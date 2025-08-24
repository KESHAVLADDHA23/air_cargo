import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, { 
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Query validation failed',
        details: errors
      });
    }

    req.query = value;
    next();
  };
};

// Common validation schemas
export const schemas = {
  signup: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required()
      .messages({
        'string.alphanum': 'Username must contain only letters and numbers',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username must not exceed 30 characters'
      }),
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    password: Joi.string().min(6).max(128).required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password must not exceed 128 characters'
      })
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),

  createBooking: Joi.object({
    origin: Joi.string().length(3).uppercase().required(),
    destination: Joi.string().length(3).uppercase().required(),
    pieces: Joi.number().integer().min(1).max(1000).required(),
    weight_kg: Joi.number().integer().min(1).max(50000).required(),
    flight_ids: Joi.array().items(Joi.number().integer().positive()).min(1).max(2).required()
  }),

  routeSearch: Joi.object({
    origin: Joi.string().length(3).uppercase().required(),
    destination: Joi.string().length(3).uppercase().required(),
    departure_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required()
  }),

  departBooking: Joi.object({
    location: Joi.string().max(100).required(),
    flight_info: Joi.object().optional()
  }),

  arriveBooking: Joi.object({
    location: Joi.string().max(100).required(),
    flight_info: Joi.object().optional()
  })
};