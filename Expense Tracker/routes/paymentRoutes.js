const express = require("express");
const paymentController = require("../controllers/paymentController");

const router = express.Router();

router.post("/create-order", paymentController.createOrder);
router.get("/status", paymentController.getPaymentStatus);
router.post("/webhook", paymentController.handlePaymentWebhook); // Webhook endpoint

module.exports = router; // ✅ CommonJS export
