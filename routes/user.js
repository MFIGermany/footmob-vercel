import { UserController } from '../controllers/user.js'
import { Router } from 'express'
import passport from 'passport'

export const createUserRouter = () => {
    const userRouter = Router()

    const userController = new UserController()

    // Ruta para iniciar sesión con Google
    userRouter.get('/auth/google', (req, res, next) => {
        passport.authenticate('google', { 
            scope: ['profile', 'email']
        }, (err, user, info) => {
            if (err) {
                console.error('Error en la autenticación con Google:', err);
                return res.status(500).send('Error de autenticación');
            }
            if (!user) {
                console.error('Usuario no autenticado:', info);
                return res.redirect('/error'); // Redirige a una página de error personalizada
            }
            req.logIn(user, (loginErr) => {
                if (loginErr) {
                    console.error('Error al iniciar sesión:', loginErr);
                    return res.status(500).send('Error al iniciar sesión');
                }
                return res.redirect('/dashboard'); // Redirige a la página deseada después del login
            });
        })(req, res, next);
    });
  
    // Ruta de callback de Google
    userRouter.get('/auth/google/footlive', passport.authenticate('google', { 
        failureRedirect: '/login' }), 
        userController.singin
    )
  
    // Ruta para cerrar sesión
    userRouter.get('/logout', (req, res) => {
        req.logout((err) => {
        if (err) return next(err)
            res.redirect('/')
        })
    })

    // Ruta para validar captcha
    userRouter.post('/getmonero', userController.recaptcha)
    userRouter.post('/withdraw', userController.withdraw)
    userRouter.post('/savedir', userController.savedir)
    userRouter.get('/wallet', userController.wallet)

    return userRouter
}

