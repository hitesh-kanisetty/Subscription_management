const { PrismaClient } = require("../generated/prisma");
const bcrypt = require("bcrypt");
const { BrevoClient } = require("@getbrevo/brevo");
const crypto = require("crypto");
const {
  sendWelcomeEmail,
  sendPasswordChangedEmail,
} = require("../services/emailService");
const prisma = new PrismaClient();

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY,
});

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const customerRole = await prisma.role.findUnique({
      where: {
        name: "CUSTOMER",
      },
    });

    if (!customerRole) {
      return res.status(500).json({
        message: "Customer role is not configured",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
        roleId: customerRole.id,
      },
    });
    await sendWelcomeEmail(user);

    return res.status(201).json({
      message: "Account created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      role: customerRole.name,
    });
  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
    };

    return res.status(200).json({
      message: "Login successful",
      role: user.role.name,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};

const logout = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error);

      return res.status(500).json({
        message: "Unable to logout",
      });
    }

    res.clearCookie("connect.sid");

    return res.status(200).json({
      message: "Logout successful",
    });
  });
};

const getCurrentUser = (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      message: "Not authenticated",
    });
  }

  return res.status(200).json({
    message: "Authenticated",
    user: req.session.user,
  });
};

/*
 * =====================================================
 * PROFILE - GET CURRENT USER PROFILE
 * =====================================================
 */

const getProfile = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "Profile fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};

/*
 * =====================================================
 * PROFILE - UPDATE NAME AND EMAIL
 * =====================================================
 */

const updateProfile = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required",
      });
    }

    const cleanedName = name.trim();
    const cleanedEmail = email.trim().toLowerCase();

    if (!cleanedName || !cleanedEmail) {
      return res.status(400).json({
        message: "Name and email cannot be empty",
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email: cleanedEmail,
        NOT: {
          id: req.session.user.id,
        },
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: req.session.user.id,
      },
      data: {
        name: cleanedName,
        email: cleanedEmail,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    req.session.user = {
      ...req.session.user,
      name: updatedUser.name,
      email: updatedUser.email,
    };

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};



const changePassword = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message:
          "Current password, new password and confirm password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message:
          "New password must be at least 8 characters",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New passwords do not match",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.session.user.id,
      },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const passwordMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    const samePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (samePassword) {
      return res.status(400).json({
        message:
          "New password must be different from the current password",
      });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });
    await sendPasswordChangedEmail({
  name: req.session.user.name,
  email: req.session.user.email,
});
    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};


const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const cleanedEmail = email?.trim().toLowerCase();

    if (!cleanedEmail) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: cleanedEmail,
      },
    });

    if (!user) {
      return res.status(200).json({
        message:
          "If an account exists with this email, an OTP has been sent",
      });
    }

    // const otp = Math.floor(
    //   100000 + Math.random() * 900000
    // ).toString();
    const otp = crypto.randomInt(100000, 1000000).toString();

    const otpHash = await bcrypt.hash(otp, 10);

    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    await prisma.passwordReset.deleteMany({
      where: {
        userId: user.id,
      },
    });

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        otpHash: otpHash,
        expiresAt: expiresAt,
      },
    });

    await brevo.transactionalEmails.sendTransacEmail({
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: "SubFlow",
      },
      to: [
        {
          email: user.email,
          name: user.name,
        },
      ],
      subject: "SubFlow Password Reset OTP",
      textContent:
        `Hello ${user.name},\n\n` +
        `Your SubFlow password reset OTP is: ${otp}\n\n` +
        `This OTP will expire in 5 minutes.\n\n` +
        `If you did not request a password reset, you can ignore this email.\n\n` +
        `SubFlow`,
    });

    return res.status(200).json({
      message:
        "If an account exists with this email, an OTP has been sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      message: "Unable to send OTP. Please try again.",
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const cleanedEmail = email?.trim().toLowerCase();
    const cleanedOtp = otp?.trim();

    if (!cleanedEmail || !cleanedOtp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: cleanedEmail,
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    const passwordReset = await prisma.passwordReset.findFirst({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!passwordReset) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    if (passwordReset.expiresAt < new Date()) {
      await prisma.passwordReset.delete({
        where: {
          id: passwordReset.id,
        },
      });

      return res.status(400).json({
        message: "OTP has expired",
      });
    }

    if (passwordReset.attempts >= 3) {
      await prisma.passwordReset.delete({
        where: {
          id: passwordReset.id,
        },
      });

      return res.status(400).json({
        message: "Too many incorrect attempts. Please request a new OTP.",
        attemptsExceeded: true,
      });
    }

    const otpMatch = await bcrypt.compare(
      cleanedOtp,
      passwordReset.otpHash
    );

    if (!otpMatch) {
      const updatedReset = await prisma.passwordReset.update({
        where: {
          id: passwordReset.id,
        },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      if (updatedReset.attempts >= 3) {
        await prisma.passwordReset.delete({
          where: {
            id: passwordReset.id,
          },
        });
       

        return res.status(400).json({
          message:
            "Too many incorrect attempts. Please request a new OTP.",
          attemptsExceeded: true,
        });
      }

      return res.status(400).json({
        message: "Invalid OTP",
        attemptsRemaining: 3 - updatedReset.attempts,
      });
    }

    return res.status(200).json({
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};


const resetPassword = async (req, res) => {
  try {
    const {
      email,
      otp,
      newPassword,
      confirmPassword,
    } = req.body;

    const cleanedEmail = email?.trim().toLowerCase();
    const cleanedOtp = otp?.trim();

    if (
      !cleanedEmail ||
      !cleanedOtp ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message:
          "Email, OTP, new password and confirm password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New passwords do not match",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: cleanedEmail,
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    const passwordReset = await prisma.passwordReset.findFirst({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!passwordReset) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    if (passwordReset.expiresAt < new Date()) {
      await prisma.passwordReset.delete({
        where: {
          id: passwordReset.id,
        },
      });

      return res.status(400).json({
        message: "OTP has expired",
      });
    }

    const otpMatch = await bcrypt.compare(
      cleanedOtp,
      passwordReset.otpHash
    );

    if (!otpMatch) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    const samePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (samePassword) {
      return res.status(400).json({
        message:
          "New password must be different from the current password",
      });
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });
     await sendPasswordChangedEmail({
  name: user.name,
  email: user.email,
});
    await prisma.passwordReset.delete({
      where: {
        id: passwordReset.id,
      },
    });

    return res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      message: "Something went wrong. Please try again.",
    });
  }
};

module.exports = {
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
};