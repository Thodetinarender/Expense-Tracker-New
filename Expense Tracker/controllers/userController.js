const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Expense = require('../models/expense');

exports.signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Email, name and password are required" });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user with hashed password
        const newUser = await User.create({ name, email, password: hashedPassword });

        res.status(201).json({ message: "User registered successfully!", user: newUser });

    } catch (error) {
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

        // Find the user with the provided email
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Compare the provided password with the stored hash
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

          // Store user session
          req.session.user = { id: user.id, email: user.email };

          // Redirect to home page
          res.redirect('/home');

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error signing in" });
    }
};


exports.expense =async(req, res) =>{
    try{
        const {amount, description,category}=req.body;

        if(!amount || !description || !category){
            return res.status(400).json({ message: "amount, descrpition and category are required" });
        }
        const newExpense = await Expense.create({amount, description,category,  userId: req.session.user.id});
     
        // Redirect to home page
    
        res.redirect('/home');

    } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding expense" });
    }

}

exports.homePage = async (req, res) => {
    try {
        // Check if user is logged in
        if (!req.session.user) {
            return res.redirect('/signin');
        }

        const userId = req.session.user.id;
        const expenses = await Expense.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']] // Optionally order by date
        });

        // Send the expenses data as JSON
        res.json(expenses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching expenses" });
    }
};

exports.deleteExpense = async (req, res) => {
    try {
        const expenseId = req.params.id;

        // Ensure the expense belongs to the logged-in user
        const expense = await Expense.findOne({ where: { id: expenseId, userId: req.session.user.id } });

        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        // Delete the expense
        await expense.destroy();

        // Send success message
        res.status(200).json({ message: "Expense deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error deleting expense" });
    }
};
