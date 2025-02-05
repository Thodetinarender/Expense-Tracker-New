const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// Signup route
router.post('/signup', userController.signup);

// Sign In route
router.post('/signin', userController.signin);
module.exports = router;
