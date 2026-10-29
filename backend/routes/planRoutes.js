const express = require("express");
const { generalLimiter } = require("../middleware/rateLimiter");
const { subscribeToPlan } = require("../controllers/subscriptionController");
const {
  createPlan,
  getPlans,
  getPlanById,
  updatePlan,
  togglePlanStatus,
  deletePlan,
} = require("../controllers/planController");

const {
  requireAdmin,
  requireAdminOrCustomer,
  requireCustomer
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/plans", generalLimiter, requireAdmin, createPlan);

router.get("/plans", generalLimiter, requireAdminOrCustomer, getPlans);

router.get("/plans/:id", generalLimiter, requireAdminOrCustomer, getPlanById);

router.put("/plans/:id", generalLimiter, requireAdmin, updatePlan);

router.patch(
  "/plans/:id/status",
  generalLimiter,
  requireAdmin,
  togglePlanStatus,
);

router.delete("/plans/:id", generalLimiter, requireAdmin, deletePlan);

router.post(
  "/plans/:id/subscribe",
  generalLimiter,
  requireCustomer,
  subscribeToPlan,
);

module.exports = router;
