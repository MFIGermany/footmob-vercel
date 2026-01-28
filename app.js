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
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Permite CORS para cualquier Chrome Extension:
 * origin = chrome-extension://<cualquier-id>
 *
 * Tu fetch solo envía Content-Type: application/json, así que NO hace falta credentials.
 */
function allowChromeExtensionCors(req, res, next) {
  const origin = req.headers.origin

  if (origin && origin.startsWith('chrome-extension://')) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  next()
}

export const createApp = () => {
  const app = express()

  // ✅ CORS y preflight antes de todo
  app.use(allowChromeExtensionCors)

  // (opcional) también puedes dejar cors() por si llamas desde web/otros:
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true)
        if (origin.startsWith('chrome-extension://')) return cb(null, true)
        return cb(null, false)
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: false,
    })
  )

  app.use(json())
  app.use(compression())
  app.disable('x-powered-by')

  app.use(express.static(path.join(__dirname, './static/public')))
  app.set('views', path.join(__dirname, './static/views'))
  app.set('view engine', 'ejs')

  app.use(express.urlencoded({ extended: false }))
  app.use(methodOverride('_method'))

  // ⚠️ En Vercel serverless no es ideal, pero no rompe tu flujo actual
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'footmobsecret',
      resave: true,
      saveUninitialized: true,
    })
  )

  app.use((req, res, next) => {
    res.locals.user = req.session.user || null
    next()
  })

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

  passport.serializeUser((user, done) => done(null, user))
  passport.deserializeUser((user, done) => done(null, user))

  // Rutas
  app.use(createUserRouter())

  const URL = process.env.URL
  app.use('/footlive', createFootMobRouter({ url: URL }))

  app.get('/', (req, res) => {
    res.redirect('/footlive')
  })

  // Archivos de texto/xml
  app.get('/:filename', (req, res) => {
    const filename = req.params.filename
    const filePath = path.join(__dirname, `./${filename}`)

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) return res.status(404).send('Not found')

      const extname = path.extname(filePath)
      let contentType = 'text/plain'
      if (extname === '.xml') contentType = 'application/xml'
      if (extname === '.txt') contentType = 'text/plain'

      return res.type(contentType).send(data)
    })
  })

  return app
}

// ✅ Vercel handler: NO listen()
const app = createApp()
export default function handler(req, res) {
  return app(req, res)
}
