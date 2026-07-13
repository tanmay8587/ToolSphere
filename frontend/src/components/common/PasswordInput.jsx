import { useState } from "react";
import { FiEye, FiEyeOff, FiLock } from "react-icons/fi";

export default function PasswordInput({
  name,
  value,
  onChange,
  placeholder,
  error,
  className = "",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
      <input
        type={showPassword ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white outline-none transition focus:bg-white/10 ${
          error ? "border-red-500" : "border-white/10 focus:border-cyan-400"
        } ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
        aria-label={showPassword ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
      </button>
    </div>
  );
}