import express from 'express';
import { register, login, getMe, registerEmployee, forgotPassword, resetPassword } from '../controllers/authController.js';
import { validateRegister, validateRegisterEmployee, validateLogin, validateForgotPassword, validateResetPassword } from '../validators/authValidator.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/register-employee', authenticate, authorize('ADMIN'), validateRegisterEmployee, registerEmployee);
router.post('/login', validateLogin, login);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);
router.get('/me', authenticate, getMe);

export default router;

