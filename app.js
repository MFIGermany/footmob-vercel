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

import dotenv from 'dotenv'
// In Vercel, environment variables are provided via the dashboard.
// This call is safe even if no .env file is present in the runtime bundle.
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const createApp = () => {
  const app = express()

  app.use(json())
  app.use(cors())
  app.use(compression())
  app.disable('x-powered-by')

  app.use(express.static(path.join(__dirname, './static/public')))

  app.set('views', path.join(__dirname, './static/views'))
  app.set('view engine', 'ejs')

  // Middlewares
  app.use(express.urlencoded({ extended: false }))
  app.use(methodOverride('_method'))

  // NOTE: MemoryStore is not ideal for serverless/prod, but keeping behavior
  // consistent with your current app. Consider Redis store if you need sessions.
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'footmobsecret',
      resave: true,
      saveUninitialized: true,
    })
  )

  // Middleware para pasar usuario a todas las vistas
  app.use((req, res, next) => {
    res.locals.user = req.session.user || null
    next()
  })

  // Initialize Passport
  app.use(passport.initialize())

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          'https://www.football-live.it.com/auth/google/footlive',
      },
      function (accessToken, refreshToken, profile, done) {
        done(null, profile)
      }
    )
  )

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

  const URL = process.env.URL
  app.use('/footlive', createFootMobRouter({ url: URL }))

  app.get('/', (req, res) => {
    res.redirect('/footlive')
  })

  // Ruta para servir archivos de texto
  app.get('/:filename', (req, res) => {
    const filename = req.params.filename
    const filePath = path.join(__dirname, `./${filename}`)

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        res.status(404).send('Not found')
      } else {
        const extname = path.extname(filePath)

        let contentType
        if (extname === '.xml') {
          contentType = 'application/xml'
        } else if (extname === '.txt') {
          contentType = 'text/plain'
        } else {
          contentType = 'text/plain'
        }

        res.type(contentType).send(data)
      }
    })
  })

  return app
}

// Create a singleton app instance for reuse across serverless invocations.
const app = createApp()

// Vercel expects a default export that is a handler function.
export default function handler(req, res) {
  return app(req, res)
}

// Create a single Express app instance to be reused across invocations.
const app = createApp()

export default function handler(req, res) {
  return app(req, res)
}
