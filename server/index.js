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

// FIX 1: Allow all origins from your Railway deployment
// Previously only localhost was allowed — the live domain was blocked!
const allowedOrigins = new Set(
  [
    process.env.CLIENT_ORIGIN,
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000',
    // Add your Railway production URL explicitly:
    'https://bright-tech-solutions-production.up.railway.app',
  ]
    .filter(Boolean)
    .map((origin) => origin.trim())
);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (e.g. same-origin, mobile apps, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      // FIX 2: In development/same-host deployments the HTML and API
      // are served from the same origin so `origin` may be undefined.
      // Also allow any railway.app subdomain for preview deployments:
      if (origin.endsWith('.railway.app')) {
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
    console.log('No MONGO_URI set — skipping database connection. College search uses Excel file only.');
    return false;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');
    return true;
  } catch (err) {
    // FIX 3: Don't crash the whole server if MongoDB fails.
    // The college search works purely from the Excel file — no DB needed.
    console.warn('MongoDB connection failed (non-fatal):', err.message);
    return false;
  }
}

async function startServer() {
  try {
    await connectToDatabase();

    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    process.exitCode = 1;
    console.error('Server failed to start.', error);
  }
}

startServer();

module.exports = app;