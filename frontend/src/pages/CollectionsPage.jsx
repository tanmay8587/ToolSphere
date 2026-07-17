import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiFolder, FiArrowRight } from "react-icons/fi";
import { getCollections, createCollection, renameCollection, deleteCollection, removeToolFromCollection } from "../services/collectionsService";
import { getToolLogoProps } from "../utils/imageOptimization";
import { useToast, ToastContainer } from "../components/common/Toast";
import { isLoggedIn, getUser } from "../utils/auth";

const liftSpring = { type: "spring", stiffness: 400, damping: 25 };

const pageVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
};

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
      >
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm text-slate-400">{message}</p>
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-white/20 hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function RenameModal({ isOpen, initialName, initialIsPublic, onSave, onCancel, loading }) {
  const [name, setName] = useState(initialName || "");
  const [isPublic, setIsPublic] = useState(initialIsPublic || false);

  useEffect(() => {
    setName(initialName || "");
    setIsPublic(initialIsPublic || false);
  }, [initialName, initialIsPublic, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
      >
        <h3 className="text-lg font-semibold text-white">Rename Collection</h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Collection name"
          className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
        />
        <div className="mt-4 flex items-center gap-3">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-2 focus:ring-cyan-400/20"
          />
          <label htmlFor="isPublic" className="text-sm text-slate-300">
            Make this collection public
          </label>
        </div>
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-white/20 hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(name, isPublic)}
            disabled={loading || !name.trim()}
            className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CreateModal({ isOpen, onCreate, onCancel, loading }) {
  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    setName("");
    setIsPublic(false);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
      >
        <h3 className="text-lg font-semibold text-white">Create Collection</h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Collection name"
          className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
        />
        <div className="mt-4 flex items-center gap-3">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-2 focus:ring-cyan-400/20"
          />
          <label htmlFor="isPublic" className="text-sm text-slate-300">
            Make this collection public
          </label>
        </div>
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-white/20 hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(name, isPublic)}
            disabled={loading || !name.trim()}
            className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ToolCard({ tool, onRemove, removing }) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10">
      <Link to={`/tools/${tool.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
        <img
          {...getToolLogoProps(tool.logo || tool.coverImage, tool.name)}
          onError={(e) => {
            e.currentTarget.src = "/default-logo.png";
          }}
          className="h-10 w-10 rounded-xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-white group-hover:text-cyan-300 transition">
            {tool.name}
          </h4>
          <p className="truncate text-xs text-slate-400">{tool.category}</p>
        </div>
        <FiArrowRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400" />
      </Link>
      <button
        onClick={() => onRemove(tool)}
        disabled={removing}
        aria-label={`Remove ${tool.name} from collection`}
        className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
      >
        <FiX className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function CollectionsPage() {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameLoading, setRenameLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(null); // `${collectionId}:${toolId}`

  const loadCollections = async () => {
    setLoading(true);
    try {
      const data = await getCollections();
      if (data.success) {
        setCollections(data.data || []);
      } else {
        setError(data.message || "Failed to load collections.");
      }
    } catch (err) {
      setError("Failed to load collections.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    loadCollections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (name, isPublic) => {
    setCreateLoading(true);
    try {
      const { data } = await createCollection(name, isPublic);
      if (data.success) {
        setCollections((prev) => [data.data, ...prev]);
        setCreateOpen(false);
        addToast("Collection created successfully.", "success");
      } else {
        addToast(data.message || "Failed to create collection.", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to create collection.", "error");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRename = async (name, isPublic) => {
    if (!renameTarget) return;
    setRenameLoading(true);
    try {
      const { data } = await renameCollection(renameTarget._id, name, isPublic);
      if (data.success) {
        setCollections((prev) =>
          prev.map((c) => (c._id === renameTarget._id ? { ...c, name: data.data.name, isPublic: data.data.isPublic } : c))
        );
        setRenameTarget(null);
        addToast("Collection renamed successfully.", "success");
      } else {
        addToast(data.message || "Failed to rename collection.", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to rename collection.", "error");
    } finally {
      setRenameLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const { data } = await deleteCollection(deleteTarget._id);
      if (data.success) {
        setCollections((prev) => prev.filter((c) => c._id !== deleteTarget._id));
        setDeleteTarget(null);
        addToast("Collection deleted successfully.", "success");
      } else {
        addToast(data.message || "Failed to delete collection.", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to delete collection.", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRemoveTool = async (collectionId, tool) => {
    const key = `${collectionId}:${tool._id}`;
    setRemoveLoading(key);
    try {
      const { data } = await removeToolFromCollection(collectionId, tool._id);
      if (data.success) {
        addToast(`Removed "${tool.name}" from collection.`, "success");
        // Refresh collection state immediately to reflect the removed tool
        // (in-place update avoids a full-page loading flash and preserves UI state)
        setCollections((prev) =>
          prev.map((c) =>
            c._id === collectionId
              ? { ...c, tools: (c.tools || []).filter((t) => t._id !== tool._id) }
              : c
          )
        );
      } else {
        addToast(data.message || "Failed to remove tool from collection.", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to remove tool from collection.", "error");
    } finally {
      setRemoveLoading(null);
    }
  };

  const localUser = getUser();

  if (!localUser && !loading) {
    navigate("/login");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="h-10 w-40 animate-pulse rounded-2xl bg-slate-800/50" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-800/50" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-slate-950 px-4 py-10 text-white"
      variants={pageVariants}
      initial="hidden"
      animate="show"
    >
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <motion.div
        className="mx-auto max-w-5xl space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div variants={cardVariants} className="flex items-center justify-between gap-4">
          <button
            onClick={() => navigate("/")}
            className="group flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur-md transition-colors duration-300 hover:border-cyan-400/40 hover:bg-white/10"
          >
            <FiArrowRight className="h-4 w-4 rotate-180 text-cyan-300" />
            <span className="hidden sm:inline">Home</span>
          </button>

          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-cyan-600"
          >
            <FiPlus className="h-4 w-4" />
            New Collection
          </button>
        </motion.div>

        {error && (
          <motion.div
            variants={cardVariants}
            className="rounded-2xl border border-red-500/20 bg-slate-900 p-6 text-sm text-red-300"
          >
            {error}
          </motion.div>
        )}

        {!error && collections.length === 0 && (
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -4, boxShadow: "0 18px 40px -12px rgba(34,211,238,0.2)" }}
            transition={liftSpring}
            className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 px-6 py-16 text-center shadow-lg"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/20 via-indigo-500/20 to-purple-600/20 ring-1 ring-white/10">
              <FiFolder className="h-8 w-8 text-cyan-300" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">No collections yet</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-400">
              Create a collection to organize your favorite AI tools.
            </p>
            <button
              onClick={() => setCreateOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600"
            >
              <FiPlus className="h-4 w-4" />
              Create your first collection
            </button>
          </motion.div>
        )}

        <motion.div variants={cardVariants} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => {
            const isExpanded = expandedId === collection._id;
            const tools = collection.tools || [];
            return (
              <div
                key={collection._id}
                className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-white">{collection.name}</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {tools.length} tool{tools.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setRenameTarget(collection)}
                      aria-label="Rename collection"
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(collection)}
                      aria-label="Delete collection"
                      className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/10"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex-1">
                  {tools.length === 0 ? (
                    <p className="text-sm text-slate-500">No tools in this collection.</p>
                  ) : (
                    <div className="space-y-2">
                      {(isExpanded ? tools : tools.slice(0, 3)).map((tool) => (
                        <ToolCard
                          key={tool._id}
                          tool={tool}
                          onRemove={(t) => handleRemoveTool(collection._id, t)}
                          removing={removeLoading === `${collection._id}:${tool._id}`}
                        />
                      ))}
                      {!isExpanded && tools.length > 3 && (
                        <button
                          onClick={() => setExpandedId(collection._id)}
                          className="text-xs font-medium text-cyan-400 hover:underline"
                        >
                          View all {tools.length} tools
                        </button>
                      )}
                      {isExpanded && (
                        <button
                          onClick={() => setExpandedId(null)}
                          className="text-xs font-medium text-slate-400 hover:underline"
                        >
                          Show less
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </motion.div>
      </motion.div>

      <CreateModal
        isOpen={createOpen}
        onCreate={handleCreate}
        onCancel={() => setCreateOpen(false)}
        loading={createLoading}
      />

      <RenameModal
        isOpen={!!renameTarget}
        initialName={renameTarget?.name}
        initialIsPublic={renameTarget?.isPublic}
        onSave={handleRename}
        onCancel={() => setRenameTarget(null)}
        loading={renameLoading}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Collection"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </motion.div>
  );
}