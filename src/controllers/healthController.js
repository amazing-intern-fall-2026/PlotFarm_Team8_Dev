import { successResponse } from '../utils/response.js';
export const health = (req, res) => {
  successResponse(res, { message: 'OK', data: { uptime: process.uptime() } });
};
