import { useEffect, Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

/* Layout */
import Layout from "./layout/Layout";
import ScrollToTop from "./components/common/ScrollToTop";

/* Protected Route */
import ProtectedRoute from "./routes/ProtectedRoute";

/* Loading Fallback */
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500 mx-auto"></div>
      <p className="text-slate-400">Loading...</p>
    </div>
  </div>
);

/* Public Pages - Lazy Loaded */
const HomePage = lazy(() => import("./pages/HomePage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const ToolsPage = lazy(() => import("./pages/ToolsPage"));
const ToolDetailPage = lazy(() => import("./pages/ToolDetailPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const CookiePage = lazy(() => import("./pages/CookiePage"));
const DisclaimerPage = lazy(() => import("./pages/DisclaimerPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const Login = lazy(() => import("./pages/Login"));
const RegisterSuccess = lazy(() => import("./pages/RegisterSuccess"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Profile = lazy(() => import("./pages/Profile"));
const MaintenancePage = lazy(() => import("./pages/MaintenancePage"));

/* Admin Pages - Lazy Loaded */
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Tools = lazy(() => import("./pages/admin/Tools"));
const ToolForm = lazy(() => import("./pages/admin/ToolForm"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const AdminProfilePage = lazy(() => import("./pages/admin/ProfilePage"));
const ChangePassword = lazy(() => import("./pages/admin/ChangePassword"));
const ManageUsers = lazy(() => import("./pages/admin/ManageUsers"));
const ContactMessages = lazy(() => import("./pages/admin/ContactMessages"));
const ContactMessageDetail = lazy(() => import("./pages/admin/ContactMessageDetail"));
const NewsletterSubscribers = lazy(() => import("./pages/admin/NewsletterSubscribers"));

function App() {

  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.classList.remove("light");
  }, []);

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>

          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />

            <Route path="/tool/:slug" element={<ToolDetailPage />} />

            <Route path="categories" element={<CategoriesPage />} />
            <Route path="tools" element={<ToolsPage />} />
            <Route path="tools/:slug" element={<ToolDetailPage />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="faq" element={<FAQPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="cookies" element={<CookiePage />} />
            <Route path="disclaimer" element={<DisclaimerPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

{/* AUTH */}
<Route path="/login" element={<Login />} />
<Route path="/register-success" element={<RegisterSuccess />} />
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password/:token" element={<ResetPassword />} />
<Route path="/verify-email/:token" element={<VerifyEmail />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="/admin/login" element={<AdminLogin />} />

          {/* ADMIN */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/tools"
            element={
              <ProtectedRoute>
                <Tools />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/tools/add"
            element={
              <ProtectedRoute>
                <ToolForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/tools/:id/edit"
            element={
              <ProtectedRoute>
                <ToolForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute>
                <AdminProfilePage />
              </ProtectedRoute>
            }
          />

<Route
            path="/admin/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <ManageUsers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/contact-messages"
            element={
              <ProtectedRoute>
                <ContactMessages />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/contact-messages/:id"
            element={
              <ProtectedRoute>
                <ContactMessageDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/newsletter-subscribers"
            element={
              <ProtectedRoute>
                <NewsletterSubscribers />
              </ProtectedRoute>
            }
          />

          {/* MAINTENANCE PAGE - Standalone route for maintenance mode */}
          <Route path="/maintenance" element={<MaintenancePage />} />

        </Routes>
      </Suspense>
    </>
  );
}

export default App;