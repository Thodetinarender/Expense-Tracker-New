const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const userRoutes = require("./routes/userRoutes");
//const expenseRoutes = require("./routes/expenseRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const emailRoutes = require("./routes/emailRoutes");
const sequelize = require("./util/database");
const morgan = require("morgan");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// hi Create a write stream (in append mode) for logging requests to a file
const accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), { flags: "a" });

// Setup Morgan for logging
app.use(morgan("combined", { stream: accessLogStream })); // Log to file
app.use(morgan("dev")); // Log to console

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Use the combined routes
app.use("/api", userRoutes);
//app.use("/api/expenses", expenseRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/password", emailRoutes);

// Add the UUID route first (more specific)
app.get("/password/resetpassword/:uuid", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "resetPassword.html"));
});

// Then add the general route
app.get("/resetPassword.html", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "resetPassword.html"));
});


app.get("/payment/response", (req, res) => {
    res.sendFile(path.join(process.cwd(), "public", "paymentResponse.html"));
});

sequelize.sync()
    .then(() => console.log("Database synced successfully"))
    .catch((err) => console.error("Error syncing database:", err));

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
