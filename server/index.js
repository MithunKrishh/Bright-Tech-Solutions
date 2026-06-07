const path = require('path');

const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');

const apiRoutes = require('./routes/apiRoutes');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const createRateLimiter = require('./middleware/rateLimiter');

dotenv.config();

const app = express();
const clientDirectory = path.join(__dirname, '..', 'client');
const port = Number(process.env.PORT) || 5000;
const allowedOrigins = new Set(
  [process.env.CLIENT_ORIGIN, 'http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:3000', 'http://127.0.0.1:5000']
    .filter(Boolean)
    .map((origin) => origin.trim())
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error('CORS policy does not allow this origin'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(clientDirectory));

app.use('/api/v1', createRateLimiter(), apiRoutes);
app.use('/api/v1', notFound);

app.get('/', (request, response) => {
  response.sendFile(path.join(clientDirectory, 'index.html'));
});

app.use(errorHandler);

async function connectToDatabase() {
  const mongoUri = process.env.MONGO_URI?.trim();

  if (!mongoUri) {
    return false;
  }

  await mongoose.connect(mongoUri);
  return true;
}

async function startServer() {
  try {
    await connectToDatabase();

    app.listen(port, '0.0.0.0');
  } catch (error) {
    process.exitCode = 1;
    console.error('Server failed to start.', error);
  }
}

startServer();

module.exports = app;
