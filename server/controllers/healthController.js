async function getHealthStatus(request, response, next) {
  try {
    return response.status(200).json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      },
      message: 'API is healthy',
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getHealthStatus,
};
