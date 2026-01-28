import { FootMobModel } from '../models/footmob.js'
import { UserModel } from '../models/user.js'
// import { MatchModel } from '../models/match.js'
//import list_leagues from '../leagues.json' assert { type: "json" }

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const leaguesPath = path.join(__dirname, '../leagues.json');
const list_leagues = JSON.parse(fs.readFileSync(leaguesPath, 'utf-8'));


export class FootMobController {
  static userFootMob
  static footMob

  constructor ({ url }) {
    this.footMob = new FootMobModel({ url })
    this.userFootMob = new UserModel()
  }

  isString = (input) => {
    return typeof input === 'string'
  }

  features = (req, res) => {
    const data = {}
    data.transfer = process.env.TRANSFER !== undefined ? Number(process.env.TRANSFER) : 1

    return res.json({ result: data })
  }

  getCountry = (name) => {
    if(this.footMob.getLang() === 'es'){
      let countries = {
        'Germany': 'Alemania',
        'Scotland': 'Escocia',
        'Hungary': 'Hungría',
        'Switzerland': 'Suiza',
        'Sweden': 'Suecia',
        'Spain': 'España',
        'Norway': 'Noruega',
        'Croatia': 'Croacia',
        'Italy': 'Italia',
        'Slovenia': 'Eslovenia',
        'Poland': 'Polonia',
        'Denmark': 'Dinamarca',
        'England': 'Inglaterra',
        'Netherlands': 'Países Bajos',
        'France': 'Francia',
        'Romania': 'Rumania',
        'Ukraine': 'Ucrania',
        'Belgium': 'Bélgica',
        'Slovakia': 'Eslovaquia',
        'Luxembourg': 'Luxemburgo',
        'Turkiye': 'Turquía',      
        'Czechia': 'Chequia',
        'Belarus': 'Bielorrusia',
        'Russia': 'Rusia',
        'Cyprus': 'Chipre',
        'Moldova': 'Moldavia',
        'Latvia': 'Letonia',
        'Lithuania': 'Lituania',
        'Faroe Islands': 'Islas Feroe',
        'Northern Ireland': 'Irlanda del Norte',
        'Bosnia and Herzegovina': 'Bosnia y Herzegovina',
        'North Macedonia': 'Macedonia del Norte',
        'Kazakhstan': 'Kazajistán',
        'Azerbaijan': 'Azerbaiyán',
        'USA': 'Estados Unidos',
        'Ireland': 'Irlanda',
        'Finland': 'Finlandia',
        'Iceland': 'Islandia',
        'Greece': 'Grecia',
        'Wales': 'Gales'
      };

      if(countries[name])
        name = countries[name]
      else
        name = name.split('/').map(country => countries[country] || country).join('/')
    }

    return name
  }

  isMore5mAgo = (date) => {
    const now = new Date() // Fecha y hora actual
    const past = new Date(date) // Fecha pasada para comparar
    const differenceInMilliseconds = now - past // Diferencia en milisegundos
  
    // Cinco minutos en milisegundos: 5 * 60 * 1000
    return differenceInMilliseconds > 5 * 60 * 1000
  }
  
  index = async (req, res) => {
    let checks_ids = []
    let { fecha, checks } = req.body

    //console.log(checks)
    if (this.isString(checks))
      checks = checks.split(',')

    //console.log(checks)
    checks.forEach((name) => { 
      //console.log(name)
      let league = this.footMob.getAll({name})
      //console.log(league)
      if(league.length)
        checks_ids.push(league[0].id)
    })

    this.footMob.setFunction('data/matches')

    this.footMob.getRequest(fecha)
      .then(data => {
        //console.log('Datos recibidos:', data)
        
        const leagues = {}
        const interns = ['UEFA Nations League', 'World Cup Qualification']
        const codes = ['ENG', 'ESP', 'ITA', 'GER', 'FRA', 'INT', 'BRA', 'CHI', 'ARG', 'USA']
        const favorites = ['Premier League', 'LaLiga', 'Serie A', 'Bundesliga', 'Ligue 1']
        const flags = { 'ENG': 'eng.png', 'ESP': 'esp.png', 'ITA': 'ita.png', 'GER': 'ger.png', 'FRA': 'fra.png', 'INT': 'int.png', 'BRA': 'bra.png', 'CHI': 'chi.png', 'ARG': 'arg.png', 'USA': 'usa.png' }
        const events = ['Champions League', 'Champions League Final Stage', 'Europa League', 'Europa League Final Stage', 'Copa America', 'Copa Libertadores']
        
        if(data){
          data.leagues.forEach(async (league) => {
            if(league.primaryId == 130)
              console.log(league.matches)
            let find_event = false
            league.name = (league.name == 'Serie A' && league.primaryId == 268) ? league.name + ' ' : league.name
            interns.forEach((event) =>{
              if(league.name.includes(event) && !league.name.includes('AFC') && !league.name.includes('OFC')){
                find_event = true
              }
            })
            if ((league.parentLeagueName && events.includes(league.parentLeagueName)) || events.includes(league.name) || (checks_ids.includes(league.primaryId) && codes.includes(league.ccode)) || find_event) {
              let show = true
              if(events.includes(league.name)){              
                let event_name = league.name
                show = false              

                checks.forEach((check) => { 
                  let find = event_name.includes(check)
                  if(find){
                    show = true
                  }
                })
              }
              else if(events.includes(league.parentLeagueName)){
                let event_name = league.parentLeagueName
                show = false
                
                checks.forEach((check) => { 
                  let find = event_name.includes(check)
                  if(find){
                    show = true
                  }
                })
              }

              if(show){
                //console.log(league.matches)
                leagues[league.name] = { flag: flags[league.ccode], matches: [] }
                league.matches.forEach((match) => {
                  leagues[league.name].matches.push({
                    home: this.getCountry(match.home.name),
                    homeid: match.home.id,
                    scorehome: match.home.score,
                    away: this.getCountry(match.away.name),
                    awayid: match.away.id,
                    scoreaway: match.away.score,
                    started: match.status.started,
                    finished: match.status.finished,
                    reason: match.status.reason ? match.status.reason.short : undefined,
                    time: match.status.liveTime ? match.status.liveTime.short : undefined,
                    score: match.status.scoreStr ? match.status.scoreStr : undefined,
                    start: match.status.startTimeStr ? match.status.startTimeStr : match.status.utcTime
                  })
                })
              }
            }
          })
        }
        //console.log(leagues)
        return res.json({ result: leagues })
      })
      .catch(error => {
        console.error('Error:', error)
      })
    // res.json({'message': 'Bienvenido'})
  }

  view = async (req, res) => {
    const base_url = "https://www.fotmob.com/"
    let { url } = req.body
    const data = {}

    if(url){
      if (!url.includes('http:') && !url.includes('https:')) {
        url = base_url + url
      }

      try {
          const response = await this.footMob.getRequestPage(url)
          data.url = response
      } catch (error) {
          console.error('Error:', error)
      }
    } else {
        try {
            this.footMob.setFunction('trendingnews')

            const resp = await this.footMob.getRequest()
            data.urls = []

            let count = 0
            for (const news of resp) {
                let url = news.page.url

                if (!url.includes('http:') && !url.includes('https:')) {
                    url = base_url + url
                }

                try {
                    const response = await this.footMob.getRequestPage(url)
                    data.urls.push(response)
                    //console.log(response)
                    if(!count)
                      data.url = response
                    count++
                } catch (error) {
                    console.error('Error:', error)
                }
            }
        } catch (error) {
            console.error('Error:', error)
        }
    }

    res.render('view', { data: data })
  }

  getDateToday = (hoursToAddOrSubtract = 0) => {
    // Obtener la fecha actual
    var today = new Date();

    // Sumar o restar horas
    today.setHours(today.getHours() - hoursToAddOrSubtract);

    // Obtener el año, mes y día
    var ano = today.getFullYear();
    var mes = ('0' + (today.getMonth() + 1)).slice(-2); // Agregar 1 ya que los meses van de 0 a 11
    var dia = ('0' + today.getDate()).slice(-2);

    // Formatear la fecha en "Y-m-d"
    var todayFormat = ano + '-' + mes + '-' + dia;

    return todayFormat;
  }

  convertToDate = (event) => {
    //console.log(event)
    let hora = event.attributes.diary_hour
    if(hora) {
      let [hour, minute, second] = hora.split(':')
      return new Date(0, 0, 0, hour, minute, second)
    }
    else
      return false
  }

  matches = async (req, res) => {
    const data = {}

    //Cargar los partidos para las apuestas deportivas
    if(req.session.user){
      data.partidos = []
      const user = await this.userFootMob.getUserById(req.session.user.id)

      const partidos = await this.userFootMob.getPartidos()
      for (var item of partidos) {
        const res = await this.userFootMob.getApuesta(user.id, item.id)
        if(res){
          item.apuesta = res.apuesta
        }

        data.partidos.push(item)
      }
    }
    
    //Lista de Canales
    const base_urlTR = "https://www.tarjetarojaenvivo.nl/"    
    //const base_urlPE = "https://futbollibretv.pe/"
    const base_url = "https://www.elitegoltv.org/"
    const base_urlRD = "https://rojadirectaenhd.net/agenda.html"
    const channel_urlRD = "https://rojadirectaenhd.net"
    
    this.footMob.setFunction('data/matches')
    
    data.recaptcha = process.env.RECAPTCHA_SITE_KEY

    try {
      data.matches = []
      data.matchesRD = []
      data.matchesPE = []
      const matches_today = []
      /*
      const response = await this.footMob.getMatches(base_url + 'home.php')
      //const response = await this.footMob.getMatches(base_urlRD)
      
      if(response){
        //console.log('entre')
        // Obtener todos los elementos li dentro del ul
        const menuItems = response.querySelectorAll('ul.menu > li')
        
        // Iterar sobre los elementos li e imprimir su contenido
        // let index = 0
        for (var item of menuItems) {
          const match = []
          
          match.country = item.className
          // Obtener el nombre del partido
          const linkText = item.querySelector('a').textContent.trim()
          // Eliminar el texto de la hora del nombre del partido
          if(item.querySelector('span.t')){
            match.name = linkText.replace(item.querySelector('span.t').textContent.trim(), '')
            match.time = item.querySelector('span.t').textContent.trim()
            
            //matches_today.push(match.name)

            match.channels = []
            // Obtener los canales de transmisión del partido
            const subItems = item.querySelectorAll('ul li.subitem1')
            subItems.forEach(subItem => {
              const channel = []
              // Obtener la URL del canal de transmisión
              let url_chanel = subItem.querySelector('a').getAttribute('href')

              if (!url_chanel.includes('http') && !url_chanel.includes('https')) {
                url_chanel = base_url + url_chanel
              }

              channel.url = url_chanel
              // Obtener el nombre del canal de transmisión
              channel.name = subItem.querySelector('a').textContent.trim()
              // Agregar el canal al arreglo de canales del partido
              match.channels.push(channel)
            })

            data.matches.push(match)
            // index++
          }
        }
      }

      //console.log(data.matches.length)
      if(data.matches.length == 0){
        const responseTR = await this.footMob.getMatches(base_urlTR)
        //console.log(responseTR)

        if(responseTR){
          // Obtener todos los elementos li dentro del ul
          const menuItemsTR = responseTR.querySelectorAll('ul.menu > li')
          
          // Iterar sobre los elementos li e imprimir su contenido
          // let index = 0
          for (var item of menuItemsTR) {
            const match = []
            
            match.country = item.className
            // Obtener el nombre del partido
            const linkText = item.querySelector('a').textContent.trim()
            // Eliminar el texto de la hora del nombre del partido
            if(item.querySelector('span.t')){
              match.name = linkText.replace(item.querySelector('span.t').textContent.trim(), '')
              match.time = item.querySelector('span.t').textContent.trim()
              
              match.channels = []
              // Obtener los canales de transmisión del partido
              const subItems = item.querySelectorAll('ul li.subitem1')
              subItems.forEach(subItem => {
                const channel = []
                // Obtener la URL del canal de transmisión
                let url_chanel = subItem.querySelector('a').getAttribute('href')

                if (!url_chanel.includes('http') && !url_chanel.includes('https')) {
                  url_chanel = base_url + url_chanel
                }

                channel.url = url_chanel
                // Obtener el nombre del canal de transmisión
                channel.name = subItem.querySelector('a').textContent.trim()
                // Agregar el canal al arreglo de canales del partido
                match.channels.push(channel)
              })

              data.matches.push(match)
            }
          }
        }
      }
      */
      try {
        //const url_pe = 'https://golazoplay.com/agenda.json'
        const url_pe = 'https://ftvhd.com/diaries.json'
        //const url_img = 'https://admin.futbollibrehd.pe'
        const url_img = 'https://img.futbolonlinehd.com'
        //const base_urlPE = "https://futbollibreonline.org"
        const base_urlPE = "https://tvhdlibre.com"

        const resp_pe = await this.footMob.getRequestPageJson(url_pe)
        
        let find = 0
        if(resp_pe && resp_pe.data){
          resp_pe.data.sort((a, b) => {
            let dateA = this.convertToDate(a)
            let dateB = this.convertToDate(b)
            return dateA - dateB
          })
          
          resp_pe.data.forEach(async (item) => {
            const match = []
            
            if(item.attributes.country.data && item.attributes.country.data.attributes && item.attributes.diary_hour){
              match.name = item.attributes.diary_description.replace('vs.', 'vs')
              match.time = item.attributes.diary_hour.split(':').slice(0, 2).join(':')
              if(item.attributes.country.data.attributes.image.data)
                match.flag = url_img + item.attributes.country.data.attributes.image.data.attributes.url
              //if(matches_today.includes(match.name))
                //find = 1

              match.channels = []

              item.attributes.embeds.data.forEach(subItem => {
                const channel = []

                let url_chanel = subItem.attributes.embed_iframe

                if (url_chanel && url_chanel.includes('embed')) {
                  channel.name = subItem.attributes.embed_name
                  channel.url = base_urlPE + url_chanel
                  match.channels.push(channel)
                }
              })

              data.matchesPE.push(match)
            }
          })
        }
        else{
          const response = await this.footMob.getMatches(base_urlRD)
      
          if(response){
            //console.log('entre')
            // Obtener todos los elementos li dentro del ul
            const menuItems = response.querySelectorAll('ul.menu > li')
            
            // Iterar sobre los elementos li e imprimir su contenido
            // let index = 0
            for (var item of menuItems) {
              const match = []
              
              match.country = item.className
              // Obtener el nombre del partido
              const linkText = item.querySelector('a').textContent.trim()
              // Eliminar el texto de la hora del nombre del partido
              if(item.querySelector('span.t')){
                match.name = linkText.replace(item.querySelector('span.t').textContent.trim(), '')
                match.time = item.querySelector('span.t').textContent.trim()

                match.channels = []
                // Obtener los canales de transmisión del partido
                const subItems = item.querySelectorAll('ul li.subitem1')
                subItems.forEach(subItem => {
                  const channel = []
                  // Obtener la URL del canal de transmisión
                  let url_chanel = subItem.querySelector('a').getAttribute('href')

                  if (!url_chanel.includes('http') && !url_chanel.includes('https')) {
                    url_chanel = channel_urlRD + url_chanel
                  }

                  channel.url = url_chanel
                  // Obtener el nombre del canal de transmisión
                  const linkName = subItem.querySelector('a').textContent.trim()
                  channel.name = linkName.replace(subItem.querySelector('span').textContent.trim(), '')
                  // Agregar el canal al arreglo de canales del partido
                  match.channels.push(channel)
                })

                //console.log(match)
                data.matchesRD.push(match)
                // index++
              }
            }
          }
        }
      }
      catch (error) {
        // Manejo del error
        console.error(error)
        console.error('An error occurred');
      }

      //Visualizar el timer
      let time = ''
      let ready = false
      if(req.session.user && req.session.user.ultimo_reclamo)
        time = new Date(req.session.user.ultimo_reclamo)

      if(!time || this.isMore5mAgo(time))
       ready = true

      data.ready = ready

      console.log(time+'-->'+ready)
      
      res.render('index', { data: data })
    } catch (error) {
        console.error('Error:', error)
    }
  }

  transfers = async (req, res) => {
    const url = 'https://www.fotmob.com/api/transfers'

    const resp = await this.footMob.getRequestPageJson(url, 1)

    return res.json({ result: resp })
  }

  leagues = async (req, res) => {
    const { lang } = req.params
    
    this.footMob.setLang(lang)

    return res.json({ result: list_leagues })
  }

  trendingnews = async (req, res) => {
    const data = {}
    res.render('news', { data: data })
  }

  extension = async (req, res) => {
    const data = {}
    res.render('extension', { data: data })
  }

  politica = async (req, res) => {
    const data = {}
    res.render('politica', { data: data })
  }

  monero = async (req, res) => {
    const data = {}
    res.render('monero', { data: data })
  }

  news = async (req, res) => {
    const { lang } = req.params
    
    this.footMob.setLang(lang)
      this.footMob.setFunction('trendingnews')

    this.footMob.getRequest()
      .then(data => {
        if(data.length)
          return res.json({ result: data })
        else{
          console.log('entre')
          this.footMob.setFunction('worldnews')

          this.footMob.getRequest()
            .then(data => {
                return res.json({ result: data })
            })
            .catch(error => {
              console.error('Error:', error)
            })
        }
      })
      .catch(error => {
        console.error('Error:', error)
      })
  }

  contribution = async (req, res) => {
    const data = {}

    const CLIENT = 'AYZ-00wqpvaRHSD-elMNEDTeSjNbacIBidhT3kzhIYn_l4pbcni_cIvz-lit6ZMRThMlt17nnno_7OIO'
    const SECRET = 'EO0P4rGn2MeqNjaiD7qDghZ4VhiyARgqvZewX7zzT1dEitpnYe-gnts2pfTj6ImIxHKs_iY2BHf9kLFx'
    const PAYPAL_API = 'https://api-m.sandbox.paypal.com' //htps://api-m.paypal.com
    const auth = {user: CLIENT, pass: SECRET}

    const url = 'https://www.paypal.com/donate/?hosted_button_id=3THN79EWQHK2E'

    /*
    try {
      const response = await axios.get(url)
      data.content_paypal = response.data
      
      res.render('contribution', { data: data })
    } catch (error) {
        console.error('Error al cargar la página externa:', error);
        res.render('pagina', { content: 'No se pudo cargar el contenido' });
    }*/
    res.render('contribution', { data: data })
  }
}
