
import axios from "axios";  
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken"; // Import JWT for decoding tokens
import Order from "../models/order.js"; 
import User from "../models/user.js"; 
import sequelize from "../util/database.js"; // Import sequelize for transactions

// const axios = require("axios");
// const { v4: uuidv4 } = require("uuid");

const CF_API_URL = "https://sandbox.cashfree.com/pg/orders";  
const CF_CLIENT_ID = "TEST430329ae80e0f32e41a393d78b923034";  
const CF_CLIENT_SECRET = "TESTaf195616268bd6202eeb3bf8dc458956e7192a85";  

const createOrder = async (req, res) => {
    const t = await sequelize.transaction(); // Start transaction
    try {
        console.log("Received Payment Request:", req.body);

        const { amount } = req.body;
        const token = req.headers.authorization?.split(" ")[1]; 

        if (!amount || !token) {
            return res.status(400).json({ message: "Amount and valid token are required!" });
        }

        let user;
        try {
            user = jwt.verify(token, process.env.JWT_SECRET || 'defaultSecretKey123');
        } catch (err) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        const userId = user.id;
        const customerName = user.name || "Unknown User"; 
        const customerEmail = user.email || "noemail@example.com"; 
        const customerPhone = "9876543210"; 

        const orderId = `ORDER_${uuidv4()}`; 

        const orderData = {
            order_id: orderId,  
            order_amount: Number(amount),  
            order_currency: "INR",
            order_note: "Test Order",
            customer_details: {
                customer_id: `user_${userId}`,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: customerPhone, 
            },
            order_meta: {
                return_url: `http://localhost:5000/payment/response?order_id=${orderId}`,
                notify_url: "http://localhost:5000/api/payment/webhook", // Webhook URL for notification
            },
            order_splits: [],
        };

        const response = await axios.post(
            CF_API_URL,  
            orderData,
            {
                headers: {
                    "x-api-version": "2023-08-01",
                    "x-client-id": CF_CLIENT_ID,  
                    "x-client-secret": CF_CLIENT_SECRET,  
                    "Content-Type": "application/json",
                },
            }
        );

        if (response.data && response.data.payment_session_id) {
            // Save order details to the database with PENDING status
            await Order.create({
                orderId: orderId,
                userId: userId,
                amount: Number(amount),
                status: "PENDING", // Initial status before payment confirmation
            },
            { transaction: t }
        );
           
             await t.commit(); // Commit transaction
             return res.json({ 
                payment_session_id: response.data.payment_session_id, 
                order_id: orderId 
              });
        } else {
            // If payment session creation failed, redirect to payment response with status FAILED
            await Order.create({
                orderId: orderId,
                userId: userId,
                amount: Number(amount),
                status: "FAILED", // Failed status
            },
            { transaction: t }
        );
            await t.commit();
            return res.redirect(`http://localhost:5000/payment/response?order_id=${orderId}`); // Redirect on failure
        }
    } catch (error) {
        await t.rollback(); // Rollback on error
        console.error("Error in createOrder:", error.response ? error.response.data : error.message);
        return res.status(500).json({
            message: "Internal Server Error",
            error: error.response ? error.response.data : error.message,
        });
    }
};

const getPaymentStatus = async (req, res) => {
    const { order_id } = req.query;

    if (!order_id) {
        return res.status(400).json({ message: "order_id is required" });
    }

    try {
        const response = await axios.get(
            `https://sandbox.cashfree.com/pg/orders/${order_id}`,
            {
                headers: {
                    "x-api-version": "2023-08-01",
                    "x-client-id": CF_CLIENT_ID,
                    "x-client-secret": CF_CLIENT_SECRET,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("🔍 Live Payment Status:", response.data);

        const paymentStatus = response.data.order_status;

        if (paymentStatus === "PAID") {
            // ✅ Update order status in the database
            const order = await Order.findOne({ where: { orderId: order_id } });

            if (order) {
                order.status = "PAID";
                await order.save();
                console.log(`✅ Order ${order_id} updated to PAID in database.`);

                // ✅ Upgrade the user to premium
                const user = await User.findOne({ where: { id: order.userId } });
                if (user) {
                    console.log(`🔄 Updating user ${user.id} to premium...`);
                    user.isPremium = 1; // Ensure it updates correctly
                    await user.save();

                    // Double-check if the update worked
                    const updatedUser = await User.findOne({ where: { id: order.userId } });
                    console.log(`🏆 User ${updatedUser.id} is now PREMIUM: ${updatedUser.isPremium}`);
                } else {
                    console.log(`⚠️ User ${order.userId} not found.`);
                }
            } else {
                console.log(`❌ Order ${order_id} not found in database!`);
            }
        }

        return res.json({ status: paymentStatus });
    } catch (error) {
        console.error("❌ Error fetching payment status:", error);
        return res.status(500).json({ message: "Error fetching payment status" });
    }
};


const handlePaymentWebhook = async (req, res) => {
    const t = await sequelize.transaction(); // Start transaction
    try {
        console.log("🔔 Webhook Received:", req.body); 
        
        const { order_id, order_status } = req.body;

        if (!order_id || !order_status) {
            console.log("❌ Invalid webhook data received:", req.body);
            return res.status(400).json({ message: "Invalid webhook data" });
        }

        console.log(`✅ Webhook for Order: ${order_id}, Status: ${order_status}`);

        if (order_status === "PAID") {
            const order = await Order.findOne({ where: { orderId: order_id }, transaction: t });

            if (!order) {
                await t.rollback();
                console.log(`❌ Order ${order_id} not found in database!`);
                return res.status(404).json({ message: "Order not found" });
            }

            // Update order status
            order.status = "PAID";
            await order.save({ transaction: t });
            console.log(`✅ Order ${order_id} updated to PAID.`);

            // ✅ Upgrade user to premium
            const user = await User.findOne({ where: { id: order.userId }, transaction: t  });
            if (user) {
                console.log(`🔄 Updating user ${user.id} to premium...`);
                user.isPremium = 1; // Ensure this is the correct type
                await user.save({ transaction: t });

                // Double-check if the update worked
                const updatedUser = await User.findOne({ where: { id: order.userId }, transaction: t  });
                console.log(`🏆 User ${updatedUser.id} is now PREMIUM: ${updatedUser.isPremium}`);
            } else {
                console.log(`⚠️ User ${order.userId} not found.`);
            }

            await t.commit(); // Commit transaction
        } else {
            console.log(`⚠️ Payment status is ${order_status}, not updating.`);
            await t.commit(); // Commit even if no changes were made
        }

        return res.status(200).json({ message: "Webhook processed successfully" });
    } catch (error) {
        await t.rollback(); // Rollback transaction on error
        console.error("❌ Error processing webhook:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


export { createOrder, getPaymentStatus ,handlePaymentWebhook}; // ✅ Use ES Modules
