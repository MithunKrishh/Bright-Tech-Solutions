function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : error.message;

  return response.status(statusCode).json({
    success: false,
    data: {},
    message,
  });
}

module.exports = errorHandler;
