import { AppError } from '../utils/AppError.js';
export default (req, res, next) => {
  next(new AppError('Not Found', 404));
};
