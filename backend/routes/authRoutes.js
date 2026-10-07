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
router.put("/profile/2fa", toggleTwoFactor);
router.post("/verify-2fa", verifyTwoFactorOtp);
router.get("/auth/google", (req, res) => {
  const authUrl = getGoogleAuthUrl();

  res.redirect(authUrl);
});

router.get("/auth/google/callback", googleLogin);
router.post("/reset-password", resetPassword);

module.exports = router;