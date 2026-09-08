// src/middlewares/authorize.js
/**
 * Middleware factory to authorize based on allowed roles.
 * Usage: `app.use(authorize('ADMIN', 'FARMER'))`
 */
export default (...allowedRoles) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      // Should have been caught by authenticate, but guard anyway
      const { errorResponse } = require('../utils/response.js');
      return errorResponse(res, { message: 'Unauthenticated', statusCode: 401 });
    }
    if (!allowedRoles.includes(user.role)) {
      const { errorResponse } = require('../utils/response.js');
      return errorResponse(res, { message: 'Forbidden: insufficient role', statusCode: 403 });
    }
    next();
  };
};
