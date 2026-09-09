import express from 'express';
import { register, login, getMe, registerEmployee } from '../controllers/authController.js';
import { validateRegister, validateLogin } from '../validators/authValidator.js';
import authenticate from '../middlewares/authenticate.js';

const router = express.Router();

router.post('/register', validateRegister, register);
// Optional: you can add a validateRegisterEmployee here, omitting for test purposes
router.post('/register-employee', registerEmployee); 
router.post('/login', validateLogin, login);
router.get('/me', authenticate, getMe);

export default router;
