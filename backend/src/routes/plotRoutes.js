import express from 'express';
import * as plotController from '../controllers/plotController.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();

router.get('/', authenticate, plotController.getAllPlots);
router.get('/:id', authenticate, plotController.getPlotById);
router.post('/', authenticate, authorize('ADMIN', 'FARMER'), plotController.createPlot);
router.put('/:id', authenticate, authorize('ADMIN', 'FARMER'), plotController.updatePlot);
router.patch('/:id/sensor', authenticate, authorize('ADMIN', 'FARMER'), plotController.updateSensor);

export default router;
