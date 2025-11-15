import CryptoJS from 'crypto-js';
import { encryption_key } from '../../enviroment/config';

// Get encryption key from environment
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-encryption-key';

/**
 * Encrypt password using AES encryption
 * @param {string} password - Plain text password
 * @returns {string} - Encrypted password
 */
export const encryptPassword = (password) => {
  try {
    const encrypted = CryptoJS.AES.encrypt(password, encryption_key).toString();
    return encrypted;
  } catch (error) {
    console.error('Password encryption failed:', error);
    return password; // Return plain password if encryption fails
  }
};

/**
 * Decrypt password using AES encryption
 * @param {string} encryptedPassword - Encrypted password
 * @returns {string} - Decrypted password
 */
export const decryptPassword = (encryptedPassword) => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedPassword, ENCRYPTION_KEY);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Password decryption failed:', error);
    return encryptedPassword; // Return encrypted password if decryption fails
  }
};
