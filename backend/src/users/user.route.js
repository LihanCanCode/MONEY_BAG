const express = require('express')
const router = express.Router(); 
const { registerUser } = require('./users');
const { verifyFirebaseToken } = require('../../middleware/authMiddleware');


router.use(verifyFirebaseToken); 
router.post('/register', registerUser);

module.exports = router; 