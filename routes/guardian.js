const router = require('express').Router();
const guardianController = require('../controllers/guardianController');
const guardianStudentController = require('../controllers/guardianStudentController');  

// For getting child status
router.get('/child-status/:studentId',
  guardianController.verifyToken,
  guardianController.getChildStatus
);

module.exports = router;