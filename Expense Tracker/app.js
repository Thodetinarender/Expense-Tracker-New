import express from "express";
import fs from "fs";
import cors from "cors";
import path from "path";
import url from "url";
import userRoutes from "./routes/userRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import sequelize from "./util/database.js";
import helmet from "helmet"
import compression from "compression";
import morgan from "morgan";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Use the combined routes
app.use("/api", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/password", emailRoutes);

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'});

app.use(helmet());
app.use(compression());
app.use(morgan('combined', {stream:accessLogStream}));

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

