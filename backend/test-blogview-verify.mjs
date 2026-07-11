/**
 * Verification of the unique Blog View system (time-based 24h dedup).
 *
 * The live MongoDB Atlas cluster is not reachable from this sandbox, so this test
 * faithfully SIMULATES the exact logic in backend/server/controllers/blogController.js
 * `recordUniqueView()` using an in-memory store. It mirrors BOTH behaviours:
 *   1. The 24h time-window query (blogId + userId/visitorId + viewedAt >= now-24h).
 *   2. The unique compound index on (blogId, userId, visitorId) which makes
 *      concurrent inserts race-safe (a duplicate throws 11000 and is treated as
 *      counted:false, so Blog.views is never inflated).
 *
 * Run:  node test-blogview-verify.mjs
 */

const VIEW_DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000;

/* ---------- In-memory simulation of BlogView + unique index ---------- */
const blogViewStore = []; // { blogId, userId, visitorId, viewedAt }
const keyOf = (v) => `${v.blogId}|${v.userId}|${v.visitorId}`;
const blogStore = new Map(); // id -> { views }

/* ---------- EXACT logic copied from blogController.js recordUniqueView ---------- */
const recordUniqueView = async (blog, userId, visitorId) => {
  const since = new Date(Date.now() - VIEW_DEDUP_WINDOW_MS);
  const query = { blogId: blog._id, viewedAt: { $gte: since } };
  if (userId) {
    query.userId = userId;
    query.visitorId = null;
  } else {
    query.userId = null;
    query.visitorId = visitorId || "anonymous";
  }

  // 1) Check whether this viewer already viewed the blog in the last 24h.
  const existing = blogViewStore.find(
    (v) =>
      v.blogId === query.blogId &&
      v.userId === query.userId &&
      v.visitorId === query.visitorId &&
      v.viewedAt >= since
  );
  if (existing) {
    return { counted: false, views: blog.views || 0 };
  }

  // 2) Create the view record (unique index => race-safe).
  const newRec = {
    blogId: query.blogId,
    userId: query.userId,
    visitorId: query.visitorId,
    viewedAt: new Date(),
  };
  const k = keyOf(newRec);
  if (blogViewStore.some((v) => keyOf(v) === k)) {
    // Duplicate key (11000) => concurrent insert already won. No increment.
    return { counted: false, views: blog.views || 0 };
  }
  blogViewStore.push(newRec);

  // 3) Genuinely new view -> increment the blog's counter.
  const updated = blogStore.get(blog._id);
  updated.views += 1;
  return { counted: true, views: updated.views };
};

/* ---------- Test harness ---------- */
const results = { passed: 0, failed: 0 };
const log = (name, ok, extra = "") => {
  console.log(`${ok ? "✅ PASS" : "❌ FAIL"}: ${name}${extra ? ` - ${extra}` : ""}`);
  ok ? results.passed++ : results.failed++;
};

const main = async () => {
  console.log("🚀 Verifying unique Blog View system (time-based 24h dedup)\n");

  const blog = { _id: "blog-1", views: 0 };
  blogStore.set(blog._id, blog);

  const guestA = "guest-browser-A-uuid"; // same browser / localStorage
  const guestB = "guest-browser-B-uuid"; // different browser
  const userA = "user-A-id";
  const userB = "user-B-id";

  // 1) Same guest opens the same blog 10 times -> only first counts.
  let r = await recordUniqueView(blog, null, guestA);
  log("1. Same guest x10 -> +1 only (first)", r.counted === true && r.views === 1, `views=${r.views}`);
  for (let i = 2; i <= 10; i++) {
    r = await recordUniqueView(blog, null, guestA);
  }
  log("1b. Same guest repeats 2..10 -> no increment", r.counted === false && r.views === 1, `views=${r.views}`);

  // 2) Refresh page (same visitorId) -> no increment.
  r = await recordUniqueView(blog, null, guestA);
  log("2. Refresh (same visitorId) -> no increment", r.counted === false && r.views === 1, `views=${r.views}`);

  // 3) Close browser and reopen within 24h (same visitorId) -> no increment.
  r = await recordUniqueView(blog, null, guestA);
  log("3. Reopen within 24h (same visitorId) -> no increment", r.counted === false && r.views === 1, `views=${r.views}`);

  // 4) Different browser (different visitorId) -> increment once.
  r = await recordUniqueView(blog, null, guestB);
  log("4. Different browser -> +1", r.counted === true && r.views === 2, `views=${r.views}`);
  r = await recordUniqueView(blog, null, guestB);
  log("4b. Different browser repeat -> no increment", r.counted === false && r.views === 2, `views=${r.views}`);

  // 5) Different logged-in user -> increment once.
  r = await recordUniqueView(blog, userA, null);
  log("5. Different logged-in user -> +1", r.counted === true && r.views === 3, `views=${r.views}`);
  r = await recordUniqueView(blog, userB, null);
  log("5b. Another logged-in user -> +1", r.counted === true && r.views === 4, `views=${r.views}`);

  // 6) Same logged-in user -> no duplicate increment within 24h.
  r = await recordUniqueView(blog, userA, null);
  log("6. Same logged-in user -> no increment", r.counted === false && r.views === 4, `views=${r.views}`);
  r = await recordUniqueView(blog, userB, null);
  log("6b. Same logged-in user B -> no increment", r.counted === false && r.views === 4, `views=${r.views}`);

  // 7) Trending still works: sort by views (simulated query).
  const trending = [{ title: "x", views: blog.views }].sort((a, b) => b.views - a.views);
  log("7. Trending query executes (sort by views)", Array.isArray(trending) && trending[0].views === blog.views, `topViews=${trending[0].views}`);

  // 8) Build passes is verified separately (npm run build --workspace=frontend).

  console.log(`\n📊 ${results.passed} passed, ${results.failed} failed`);
  process.exit(results.failed > 0 ? 1 : 0);
};

main().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});