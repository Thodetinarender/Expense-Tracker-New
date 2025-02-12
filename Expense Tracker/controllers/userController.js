const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Expense = require('../models/expense');
const sequelize = require('../util/database');
require('dotenv').config();

// Generate JWT Token
const generateToken = (user) => {
    const secret = process.env.JWT_SECRET || 'defaultSecretKey123'; // Fallback secret
    return jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '1h' });
};


exports.signup = async (req, res) => {
    const t = await sequelize.transaction(); // Start transaction
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required" });
        }

        const existingUser = await User.findOne({ where: { email }, transaction: t });
        if (existingUser) {
            await t.rollback();
            return res.status(400).json({ message: "Email already in use" });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user with hashed password
        const newUser = await User.create({ name, email, password: hashedPassword },{ transaction: t});

        await t.commit(); // Commit transaction
        res.status(201).json({ message: "User registered successfully!", token: generateToken(newUser) });

    } catch (error) {
        await t.rollback(); // Rollback on error
        console.error(error);
        res.status(500).json({ message: "Error signing up user" });
    }
};


exports.signin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

        // Generate token with user ID inside it
        const token = jwt.sign(
            { id: user.id, email: user.email, isPremium: user.isPremium },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({ message: "Login successful", token , isPremium: user.isPremium });

    } catch (error) {
        console.error("Sign-in error:", error);
        res.status(500).json({ message: "Error signing in" });
    }
};

exports.authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        console.error("Authentication failed: No token provided");
        return res.status(401).json({ message: "Access Denied! No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
       //console.log("Authenticated user:", decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("Invalid token:", error.message);
        return res.status(403).json({ message: "Invalid token" });
    }
};




exports.addExpense =async(req, res) =>{
    const t = await sequelize.transaction();
    try{
        const {amount, description,category}=req.body;

        if(!amount || !description || !category){
            return res.status(400).json({ message: "amount, description and category are required" });
        }
        const newExpense = await Expense.create({amount, description,category, userId: req.user.id }, {transaction:t});
     
        // Update totalExpense in User table
        await User.increment('totalExpense', { 
            by: amount, 
            where: { id: req.user.id } ,
            transaction:t

        });

        // Commit the transaction
        await t.commit();

        res.status(201).json({ message: "Expense added successfully", expense: newExpense });


    } catch (error) {
        await t.rollback(); // Rollback if any error occurs
        console.error(error);
        res.status(500).json({ message: "Error adding expense" });
    }

}


exports.deleteExpense = async (req, res) => {
    const t = await sequelize.transaction(); // Start transaction
    try {
        const expenseId = req.params.id;

        // Ensure the expense belongs to the logged-in user
        const expense = await Expense.findOne({ where: { id: expenseId, userId: req.user.id }, transaction:t });


        if (!expense) {
            await t.rollback(); // Rollback if expense is not found
            return res.status(404).json({ message: "Expense not found" });
        }

         // Subtract the deleted expense amount from totalExpense
         await User.increment('totalExpense', { 
            by: -expense.amount, 
            where: { id: req.user.id },
            transaction: t 
        });

        // Delete the expense
        await expense.destroy({ transaction: t });
        await t.commit(); // Commit the transaction

        // Send success message
        res.status(200).json({ message: "Expense deleted successfully" });
    } catch (error) {
        await t.rollback(); // Rollback transaction on error
        console.error(error);
        res.status(500).json({ message: "Error deleting expense" });
    }
};

exports.expenses = async (req, res) => {
    try {
       // console.log("Fetching expenses for user:", req.user.id);

        // Ensure `req.user.id` is available
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized: User ID not found" });
        }

        const expenses = await Expense.findAll({ where: { userId: req.user.id } });

       // console.log("Expenses fetched:", expenses);
        res.status(200).json(expenses);
    } catch (error) {
        console.error("Error fetching expenses:", error.message);
        res.status(500).json({ message: "Error fetching expenses", error: error.message });
    }
}

exports.getAllUsersTotalExpenses = async (req, res) => {
    try {
        if (!req.user.isPremium) {
            return res.status(403).json({ message: "Access Denied! Only Premium users can view this." });
        }

        // Fetch only users with their totalExpense
        const usersTotalExpenses = await User.findAll({
            attributes: ['id', 'name', 'totalExpense'],
            order: [['totalExpense', 'DESC']] // Sort by highest totalExpense
        });

        res.status(200).json(usersTotalExpenses);

    } catch (error) {
        console.error("Error fetching total expenses:", error.message);
        res.status(500).json({ message: "Error fetching total expenses" });
    }
};
