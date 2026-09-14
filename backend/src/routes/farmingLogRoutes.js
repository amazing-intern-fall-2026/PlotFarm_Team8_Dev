import express from 'express';
import * as farmingLogController from '../controllers/farmingLogController.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();

// GET /api/v1/farming-logs
router.get('/', authenticate, farmingLogController.getLogs);

// POST /api/v1/farming-logs
router.post('/', authenticate, authorize('FARMER', 'ADMIN'), farmingLogController.createLog);

// PUT /api/v1/farming-logs/:id
router.put('/:id', authenticate, authorize('FARMER', 'ADMIN'), farmingLogController.updateLog);

// DELETE /api/v1/farming-logs/:id
router.delete('/:id', authenticate, authorize('FARMER', 'ADMIN'), farmingLogController.deleteLog);

export default router;
