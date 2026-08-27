const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  if (req.session.user.role !== "ADMIN") {
    return res.status(403).json({
      message: "Access denied",
    });
  }

  next();
};

const requireCustomer = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  if (req.session.user.role !== "CUSTOMER") {
    return res.status(403).json({
      message: "Access denied",
    });
  }

  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireCustomer,
};