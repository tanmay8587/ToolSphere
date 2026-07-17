import { useEffect, useState } from 'react';
import { getToolTimeline } from '../../services/toolsService';
import { FiClock, FiCheck, FiTool, FiZap, FiAlertTriangle, FiShield, FiInfo } from 'react-icons/fi';

const CHANGE_TYPE_CONFIG = {
  feature: {
    icon: FiZap,
    label: 'New Feature',
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  },
  bugfix: {
    icon: FiTool,
    label: 'Bug Fix',
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  },
  improvement: {
    icon: FiCheck,
    label: 'Improvement',
    color: 'text-green-400 bg-green-500/10 border-green-500/20',
  },
  breaking: {
    icon: FiAlertTriangle,
    label: 'Breaking Change',
    color: 'text-red-400 bg-red-500/10 border-red-500/20',
  },
  security: {
    icon: FiShield,
    label: 'Security',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  other: {
    icon: FiInfo,
    label: 'Other',
    color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  },
};

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function TimelineEntry({ entry }) {
  const changeTypeConfig = CHANGE_TYPE_CONFIG[entry.type] || CHANGE_TYPE_CONFIG.other;
  const ChangeIcon = changeTypeConfig.icon;

  return (
    <div className="flex gap-4">
      {/* Timeline dot and line */}
      <div className="flex flex-col items-center">
        <div className={`rounded-full p-2 border ${changeTypeConfig.color}`}>
          <ChangeIcon size={16} />
        </div>
        <div className="w-px h-full bg-slate-700 mt-2" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                  v{entry.version}
                </span>
                {entry.isMajor && (
                  <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300">
                    Major
                  </span>
                )}
                <span className={`rounded-full px-3 py-1 text-xs font-medium border ${changeTypeConfig.color}`}>
                  {changeTypeConfig.label}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {entry.title}
              </h3>
              <p className="text-sm text-slate-300 mb-3">
                {entry.description}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <FiClock size={14} />
                <span>Released on {formatDate(entry.releasedAt)}</span>
              </div>
            </div>
          </div>

          {/* Changes list */}
          {entry.changes && entry.changes.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold text-slate-300">Changes:</h4>
              <ul className="space-y-2">
                {entry.changes.map((change, index) => {
                  const changeConfig = CHANGE_TYPE_CONFIG[change.type] || CHANGE_TYPE_CONFIG.other;
                  const ChangeItemIcon = changeConfig.icon;
                  return (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-slate-400"
                    >
                      <ChangeItemIcon size={16} className={`mt-0.5 flex-shrink-0 ${changeConfig.color.split(' ')[0]}`} />
                      <span>{change.description}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ToolTimeline({ toolSlug, toolName }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTimeline = async () => {
      if (!toolSlug) return;

      setLoading(true);
      setError(null);

      try {
        const data = await getToolTimeline(toolSlug);
        if (data.success) {
          setTimeline(data.timeline || []);
        } else {
          setError('Failed to load timeline');
        }
      } catch (err) {
        setError('Failed to load timeline');
        console.error('Error loading timeline:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTimeline();
  }, [toolSlug]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white mb-6">Update History</h2>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 animate-pulse space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="h-6 w-16 bg-slate-800 rounded-full" />
              <div className="h-6 w-20 bg-slate-800 rounded-full" />
            </div>
            <div className="h-5 w-3/4 bg-slate-800 rounded" />
            <div className="h-4 w-full bg-slate-800 rounded" />
            <div className="h-4 w-2/3 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
        <p className="text-sm text-slate-400">
          No update history available for {toolName || 'this tool'} yet.
        </p>
      </div>
    );
  }

  const latestUpdate = timeline[0];
  const lastUpdated = latestUpdate?.releasedAt || latestUpdate?.createdAt;

  return (
    <div className="space-y-6">
      {/* Header with last updated info */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Update History</h2>
        {lastUpdated && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <FiClock size={16} />
            <span>Last updated: {formatDate(lastUpdated)}</span>
          </div>
        )}
      </div>

      {/* Timeline entries */}
      <div className="space-y-0">
        {timeline.map((entry) => (
          <TimelineEntry key={entry._id} entry={entry} />
        ))}
      </div>
    </div>
  );
}