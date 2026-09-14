import express from 'express';
import * as harvestController from '../controllers/harvestController.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();

// GET /api/v1/harvests/my — Customer only (/my MUST be before /:id)
router.get('/my', authenticate, authorize('CUSTOMER'), harvestController.getMyHarvests);

// GET /api/v1/harvests — Farmer/Admin only
router.get('/', authenticate, authorize('FARMER', 'ADMIN'), harvestController.getAllHarvests);

// POST /api/v1/harvests — Farmer/Admin only
router.post('/', authenticate, authorize('FARMER', 'ADMIN'), harvestController.createHarvest);

// PATCH /api/v1/harvests/:id/status — Farmer/Admin only
router.patch('/:id/status', authenticate, authorize('FARMER', 'ADMIN'), harvestController.updateHarvestStatus);

// PATCH /api/v1/harvests/:id/delivery — Farmer/Admin only
router.patch('/:id/delivery', authenticate, authorize('FARMER', 'ADMIN'), harvestController.updateHarvestDelivery);

export default router;
