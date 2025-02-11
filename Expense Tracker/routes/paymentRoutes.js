import express from "express";
import { createOrder, getPaymentStatus, handlePaymentWebhook } from "../controllers/paymentController.js";

const router = express.Router();
router.post("/create-order", createOrder);
router.get("/status", getPaymentStatus);
router.post("/webhook", handlePaymentWebhook); // Webhook endpoint

export default router; // ✅ Use ES Modules
