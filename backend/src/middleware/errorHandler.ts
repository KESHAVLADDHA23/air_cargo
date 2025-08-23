import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    statusCode: err.statusCode || 500,
    code: err.code || 'INTERNAL_ERROR'
  };

  // Specific error handling
  if (err.message.includes('UNIQUE constraint failed')) {
    error = {
      message: 'Resource already exists',
      statusCode: 409,
      code: 'DUPLICATE_RESOURCE'
    };
  }

  if (err.message.includes('FOREIGN KEY constraint failed')) {
    error = {
      message: 'Referenced resource not found',
      statusCode: 400,
      code: 'INVALID_REFERENCE'
    };
  }

  if (err.message.includes('NOT NULL constraint failed')) {
    error = {
      message: 'Required field missing',
      statusCode: 400,
      code: 'MISSING_REQUIRED_FIELD'
    };
  }

  res.status(error.statusCode).json({
    error: error.code,
    message: error.message,
    timestamp: new Date().toISOString(),
    path: req.url
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString(),
    path: req.url
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};