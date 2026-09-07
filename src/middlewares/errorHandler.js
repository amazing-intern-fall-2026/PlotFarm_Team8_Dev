import { errorResponse } from '../utils/response.js';
export default (err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const errors = err.errors || null;
  errorResponse(res, { message, errors, statusCode: status });
};
