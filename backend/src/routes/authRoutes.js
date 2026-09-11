import express from 'express';
import { register, login, getMe, registerEmployee } from '../controllers/authController.js';
import { validateRegister, validateRegisterEmployee, validateLogin } from '../validators/authValidator.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/register-employee', authenticate, authorize('ADMIN'), validateRegisterEmployee, registerEmployee);
router.post('/login', validateLogin, login);
router.get('/me', authenticate, getMe);

export default router;

