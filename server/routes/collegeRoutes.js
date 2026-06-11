const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController');

// GET /api/v1/colleges/search?q=searchterm  → autocomplete suggestions
router.get('/debug', collegeController.debugPaths);
router.get('/search', collegeController.searchColleges);

// GET /api/v1/colleges/results?q=searchterm → full result cards
router.get('/results', collegeController.getResults);

// GET /api/v1/colleges/by-college?name=collegename
router.get('/by-college', collegeController.getCollegeDetails);

// GET /api/v1/colleges/by-course?name=degreename
router.get('/by-course', collegeController.getCollegesByCourse);

// GET /api/v1/colleges/streams
router.get('/streams', collegeController.getStreams);

// GET /api/v1/colleges/states
router.get('/states', collegeController.getStates);

module.exports = router;