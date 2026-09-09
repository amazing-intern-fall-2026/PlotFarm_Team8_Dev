import express from 'express';
import * as authController from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/register-employee', authController.registerEmployee);
router.post('/login', authController.login);
router.get('/me', verifyToken, authController.getMe);

export default router;
