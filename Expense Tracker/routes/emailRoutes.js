const express = require("express");
const emailController = require("../controllers/emailController");

const router = express.Router();

router.post('/forgot', emailController.forgotPassword);
router.post('/resetpassword/:uuid', emailController.resetPassword);

module.exports = router;