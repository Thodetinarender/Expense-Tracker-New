import express from 'express';
import { forgotPassword, resetPassword } from '../controllers/emailController.js';

const router = express.Router();

router.post('/forgot', forgotPassword);
router.post('/resetpassword/:uuid', resetPassword);

export default router;