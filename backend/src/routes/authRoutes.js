import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { validateRegister, validateLogin } from '../validators/authValidator.js';
import authenticate from '../middlewares/authenticate.js';

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', authenticate, getMe);

export default router;
