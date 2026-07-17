import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { FiPlus, FiEdit2, FiTrash2, FiX, FiFolder, FiArrowRight, FiShare2, FiGlobe, FiLock, FiUsers } from "react-icons/fi";
import { getUserToolLists, getSharedUserToolLists, getPublicUserToolLists, createUserToolList, updateUserToolList, deleteUserToolList, removeToolFromList, shareUserToolList, unshareUserToolList } from "../services/userToolListsService";
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

function RenameModal({ isOpen, initialName, onSave, onCancel, loading }) {
  const [name, setName] = useState(initialName || "");

  useEffect(() => {
    setName(initialName || "");
  }, [initialName, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
      >
        <h3 className="text-lg font-semibold text-white">Rename List</h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="List name"
          className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
        />
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-white/20 hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(name)}
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
        <h3 className="text-lg font-semibold text-white">Create Tool List</h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="List name"
          className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
        />
        <div className="mt-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-400"
          />
          <label htmlFor="isPublic" className="text-sm text-slate-300">
            Make this list public (anyone can view)
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

function ShareModal({ isOpen, listName, onShare, onCancel, loading }) {
  const [email, setEmail] = useState("");

  useEffect(() => {
    setEmail("");
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
        <h3 className="text-lg font-semibold text-white">Share "{listName}"</h3>
        <p className="mt-2 text-sm text-slate-400">Enter the email address of the user you want to share with.</p>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          type="email"
          className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
        />
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-white/20 hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onShare(email)}
            disabled={loading || !email.trim()}
            className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:opacity-50"
          >
            {loading ? "Sharing..." : "Share"}
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
        aria-label={`Remove ${tool.name} from list`}
        className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
      >
        <FiX className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function UserToolListsPage() {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const [lists, setLists] = useState([]);
  const [sharedLists, setSharedLists] = useState([]);
  const [publicLists, setPublicLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("my-lists"); // "my-lists", "shared", "public"
  
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameLoading, setRenameLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(null);
  const [visibilityLoading, setVisibilityLoading] = useState(null);

  const loadLists = async () => {
    setLoading(true);
    setError("");
    try {
      const [myListsData, sharedData, publicData] = await Promise.all([
        getUserToolLists(),
        getSharedUserToolLists(),
        getPublicUserToolLists(),
      ]);

      if (myListsData.success) {
        setLists(myListsData.data || []);
      } else {
        setError(myListsData.message || "Failed to load lists.");
      }

      if (sharedData.success) {
        setSharedLists(sharedData.data || []);
      }

      if (publicData.success) {
        setPublicLists(publicData.data || []);
      }
    } catch (err) {
      setError("Failed to load lists.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login");
      return;
    }
    loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (name, isPublic) => {
    setCreateLoading(true);
    try {
      const { data } = await createUserToolList(name, isPublic);
      if (data.success) {
        setLists((prev) => [data.data, ...prev]);
        setCreateOpen(false);
        addToast("List created successfully.", "success");
      } else {
        addToast(data.message || "Failed to create list.", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to create list.", "error");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRename = async (name) => {
    if (!renameTarget) return;
    setRenameLoading(true);
    try {
      const { data } = await updateUserToolList(renameTarget._id, name);
      if (data.success) {
        setLists((prev) =>
          prev.map((l) => (l._id === renameTarget._id ? { ...l, name: data.data.name } : l))
        );
        setRenameTarget(null);
        addToast("List renamed successfully.", "success");
      } else {
        addToast(data.message || "Failed to rename list.", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to rename list.", "error");
    } finally {
      setRenameLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const { data } = await deleteUserToolList(deleteTarget._id);
      if (data.success) {
        setLists((prev) => prev.filter((l) => l._id !== deleteTarget._id));
        setDeleteTarget(null);
        addToast("List deleted successfully.", "success");
      } else {
        addToast(data.message || "Failed to delete list.", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to delete list.", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleShare = async (email) => {
    if (!shareTarget) return;
    setShareLoading(true);
    try {
      const { data } = await shareUserToolList(shareTarget._id, email);
      if (data.success) {
        setLists((prev) =>
          prev.map((l) => (l._id === shareTarget._id ? data.data : l))
        );
        setShareTarget(null);
        addToast("List shared successfully.", "success");
      } else {
        addToast(data.message || "Failed to share list.", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to share list.", "error");
    } finally {
      setShareLoading(false);
    }
  };

  const handleUnshare = async (listId, userId) => {
    try {
      const { data } = await unshareUserToolList(listId, userId);
      if (data.success) {
        setLists((prev) =>
          prev.map((l) => (l._id === listId ? data.data : l))
        );
        addToast("User removed from shared list.", "success");
      } else {
        addToast(data.message || "Failed to remove user.", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to remove user.", "error");
    }
  };

  const handleToggleVisibility = async (list) => {
    setVisibilityLoading(list._id);
    try {
      const { data } = await updateUserToolList(list._id, undefined, !list.isPublic);
      if (data.success) {
        setLists((prev) =>
          prev.map((l) => (l._id === list._id ? data.data : l))
        );
        addToast(`List is now ${!list.isPublic ? "public" : "private"}.`, "success");
      } else {
        addToast(data.message || "Failed to update visibility.", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to update visibility.", "error");
    } finally {
      setVisibilityLoading(null);
    }
  };

  const handleRemoveTool = async (listId, tool) => {
    const key = `${listId}:${tool._id}`;
    setRemoveLoading(key);
    try {
      const { data } = await removeToolFromList(listId, tool._id);
      if (data.success) {
        addToast(`Removed "${tool.name}" from list.`, "success");
        setLists((prev) =>
          prev.map((l) =>
            l._id === listId
              ? { ...l, tools: (l.tools || []).filter((t) => t._id !== tool._id) }
              : l
          )
        );
      } else {
        addToast(data.message || "Failed to remove tool from list.", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to remove tool from list.", "error");
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

  const getCurrentLists = () => {
    switch (activeTab) {
      case "shared":
        return sharedLists;
      case "public":
        return publicLists;
      default:
        return lists;
    }
  };

  const currentLists = getCurrentLists();

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

          {activeTab === "my-lists" && (
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-cyan-600"
            >
              <FiPlus className="h-4 w-4" />
              New List
            </button>
          )}
        </motion.div>

        {/* Tabs */}
        <motion.div variants={cardVariants} className="flex gap-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab("my-lists")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === "my-lists"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <FiFolder className="h-4 w-4" />
            My Lists ({lists.length})
          </button>
          <button
            onClick={() => setActiveTab("shared")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === "shared"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <FiUsers className="h-4 w-4" />
            Shared with me ({sharedLists.length})
          </button>
          <button
            onClick={() => setActiveTab("public")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === "public"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <FiGlobe className="h-4 w-4" />
            Public Lists ({publicLists.length})
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

        {!error && currentLists.length === 0 && (
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -4, boxShadow: "0 18px 40px -12px rgba(34,211,238,0.2)" }}
            transition={liftSpring}
            className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 px-6 py-16 text-center shadow-lg"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/20 via-indigo-500/20 to-purple-600/20 ring-1 ring-white/10">
              <FiFolder className="h-8 w-8 text-cyan-300" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">
              {activeTab === "my-lists" && "No lists yet"}
              {activeTab === "shared" && "No lists shared with you"}
              {activeTab === "public" && "No public lists available"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-400">
              {activeTab === "my-lists" && "Create a list to organize your favorite AI tools."}
              {activeTab === "shared" && "Lists shared with you will appear here."}
              {activeTab === "public" && "Public lists from other users will appear here."}
            </p>
            {activeTab === "my-lists" && (
              <button
                onClick={() => setCreateOpen(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600"
              >
                <FiPlus className="h-4 w-4" />
                Create your first list
              </button>
            )}
          </motion.div>
        )}

        <motion.div variants={cardVariants} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {currentLists.map((list) => {
            const isExpanded = expandedId === list._id;
            const tools = list.tools || [];
            const isOwner = list.user?._id === localUser?._id;
            
            return (
              <div
                key={list._id}
                className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-lg font-semibold text-white">{list.name}</h3>
                      {list.isPublic ? (
                        <FiGlobe className="h-4 w-4 shrink-0 text-cyan-400" title="Public" />
                      ) : (
                        <FiLock className="h-4 w-4 shrink-0 text-slate-400" title="Private" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {tools.length} tool{tools.length === 1 ? "" : "s"}
                      {list.user && !isOwner && ` • by ${list.user.name || list.user.email}`}
                    </p>
                  </div>
                  {isOwner && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleVisibility(list)}
                        disabled={visibilityLoading === list._id}
                        aria-label={list.isPublic ? "Make private" : "Make public"}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                        title={list.isPublic ? "Make private" : "Make public"}
                      >
                        {list.isPublic ? <FiLock className="h-4 w-4" /> : <FiGlobe className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => setShareTarget(list)}
                        aria-label="Share list"
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                      >
                        <FiShare2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setRenameTarget(list)}
                        aria-label="Rename list"
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(list)}
                        aria-label="Delete list"
                        className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/10"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex-1">
                  {tools.length === 0 ? (
                    <p className="text-sm text-slate-500">No tools in this list.</p>
                  ) : (
                    <div className="space-y-2">
                      {(isExpanded ? tools : tools.slice(0, 3)).map((tool) => (
                        <ToolCard
                          key={tool._id}
                          tool={tool}
                          onRemove={(t) => handleRemoveTool(list._id, t)}
                          removing={removeLoading === `${list._id}:${tool._id}`}
                        />
                      ))}
                      {!isExpanded && tools.length > 3 && (
                        <button
                          onClick={() => setExpandedId(list._id)}
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

                {isOwner && list.sharedWith && list.sharedWith.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <p className="text-xs text-slate-400 mb-2">Shared with:</p>
                    <div className="flex flex-wrap gap-1">
                      {list.sharedWith.map((user) => (
                        <div
                          key={user._id}
                          className="flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-300"
                        >
                          <span className="truncate max-w-[100px]">{user.name || user.email}</span>
                          <button
                            onClick={() => handleUnshare(list._id, user._id)}
                            className="ml-1 text-slate-400 hover:text-red-400"
                            title="Remove access"
                          >
                            <FiX className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
        onSave={handleRename}
        onCancel={() => setRenameTarget(null)}
        loading={renameLoading}
      />

      <ShareModal
        isOpen={!!shareTarget}
        listName={shareTarget?.name}
        onShare={handleShare}
        onCancel={() => setShareTarget(null)}
        loading={shareLoading}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete List"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </motion.div>
  );
}