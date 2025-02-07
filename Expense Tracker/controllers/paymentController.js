import { createOrder, checkPaymentStatus } from "../services/cashFreeServices.js";
import Order from "../models/order.js";
import User from "../models/user.js";

// API to Create an Order
// export const createPaymentOrder = async (req, res) => {
//     try {
//         const userId = req.user.id;
//         const orderAmount = 199; // Example premium membership price
//         const orderId = `ORDER_${Date.now()}`;
//         const customerPhone = "9999999999"; // Dummy phone, should be updated from user profile

//         // Save order in the database with PENDING status
//         const newOrder = await Order.create({
//             orderId,
//             userId,
//             amount: orderAmount,
//             status: "PENDING"
//         });

//         // Call Cashfree service to create order
//         const paymentSessionId = await createOrder(orderId, orderAmount, userId, customerPhone);

//         res.status(201).json({ paymentSessionId });

//     } catch (error) {
//         console.error("Error creating payment order:", error.message);
//         res.status(500).json({ message: "Failed to create order" });
//     }
// };

export const createPaymentOrder = async (req, res) => {
    try {
        console.log("Received payment request:", req.body); // Debugging log

        const { userId, amount } = req.body;
        if (!userId || !amount) {
            console.error("Missing required fields:", req.body);
            return res.status(400).json({ message: "Missing userId or amount" });
        }

        const orderId = `ORDER_${Date.now()}`;
        const newOrder = await Order.create({
            orderId,
            userId,
            amount,
            status: "PENDING",
        });

        console.log("New Order Created:", newOrder);

        res.json({ message: "Order created successfully", orderId });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ message: "Server error while creating order" });
    }
};


// API to Check Payment Status
export const verifyPaymentStatus = async (req, res) => {
    try {
        const { orderId } = req.params;

        // Fetch order details from Cashfree
        const orderStatus = await checkPaymentStatus(orderId);

        // Update order status in the database
        const order = await Order.findOne({ where: { orderId } });
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        order.status = orderStatus;
        await order.save();

        // If payment is successful, upgrade user to Premium
        if (orderStatus === "PAID") {
            await User.update({ isPremium: true }, { where: { id: order.userId } });
        }

        res.status(200).json({ message: `Payment ${orderStatus}` });

    } catch (error) {
        console.error("Error verifying payment status:", error.message);
        res.status(500).json({ message: "Failed to verify payment" });
    }
};
