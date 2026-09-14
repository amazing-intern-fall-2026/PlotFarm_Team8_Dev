import { successResponse } from '../utils/response.js';
import * as contractService from '../services/contractService.js';

// Create a new contract (CUSTOMER only)
export const createContract = async (req, res, next) => {
    try {
        const contract = await contractService.createContract(req.body, req.user);
        successResponse(res, {
            statusCode: 201,
            data: contract,
            message: 'Tạo hợp đồng thuê đất thành công'
        });
    } catch (err) { next(err); }
};

// Get authenticated customer's own contracts
export const getMyContracts = async (req, res, next) => {
    try {
        const data = await contractService.getMyContracts(req.user);
        successResponse(res, { data, message: 'Lấy danh sách hợp đồng của bạn thành công' });
    } catch (err) { next(err); }
};

// Get all contracts (ADMIN/FARMER)
export const getAllContracts = async (req, res, next) => {
    try {
        const data = await contractService.getAllContracts(req.user, req.query);
        successResponse(res, { data, message: 'Lấy danh sách hợp đồng thành công' });
    } catch (err) { next(err); }
};

// Get a single contract by ID (all roles, with ownership guard for CUSTOMER)
export const getContractById = async (req, res, next) => {
    try {
        const data = await contractService.getContractById(req.params.id, req.user);
        successResponse(res, { data, message: 'Lấy thông tin hợp đồng thành công' });
    } catch (err) { next(err); }
};

// Update contract status (ADMIN only)
export const updateContractStatus = async (req, res, next) => {
    try {
        const status = req.body.trangThai || req.body.status;
        const data = await contractService.updateContractStatus(req.params.id, status, req.user);
        successResponse(res, { data, message: 'Cập nhật trạng thái hợp đồng thành công' });
    } catch (err) { next(err); }
};
