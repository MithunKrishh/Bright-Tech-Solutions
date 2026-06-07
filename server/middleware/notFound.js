function notFound(request, response) {
  return response.status(404).json({
    success: false,
    data: {},
    message: 'Route not found',
  });
}

module.exports = notFound;
