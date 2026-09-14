import express from 'express';
import * as contractController from '../controllers/contractController.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();

// Create contract — CUSTOMER only
router.post('/', authenticate, authorize('CUSTOMER'), contractController.createContract);

// Get own contracts — CUSTOMER only (/my MUST be before /:id)
router.get('/my', authenticate, authorize('CUSTOMER'), contractController.getMyContracts);

// Get all contracts — ADMIN/FARMER only
router.get('/', authenticate, authorize('ADMIN', 'FARMER'), contractController.getAllContracts);

// Get single contract — all authenticated roles (ownership enforced in service)
router.get('/:id', authenticate, contractController.getContractById);

// Update contract status — ADMIN only
router.patch('/:id/status', authenticate, authorize('ADMIN'), contractController.updateContractStatus);

export default router;
