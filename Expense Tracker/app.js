const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session'); // Import session
const sequelize = require('./util/database');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors());
app.use(bodyParser.json()); // To handle JSON data
app.use(bodyParser.urlencoded({ extended: true }));  // To handle form data (URL-encoded)


// Configure session middleware
app.use(session({
    secret: 'narender746', // Change this to a secure secret key
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set `true` if using HTTPS
}));

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', userRoutes);

// Middleware to protect routes (authentication check)
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/signin'); // Redirect to signin if not logged in
    }
};

// Serve the SignIn page on `/signin`
app.get('/signin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signin.html'));
});

// Serve the Signup page on `/signup`
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});


// Serve the home page (protected route)
app.get('/home', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});


// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
            return res.status(500).send("Error logging out");
        }
        res.redirect('/signin');
    });
});


// Sync database & start server
sequelize.sync()
    .then(() => {
        console.log('Database synced');
        app.listen(5000, () => console.log('Server running on http://localhost:5000'));
    })
    .catch(err => console.error(err));
