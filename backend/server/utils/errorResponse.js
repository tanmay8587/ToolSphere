export const sendErrorResponse = (res, statusCode, message, details = null) => {
  const response = {
    success: false,
    message,
    ...(details && { details }),
  };

  if (process.env.NODE_ENV === 'development' && details?.stack) {
    response.stack = details.stack;
  }

  res.status(statusCode).json(response);
};

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode.toString().startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default { sendErrorResponse, AppError };
