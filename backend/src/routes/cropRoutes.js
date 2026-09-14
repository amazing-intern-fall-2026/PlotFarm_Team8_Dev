import express from 'express';
import * as cropController from '../controllers/cropController.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();

router.get('/', authenticate, cropController.getAllCrops);
router.get('/:id', authenticate, cropController.getCropById);
router.post('/', authenticate, authorize('ADMIN'), cropController.createCrop);

export default router;
