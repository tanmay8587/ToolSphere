import { FiSearch, FiTool, FiFolder, FiAlertCircle, FiRefreshCw, FiPlus } from "react-icons/fi";

const icons = {
  search: FiSearch,
  tool: FiTool,
  folder: FiFolder,
  error: FiAlertCircle,
  add: FiPlus,
};

export default function EmptyState({ 
  type = "search", 
  title, 
  description,
  action,
  onRetry,
  className = ""
}) {
  const Icon = icons[type] || FiSearch;
  
  const defaultTitles = {
    search: "No tools found",
    tool: "No tools available",
    folder: "No categories found",
    error: "Something went wrong",
    add: "Get started",
  };

  const defaultDescriptions = {
    search: "Try adjusting your search or filter criteria",
    tool: "Check back later for new AI tools",
    folder: "Categories will appear here once tools are added",
    error: "Please try again or contact support",
    add: "Add your first item to get started",
  };

  return (
    <div className={`flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-900/30 p-12 text-center ${className}`}>
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-slate-800">
        <Icon className="h-10 w-10 text-slate-300" />
      </div>
      
      <h3 className="mb-2 text-2xl font-semibold text-white">
        {title || defaultTitles[type]}
      </h3>
      
      <p className="mb-6 max-w-md text-slate-300">
        {description || defaultDescriptions[type]}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
        >
          <FiRefreshCw className="h-4 w-4" />
          Try Again
        </button>
      )}

      {action && (
        <div>{action}</div>
      )}
    </div>
  );
}