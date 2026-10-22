const express = require("express");
const { generalLimiter } = require("../middleware/rateLimiter");
const {
  subscribeToPlan,
} = require("../controllers/subscriptionController");
const {
  createPlan,
  getPlans,
  getPlanById,
  updatePlan,
  togglePlanStatus,
  deletePlan,
} = require("../controllers/planController");

const router = express.Router();


router.post("/plans", generalLimiter, createPlan);

router.get("/plans", generalLimiter, getPlans);

router.get("/plans/:id", generalLimiter, getPlanById);

router.put("/plans/:id", generalLimiter, updatePlan);

router.patch(
  "/plans/:id/status",
  generalLimiter,
  togglePlanStatus
);

router.delete("/plans/:id", generalLimiter, deletePlan);

router.post(
  "/plans/:id/subscribe",
  generalLimiter,
  subscribeToPlan
);

module.exports = router;