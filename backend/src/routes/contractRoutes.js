import express from 'express';
import * as contractController from '../controllers/contractController.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();

// Chỉ Customer được phép tạo Hợp đồng
router.post('/', authenticate, authorize('CUSTOMER'), contractController.createContract);

export default router;
