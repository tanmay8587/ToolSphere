import { FiChevronDown, FiInfo } from "react-icons/fi";
import { useState } from "react";

export default function SectionCard({ 
  title, 
  description, 
  children, 
  className = "",
  defaultOpen = true,
  icon: Icon = FiInfo,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-950/50 ${className}`}>
      <div 
        className="flex items-center justify-between p-6 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
            <Icon className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {description && (
              <p className="text-sm text-slate-400 mt-1">{description}</p>
            )}
          </div>
        </div>
        <FiChevronDown 
          className={`h-5 w-5 text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`} 
        />
      </div>
      
      {isOpen && (
        <div className="px-6 pb-6 border-t border-slate-800/50">
          <div className="pt-6">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}