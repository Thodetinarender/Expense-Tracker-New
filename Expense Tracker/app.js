const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const emailRoutes = require("./routes/emailRoutes");
const sequelize = require("./util/database");

const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const app = express();

// Middleware to log the beginning of each request
app.use((req, res, next) => {
  //console.log(`Received request: ${req.method} ${req.url}`);
  next();
});

app.use(cors({
  origin: "://127.0.0.1:5500", // Adjust based on where your frontend is running
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware for security headers, compression, and logging
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "https://cdn.jsdelivr.net", 
        "'unsafe-inline'", 
        "https://sandbox.cashfree.com",   // Allow the sandbox checkout URL
        "https://*.cashfree.com",        // Allow Cashfree scripts
        "https://*.cashfreepay.com"      // Allow Cashfree payment gateway scripts
      ],
      styleSrc: [
        "'self'", 
        "https://cdn.jsdelivr.net", 
        "https://cdnjs.cloudflare.com", 
        "'unsafe-inline'"
      ],
      fontSrc: [
        "'self'", 
        "https://cdnjs.cloudflare.com"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https://*.cashfree.com",        // Allow Cashfree to load images
        "https://*.cashfreepay.com"      // Allow Cashfree payment gateway images
      ],
      connectSrc: [
        "'self'", 
        "https://sandbox.cashfree.com",  // Allow Cashfree sandbox API requests
        "https://*.cashfree.com",        // Allow Cashfree API requests
        "https://*.cashfreepay.com"      // Allow Cashfree payment API requests
      ],
      frameSrc: [
        "'self'",
        "https://sandbox.cashfree.com"   // Allow embedding the Cashfree payment page (frame)
      ],
      scriptSrcAttr: ["'unsafe-inline'"], // Allow inline event handlers (not recommended)
    },
  },
}));

app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Use the combined routes
app.use("/api", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/password", emailRoutes);

// Add the UUID route first (more specific)
app.get("/password/resetpassword/:uuid", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "resetPassword.html"));
});

// Then add the general route
app.get("/resetPassword.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "resetPassword.html"));
});

app.get("/payment/response", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "paymentResponse.html"));
});

sequelize.sync()
  .then(() => console.log("Database synced and also successfully"))
  .catch((err) => console.error("Error syncing database:", err));

app.listen(5000, () => console.log("Server running on http://localhost:5000"));