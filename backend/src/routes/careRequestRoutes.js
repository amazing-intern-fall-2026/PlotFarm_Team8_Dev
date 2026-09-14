import express from 'express';
import * as careRequestController from '../controllers/careRequestController.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();

// POST /api/v1/care-requests — Customer only
router.post('/', authenticate, authorize('CUSTOMER'), careRequestController.createCareRequest);

// GET /api/v1/care-requests/my — Customer only (/my MUST be before /:id)
router.get('/my', authenticate, authorize('CUSTOMER'), careRequestController.getMyCareRequests);

// GET /api/v1/care-requests — Farmer/Admin only
router.get('/', authenticate, authorize('FARMER', 'ADMIN'), careRequestController.getAllCareRequests);

// PATCH /api/v1/care-requests/:id/status — Farmer/Admin only
router.patch('/:id/status', authenticate, authorize('FARMER', 'ADMIN'), careRequestController.updateCareRequestStatus);

export default router;
