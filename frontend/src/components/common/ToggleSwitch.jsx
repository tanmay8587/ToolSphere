import { forwardRef } from "react";

const ToggleSwitch = forwardRef(({ 
  checked = false, 
  onChange, 
  disabled = false,
  id,
  className = "",
  "aria-label": ariaLabel,
}, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300
        focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
        disabled:cursor-not-allowed disabled:opacity-50
        ${checked ? "bg-gradient-to-r from-blue-500 to-purple-600" : "bg-slate-700"}
        ${className}
      `}
    >
      <span
        className={`
          inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300
          ${checked ? "translate-x-5" : "translate-x-1"}
        `}
      />
    </button>
  );
});

ToggleSwitch.displayName = "ToggleSwitch";

export default ToggleSwitch;