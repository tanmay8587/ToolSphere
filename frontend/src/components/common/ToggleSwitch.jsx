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
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900
        disabled:cursor-not-allowed disabled:opacity-50
        ${checked ? "bg-cyan-500" : "bg-slate-700"}
        ${className}
      `}
    >
      <span
        className={`
          inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform
          ${checked ? "translate-x-6" : "translate-x-0.5"}
        `}
      />
    </button>
  );
});

ToggleSwitch.displayName = "ToggleSwitch";

export default ToggleSwitch;