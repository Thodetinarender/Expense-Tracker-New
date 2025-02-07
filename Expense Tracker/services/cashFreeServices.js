import { Cashfree } from "cashfree-pg";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

Cashfree.XClientId = "TEST430329ae80e0f32e41a393d78b923034";//process.env.CASHFREE_API_ID;
Cashfree.XClientSecret = "TESTaf195616268bd6202eeb3bf8dc458956e7192a85";//process.env.CASHFREE_SECURITY_KEY;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX; // Change to PRODUCTION when live

// Function to create an order with Cashfree
export const createOrder = async (orderId, orderAmount, customerId, customerPhone) => {
    try {
        const expiryDate = new Date(Date.now() + 60 * 60 * 1000); // 1-hour expiry
        const formattedExpiryDate = expiryDate.toISOString();

        const request = {
            order_amount: orderAmount,
            order_currency: "INR",
            order_id: orderId,
            customer_details: {
                customer_id: customerId,
                customer_phone: customerPhone
            },
            order_meta: {
                return_url: `http://localhost:5000/payment-status/${orderId}`,
                payment_methods: "cc,dc,upi"
            },
            order_expiry_time: formattedExpiryDate
        };

        // Call Cashfree API to create order
        const response = await Cashfree.PGCreateOrder("2023-08-01", request);

        if (response.status === 200) {
            return response.data.payment_session_id;
        } else {
            throw new Error("Failed to create order with Cashfree");
        }
    } catch (error) {
        console.error("Error creating order:", error.message);
        throw error;
    }
};

// Function to check payment status from Cashfree
export const checkPaymentStatus = async (orderId) => {
    try {
        const response = await Cashfree.PGGetOrder("2023-08-01", orderId);
        return response.data.order_status; // "PAID", "FAILED", "PENDING"
    } catch (error) {
        console.error("Error checking payment status:", error.message);
        throw error;
    }
};
