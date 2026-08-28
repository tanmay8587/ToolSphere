import express from "express";
import {
  getCompanyOverview,
  getCompanyTools,
  getCompanyTool,
  updateCompanyTool,
  getCompanyAnalytics,
  getTeamMembers,
  inviteTeamMember,
  updateTeamMember,
  removeTeamMember,
} from "../controllers/companyController.js";
import { verifyUser } from "../middleware/auth.js";

/* ===========================
   COMPANY DASHBOARD ROUTES  (/api/company)
   All routes require an authenticated (verified) user.
   =========================== */
const router = express.Router();

// Every company endpoint requires a logged-in user.
router.use(verifyUser);

/**
 * GET /api/company/overview
 * - Returns company info, aggregate stats, and analytics for the current user.
 */
router.get("/overview", getCompanyOverview);

/**
 * GET /api/company/tools
 * - Lists the tools owned by the current user's company (plus claim statuses).
 */
router.get("/tools", getCompanyTools);

/**
 * GET /api/company/tools/:id
 * - Returns a single tool owned by the current user's company.
 */
router.get("/tools/:id", getCompanyTool);

/**
 * PUT /api/company/tools/:id
 * - Updates tool details (description, website, pricing, media, lists, SEO).
 */
router.put("/tools/:id", updateCompanyTool);

/**
 * GET /api/company/analytics
 * - Returns aggregate + per-tool analytics for the company's verified tools.
 */
router.get("/analytics", getCompanyAnalytics);

/**
 * GET /api/company/team
 * - Lists the company owner plus its team members.
 */
router.get("/team", getTeamMembers);

/**
 * POST /api/company/team
 * - Invites / adds a team member to the company.
 */
router.post("/team", inviteTeamMember);

/**
 * PUT /api/company/team/:id
 * - Updates a team member's role or status (owner only).
 */
router.put("/team/:id", updateTeamMember);

/**
 * DELETE /api/company/team/:id
 * - Removes a team member (owner only).
 */
router.delete("/team/:id", removeTeamMember);

export default router;
