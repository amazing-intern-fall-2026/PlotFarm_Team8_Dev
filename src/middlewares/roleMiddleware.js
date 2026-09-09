/**
 * Middleware to check if the user's role is in the allowed list
 * @param  {...string} allowedRoles - List of allowed roles (e.g., 'ADMIN', 'FARMER')
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is set by verifyToken middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực người dùng.',
        errorType: 'UNAUTHORIZED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này.',
        errorType: 'FORBIDDEN'
      });
    }
    next();
  };
};
