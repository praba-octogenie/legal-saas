import crypto from 'crypto';

/**
 * Encrypt data using AES-256-CBC
 * @param data Data to encrypt
 * @param key Encryption key
 * @returns Encrypted data as base64 string
 */
export const encrypt = (data: string, key: string): string => {
  // Create a buffer from the key (must be 32 bytes for AES-256)
  const keyBuffer = crypto.createHash('sha256').update(key).digest();
  
  // Generate a random initialization vector
  const iv = crypto.randomBytes(16);
  
  // Create cipher
  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
  
  // Encrypt the data
  let encrypted = cipher.update(data, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // Combine IV and encrypted data
  return iv.toString('hex') + ':' + encrypted;
};

/**
 * Decrypt data using AES-256-CBC
 * @param encryptedData Encrypted data as base64 string
 * @param key Encryption key
 * @returns Decrypted data
 */
export const decrypt = (encryptedData: string, key: string): string => {
  // Create a buffer from the key (must be 32 bytes for AES-256)
  const keyBuffer = crypto.createHash('sha256').update(key).digest();
  
  // Split IV and encrypted data
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  // Create decipher
  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
  
  // Decrypt the data
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

/**
 * Generate a secure random token
 * @param length Length of the token
 * @returns Random token
 */
export const generateToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash a password using bcrypt
 * @param password Password to hash
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const bcrypt = await import('bcrypt');
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compare a password with a hash
 * @param password Password to compare
 * @param hash Hash to compare with
 * @returns True if the password matches the hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  const bcrypt = await import('bcrypt');
  return bcrypt.compare(password, hash);
};

export default {
  encrypt,
  decrypt,
  generateToken,
  hashPassword,
  comparePassword,
};