import express from 'express';
import * as farmController from '../controllers/farmController.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();

router.get('/', authenticate, farmController.getAllFarms);
router.get('/my-farms', authenticate, authorize('FARMER'), farmController.getMyFarms);
router.get('/:id', authenticate, farmController.getFarmById);

router.post('/', authenticate, authorize('ADMIN', 'FARMER'), farmController.createFarm);
router.put('/:id', authenticate, authorize('ADMIN', 'FARMER'), farmController.updateFarm);
router.delete('/:id', authenticate, authorize('ADMIN', 'FARMER'), farmController.deleteFarm);

export default router;
