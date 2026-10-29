
const express = require("express");
const { getGoogleAuthUrl } = require("../services/googleAuthService");

const {
  loginLimiter,
  signupLimiter,
  passwordResetLimiter,
  otpLimiter,
} = require("../middleware/rateLimiter");

const {
  requireAuth,
  requireAdmin,
} = require("../middleware/authMiddleware");

const {
  signup,
  login,
  logout,
  googleLogin,
  getCurrentUser,
  getProfile,
  toggleTwoFactor,
  updateProfile,
  changePassword,
  setupPassword,
  forgotPassword,
  verifyOtp,
  verifyTwoFactorOtp,
  resetPassword,
} = require("../controllers/authController");

const router = express.Router();

// Public authentication routes
router.post("/signup", signupLimiter, signup);
router.post("/login", loginLimiter, login);
router.post("/logout", logout);
router.get("/me", getCurrentUser);

// Protected profile routes
router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);
router.put("/profile/password", requireAuth, changePassword);
router.put("/profile/password/setup", requireAuth, setupPassword);

// Forgot password
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/verify-otp", otpLimiter, verifyOtp);
router.post("/reset-password", passwordResetLimiter, resetPassword);

// Two-factor authentication
router.post("/verify-2fa", otpLimiter, verifyTwoFactorOtp);
router.put("/profile/2fa", requireAdmin, toggleTwoFactor);

// Google authentication
router.get("/auth/google", (req, res) => {
  const authUrl = getGoogleAuthUrl();
  res.redirect(authUrl);
});

router.get("/auth/google/callback", googleLogin);

module.exports = router;
