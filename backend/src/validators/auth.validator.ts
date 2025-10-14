import Joi from 'joi';

/**
 * Validation schema for profile update
 */
export const updateProfileSchema = Joi.object({
  displayName: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Display name must be at least 2 characters long',
    'string.max': 'Display name cannot exceed 100 characters',
  }),
}).min(1);
