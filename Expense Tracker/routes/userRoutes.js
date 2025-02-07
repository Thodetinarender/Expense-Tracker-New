const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const Expense = require('../models/expense'); // Import Expense model

// Authentication middleware
const { authenticateToken } = userController;

// Authentication routes
router.post('/signup', userController.signup);
router.post('/signin', userController.signin);

// Protected expense routes
router.post('/add-expense', authenticateToken, userController.addExpense);

router.get('/expenses', authenticateToken, userController.expenses);

router.delete('/expense/:id', authenticateToken, userController.deleteExpense);

module.exports = router;
