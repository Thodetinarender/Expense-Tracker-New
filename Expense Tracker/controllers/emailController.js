
import SibApiV3Sdk from "sib-api-v3-sdk";
import User from "../models/user.js";
import ForgotPasswordRequest from "../models/forgotPasswordRequest.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// Configure API key authorization
const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY || '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';

const sendResetEmail = async (email, uuid) => {
    try {
        // Create a new TransactionalEmailsApi instance
        const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

        // Create SendSmtpEmail object
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

        // Configure the email
        sendSmtpEmail.sender = {
            email: "tnr123457@gmail.com",
            name: "Expense Tracker"
        };
        sendSmtpEmail.to = [{ email }];
        sendSmtpEmail.subject = "Reset Your Password";
        
        const resetLink = `http://localhost:5000/password/resetpassword/${uuid}`;
        
        sendSmtpEmail.htmlContent = `
            <html>
                <body>
                    <h2>Password Reset Request</h2>
                    <p>Click the button below to reset your password:</p>
                    <div style="margin: 20px 0;">
                        <a href="${resetLink}" 
                           style="background-color: #007bff; 
                                  color: white; 
                                  padding: 10px 20px; 
                                  text-decoration: none; 
                                  border-radius: 5px;">
                            Reset Password
                        </a>
                    </div>
                    <p>Or copy and paste this link in your browser:</p>
                    <p>${resetLink}</p>
                    <p>This link will expire in 24 hours.</p>
                </body>
            </html>
        `;

        // Send the email
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('Email sent successfully:', data);
        return true;
    } catch (error) {
        console.error('Email sending error:', error);
        throw error;
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                success: false,
                message: "Email is required" 
            });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }

        // Create new password reset request
        const resetRequest = await ForgotPasswordRequest.create({
            userId: user.id,
            isActive: true
        });

        await sendResetEmail(email, resetRequest.id);
        
        return res.status(200).json({ 
            success: true,
            message: "Password reset email sent. Please check your inbox."
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return res.status(500).json({ 
            success: false,
            message: "Failed to send reset email. Please try again later."
        });
    }
};

// ... rest of your code ...
export const resetPassword = async (req, res) => {
    try {
        const { uuid } = req.params;
        const { newPassword } = req.body;

        if (!uuid || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Reset token and new password are required"
            });
        }

        // Find the reset request
        const resetRequest = await ForgotPasswordRequest.findOne({
            where: {
                id: uuid,
                isActive: true
            }
        });

        if (!resetRequest) {
            return res.status(404).json({
                success: false,
                message: "Invalid or expired reset link"
            });
        }

        const user = await User.findByPk(resetRequest.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ password: hashedPassword });

        // Deactivate the reset request
        await resetRequest.update({ isActive: false });

        res.status(200).json({
            success: true,
            message: "Password updated successfully!"
        });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to reset password"
        });
    }
};