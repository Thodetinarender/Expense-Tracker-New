import express from "express";
import cors from "cors";
import path from "path";
import url from "url"; // Import url module to work with import.meta.url
import userRoutes from "./routes/userRoutes.js"; // ✅ Use ES Modules
import paymentRoutes from "./routes/paymentRoutes.js";
import sequelize from "./util/database.js";

// Get the current directory using import.meta.url
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

app.get("/payment/response", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "paymentResponse.html"));
});


sequelize.sync() // sequelize.sync({ force: true }) // Change `force: true` only for development
  .then(() => console.log("Database synced successfully"))
  .catch((err) => console.error("Error syncing database:", err));

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
