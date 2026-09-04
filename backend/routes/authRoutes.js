const express = require("express");

const {
  signup,
  login,
  logout,
  getCurrentUser,
  getProfile,
  updateProfile,
  changePassword,
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

module.exports = router;