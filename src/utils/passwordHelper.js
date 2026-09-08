import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a password
 * @param {string} password 
 * @returns {Promise<string>}
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

/**
 * Compare a plain text password with a hash
 * @param {string} password 
 * @param {string} hash 
 * @returns {Promise<boolean>}
 */
export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};
