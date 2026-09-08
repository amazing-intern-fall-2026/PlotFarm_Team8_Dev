// src/middlewares/authorize.js
import { errorResponse } from '../utils/response.js';

/**
 * Middleware factory to authorize based on allowed roles.
 * Usage: `app.use(authorize('ADMIN', 'FARMER'))`
 */
export default (...allowedRoles) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      // Should have been caught by authenticate, but guard anyway
      return errorResponse(res, { message: 'Unauthenticated', statusCode: 401 });
    }
    if (!allowedRoles.includes(user.role)) {
      return errorResponse(res, { message: 'Forbidden: insufficient role', statusCode: 403 });
    }
    next();
  };
};
