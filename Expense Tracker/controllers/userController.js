const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Expense = require('../models/expense');
//const { ExpenseReport } = require('../models/ExpenseReport');
const ExpenseReport = require('../models/ExpenseReport'); // Ensure the path is correct
const sequelize = require('../util/database');
const dotenv = require('dotenv');

const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
dotenv.config();

// Generate JWT Token
const generateToken = (user) => {
    const secret = process.env.JWT_SECRET; // Fallback secret
    return jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: '1h' });
};


 const signup = async (req, res) => {
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


const signin = async (req, res) => {
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

const authenticateToken = (req, res, next) => {
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
// controllers/expenseController.js
const addExpense = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { amount, description, category, type } = req.body;

        if (!amount || !description || !category || !type) {
            return res.status(400).json({ message: "amount, description, category, and type are required" });
        }

        const newExpense = await Expense.create({ amount, description, category, type, userId: req.user.id }, { transaction: t });

        if (type === 'expense') {
            await User.increment(
                { totalExpense: amount, totalSalary: -amount },
                { where: { id: req.user.id }, transaction: t }
            );
        } else if (type === 'income') {
            await User.increment(
                { totalSalary: amount },
                { where: { id: req.user.id }, transaction: t }
            );
        }

        await t.commit();

        res.status(201).json({ message: "Entry added successfully", expense: newExpense });
    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({ message: "Error adding entry" });
    }
}


const deleteExpense = async (req, res) => {
    const t = await sequelize.transaction(); // Start transaction
    try {
        const expenseId = req.params.id;

        // Ensure the expense belongs to the logged-in user
        const expense = await Expense.findOne({ where: { id: expenseId, userId: req.user.id }, transaction:t });


        if (!expense) {
            await t.rollback(); // Rollback if expense is not found
            return res.status(404).json({ message: "Expense not found" });
        }

         // Subtract the deleted expense amount from totalExpense and increment totalSalary
         await User.increment(
            { totalExpense: -expense.amount, totalSalary: expense.amount },
            { where: { id: req.user.id }, transaction: t }
        );

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

const expenses = async (req, res) => {
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

const getAllUsersTotalExpenses = async (req, res) => {
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

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
//const { expenseReportt } = require('./models');  // Adjust the path to your model

const s3 = new S3Client({
    region: process.env.AWS_REGION || "ap-south-1", // Set default if undefined
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});


// Download expense report and upload to S3
const downloadExpense = async (req, res) => {
    try {
        // Ensure `req.user.id` is available
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized: User ID not found" });
        }

        // Fetch expenses for the logged-in user
        const expenses = await Expense.findAll({
            where: { userId: req.user.id }
        });

        // If no expenses found
        if (expenses.length === 0) {
            return res.status(404).json({ message: "No expenses found for the user" });
        }

        // Convert expenses to CSV format
        const csv = convertExpensesToCSV(expenses);

        // Set the file name to include a timestamp for uniqueness
        const fileName = `expense_report_${Date.now()}.csv`;

        // Set S3 parameters using environment variables for your bucket name
        const s3Params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileName,
            Body: csv,
            ContentType: 'text/csv',
            ACL: 'public-read'
        };

        // Create a PutObjectCommand to upload the CSV to S3
        const uploadCommand = new PutObjectCommand(s3Params);

        // Send the upload command to S3
        await s3.send(uploadCommand);

         // Generate the file URL
         const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

         // Store fileName and fileUrl in the database
         const expenseReport = await ExpenseReport.create({
             userId: req.user.id,
             fileName: fileName,
             fileUrl: fileUrl
         });
 
         // Return the URL of the uploaded file
         res.status(200).json({
             fileURL: fileUrl,
             fileName: fileName,
             userId : expenseReport.id // Optionally return the report ID
         });

    } catch (error) {
        console.error("Error generating expense report:", error.message);
        res.status(500).json({ message: "Error generating expense report", error: error.message });
    }
};

// Function to get expense reports for the logged-in user
const getUserExpenseReports = async (req, res) => {
    try {
        // Ensure `req.user.id` is available
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized: User ID not found" });
        }

        // Fetch expense reports for the logged-in user
        const reports = await ExpenseReport.findAll({
            where: { userId: req.user.id }
        });

        // If no reports found
        if (reports.length === 0) {
            return res.status(404).json({ message: "No expense reports found for the user" });
        }

        // Return the reports
        res.status(200).json(reports);

    } catch (error) {
        console.error("Error fetching expense reports:", error.message);
        res.status(500).json({ message: "Error fetching expense reports", error: error.message });
    }
};

// Helper function to convert expenses data into CSV format
function convertExpensesToCSV(expenses) {
    const headers = ['Date', 'Description', 'Category', 'Income', 'Expense'];

    const rows = expenses.map(expense => {
        const date = new Date(expense.createdAt).toLocaleDateString(); // Format the date
        const income = expense.type === 'income' ? `₹${expense.amount}` : '';
        const expenseAmount = expense.type === 'expense' ? `₹${expense.amount}` : '';
        return `${date},${expense.description},${expense.category},${income},${expenseAmount}`;
    });

    return [headers.join(','), ...rows].join('\n');
}





module.exports = {
    signup,
    signin,
    authenticateToken,
    addExpense,
    deleteExpense,
    expenses,
    getAllUsersTotalExpenses,
    downloadExpense,
    getUserExpenseReports,
    convertExpensesToCSV
    
};
