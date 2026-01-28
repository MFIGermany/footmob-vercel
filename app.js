import { createFootMobRouter } from './routes/footmob.js'
import { createUserRouter } from './routes/user.js'
import express, { json } from 'express'
import compression from 'compression'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import methodOverride from 'method-override'
import session from 'express-session'

import GoogleStrategy from 'passport-google-oauth20'
import passport from 'passport'

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

import dotenv from 'dotenv'
dotenv.config({ path: './.env' })

export const createApp = () => {
  const app = express()

  app.use(json())
  app.use(cors())
  app.use(compression())
  app.disable('x-powered-by')

  app.use(express.static(path.join(__dirname, './static/public')))
  
  app.set('views', path.join(__dirname, './static/views'))
  app.set("view engine", "ejs")

  // Middlewares
  // Para recibir los valores por POST
  app.use(express.urlencoded({extended: false}))
  app.use(methodOverride('_method')) //posiblemente no lo use
  app.use(session({
    secret: 'footmobsecret',
    resave: true,
    saveUninitialized: true
  }))

  function verifyExtensionToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    if (token !== process.env.API_TOKEN) {
      return res.status(403).json({ error: "Invalid token" });
    }

    next();
  }


  // Middleware para pasar usuario a todas las vistas
  app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
  });
  
  // Initialize Passport
  app.use(passport.initialize())

  passport.use(
    new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'https://www.football-live.it.com/auth/google/footlive', //produccion
      //callbackURL: '/auth/google/footlive', //local
    },
    function(accessToken, refreshToken, profile, done) {
      done(null, profile)
    }
  ))
  
  // Serializar usuario
  passport.serializeUser((user, done) => {
    done(null, user)
  })

  // Deserializar usuario
  passport.deserializeUser((user, done) => {
    done(null, user)
  })

  // Rutas
  app.use(createUserRouter())

  //Routes
  const URL = process.env.URL
  app.use('/footlive', verifyExtensionToken, createFootMobRouter({ url: URL }))
  //app.use('/footlive', createUserRouter())

  app.get('/', (req, res) => {
    res.redirect('/footlive')
  })

  // Ruta para servir archivos de texto
  app.get('/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, `./${filename}`);

    // Verifica si el archivo existe
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        // Si ocurre un error al leer el archivo, devuelve un error 500
        res.status(500).send('Error interno del servidor')
      } else {
        // Obtener la extensión del archivo
        const extname = path.extname(filePath);
        
        // Establecer el tipo de contenido basado en la extensión del archivo
        let contentType;
        if (extname === '.xml') {
          contentType = 'application/xml'
        } else if (extname === '.txt') {
          contentType = 'text/plain'
        } else {
          contentType = 'text/plain' // Tipo de contenido predeterminado
        }

        // Establecer el tipo de contenido en el encabezado de la respuesta
        res.type(contentType).send(data)
      }
    })
  })

  const PORT = process.env.PORT ?? 3000

  app.listen(PORT, () => {
    console.log(`server listening on port http://localhost:${PORT}`)
  })
}

createApp()