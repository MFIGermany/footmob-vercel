
import { UserModel } from '../models/user.js'
import dotenv from 'dotenv'
import https from 'https'

dotenv.config({ path: './.env' })

export class UserController {
    static userFootMob

    constructor () {
      this.userFootMob = new UserModel()
    }

    isNextDayOrLater = (targetDateString) => {
      // Obtener la fecha actual y la fecha objetivo
      const today = new Date()
      const targetDate = new Date(targetDateString)
    
      // Resetear las horas para comparar solo el año, mes y día
      today.setHours(0, 0, 0, 0)
      targetDate.setHours(0, 0, 0, 0)
    
      // Comparar si la fecha actual es igual o mayor a la fecha objetivo
      return today > targetDate
    }

    sumarSatoshis = (a, b) => {
        // Convertir los montos a satoshis (enteros)
        const satoshisA = Math.round(a * 1e12);
        const satoshisB = Math.round(b * 1e12);
      
        // Realizar la suma
        const totalSatoshis = satoshisA + satoshisB;
      
        // Convertir de vuelta a Monero
        return totalSatoshis / 1e12;
    }

    restarSatoshis = (a, b) => {
      // Convertir los montos a satoshis (enteros)
      const satoshisA = Math.round(a * 1e12);
      const satoshisB = Math.round(b * 1e12);
    
      // Realizar la suma
      const totalSatoshis = satoshisA - satoshisB;
    
      // Convertir de vuelta a Monero
      return totalSatoshis / 1e12;
  }

    formatDateForMySQL = (date) => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, "0") // Meses comienzan desde 0
        const day = String(date.getDate()).padStart(2, "0")
        const hours = String(date.getHours()).padStart(2, "0")
        const minutes = String(date.getMinutes()).padStart(2, "0")
        const seconds = String(date.getSeconds()).padStart(2, "0")
      
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    }

    singin = async (req, res) => {
        const profile = req.user

        const googleId = profile.id
        const name = profile.displayName
        const email = profile.emails[0].value

        try {
            const today = new Date()
            const fechaMySQL = this.formatDateForMySQL(today)
            // Verifica si el usuario ya existe
            let user = await this.userFootMob.getUserById(googleId);
            
            //console.log(user)
            if (!user) {
                // Si no existe, crea uno nuevo
                this.userFootMob.createUser(googleId, name, email)                
            }

            if(user){
                // Comparar fechas
                if(!user.login_day || this.isNextDayOrLater(user.login_day)){
                    const monto = 0.00000100
                    const resultado = this.sumarSatoshis(user.balance, monto)

                    user.balance = resultado.toFixed(8)

                    this.userFootMob.updateBalance(user.id, user.balance)

                    this.userFootMob.updateFechaLogin(user.id, fechaMySQL)
                }

                req.session.user = { id: profile.id, name: profile.displayName, billetera: user.billetera, balance: user.balance, ultimo_reclamo: user.ultimo_reclamo }
                console.log(req.session.user)
            }
            else{
                user = await this.userFootMob.getUserById(googleId)
                
                this.userFootMob.updateFechaLogin(user.id, fechaMySQL)
                
                req.session.user = { id: profile.id, name: profile.displayName, billetera: '', balance: '0.00000100' }
            }

            res.redirect('/footlive')
        } catch (error) {
            throw new Error('Error al manejar el inicio de sesión con Google: ' + error.message)
        }
    }

    isMore5mAgo = (date) => {
      const now = new Date() // Fecha y hora actual
      const past = new Date(date) // Fecha pasada para comparar
      const differenceInMilliseconds = now - past // Diferencia en milisegundos
    
      // Cinco minutos en milisegundos: 5 * 60 * 1000
      return differenceInMilliseconds > 5 * 60 * 1000
    }

    wallet = async (req, res) => {
      const data = {}

      if(req.session.user){
        data.withdraws = await this.userFootMob.getWithdraws(req.session.user.id)

        res.render('monedero', { data: data })
      }
      else
        res.redirect('/')
    }

    withdraw = async (req, res) => {
      const { amount } = req.body

      if(req.session.user){
        const today = new Date()
        const fechaMySQL = this.formatDateForMySQL(today)
        const user_withdraw = await this.userFootMob.setWithdraw(req.session.user.id, amount, fechaMySQL)

        if (user_withdraw){
          const resultado = this.restarSatoshis(req.session.user.balance, amount)

          if(resultado > 0){
            req.session.user.balance = resultado.toFixed(8)

            const user = await this.userFootMob.getUserById(req.session.user.id)

            this.userFootMob.updateBalance(user.id, req.session.user.balance)

            return res.json({ type: 'success', message: 'Solicitud de retiro satisfactoriamente.' })
          }
          else
            return res.status(400).json({ type: 'error', message: 'No tiene suficiente saldo para retirar.' })
        }
        else
          return res.status(400).json({ type: 'error', message: 'Error al gestionar la solicitud de retiro, por favor contante con el administrador.' })
      }
      else
        res.redirect('/')
    }

    savedir = async (req, res) => {
      const { wallet } = req.body

      if(req.session.user){
        const user_wallet = await this.userFootMob.updateWallet(req.session.user.id, wallet)

        if (user_wallet){
          req.session.user.billetera = wallet
          return res.json({ type: 'success', message: 'Se ha guardado su dirección de monedero satisfactoriamente.' })
        }
        else
          return res.status(400).json({ type: 'info', message: 'Esa dirección de monedero ya está asociada a otra cuenta.' })
      }
      else
        res.redirect('/')
    }

    recaptcha = async (req, res) => {
        const { token } = req.body

        const user = await this.userFootMob.getUserById(req.session.user.id)
      
        // Datos a enviar a la API de Google reCAPTCHA
        const params = new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token,
        }).toString()
      
        // Configurar la petición HTTPS
        const options = {
          hostname: 'www.google.com',
          path: `/recaptcha/api/siteverify?${params}`,
          method: 'POST',
        }
      
        const request = https.request(options, (response) => {
          let data = ''
      
          // Recibir datos en fragmentos
          response.on('data', (chunk) => {
            data += chunk;
          })
      
          // Procesar los datos recibidos
          response.on('end', () => {
            const result = JSON.parse(data);
      
            if (result.success) {
              //Consultar tiempo
              let time = ''
              if(user.ultimo_reclamo)
                time = new Date(user.ultimo_reclamo)

              if(!time || this.isMore5mAgo(time)){
                //Guardar recompensa
                let monto = '0.00000075'
                const resultado = this.sumarSatoshis(user.balance, monto)

                user.balance = resultado.toFixed(8)
                
                const today = user.ultimo_reclamo = new Date()
                const fechaMySQL = this.formatDateForMySQL(today)

                this.userFootMob.updateBalance(user.id, user.balance, fechaMySQL)
              }
              else
                return res.status(400).json({ type: 'warning', message: 'Debe esperar 5min hasta el próximo reclamo' })

              req.session.user.balance = user.balance
              req.session.user.ultimo_reclamo = user.ultimo_reclamo

              return res.json({ type: 'success', message: 'Gracias. Tu recompensa se ha añadido a tu balance.' })
            } else {
              return res.status(400).json({ type: 'error', message: 'Validación de Captcha incorrecto, vuelva a interlo' })
            }
          })
        })
      
        // Manejar errores en la petición
        request.on('error', (error) => {
          console.error('Error al verificar el reCAPTCHA:', error)
          return res.status(500).json({ success: false, message: 'Error en el servidor' })
        })
      
        request.end()
    }
}