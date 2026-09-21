import express from 'express';
import * as adminController from '../controllers/adminController.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();

// All routes under /admin are restricted to ADMIN role
router.use(authenticate, authorize('ADMIN'));

// GET /api/v1/admin/kpi
router.get('/kpi', adminController.getKPI);

// GET /api/v1/admin/users
router.get('/users', adminController.getAllUsers);

// PATCH /api/v1/admin/users/:id/status
router.patch('/users/:id/status', adminController.updateUserStatus);

// Farmer Applications Management (KYC & Approval)
// GET /api/v1/admin/farmer-applications
router.get('/farmer-applications', adminController.getFarmerApplications);

// GET /api/v1/admin/farmer-applications/:id
router.get('/farmer-applications/:id', adminController.getFarmerApplicationById);

// POST /api/v1/admin/farmer-applications/:id/approve
router.post('/farmer-applications/:id/approve', adminController.approveFarmerApplication);

// POST /api/v1/admin/farmer-applications/:id/reject
router.post('/farmer-applications/:id/reject', adminController.rejectFarmerApplication);

export default router;
