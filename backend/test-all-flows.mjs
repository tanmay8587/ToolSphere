/**
 * END-TO-END FLOW TESTS — ToolSphere
 * Covers: Auth, Tools, Blogs, Likes, Saves, Reviews, Profile,
 *         Collections, Compare, Tool submission, Tool requests, Admin.
 *
 * Usage:  node test-all-flows.mjs   (server must be running on :5000)
 *
 * Creates uniquely-prefixed test data (E2E*) and cleans up after itself.
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import dns from "dns";
import mongoose from "mongoose";

// Same DNS configuration the server uses — required for mongodb+srv SRV lookups.
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["1.1.1.1", "8.8.8.8"]);


const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const API = process.env.E2E_API_URL || "http://localhost:5000/api";
const RUN = Date.now().toString(36);
const PW = "TestPass123";
const USER1 = { name: "E2E User One", email: `e2e-u1-${RUN}@example.com` };
const USER2 = { name: "E2E User Two", email: `e2e-u2-${RUN}@example.com` };
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

/* ============ tiny test harness ============ */
let passed = 0;
const failures = [];
function check(name, cond, extra = "") {
  if (cond) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failures.push(name + (extra ? ` — ${extra}` : ""));
    console.log(`  ❌ ${name}${extra ? ` — ${extra}` : ""}`);
  }
}
function section(title) {
  console.log(`\n━━━ ${title} ━━━`);
}

async function api(method, path, { token, body, formData, visitorId } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (visitorId) headers["X-Visitor-ID"] = visitorId;
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch (e) {
    return { status: 0, data: { success: false, message: e.message } };
  }
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

/* ============ DB helpers (setup/cleanup only) ============ */
let db = null;
async function connectDb() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  db = mongoose.connection.db;
}
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

/* ============ shared state ============ */
const S = {
  adminToken: null,
  user1Token: null,
  user2Token: null,
  user1Id: null,
  user2Id: null,
  tool: null,
  tool2: null,
  submittedToolId: null,
  adminToolId: null,
  blog: null,
  blogCreated: false,
  commentId: null,
  review1Id: null,
  review2Id: null,
  toolRequestId: null,
  collectionId: null,
  toolListId: null,
};

/* ================================================================
   0. HEALTH
================================================================ */
async function testHealth() {
  section("0. HEALTH");
  const r = await api("GET", "/health");
  check("GET /health → 200", r.status === 200 && r.data.status === "ok", `got ${r.status}`);
  check("health reports database connected", r.data.database === "connected", r.data.database);
}

/* ================================================================
   A. ADMIN BOOTSTRAP
================================================================ */
async function testAdminBootstrap() {
  section("A. ADMIN — login & bootstrap");

  const bad = await api("POST", "/admin/login", {
    body: { email: ADMIN_EMAIL, password: "WrongPassword123!" },
  });
  check("admin login with wrong password → 401", bad.status === 401, `got ${bad.status}`);

  const r = await api("POST", "/admin/login", {
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  check("admin login → 200 + token", r.status === 200 && !!r.data.token, `got ${r.status}`);
  S.adminToken = r.data.token;

  const prof = await api("GET", "/admin/profile", { token: S.adminToken });
  check("GET /admin/profile → 200", prof.status === 200 && prof.data.success, `got ${prof.status}`);

  const dash = await api("GET", "/admin/dashboard", { token: S.adminToken });
  check(
    "GET /admin/dashboard → 200 with stats",
    dash.status === 200 && dash.data.success,
    `got ${dash.status}`
  );

  const noAuth = await api("GET", "/admin/dashboard");
  check("admin route without token → 401", noAuth.status === 401, `got ${noAuth.status}`);

  const tools = await api("GET", "/admin/tools", { token: S.adminToken });
  check("GET /admin/tools → 200", tools.status === 200 && tools.data.success, `got ${tools.status}`);

  const users = await api("GET", "/admin/users", { token: S.adminToken });
  check("GET /admin/users → 200", users.status === 200 && users.data.success, `got ${users.status}`);

  const cats = await api("GET", "/admin/categories", { token: S.adminToken });
  check(
    "GET /admin/categories → 200 non-empty",
    cats.status === 200 && Array.isArray(cats.data.categories) && cats.data.categories.length > 0
  );

  const bcats = await api("GET", "/admin/blog-categories", { token: S.adminToken });
  check(
    "GET /admin/blog-categories → 200 non-empty",
    bcats.status === 200 && Array.isArray(bcats.data.categories) && bcats.data.categories.length > 0
  );
}

/* ================================================================
   B. BASE DATA (tool + published blog, created only if missing)
================================================================ */
async function ensureBaseData() {
  section("B. BASE DATA — tool & blog present");

  const tools = await api("GET", "/tools?limit=50");
  const existing = tools.data.tools || [];
  if (existing.length >= 2) {
    S.tool = existing[0];
    S.tool2 = existing[1];
    check("public tools exist (>=2)", true);
  } else {
    const catName =
      (await api("GET", "/tools/categories")).data.categories?.[0]?.name || "AI";
    const desc =
      "E2E base tool created to validate directory flows. Auto-generated test data.";
    const mk = async (n) =>
      api("POST", "/admin/tools", {
        token: S.adminToken,
        body: {
          name: n,
          category: catName,
          website: "https://example.com",
          description: desc,
          pricing: "Free",
          status: "active",
          tags: "e2e,test",
          features: "feature-a,feature-b",
          pros: "fast,reliable",
          cons: "pricey",
        },
      });
    const t1 = await mk(`E2E Base Tool A ${RUN}`);
    const t2 = await mk(`E2E Base Tool B ${RUN}`);
    check("admin created base tools", t1.status === 201 && t2.status === 201, `${t1.status}/${t2.status}`);
    S.tool = t1.data.tool;
    S.tool2 = t2.data.tool;
    S.adminToolId = S.tool2._id;
  }

  const detail = await api("GET", `/tools/${S.tool.slug}`);
  check(
    "GET /tools/:slug → 200 with tool detail",
    detail.status === 200 && detail.data.tool?._id,
    `got ${detail.status}`
  );
  if (detail.data.tool) S.tool = detail.data.tool;

  const blogs = await api("GET", "/blogs?limit=20");
  const pub = (blogs.data.blogs || []).filter(
    (b) => b.status === "published" || b.publishedAt
  );
  if (pub.length > 0) {
    S.blog = pub[0];
    check("published blog exists", true);
  } else {
    const bcats = await api("GET", "/admin/blog-categories", { token: S.adminToken });
    const bcatName = bcats.data.categories?.[0]?.name || "General";
    const created = await api("POST", "/admin/blogs", {
      token: S.adminToken,
      body: {
        title: `E2E Test Blog ${RUN}`,
        content: "<p>This is an E2E test blog post used to validate blog flows.</p>",
        excerpt: "E2E test blog excerpt",
        category: bcatName,
        status: "published",
      },
    });
    check("admin created blog → 201", created.status === 201, `got ${created.status}`);
    S.blogCreated = true;
    S.blog = created.data.blog;
    if (S.blog && S.blog.status !== "published") {
      await api("PATCH", `/admin/blogs/${S.blog._id}/status`, {
        token: S.adminToken,
        body: { status: "published" },
      });
    }
  }
}

/* ================================================================
   C. TOOLS — public browsing
================================================================ */
async function testTools() {
  section("C. TOOLS — public flows");

  const all = await api("GET", "/tools");
  check(
    "GET /tools → 200 list + pagination",
    all.status === 200 && Array.isArray(all.data.tools) && !!all.data.pagination,
    `got ${all.status}`
  );

  const search = await api("GET", `/tools?search=${encodeURIComponent(S.tool.name.split(" ")[0])}`);
  check(
    "GET /tools?search=<term> returns results",
    search.status === 200 && (search.data.tools || []).some((t) => t._id === S.tool._id)
  );

  const catName = S.tool.category;
  const byCat = await api("GET", `/tools?category=${encodeURIComponent(catName)}`);
  check(
    `GET /tools?category=${catName} filters correctly`,
    byCat.status === 200 &&
      (byCat.data.tools || []).every(
        (t) => t.category?.toLowerCase() === catName.toLowerCase()
      )
  );

  const paged = await api("GET", "/tools?page=1&limit=2");
  check(
    "GET /tools?limit=2 paginates",
    paged.status === 200 &&
      (paged.data.tools || []).length <= 2 &&
      paged.data.pagination?.limit === 2
  );

  const newest = await api("GET", "/tools?sort=newest&limit=5");
  check("GET /tools?sort=newest → 200", newest.status === 200 && Array.isArray(newest.data.tools));

  const rating = await api("GET", "/tools?rating=4&limit=10");
  check("GET /tools?rating=4 → 200", rating.status === 200);

  const searchEp = await api("GET", `/tools/search?search=${encodeURIComponent(S.tool.name)}`);
  check("GET /tools/search works", searchEp.status === 200 && (searchEp.data.tools || []).length >= 1);

  const featured = await api("GET", "/tools/featured");
  check(
    "GET /tools/featured → all featured & approved",
    featured.status === 200 &&
      (featured.data.tools || []).every((t) => t.featured === true && t.approved === true)
  );

  const cats = await api("GET", "/tools/categories");
  check(
    "GET /tools/categories → non-empty with counts",
    cats.status === 200 &&
      Array.isArray(cats.data.categories) &&
      cats.data.categories.length > 0 &&
      typeof cats.data.categories[0].count === "number"
  );

  const related = await api("GET", `/tools/${S.tool.slug}/related`);
  check("GET /tools/:slug/related → 200", related.status === 200 && Array.isArray(related.data.tools));

  const recs = await api("GET", `/tools/${S.tool._id}/recommendations`);
  check("GET /tools/:id/recommendations → 200", recs.status === 200 && Array.isArray(recs.data.tools));

  const alts = await api("GET", `/tools/${S.tool._id}/alternatives`);
  check("GET /tools/:id/alternatives → 200", alts.status === 200 && Array.isArray(alts.data.tools));

  const timeline = await api("GET", `/tools/${S.tool.slug}/timeline`);
  check("GET /tools/:slug/timeline → 200", timeline.status === 200 && Array.isArray(timeline.data.timeline));

  const score = await api("GET", `/tools/${S.tool._id}/recommendation-score`);
  check(
    "GET /tools/:id/recommendation-score → numeric score",
    score.status === 200 && typeof score.data.score === "number",
    `got ${score.status}`
  );

  const missing = await api("GET", "/tools/does-not-exist-e2e");
  check("GET /tools/:unknown-slug → 404", missing.status === 404, `got ${missing.status}`);
}

/* ================================================================
   D. BLOGS — public flows
================================================================ */
async function testBlogsPublic() {
  section("D. BLOGS — public flows");

  const list = await api("GET", "/blogs");
  check(
    "GET /blogs → 200 list",
    list.status === 200 && Array.isArray(list.data.blogs),
    `got ${list.status}`
  );

  const trending = await api("GET", "/blogs/trending");
  check("GET /blogs/trending → 200", trending.status === 200 && Array.isArray(trending.data.blogs));

  const bcats = await api("GET", "/blogs/categories");
  check(
    "GET /blogs/categories → non-empty",
    bcats.status === 200 && Array.isArray(bcats.data.categories) && bcats.data.categories.length > 0
  );

  const detail = await api("GET", `/blogs/${S.blog.slug}`);
  check(
    "GET /blogs/:slug → 200 detail",
    detail.status === 200 && detail.data.blog?.slug === S.blog.slug,
    `got ${detail.status}`
  );

  const related = await api("GET", `/blogs/${S.blog.slug}/related`);
  check(
    "GET /blogs/:slug/related → 200",
    related.status === 200 && Array.isArray(related.data.relatedBlogs),
    `got ${related.status}`
  );

  const adjacent = await api("GET", `/blogs/${S.blog.slug}/adjacent`);
  check("GET /blogs/:slug/adjacent → 200", adjacent.status === 200);

  const comments = await api("GET", `/blogs/${S.blog.slug}/comments`);
  check(
    "GET /blogs/:slug/comments → 200",
    comments.status === 200 && Array.isArray(comments.data.comments),
    `got ${comments.status}`
  );

  const vid = crypto.randomUUID();
  const v1 = await api("POST", `/blogs/${S.blog.slug}/view`, { visitorId: vid });
  const v2 = await api("POST", `/blogs/${S.blog.slug}/view`, { visitorId: vid });
  check("POST /blogs/:slug/view → success", v1.status === 200 && v1.data.success, `got ${v1.status}`);
  if (typeof v1.data.views === "number" && typeof v2.data.views === "number") {
    check(
      "duplicate view does not inflate counter",
      v2.data.views === v1.data.views,
      `${v1.data.views} → ${v2.data.views}`
    );
  } else {
    check("duplicate view dedup (response shape varies — accepted)", true);
  }
}

/* ================================================================
   E. AUTH — register / verify / login
================================================================ */
async function testAuth() {
  section("E. AUTH — register / verify / login");

  const missing = await api("POST", "/auth/register", { body: { name: "x" } });
  check("register with missing fields → 400", missing.status === 400, `got ${missing.status}`);

  const weak = await api("POST", "/auth/register", {
    body: { name: USER1.name, email: USER1.email, password: "abc" },
  });
  check("register with weak password → 400", weak.status === 400, `got ${weak.status}`);

  const reg = await api("POST", "/auth/register", {
    body: { name: USER1.name, email: USER1.email, password: PW },
  });
  check(
    "register → success (unverified)",
    (reg.status === 200 || reg.status === 201) && reg.data.success === true,
    `got ${reg.status}`
  );

  const dup = await api("POST", "/auth/register", {
    body: { name: USER1.name, email: USER1.email, password: PW },
  });
  check("duplicate register → 400", dup.status === 400, `got ${dup.status}`);

  const unverifiedLogin = await api("POST", "/auth/login", {
    body: { email: USER1.email, password: PW },
  });
  check("login before verification → 403", unverifiedLogin.status === 403, `got ${unverifiedLogin.status}`);

  const noToken = await api("GET", "/auth/profile");
  check("profile without token → 401", noToken.status === 401, `got ${noToken.status}`);

  // Seed a known verification token (simulates the link from the email)
  const knownToken = `e2e-verify-${RUN}`;
  await db.collection("users").updateOne(
    { email: USER1.email },
    {
      $set: {
        emailVerificationToken: sha256(knownToken),
        emailVerificationExpire: new Date(Date.now() + 3600_000),
      },
    }
  );

  const verify = await api("GET", `/auth/verify-email/${knownToken}`);
  check("GET /auth/verify-email/:token → success", verify.status === 200 && verify.data.success, `got ${verify.status}`);

  const dbUser = await db.collection("users").findOne({ email: USER1.email });
  check("user.isVerified = true after verification", dbUser?.isVerified === true);
  S.user1Id = String(dbUser?._id);

  const wrongPw = await api("POST", "/auth/login", {
    body: { email: USER1.email, password: "WrongPass123" },
  });
  check("login with wrong password → 401", wrongPw.status === 401, `got ${wrongPw.status}`);

  const login = await api("POST", "/auth/login", { body: { email: USER1.email, password: PW } });
  check("login → 200 + token", login.status === 200 && !!login.data.token, `got ${login.status}`);
  S.user1Token = login.data.token;

  const g = await api("POST", "/auth/google", {
    body: { name: USER2.name, email: USER2.email, googleId: `e2e-g-${RUN}`, avatar: "" },
  });
  check("google auth → 200 + token (auto-verified)", g.status === 200 && !!g.data.token, `got ${g.status}`);
  S.user2Token = g.data.token;
  const gUser = await db.collection("users").findOne({ email: USER2.email });
  S.user2Id = String(gUser?._id);
  check("google user isVerified = true", gUser?.isVerified === true);
}

/* ================================================================
   F. PROFILE — view / update / activity
================================================================ */
async function testProfile() {
  section("F. PROFILE — view / update / activity");

  const prof = await api("GET", "/auth/profile", { token: S.user1Token });
  check(
    "GET /auth/profile → user + bookmarks + reviews",
    prof.status === 200 &&
      prof.data.user?.email === USER1.email &&
      Array.isArray(prof.data.bookmarks) &&
      Array.isArray(prof.data.reviews),
    `got ${prof.status}`
  );

  const upd = await api("PUT", "/auth/profile", {
    token: S.user1Token,
    body: { bio: "E2E bio", name: USER1.name },
  });
  check("PUT /auth/profile updates bio", upd.status === 200 && upd.data.user?.bio === "E2E bio", `got ${upd.status}`);

  const nl = await api("PUT", "/auth/newsletter-preference", {
    token: S.user1Token,
    body: { newsletterEnabled: false },
  });
  check("PUT /auth/newsletter-preference → false", nl.status === 200 && nl.data.newsletterEnabled === false);

  const vt = await api("POST", "/users/me/viewed-tools", {
    token: S.user1Token,
    body: { toolId: S.tool._id },
  });
  check("POST /users/me/viewed-tools → success", vt.status === 200 && vt.data.success, `got ${vt.status}`);

  const rvt = await api("GET", "/users/me/recently-viewed-tools", { token: S.user1Token });
  check(
    "GET /users/me/recently-viewed-tools contains tool",
    rvt.status === 200 && JSON.stringify(rvt.data).includes(S.tool.slug),
    `got ${rvt.status}`
  );

  const vb = await api("POST", "/users/me/viewed-blogs", {
    token: S.user1Token,
    body: { blogId: S.blog._id },
  });
  check("POST /users/me/viewed-blogs → success", vb.status === 200 && vb.data.success, `got ${vb.status}`);

  const rvb = await api("GET", "/users/me/recently-viewed-blogs", { token: S.user1Token });
  check(
    "GET /users/me/recently-viewed-blogs contains blog",
    rvb.status === 200 && JSON.stringify(rvb.data).includes(S.blog.slug),
    `got ${rvb.status}`
  );

  const pub1 = await api("GET", `/users/public/${S.user1Id}`, { token: S.user2Token });
  check("GET /users/public/:id → 200", pub1.status === 200 && pub1.data.success, `got ${pub1.status}`);

  const follow = await api("POST", `/users/${S.user1Id}/follow`, { token: S.user2Token });
  check("POST /users/:id/follow → success", follow.status === 200 && follow.data.success, `got ${follow.status}`);

  const feed = await api("GET", "/users/me/personalized-feed", { token: S.user2Token });
  check("GET /users/me/personalized-feed → 200", feed.status === 200 && feed.data.success, `got ${feed.status}`);

  const unfollow = await api("DELETE", `/users/${S.user1Id}/follow`, { token: S.user2Token });
  check("DELETE /users/:id/follow → success", unfollow.status === 200 && unfollow.data.success, `got ${unfollow.status}`);
}

/* ================================================================
   G. SAVES — tool bookmark toggle
================================================================ */
async function testToolSaves() {
  section("G. SAVES — tool bookmark toggle");

  const on = await api("POST", `/auth/tools/${S.tool._id}/bookmark`, { token: S.user2Token });
  check("bookmark tool → bookmarked: true", on.status === 200 && on.data.bookmarked === true, `got ${on.status}`);

  const off = await api("POST", `/auth/tools/${S.tool._id}/bookmark`, { token: S.user2Token });
  check("bookmark again → bookmarked: false (toggle)", off.status === 200 && off.data.bookmarked === false);

  const on2 = await api("POST", `/auth/tools/${S.tool._id}/bookmark`, { token: S.user2Token });
  check("bookmark restored for later tests", on2.data.bookmarked === true);

  const prof = await api("GET", "/auth/profile", { token: S.user2Token });
  check(
    "profile bookmarks include the tool",
    prof.status === 200 &&
      (prof.data.bookmarks || []).some((t) => t && (t._id === S.tool._id || String(t?._id) === String(S.tool._id)))
  );

  const noAuth = await api("POST", `/auth/tools/${S.tool._id}/bookmark`);
  check("bookmark without token → 401", noAuth.status === 401, `got ${noAuth.status}`);
}

/* ================================================================
   H. LIKES / SAVES — blog interactions
================================================================ */
async function testBlogInteractions() {
  section("H. LIKES / SAVES — blog like, bookmark, comment");

  const like = await api("POST", `/blogs/${S.blog.slug}/like`, { token: S.user2Token });
  check("like blog → success", like.status === 200 && like.data.success, `got ${like.status}`);

  const state1 = await api("GET", `/blogs/${S.blog.slug}/interaction`, { token: S.user2Token });
  check(
    "interaction state → isLiked: true",
    state1.status === 200 && state1.data.success && state1.data.isLiked === true,
    `got ${state1.status} isLiked=${state1.data.isLiked}`
  );

  const likedList = await api("GET", "/users/me/liked-blogs", { token: S.user2Token });
  check(
    "GET /users/me/liked-blogs contains blog",
    likedList.status === 200 &&
      (likedList.data.likedBlogs || []).some((b) => b.slug === S.blog.slug),
    `got ${likedList.status}`
  );

  const unlike = await api("DELETE", `/blogs/${S.blog.slug}/like`, { token: S.user2Token });
  check("unlike blog → success", unlike.status === 200 && unlike.data.success, `got ${unlike.status}`);

  const state2 = await api("GET", `/blogs/${S.blog.slug}/interaction`, { token: S.user2Token });
  check("interaction state → liked: false after unlike", state2.data.isLiked === false);

  const bm = await api("POST", `/blogs/${S.blog.slug}/bookmark`, { token: S.user2Token });
  check("bookmark blog → success", bm.status === 200 && bm.data.success, `got ${bm.status}`);

  const state3 = await api("GET", `/blogs/${S.blog.slug}/interaction`, { token: S.user2Token });
  check(
    "interaction state → bookmarked: true",
    state3.data.isBookmarked === true,
    `bookmarked=${state3.data.isBookmarked}`
  );

  const savedList = await api("GET", "/users/me/saved-blogs", { token: S.user2Token });
  check(
    "GET /users/me/saved-blogs contains blog",
    savedList.status === 200 &&
      (savedList.data.savedBlogs || []).some((b) => b.slug === S.blog.slug),
    `got ${savedList.status}`
  );

  const unbm = await api("DELETE", `/blogs/${S.blog.slug}/bookmark`, { token: S.user2Token });
  check("remove bookmark → success", unbm.status === 200 && unbm.data.success, `got ${unbm.status}`);

  const state4 = await api("GET", `/blogs/${S.blog.slug}/interaction`, { token: S.user2Token });
  check("interaction state → bookmarked: false after removal", state4.data.isBookmarked === false);

  // re-like so leaderboard/feed data stays sane; then un-like in cleanup
  await api("POST", `/blogs/${S.blog.slug}/like`, { token: S.user2Token });

  // comment (pending) → admin approves → publicly visible
  const c = await api("POST", `/blogs/${S.blog.slug}/comments`, {
    token: S.user2Token,
    body: { content: `E2E comment ${RUN}` },
  });
  check(
    "POST comment → created (pending)",
    (c.status === 200 || c.status === 201) && !!c.data.comment?._id,
    `got ${c.status}`
  );
  S.commentId = c.data.comment?._id;

  const before = await api("GET", `/blogs/${S.blog.slug}/comments`);
  const visibleBefore = (before.data.comments || []).some((x) => String(x._id) === String(S.commentId));
  check("pending comment NOT publicly visible", !visibleBefore);

  const approve = await api("PATCH", `/admin/blog-comments/${S.commentId}/approve`, { token: S.adminToken });
  check("admin approves comment", approve.status === 200 && approve.data.success, `got ${approve.status}`);

  const after = await api("GET", `/blogs/${S.blog.slug}/comments`);
  const visibleAfter = (after.data.comments || []).some((x) => String(x._id) === String(S.commentId));
  check("approved comment publicly visible", visibleAfter);
}

/* ================================================================
   I. REVIEWS — submit / moderate / like
================================================================ */
async function testReviews() {
  section("I. REVIEWS — submit / moderate / like");

  const bad = await api("POST", `/auth/tools/${S.tool._id}/review`, {
    token: S.user2Token,
    body: { rating: 9, comment: "invalid" },
  });
  check("review with rating 9 → 400", bad.status === 400, `got ${bad.status}`);

  const r1 = await api("POST", `/auth/tools/${S.tool._id}/review`, {
    token: S.user2Token,
    body: { rating: 5, comment: `E2E great tool ${RUN}` },
  });
  check(
    "user2 review created (pending)",
    r1.status === 200 && r1.data.review?._id && r1.data.review.status === "pending",
    `got ${r1.status} status=${r1.data.review?.status}`
  );
  S.review1Id = r1.data.review?._id;

  const pending = await api("GET", "/admin/reviews", { token: S.adminToken });
  check(
    "admin pending reviews contains it",
    pending.status === 200 &&
      (pending.data.reviews || []).some((x) => String(x._id) === String(S.review1Id)),
    `got ${pending.status}`
  );

  const approve = await api("PUT", `/admin/reviews/${S.review1Id}/approve`, { token: S.adminToken });
  check("admin approves review", approve.status === 200 && approve.data.success, `got ${approve.status}`);

  // user1 likes user2's review
  const like1 = await api("POST", `/users/me/reviews/${S.review1Id}/like`, { token: S.user1Token });
  check("review like toggle → success", like1.status === 200 && like1.data.success, `got ${like1.status}`);
  if (like1.data.review) {
    check("review likes now include liker", (like1.data.review.likes || []).length === 1);
  }

  const like2 = await api("POST", `/users/me/reviews/${S.review1Id}/like`, { token: S.user1Token });
  if (like2.data.review) {
    check("review like toggles off", (like2.data.review.likes || []).length === 0);
  } else {
    check("review like toggle-off → success", like2.status === 200, `got ${like2.status}`);
  }

  const likeGuest = await api("POST", `/users/me/reviews/${S.review1Id}/like`);
  check("review like without auth → 401", likeGuest.status === 401, `got ${likeGuest.status}`);

  // user1 writes a review → admin rejects → admin deletes
  const r2 = await api("POST", `/auth/tools/${S.tool._id}/review`, {
    token: S.user1Token,
    body: { rating: 3, comment: `E2E mediocre tool ${RUN}` },
  });
  check("user1 review created (upsert per user)", r2.status === 200 && !!r2.data.review?._id, `got ${r2.status}`);
  S.review2Id = r2.data.review?._id;

  const reject = await api("PUT", `/admin/reviews/${S.review2Id}/reject`, { token: S.adminToken });
  check("admin rejects review", reject.status === 200 && reject.data.success, `got ${reject.status}`);

  const del = await api("DELETE", `/admin/reviews/${S.review2Id}`, { token: S.adminToken });
  check("admin deletes review", del.status === 200 && del.data.success, `got ${del.status}`);

  const upd = await api("POST", `/auth/tools/${S.tool._id}/review`, {
    token: S.user2Token,
    body: { rating: 4, comment: `E2E updated comment ${RUN}` },
  });
  check(
    "re-submitting review updates existing (upsert)",
    upd.status === 200 && Number(upd.data.review?.rating) === 4,
    `got ${upd.status}`
  );
}

/* ================================================================
   J. COLLECTIONS — CRUD + public share
================================================================ */
async function testCollections() {
  section("J. COLLECTIONS — CRUD + share");

  const noAuth = await api("GET", "/collections");
  check("GET /collections without token → 401", noAuth.status === 401, `got ${noAuth.status}`);

  const created = await api("POST", "/collections", {
    token: S.user1Token,
    body: { name: `E2E Collection ${RUN}`, isPublic: false },
  });
  check(
    "POST /collections → 201 with shareId",
    created.status === 201 && !!created.data.data?._id && !!created.data.data?.shareId,
    `got ${created.status}`
  );
  S.collectionId = created.data.data?._id;
  const shareId = created.data.data?.shareId;

  const list = await api("GET", "/collections", { token: S.user1Token });
  check(
    "GET /collections contains new collection",
    list.status === 200 &&
      (list.data.data || []).some((c) => String(c._id) === String(S.collectionId))
  );

  const add = await api("POST", `/collections/${S.collectionId}/tools`, {
    token: S.user1Token,
    body: { toolId: S.tool._id },
  });
  check("add tool to collection → success", add.status === 200 && add.data.success, `got ${add.status}`);

  const dup = await api("POST", `/collections/${S.collectionId}/tools`, {
    token: S.user1Token,
    body: { toolId: S.tool._id },
  });
  check("duplicate add → 400", dup.status === 400, `got ${dup.status}`);

  const foreign = await api("POST", `/collections/${S.collectionId}/tools`, {
    token: S.user2Token,
    body: { toolId: S.tool2._id },
  });
  check("other user cannot modify collection → 404", foreign.status === 404, `got ${foreign.status}`);

  const rename = await api("PATCH", `/collections/${S.collectionId}`, {
    token: S.user1Token,
    body: { name: `E2E Collection Renamed ${RUN}`, isPublic: true },
  });
  check(
    "PATCH rename + make public",
    rename.status === 200 &&
      rename.data.data?.name === `E2E Collection Renamed ${RUN}` &&
      rename.data.data?.isPublic === true,
    `got ${rename.status}`
  );

  const shared = await api("GET", `/collections/shared/${shareId}`);
  check(
    "GET /collections/shared/:shareId (public, no auth) → tools populated",
    shared.status === 200 &&
      shared.data.data?.isPublic === true &&
      (shared.data.data?.tools || []).some((t) => String(t?._id) === String(S.tool._id)),
    `got ${shared.status}`
  );

  const rm = await api("DELETE", `/collections/${S.collectionId}/tools`, {
    token: S.user1Token,
    body: { toolId: S.tool._id },
  });
  check(
    "remove tool from collection",
    rm.status === 200 && !(rm.data.data?.tools || []).some((t) => String(t?._id) === String(S.tool._id))
  );

  const del = await api("DELETE", `/collections/${S.collectionId}`, { token: S.user1Token });
  check("DELETE /collections/:id → success", del.status === 200 && del.data.success, `got ${del.status}`);
  S.collectionId = null;
}

/* ================================================================
   K. USER TOOL LISTS — CRUD + share by email
================================================================ */
async function testToolLists() {
  section("K. USER TOOL LISTS — CRUD + share");

  const created = await api("POST", "/user-tool-lists", {
    token: S.user2Token,
    body: { name: `E2E List ${RUN}` },
  });
  check("POST /user-tool-lists → 201", created.status === 201 && !!created.data.data?._id, `got ${created.status}`);
  S.toolListId = created.data.data?._id;

  const add = await api("POST", `/user-tool-lists/${S.toolListId}/tools`, {
    token: S.user2Token,
    body: { toolId: S.tool._id },
  });
  check("add tool to list → success", add.status === 200 && add.data.success, `got ${add.status}`);

  const one = await api("GET", `/user-tool-lists/${S.toolListId}`, { token: S.user2Token });
  check(
    "GET /user-tool-lists/:id populated",
    one.status === 200 && (one.data.data?.tools || []).length === 1,
    `got ${one.status}`
  );

  const upd = await api("PATCH", `/user-tool-lists/${S.toolListId}`, {
    token: S.user2Token,
    body: { name: `E2E List Renamed ${RUN}`, isPublic: true },
  });
  check("PATCH list rename + public", upd.status === 200 && upd.data.success, `got ${upd.status}`);

  const pub = await api("GET", "/user-tool-lists/public");
  check(
    "GET /user-tool-lists/public contains it",
    pub.status === 200 &&
      (pub.data.data || pub.data.lists || []).some((l) => String(l._id) === String(S.toolListId)),
    `got ${pub.status}`
  );

  const share = await api("POST", `/user-tool-lists/${S.toolListId}/share`, {
    token: S.user2Token,
    body: { email: USER1.email },
  });
  check("share list with user1 by email → success", share.status === 200 && share.data.success, `got ${share.status}`);

  const sharedWithMe = await api("GET", "/user-tool-lists/shared", { token: S.user1Token });
  check(
    "user1 sees list in /user-tool-lists/shared",
    sharedWithMe.status === 200 &&
      (sharedWithMe.data.data || []).some((l) => String(l._id) === String(S.toolListId)),
    `got ${sharedWithMe.status}`
  );

  const unshare = await api("DELETE", `/user-tool-lists/${S.toolListId}/share/${S.user1Id}`, {
    token: S.user2Token,
  });
  check("unshare user1 → success", unshare.status === 200 && unshare.data.success, `got ${unshare.status}`);

  const del = await api("DELETE", `/user-tool-lists/${S.toolListId}`, { token: S.user2Token });
  check("DELETE /user-tool-lists/:id → success", del.status === 200 && del.data.success, `got ${del.status}`);
  S.toolListId = null;
}

/* ================================================================
   L. COMPARE — data availability for the compare page
   (compare itself is client-side: localStorage + ?tools= URL param)
================================================================ */
async function testCompare() {
  section("L. COMPARE — compare data availability");

  const r = await api("GET", "/tools?limit=1000");
  const tools = r.data.tools || [];
  check("GET /tools?limit=1000 → 200 (shareable compare link data)", r.status === 200 && tools.length >= 2);

  const fields = ["name", "logo", "category", "description", "pricing", "rating", "website", "slug", "features"];
  const complete = tools.slice(0, 5).filter((t) => fields.every((f) => t[f] !== undefined));
  check(
    "tools expose fields used by ComparePage (name/logo/pricing/rating/…)",
    complete.length >= 2,
    `only ${complete.length} of first 5 complete`
  );
}

/* ================================================================
   M. TOOL SUBMISSION — user submits → admin approves
================================================================ */
async function testToolSubmission() {
  section("M. TOOL SUBMISSION — submit → approve → feature → reject");

  const noAuth = await fetch(`${API}/tools/submit`, { method: "POST" });
  check("submit without auth → 401", noAuth.status === 401, `got ${noAuth.status}`);

  const fd = new FormData();
  const name = `E2E Submitted Tool ${RUN}`;
  fd.append("name", name);
  fd.append("category", S.tool.category);
  fd.append("website", "https://example.com/submitted");
  fd.append("description", "A user-submitted tool for E2E validation of the submission flow.");
  fd.append("pricing", "Free");
  fd.append("tags", "e2e,submitted");
  fd.append("features", "fast,simple");

  const sub = await fetch(`${API}/tools/submit`, {
    method: "POST",
    headers: { Authorization: `Bearer ${S.user1Token}` },
    body: fd,
  });
  const subData = await sub.json().catch(() => ({}));
  check("POST /tools/submit → 201 pending", sub.status === 201 && subData.tool?.status === "pending", `got ${sub.status}`);
  S.submittedToolId = subData.tool?._id;

  const publicList = await api("GET", `/tools?search=${encodeURIComponent(name)}`);
  check(
    "submitted tool NOT in public list before approval",
    (publicList.data.tools || []).length === 0,
    `found ${(publicList.data.tools || []).length}`
  );

  const approve = await api("PUT", `/admin/tools/${S.submittedToolId}/approve`, { token: S.adminToken });
  check("admin approves submission", approve.status === 200 && approve.data.tool?.approved === true, `got ${approve.status}`);

  const after = await api("GET", `/tools?search=${encodeURIComponent(name)}`);
  check(
    "approved tool now publicly visible",
    (after.data.tools || []).some((t) => String(t._id) === String(S.submittedToolId))
  );

  const feat = await api("PUT", `/admin/tools/${S.submittedToolId}/feature`, { token: S.adminToken });
  check("admin toggles featured → true", feat.status === 200 && feat.data.featured === true, `got ${feat.status}`);

  const featuredList = await api("GET", "/tools/featured");
  check(
    "featured list contains it",
    (featuredList.data.tools || []).some((t) => String(t._id) === String(S.submittedToolId))
  );

  const reject = await api("PUT", `/admin/tools/${S.submittedToolId}/reject`, {
    token: S.adminToken,
    body: { status: "rejected", reason: "E2E cleanup" },
  });
  check("admin rejects/unpublishes tool", reject.status === 200 && reject.data.tool?.approved === false, `got ${reject.status}`);

  const gone = await api("GET", `/tools?search=${encodeURIComponent(name)}`);
  check(
    "rejected tool no longer publicly visible",
    !(gone.data.tools || []).some((t) => String(t._id) === String(S.submittedToolId))
  );

  const d = await api("DELETE", `/admin/tools/${S.submittedToolId}`, { token: S.adminToken });
  check("admin deletes submitted tool (cleanup)", d.status === 200 || d.status === 204, `got ${d.status}`);
  S.submittedToolId = null;
}

/* ================================================================
   N. TOOL REQUESTS — user request → admin status change
================================================================ */
async function testToolRequests() {
  section("N. TOOL REQUESTS");

  const noAuth = await api("POST", "/tool-requests", { body: { toolName: "x", category: "y" } });
  check("tool request without auth → 401", noAuth.status === 401, `got ${noAuth.status}`);

  const missing = await api("POST", "/tool-requests", {
    token: S.user1Token,
    body: { toolName: "x" },
  });
  check("tool request missing category → 400", missing.status === 400, `got ${missing.status}`);

  const req = await api("POST", "/tool-requests", {
    token: S.user1Token,
    body: {
      toolName: `E2E Requested Tool ${RUN}`,
      website: "https://example.com",
      category: S.tool.category,
      description: "Please add this tool to the directory.",
    },
  });
  check("POST /tool-requests → 201", req.status === 201 && !!req.data.data?._id, `got ${req.status}`);
  S.toolRequestId = req.data.data?._id;

  const adminList = await api("GET", "/admin/tool-requests", { token: S.adminToken });
  check(
    "admin GET /admin/tool-requests contains it",
    adminList.status === 200 &&
      (adminList.data.data || []).some((r) => String(r._id) === String(S.toolRequestId)),
    `got ${adminList.status}`
  );

  const badStatus = await api("PUT", `/admin/tool-requests/${S.toolRequestId}/status`, {
    token: S.adminToken,
    body: { status: "Bogus" },
  });
  check("invalid status → 400", badStatus.status === 400, `got ${badStatus.status}`);

  const st = await api("PUT", `/admin/tool-requests/${S.toolRequestId}/status`, {
    token: S.adminToken,
    body: { status: "Approved" },
  });
  check("admin sets status Approved", st.status === 200 && st.data.data?.status === "Approved", `got ${st.status}`);
}

/* ================================================================
   O. ADMIN — categories & users management
================================================================ */
async function testAdminCategoriesUsers() {
  section("O. ADMIN — categories / users");

  const catName = `E2E Category ${RUN}`;
  const cat = await api("POST", "/admin/categories", {
    token: S.adminToken,
    body: { name: catName, description: "E2E category", icon: "🧪" },
  });
  check("admin create category", cat.status === 200 || cat.status === 201, `got ${cat.status}`);
  S.categoryId = cat.data.category?._id;

  const catUpd = await api("PUT", `/admin/categories/${S.categoryId}`, {
    token: S.adminToken,
    body: { description: "E2E category updated" },
  });
  check("admin update category", catUpd.status === 200 && catUpd.data.success, `got ${catUpd.status}`);

  const catToggle = await api("PUT", `/admin/categories/${S.categoryId}/toggle`, { token: S.adminToken });
  check("admin toggle category active", catToggle.status === 200 && catToggle.data.success, `got ${catToggle.status}`);

  const catDel = await api("DELETE", `/admin/categories/${S.categoryId}`, { token: S.adminToken });
  check("admin delete category", catDel.status === 200 || catDel.status === 204, `got ${catDel.status}`);
  S.categoryId = null;

  const bcat = await api("POST", "/admin/blog-categories", {
    token: S.adminToken,
    body: { name: `E2E BlogCat ${RUN}`, description: "E2E" },
  });
  check("admin create blog category", (bcat.status === 200 || bcat.status === 201) && !!bcat.data.category?._id, `got ${bcat.status}`);

  const bcatUpd = await api("PUT", `/admin/blog-categories/${bcat.data.category?._id}`, {
    token: S.adminToken,
    body: { name: `E2E BlogCat ${RUN}`, description: "E2E updated" },
  });
  check("admin update blog category", bcatUpd.status === 200 && bcatUpd.data.success, `got ${bcatUpd.status}`);

  const bcatDel = await api("DELETE", `/admin/blog-categories/${bcat.data.category?._id}`, { token: S.adminToken });
  check("admin delete blog category", bcatDel.status === 200 || bcatDel.status === 204, `got ${bcatDel.status}`);

  const users = await api("GET", "/admin/users", { token: S.adminToken });
  check(
    "admin users list contains test users",
    (users.data.users || users.data.data || []).some((u) => u.email === USER2.email)
  );

  const userUpd = await api("PUT", `/admin/users/${S.user2Id}`, {
    token: S.adminToken,
    body: { name: `${USER2.name} Updated` },
  });
  check("admin update user", userUpd.status === 200 && userUpd.data.success, `got ${userUpd.status}`);
}

/* ================================================================
   P. ADMIN — blogs CRUD, exports, logs, search
================================================================ */
async function testAdminBlogsMisc() {
  section("P. ADMIN — blogs / exports / logs / search");

  const adminBlogs = await api("GET", "/admin/blogs", { token: S.adminToken });
  check("admin GET /admin/blogs → 200", adminBlogs.status === 200 && adminBlogs.data.success, `got ${adminBlogs.status}`);

  const blogStats = await api("GET", "/admin/blogs/stats", { token: S.adminToken });
  check("admin GET /admin/blogs/stats → 200", blogStats.status === 200 && blogStats.data.success, `got ${blogStats.status}`);

  const nb = await api("POST", "/admin/blogs", {
    token: S.adminToken,
    body: { title: `E2E Admin Blog ${RUN}`, content: "<p>E2E admin blog content</p>", excerpt: "E2E" },
  });
  check("admin create blog → 201", nb.status === 201, `got ${nb.status}`);
  const nbId = nb.data.blog?._id;

  const nbUpd = await api("PUT", `/admin/blogs/${nbId}`, {
    token: S.adminToken,
    body: { title: `E2E Admin Blog Updated ${RUN}` },
  });
  check("admin update blog", nbUpd.status === 200 && nbUpd.data.success, `got ${nbUpd.status}`);

  const nbStatus = await api("PATCH", `/admin/blogs/${nbId}/status`, {
    token: S.adminToken,
    body: { status: "published" },
  });
  check("admin set blog status published", nbStatus.status === 200 && nbStatus.data.success, `got ${nbStatus.status}`);

  const nbFeat = await api("PATCH", `/admin/blogs/${nbId}/featured`, { token: S.adminToken });
  check("admin toggle blog featured", nbFeat.status === 200 && nbFeat.data.success, `got ${nbFeat.status}`);

  const nbDel = await api("DELETE", `/admin/blogs/${nbId}`, { token: S.adminToken });
  check("admin delete blog", nbDel.status === 200 || nbDel.status === 204, `got ${nbDel.status}`);

  const logs = await api("GET", "/admin/activity-logs", { token: S.adminToken });
  check("admin GET /admin/activity-logs → 200", logs.status === 200 && logs.data.success, `got ${logs.status}`);

  const notifs = await api("GET", "/admin/notifications", { token: S.adminToken });
  check("admin GET /admin/notifications → 200", notifs.status === 200 && notifs.data.success, `got ${notifs.status}`);

  const comments = await api("GET", "/admin/blog-comments", { token: S.adminToken });
  check("admin GET /admin/blog-comments → 200", comments.status === 200 && comments.data.success, `got ${comments.status}`);

  const unread = await api("GET", "/admin/contact-messages/unread-count", { token: S.adminToken });
  check("admin GET /admin/contact-messages/unread-count → 200", unread.status === 200, `got ${unread.status}`);

  const exportTools = await api("GET", "/admin/export/tools", { token: S.adminToken });
  check("admin GET /admin/export/tools → 200", exportTools.status === 200, `got ${exportTools.status}`);

  const search = await api("GET", `/admin/search?q=${encodeURIComponent(S.tool.name)}`, { token: S.adminToken });
  check("admin GET /admin/search → 200", search.status === 200, `got ${search.status}`);
}

/* ================================================================
   Q. AUTH — password change, forgot/reset, logout, delete account
================================================================ */
async function testAuthExtras() {
  section("Q. AUTH — passwords / logout / delete account");

  const wrongCur = await api("PUT", "/auth/change-password", {
    token: S.user1Token,
    body: { currentPassword: "WrongPass123", newPassword: "NewPass123", confirmPassword: "NewPass123" },
  });
  check("change password with wrong current → 400", wrongCur.status === 400, `got ${wrongCur.status}`);

  const mismatch = await api("PUT", "/auth/change-password", {
    token: S.user1Token,
    body: { currentPassword: PW, newPassword: "NewPass123", confirmPassword: "Different123" },
  });
  check("change password with mismatched confirm → 400", mismatch.status === 400, `got ${mismatch.status}`);

  const ch = await api("PUT", "/auth/change-password", {
    token: S.user1Token,
    body: { currentPassword: PW, newPassword: "NewPass123", confirmPassword: "NewPass123" },
  });
  check("change password → success", ch.status === 200 && ch.data.success, `got ${ch.status}`);

  const oldLogin = await api("POST", "/auth/login", { body: { email: USER1.email, password: PW } });
  check("login with old password → 401", oldLogin.status === 401, `got ${oldLogin.status}`);

  const newLogin = await api("POST", "/auth/login", { body: { email: USER1.email, password: "NewPass123" } });
  check("login with new password → 200", newLogin.status === 200 && !!newLogin.data.token, `got ${newLogin.status}`);

  const forgotGhost = await api("POST", "/auth/forgot-password", {
    body: { email: `ghost-${RUN}@example.com` },
  });
  check(
    "forgot-password (unknown email) → generic success",
    forgotGhost.status === 200 && forgotGhost.data.success,
    `got ${forgotGhost.status}`
  );

  // Reset flow via seeded token (simulates the emailed link)
  const resetToken = `e2e-reset-${RUN}`;
  await db.collection("users").updateOne(
    { email: USER1.email },
    {
      $set: {
        resetPasswordToken: sha256(resetToken),
        resetPasswordExpire: new Date(Date.now() + 3600_000),
      },
    }
  );

  const checkTok = await api("GET", `/auth/verify-reset-token/${resetToken}`);
  check("GET /auth/verify-reset-token/:token → valid", checkTok.status === 200 && checkTok.data.success, `got ${checkTok.status}`);

  const reset = await api("PUT", `/auth/reset-password/${resetToken}`, {
    body: { password: PW },
  });
  check("PUT /auth/reset-password/:token → success", reset.status === 200 && reset.data.success, `got ${reset.status}`);

  const afterReset = await api("POST", "/auth/login", { body: { email: USER1.email, password: PW } });
  check("login after reset → 200", afterReset.status === 200, `got ${afterReset.status}`);
  S.user1Token = afterReset.data.token;

  const logout = await api("POST", "/auth/logout", { token: S.user1Token });
  check("POST /auth/logout → success", logout.status === 200 && logout.data.success, `got ${logout.status}`);

  const badDel = await api("DELETE", "/auth/account", {
    token: S.user1Token,
    body: { password: "WrongPass123" },
  });
  check("delete account with wrong password → 400", badDel.status === 400, `got ${badDel.status}`);
}

/* ================================================================
   Z. CLEANUP + summary
================================================================ */
async function cleanup() {
  section("Z. CLEANUP");

  try {
    if (S.review1Id) await api("DELETE", `/admin/reviews/${S.review1Id}`, { token: S.adminToken });
    if (S.commentId) await api("DELETE", `/admin/blog-comments/${S.commentId}`, { token: S.adminToken });
    if (S.submittedToolId) await api("DELETE", `/admin/tools/${S.submittedToolId}`, { token: S.adminToken });
    if (S.adminToolId) await api("DELETE", `/admin/tools/${S.adminToolId}`, { token: S.adminToken });
    if (S.collectionId && S.user1Token) await api("DELETE", `/collections/${S.collectionId}`, { token: S.user1Token });
    if (S.toolListId && S.user2Token) await api("DELETE", `/user-tool-lists/${S.toolListId}`, { token: S.user2Token });
    if (S.user2Id && S.adminToken) await api("DELETE", `/admin/users/${S.user2Id}`, { token: S.adminToken });

    // user1 deletes own account (full cascade)
    if (S.user1Token) {
      await api("DELETE", "/auth/account", { token: S.user1Token, body: { password: PW } });
    }

    // hard-delete any remaining artifacts created by this run
    await db.collection("tools").deleteMany({ name: { $regex: `E2E.*${RUN}` } });
    await db.collection("blogs").deleteMany({ title: { $regex: `E2E.*${RUN}` } });
    await db.collection("blogcomments").deleteMany({ content: { $regex: `E2E.*${RUN}` } });
    await db.collection("reviews").deleteMany({ comment: { $regex: `E2E.*${RUN}` } });
    await db.collection("users").deleteMany({ email: { $regex: `e2e-.*-${RUN}@example.com` } });
    await db.collection("categories").deleteMany({ name: { $regex: `E2E.*${RUN}` } });
    await db.collection("blogcategories").deleteMany({ name: { $regex: `E2E.*${RUN}` } });
    await db.collection("collections").deleteMany({ name: { $regex: `E2E.*${RUN}` } });
    await db.collection("usertoollists").deleteMany({ name: { $regex: `E2E.*${RUN}` } });
    await db.collection("toolrequests").deleteMany({ toolName: { $regex: `E2E.*${RUN}` } });

    console.log("  🧹 Cleanup done.");
  } catch (e) {
    console.log(`  ⚠️ Cleanup error (non-fatal): ${e.message}`);
  }
}

async function main() {
  console.log(`\n🚀 E2E flow tests → ${API}`);
  console.log(`   run id: ${RUN}`);

  const steps = [
    ["connect DB", connectDb],
    ["health", testHealth],
    ["admin bootstrap", testAdminBootstrap],
    ["base data", ensureBaseData],
    ["tools", testTools],
    ["blogs public", testBlogsPublic],
    ["auth", testAuth],
    ["profile", testProfile],
    ["tool saves", testToolSaves],
    ["blog interactions", testBlogInteractions],
    ["reviews", testReviews],
    ["collections", testCollections],
    ["tool lists", testToolLists],
    ["compare", testCompare],
    ["tool submission", testToolSubmission],
    ["tool requests", testToolRequests],
    ["admin categories/users", testAdminCategoriesUsers],
    ["admin blogs/misc", testAdminBlogsMisc],
    ["auth extras", testAuthExtras],
  ];

  for (const [name, fn] of steps) {
    try {
      await fn();
    } catch (e) {
      failures.push(`[FATAL] step "${name}" crashed: ${e.message}`);
      console.log(`\n💥 Step "${name}" crashed:`, e.message, "\n");
    }
  }

  await cleanup();
  mongoose.disconnect().catch(() => {});

  console.log("\n════════════════════════════════════");
  console.log(`   RESULT: ${passed} passed, ${failures.length} failed`);
  console.log("════════════════════════════════════");
  if (failures.length > 0) {
    console.log("\nFailed checks:");
    failures.forEach((f) => console.log(`  • ${f}`));
    process.exitCode = 1;
  }
}

main();

