import { FootMobController } from '../controllers/footmob.js'
import { Router } from 'express'

export const createFootMobRouter = ({ url }) => {
  const footmobRouter = Router()

  const footMobController = new FootMobController({ url })

  // Aqui van las llamadas a los metodos
  footmobRouter.post('/view', footMobController.view)
  footmobRouter.post('/', footMobController.index)
  footmobRouter.get('/', footMobController.matches)
  footmobRouter.get('/features', footMobController.features)
  footmobRouter.get('/views/:lang?', footMobController.view)
  footmobRouter.get('/news/:lang?', footMobController.news)
  footmobRouter.get('/transfers', footMobController.transfers)
  footmobRouter.get('/extension', footMobController.extension)  
  footmobRouter.get('/leagues/:lang', footMobController.leagues)
  footmobRouter.get('/matches/:lang?', footMobController.matches)
  footmobRouter.get('/trendingnews', footMobController.trendingnews)
  footmobRouter.get('/contribution', footMobController.contribution)
  footmobRouter.get('/politica', footMobController.politica)
  footmobRouter.get('/monero', footMobController.monero)

  return footmobRouter
}
