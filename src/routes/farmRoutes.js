import express from 'express';
import * as farmController from '../controllers/farmController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Tất cả APIs quản lý Farm đều yêu cầu người dùng phải đăng nhập
router.use(verifyToken);

router.get('/', farmController.getFarms);
router.get('/my-farms', authorizeRoles('FARMER'), farmController.getMyFarms);
router.get('/:id', farmController.getFarm);
router.post('/', authorizeRoles('ADMIN', 'FARMER'), farmController.createFarm);
router.put('/:id', authorizeRoles('ADMIN', 'FARMER'), farmController.updateFarm);
router.delete('/:id', authorizeRoles('ADMIN', 'FARMER'), farmController.deleteFarm);

export default router;
