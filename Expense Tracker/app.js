// const express = require('express');
// const path = require('path');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const sequelize = require('./util/database');
// const userRoutes = require('./routes/userRoutes');
// // const paymentRoutes = require('./routes/paymentRoutes');

// require('dotenv').config();

// const app = express();

// app.use(cors());
// app.use(bodyParser.json()); // To handle JSON data
// app.use(bodyParser.urlencoded({ extended: true }));  // To handle form data (URL-encoded)



// // Serve static files from the 'public' folder
// app.use(express.static(path.join(__dirname, 'public')));

// // Routes
// app.use('/api', userRoutes);
// // app.use('/api', paymentRoutes);

// // Serve the SignIn page on `/signin`
// app.get('/signin', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'signin.html'));
// });

// // Serve the Signup page on `/signup`
// app.get('/signup', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'signup.html'));
// });


// // Sync database & start server
// sequelize.sync()
//     .then(() => {
//         console.log('Database synced');
//         app.listen(5000, () => console.log('Server running on http://localhost:5000'));
//     })
//     .catch(err => console.error(err));

import express from "express";
import cors from "cors";
import path from "path";
import userRoutes from "./routes/userRoutes.js"; // ✅ Use ES Modules
import sequelize from "./util/database.js";
import Order from "./models/order.js"; // Ensure model is imported

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(process.cwd(), "public")));

// Use the combined routes
app.use("/api", userRoutes);


sequelize.sync() // Change `force: true` only for development
  .then(() => console.log("Database synced successfully"))
  .catch((err) => console.error("Error syncing database:", err));
app.listen(5000, () => console.log("Server running on http://localhost:5000"));

