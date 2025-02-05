const User = require('../models/user');

exports.signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Create user in the database
        const newUser = await User.create({ name, email, password });

        res.status(201).json({ message: "User registered successfully!", user: newUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error signing up user" });
    }
};
