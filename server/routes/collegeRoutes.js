const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController');

router.get('/debug', collegeController.debugPaths);
router.get('/search', collegeController.searchColleges);
router.get('/results', collegeController.getResults);
router.get('/by-college', collegeController.getCollegeDetails);
router.get('/by-course', collegeController.getCollegesByCourse);
router.get('/streams', collegeController.getStreams);
router.get('/states', collegeController.getStates);

module.exports = router;