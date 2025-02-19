const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router();

// Authentication routes
router.post("/signup", userController.signup);
router.post("/signin", userController.signin);

// Protected expense routes
router.post("/add-expense", userController.authenticateToken, userController.addExpense);
router.get("/expenses", userController.authenticateToken, userController.expenses);
router.delete("/expense/:id", userController.authenticateToken, userController.deleteExpense);
router.get("/download", userController.authenticateToken, userController.downloadExpense);
router.get('/reports', userController.authenticateToken, userController.getUserExpenseReports);

// Premium Users
router.get("/total-expenses", userController.authenticateToken, userController.getAllUsersTotalExpenses);

module.exports = router; // ✅ CommonJS export
