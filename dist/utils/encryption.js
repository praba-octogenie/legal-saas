"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePassword = exports.hashPassword = exports.generateToken = exports.decrypt = exports.encrypt = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Encrypt data using AES-256-CBC
 * @param data Data to encrypt
 * @param key Encryption key
 * @returns Encrypted data as base64 string
 */
const encrypt = (data, key) => {
    // Create a buffer from the key (must be 32 bytes for AES-256)
    const keyBuffer = crypto_1.default.createHash('sha256').update(key).digest();
    // Generate a random initialization vector
    const iv = crypto_1.default.randomBytes(16);
    // Create cipher
    const cipher = crypto_1.default.createCipheriv('aes-256-cbc', keyBuffer, iv);
    // Encrypt the data
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    // Combine IV and encrypted data
    return iv.toString('hex') + ':' + encrypted;
};
exports.encrypt = encrypt;
/**
 * Decrypt data using AES-256-CBC
 * @param encryptedData Encrypted data as base64 string
 * @param key Encryption key
 * @returns Decrypted data
 */
const decrypt = (encryptedData, key) => {
    // Create a buffer from the key (must be 32 bytes for AES-256)
    const keyBuffer = crypto_1.default.createHash('sha256').update(key).digest();
    // Split IV and encrypted data
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    // Create decipher
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', keyBuffer, iv);
    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
exports.decrypt = decrypt;
/**
 * Generate a secure random token
 * @param length Length of the token
 * @returns Random token
 */
const generateToken = (length = 32) => {
    return crypto_1.default.randomBytes(length).toString('hex');
};
exports.generateToken = generateToken;
/**
 * Hash a password using bcrypt
 * @param password Password to hash
 * @returns Hashed password
 */
const hashPassword = async (password) => {
    const bcrypt = await Promise.resolve().then(() => __importStar(require('bcrypt')));
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
};
exports.hashPassword = hashPassword;
/**
 * Compare a password with a hash
 * @param password Password to compare
 * @param hash Hash to compare with
 * @returns True if the password matches the hash
 */
const comparePassword = async (password, hash) => {
    const bcrypt = await Promise.resolve().then(() => __importStar(require('bcrypt')));
    return bcrypt.compare(password, hash);
};
exports.comparePassword = comparePassword;
exports.default = {
    encrypt: exports.encrypt,
    decrypt: exports.decrypt,
    generateToken: exports.generateToken,
    hashPassword: exports.hashPassword,
    comparePassword: exports.comparePassword,
};
