export const successResponse = (res, { message = 'Success', data = null, meta = null, statusCode = 200 }) => {
  return res.status(statusCode).json({ success: true, message, data, meta });
};

export const errorResponse = (res, { message = 'Error', errors = null, code = null, statusCode = 500 }) => {
  return res.status(statusCode).json({ success: false, message, code, errors });
};
