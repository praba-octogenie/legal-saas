import Joi from 'joi';

/**
 * Validate data against a Joi schema
 * @param schema Joi schema
 * @param data Data to validate
 * @returns Validation result
 */
export const validateSchema = <T>(schema: Joi.Schema, data: any): { error?: Joi.ValidationError; value: T } => {
  const options: Joi.ValidationOptions = {
    abortEarly: false, // Include all errors
    allowUnknown: true, // Ignore unknown props
    stripUnknown: true, // Remove unknown props
  };

  const { error, value } = schema.validate(data, options);
  
  return { error, value: value as T };
};

// Client validation schemas
const clientAddressSchema = Joi.object({
  street: Joi.string().optional(),
  city: Joi.string().optional(),
  state: Joi.string().optional(),
  postalCode: Joi.string().optional(),
  country: Joi.string().optional(),
});

const clientKycDocumentSchema = Joi.object({
  type: Joi.string().required(),
  documentId: Joi.string().required(),
  documentUrl: Joi.string().required(),
  status: Joi.string().valid('pending', 'verified', 'rejected').default('pending'),
});

const clientKycSchema = Joi.object({
  aadharNumber: Joi.string().optional(),
  panNumber: Joi.string().optional(),
  gstNumber: Joi.string().optional(),
  companyRegistrationNumber: Joi.string().optional(),
  documents: Joi.array().items(clientKycDocumentSchema).optional(),
});

const clientContactPersonSchema = Joi.object({
  id: Joi.string().optional(),
  name: Joi.string().required(),
  designation: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  isPrimary: Joi.boolean().default(false),
});

const clientPreferencesSchema = Joi.object({
  language: Joi.string().optional(),
  communicationChannel: Joi.string().valid('email', 'phone', 'portal').optional(),
  notificationPreferences: Joi.object({
    email: Joi.boolean().optional(),
    sms: Joi.boolean().optional(),
    portal: Joi.boolean().optional(),
  }).optional(),
});

const clientPortalAccessSchema = Joi.object({
  enabled: Joi.boolean().optional(),
  username: Joi.string().optional(),
  accessLevel: Joi.string().valid('full', 'limited', 'readonly').optional(),
});

const createClientSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  type: Joi.string().valid('individual', 'corporate', 'government', 'ngo').default('individual'),
  category: Joi.string().optional(),
  address: clientAddressSchema.optional(),
  kycDetails: clientKycSchema.optional(),
  contactPersons: Joi.array().items(clientContactPersonSchema).optional(),
  preferences: clientPreferencesSchema.optional(),
  portalAccess: clientPortalAccessSchema.optional(),
  metadata: Joi.object().optional(),
});

const updateClientSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  type: Joi.string().valid('individual', 'corporate', 'government', 'ngo').optional(),
  status: Joi.string().valid('active', 'inactive', 'blocked').optional(),
  category: Joi.string().optional(),
  address: clientAddressSchema.optional(),
  kycDetails: clientKycSchema.optional(),
  contactPersons: Joi.array().items(clientContactPersonSchema).optional(),
  preferences: clientPreferencesSchema.optional(),
  portalAccess: clientPortalAccessSchema.optional(),
  metadata: Joi.object().optional(),
});

/**
 * Create a middleware for validating request body
 * @param schema Joi schema
 * @returns Express middleware
 */
export const validateBody = (schema: Joi.Schema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = validateSchema(schema, req.body);
    
    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      return res.status(400).json({ error: errorMessage });
    }
    
    req.body = value;
    next();
  };
};

/**
 * Create a middleware for validating request query
 * @param schema Joi schema
 * @returns Express middleware
 */
export const validateQuery = (schema: Joi.Schema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = validateSchema(schema, req.query);
    
    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      return res.status(400).json({ error: errorMessage });
    }
    
    req.query = value;
    next();
  };
};

/**
 * Create a middleware for validating request params
 * @param schema Joi schema
 * @returns Express middleware
 */
export const validateParams = (schema: Joi.Schema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = validateSchema(schema, req.params);
    
    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      return res.status(400).json({ error: errorMessage });
    }
    
    req.params = value;
    next();
  };
};

/**
 * Validate create client request
 * @param data Request data
 * @returns Validation result
 */
export const validateCreateClient = (data: any) => {
  return validateSchema(createClientSchema, data);
};

/**
 * Validate update client request
 * @param data Request data
 * @returns Validation result
 */
export const validateUpdateClient = (data: any) => {
  return validateSchema(updateClientSchema, data);
};

export default {
  validateSchema,
  validateBody,
  validateQuery,
  validateParams,
  validateCreateClient,
  validateUpdateClient,
};