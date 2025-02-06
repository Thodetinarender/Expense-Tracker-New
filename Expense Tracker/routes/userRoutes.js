const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// Signup route
router.post('/signup', userController.signup);

// Sign In route
router.post('/signin', userController.signin);

// New expense route
router.post('/add-expense', userController.expense);

// Home route to fetch and render expenses for the logged-in user
router.get('/home', userController.homePage); // Fetches and renders home page with expenses

// Route to delete an expense
router.delete('/expense/:id', userController.deleteExpense);

module.exports = router;
