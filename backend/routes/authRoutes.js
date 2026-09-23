const express = require("express");
const {
  getGoogleAuthUrl
} = require("../services/googleAuthService");
const {
  signup,
  login,
  logout,
  googleLogin,
  getCurrentUser,
  getProfile,
  updateProfile,
  changePassword,
  setupPassword,
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
router.put("/profile/password/setup", setupPassword);

// Forgot Password
router.post("/forgot-password", forgotPassword);

router.post("/verify-otp", verifyOtp);
// Google Authentication

router.get("/auth/google", (req, res) => {
  const authUrl = getGoogleAuthUrl();

  res.redirect(authUrl);
});

router.get("/auth/google/callback", googleLogin);
router.post("/reset-password", resetPassword);

module.exports = router;