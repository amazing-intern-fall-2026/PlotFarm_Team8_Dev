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

export default router;
