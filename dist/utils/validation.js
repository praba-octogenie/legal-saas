"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUpdateClient = exports.validateCreateClient = exports.validateParams = exports.validateQuery = exports.validateBody = exports.validateSchema = void 0;
const joi_1 = __importDefault(require("joi"));
/**
 * Validate data against a Joi schema
 * @param schema Joi schema
 * @param data Data to validate
 * @returns Validation result
 */
const validateSchema = (schema, data) => {
    const options = {
        abortEarly: false, // Include all errors
        allowUnknown: true, // Ignore unknown props
        stripUnknown: true, // Remove unknown props
    };
    const { error, value } = schema.validate(data, options);
    return { error, value: value };
};
exports.validateSchema = validateSchema;
// Client validation schemas
const clientAddressSchema = joi_1.default.object({
    street: joi_1.default.string().optional(),
    city: joi_1.default.string().optional(),
    state: joi_1.default.string().optional(),
    postalCode: joi_1.default.string().optional(),
    country: joi_1.default.string().optional(),
});
const clientKycDocumentSchema = joi_1.default.object({
    type: joi_1.default.string().required(),
    documentId: joi_1.default.string().required(),
    documentUrl: joi_1.default.string().required(),
    status: joi_1.default.string().valid('pending', 'verified', 'rejected').default('pending'),
});
const clientKycSchema = joi_1.default.object({
    aadharNumber: joi_1.default.string().optional(),
    panNumber: joi_1.default.string().optional(),
    gstNumber: joi_1.default.string().optional(),
    companyRegistrationNumber: joi_1.default.string().optional(),
    documents: joi_1.default.array().items(clientKycDocumentSchema).optional(),
});
const clientContactPersonSchema = joi_1.default.object({
    id: joi_1.default.string().optional(),
    name: joi_1.default.string().required(),
    designation: joi_1.default.string().optional(),
    email: joi_1.default.string().email().optional(),
    phone: joi_1.default.string().optional(),
    isPrimary: joi_1.default.boolean().default(false),
});
const clientPreferencesSchema = joi_1.default.object({
    language: joi_1.default.string().optional(),
    communicationChannel: joi_1.default.string().valid('email', 'phone', 'portal').optional(),
    notificationPreferences: joi_1.default.object({
        email: joi_1.default.boolean().optional(),
        sms: joi_1.default.boolean().optional(),
        portal: joi_1.default.boolean().optional(),
    }).optional(),
});
const clientPortalAccessSchema = joi_1.default.object({
    enabled: joi_1.default.boolean().optional(),
    username: joi_1.default.string().optional(),
    accessLevel: joi_1.default.string().valid('full', 'limited', 'readonly').optional(),
});
const createClientSchema = joi_1.default.object({
    name: joi_1.default.string().required(),
    email: joi_1.default.string().email().optional(),
    phone: joi_1.default.string().optional(),
    type: joi_1.default.string().valid('individual', 'corporate', 'government', 'ngo').default('individual'),
    category: joi_1.default.string().optional(),
    address: clientAddressSchema.optional(),
    kycDetails: clientKycSchema.optional(),
    contactPersons: joi_1.default.array().items(clientContactPersonSchema).optional(),
    preferences: clientPreferencesSchema.optional(),
    portalAccess: clientPortalAccessSchema.optional(),
    metadata: joi_1.default.object().optional(),
});
const updateClientSchema = joi_1.default.object({
    name: joi_1.default.string().optional(),
    email: joi_1.default.string().email().optional(),
    phone: joi_1.default.string().optional(),
    type: joi_1.default.string().valid('individual', 'corporate', 'government', 'ngo').optional(),
    status: joi_1.default.string().valid('active', 'inactive', 'blocked').optional(),
    category: joi_1.default.string().optional(),
    address: clientAddressSchema.optional(),
    kycDetails: clientKycSchema.optional(),
    contactPersons: joi_1.default.array().items(clientContactPersonSchema).optional(),
    preferences: clientPreferencesSchema.optional(),
    portalAccess: clientPortalAccessSchema.optional(),
    metadata: joi_1.default.object().optional(),
});
/**
 * Create a middleware for validating request body
 * @param schema Joi schema
 * @returns Express middleware
 */
const validateBody = (schema) => {
    return (req, res, next) => {
        const { error, value } = (0, exports.validateSchema)(schema, req.body);
        if (error) {
            const errorMessage = error.details.map((detail) => detail.message).join(', ');
            return res.status(400).json({ error: errorMessage });
        }
        req.body = value;
        next();
    };
};
exports.validateBody = validateBody;
/**
 * Create a middleware for validating request query
 * @param schema Joi schema
 * @returns Express middleware
 */
const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = (0, exports.validateSchema)(schema, req.query);
        if (error) {
            const errorMessage = error.details.map((detail) => detail.message).join(', ');
            return res.status(400).json({ error: errorMessage });
        }
        req.query = value;
        next();
    };
};
exports.validateQuery = validateQuery;
/**
 * Create a middleware for validating request params
 * @param schema Joi schema
 * @returns Express middleware
 */
const validateParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = (0, exports.validateSchema)(schema, req.params);
        if (error) {
            const errorMessage = error.details.map((detail) => detail.message).join(', ');
            return res.status(400).json({ error: errorMessage });
        }
        req.params = value;
        next();
    };
};
exports.validateParams = validateParams;
/**
 * Validate create client request
 * @param data Request data
 * @returns Validation result
 */
const validateCreateClient = (data) => {
    return (0, exports.validateSchema)(createClientSchema, data);
};
exports.validateCreateClient = validateCreateClient;
/**
 * Validate update client request
 * @param data Request data
 * @returns Validation result
 */
const validateUpdateClient = (data) => {
    return (0, exports.validateSchema)(updateClientSchema, data);
};
exports.validateUpdateClient = validateUpdateClient;
exports.default = {
    validateSchema: exports.validateSchema,
    validateBody: exports.validateBody,
    validateQuery: exports.validateQuery,
    validateParams: exports.validateParams,
    validateCreateClient: exports.validateCreateClient,
    validateUpdateClient: exports.validateUpdateClient,
};
