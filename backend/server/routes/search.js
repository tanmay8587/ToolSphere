import express from "express";
import { globalSearch } from "../controllers/searchController.js";

const router = express.Router();

/**
 * GET /api/search
 * - Global search across tools, blogs, and categories
 * - Query params:
 *   - q: search query (required)
 *   - limit: max results per type (default: 20, max: 50)
 */
router.get("/", globalSearch);

export default router;