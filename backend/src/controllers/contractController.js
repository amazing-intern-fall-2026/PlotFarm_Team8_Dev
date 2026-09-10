import { successResponse, errorResponse } from '../utils/response.js';
import * as contractService from '../services/contractService.js';

export const createContract = async (req, res, next) => {
    try {
        const contract = await contractService.createContract(req.body, req.user);
        successResponse(res, {
            statusCode: 201,
            data: contract,
            message: 'Tạo hợp đồng thuê đất thành công'
        });
    } catch (err) {
        next(err);
    }
};
