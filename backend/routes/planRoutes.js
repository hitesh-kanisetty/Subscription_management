const express = require("express");

const {
  createPlan,
  getPlans,
  getPlanById,
  updatePlan,
  togglePlanStatus,
  deletePlan,
} = require("../controllers/planController");

const router = express.Router();

router.post("/plans", createPlan);

router.get("/plans", getPlans);

router.get("/plans/:id", getPlanById);

router.put("/plans/:id", updatePlan);

router.patch("/plans/:id/status", togglePlanStatus);

router.delete("/plans/:id", deletePlan);

module.exports = router;