import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/config.js';

/**
 * Generate Access and Refresh tokens
 * @param {object} payload - The data to embed in the token (e.g., username, role)
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, JWT_CONFIG.accessSecret, {
    expiresIn: JWT_CONFIG.accessExpiresIn,
  });

  const refreshToken = jwt.sign(payload, JWT_CONFIG.refreshSecret, {
    expiresIn: JWT_CONFIG.refreshExpiresIn,
  });

  return {
    accessToken,
    refreshToken,
  };
};

/**
 * Verify an Access Token
 * @param {string} token 
 * @returns {object|string} - Decoded payload or throws error
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_CONFIG.accessSecret);
};

/**
 * Verify a Refresh Token
 * @param {string} token 
 * @returns {object|string} - Decoded payload or throws error
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_CONFIG.refreshSecret);
};
