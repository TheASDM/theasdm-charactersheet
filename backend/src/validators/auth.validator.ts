import Joi from 'joi';

/**
 * Validation schema for user registration
 */
export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password cannot exceed 128 characters',
    'any.required': 'Password is required',
  }),
  displayName: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Display name must be at least 2 characters long',
    'string.max': 'Display name cannot exceed 100 characters',
    'any.required': 'Display name is required',
  }),
  username: Joi.string().min(2).max(60).optional().messages({
    'string.min': 'Username must be at least 2 characters long',
    'string.max': 'Username cannot exceed 60 characters',
  }),
});

/**
 * Validation schema for user login
 */
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

/**
 * Validation schema for profile update
 */
export const updateProfileSchema = Joi.object({
  displayName: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Display name must be at least 2 characters long',
    'string.max': 'Display name cannot exceed 100 characters',
  }),
}).min(1);
