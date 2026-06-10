const express = require('express');

const { getHealthStatus } = require('../controllers/healthController');
const collegeRoutes = require('./collegeRoutes');

const router = express.Router();

router.get('/health', getHealthStatus);
router.use('/colleges', collegeRoutes);

module.exports = router;
