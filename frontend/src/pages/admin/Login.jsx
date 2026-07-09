import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../../services/adminApi";
import { saveAdminToken } from "../../utils/auth";
import PasswordInput from "../../components/common/PasswordInput";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    // Clear validation error when user types
    if (e.target.name === "password") {
      setValidationErrors((prev) => ({ ...prev, password: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!form.email) errors.email = "Email is required";
    if (!form.password) errors.password = "Password is required";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const { data } = await loginAdmin(form);

      if (data.success) {
        saveAdminToken(data.token);
        navigate("/admin/dashboard");
      } else {
        setError(data.message || "Login Failed");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Login Failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">

      <div className="w-full max-w-md rounded-2xl bg-slate-900 p-8 shadow-2xl">

        <h1 className="text-3xl font-bold text-white text-center">
          Admin Login
        </h1>

        <p className="text-center text-slate-400 mt-2 mb-8">
          AI Tools Directory
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/20 p-3 text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className={`w-full rounded-lg border bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-500 ${
              validationErrors.email ? "border-red-500" : "border-slate-700"
            }`}
          />
          {validationErrors.email && (
            <p className="mt-1 text-xs text-red-400">{validationErrors.email}</p>
          )}

          <PasswordInput
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            error={validationErrors.password}
            required
            className="rounded-lg border border-slate-700 bg-slate-800"
          />
          {validationErrors.password && (
            <p className="mt-1 text-xs text-red-400">{validationErrors.password}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cyan-500 py-3 font-semibold text-white transition hover:bg-cyan-600 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

      </div>

    </div>
  );
}