const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const sequelize = require('./util/database');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', userRoutes);

// Serve the Signup page on `/signup`
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Sync database & start server
sequelize.sync()
    .then(() => {
        console.log('Database synced');
        app.listen(5000, () => console.log('Server running on http://localhost:5000'));
    })
    .catch(err => console.error(err));
