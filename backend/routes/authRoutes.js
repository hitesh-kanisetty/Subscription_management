const express = require("express");

const {
  signup,
  login,
  logout,
  getCurrentUser,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
} = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);

router.post("/login", login);

router.post("/logout", logout);

router.get("/me", getCurrentUser);

// Profile
router.get("/profile", getProfile);

router.put("/profile", updateProfile);

router.put("/profile/password", changePassword);

// Forgot Password
router.post("/forgot-password", forgotPassword);

router.post("/verify-otp", verifyOtp);

router.post("/reset-password", resetPassword);

module.exports = router;