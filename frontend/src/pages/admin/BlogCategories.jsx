import { useEffect, useState } from "react";
import AdminLayout from "../../layout/AdminLayout";
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiX,
  FiCheck,
} from "react-icons/fi";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/blogCategoryService";
import { useToast } from "../../components/common/Toast";

/* =====================================
   CATEGORY MODAL
   ===================================== */
function CategoryModal({ isOpen, category, onClose, onSave }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description || "");
      setColor(category.color || "#3B82F6");
    } else {
      setName("");
      setDescription("");
      setColor("#3B82F6");
    }
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      addToast("Category name is required", "error");
      return;
    }

    setLoading(true);
    try {
      const result = await onSave({
        name: name.trim(),
        description: description.trim(),
        color,
      });

      if (result.success) {
        addToast(category ? "Category updated successfully" : "Category created successfully", "success");
        onClose();
      } else {
        addToast(result.message || "Failed to save category", "error");
      }
    } catch (err) {
      addToast(err.message || "Failed to save category", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            {category ? "Edit Category" : "New Category"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Category Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Technology, Tutorial, News"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this category"
              rows={3}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-16 rounded-lg border border-slate-700 bg-slate-800 cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#3B82F6"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-cyan-500 font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600 disabled:opacity-50"
            >
              {loading ? "Saving..." : category ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =====================================
   DELETE CONFIRMATION MODAL
   ===================================== */
function DeleteModal({ isOpen, category, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const result = await onConfirm(category._id);
      if (result.success) {
        onClose();
      }
    } catch (err) {
      // Error handled in parent
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-white">Delete Category</h3>
        <p className="mt-2 text-sm text-slate-400">
          Are you sure you want to delete <span className="text-white font-semibold">"{category?.name}"</span>?
          This action cannot be undone.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =====================================
   MAIN PAGE
   ===================================== */
export default function BlogCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const { addToast } = useToast();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const result = await getAllCategories();
      if (result.success) {
        setCategories(result.categories || []);
      }
    } catch (err) {
      addToast(err.message || "Failed to fetch categories", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (data) => {
    const result = await createCategory(data);
    if (result.success) {
      fetchCategories();
    }
    return result;
  };

  const handleUpdate = async (data) => {
    if (!selectedCategory) return { success: false };
    const result = await updateCategory(selectedCategory._id, data);
    if (result.success) {
      fetchCategories();
    }
    return result;
  };

  const handleDelete = async (id) => {
    const result = await deleteCategory(id);
    if (result.success) {
      addToast("Category deleted successfully", "success");
      fetchCategories();
    } else {
      addToast(result.message || "Failed to delete category", "error");
    }
    return result;
  };

  const openCreateModal = () => {
    setSelectedCategory(null);
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setModalOpen(true);
  };

  const openDeleteConfirm = (category) => {
    setSelectedCategory(category);
    setDeleteModalOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Blog Categories</h1>
            <p className="mt-1 text-sm text-slate-400">
              Create and manage blog categories
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-white transition hover:bg-cyan-600"
          >
            <FiPlus className="h-4 w-4" />
            Add Category
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full text-center text-slate-500 py-12">
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-slate-800 bg-slate-950 p-12 text-center">
              <div className="text-slate-500 mb-4">
                <FiPlus className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No categories yet</h3>
              <p className="text-sm text-slate-400 mb-6">
                Get started by creating your first blog category
              </p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-white transition hover:bg-cyan-600"
              >
                <FiPlus className="h-4 w-4" />
                Create First Category
              </button>
            </div>
          ) : (
            categories.map((category) => (
              <div
                key={category._id}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-6 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <div
                        className="h-6 w-6 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{category.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">{category.slug}</p>
                    </div>
                  </div>
                </div>

                {category.description && (
                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                    {category.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <span className="text-xs text-slate-500">
                    {new Date(category.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(category)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
                    >
                      <FiEdit size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(category)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-500"
                    >
                      <FiTrash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Category Modal */}
      <CategoryModal
        isOpen={modalOpen}
        category={selectedCategory}
        onClose={() => setModalOpen(false)}
        onSave={selectedCategory ? handleUpdate : handleCreate}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        category={selectedCategory}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
    </AdminLayout>
  );
}