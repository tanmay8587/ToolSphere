import { useRef, useState, useEffect } from "react";
import { uploadFile } from "../../../services/uploadService";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiX, FiAlertCircle } from "react-icons/fi";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_IMAGES = 10;

function SortableImage({ id, url, onDelete, status }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative group rounded-xl overflow-hidden border border-slate-700 cursor-grab bg-slate-900"
    >
      <img
        src={url}
        alt="Gallery"
        className="h-24 w-24 object-cover"
        onError={(e) => {
          e.target.src = "https://placehold.co/96x96?text=Error";
        }}
      />
      
      {status === "uploaded" && (
        <span className="absolute top-1 left-1 rounded bg-emerald-500 px-1.5 py-0.5 text-xs font-semibold text-white">
          ✓
        </span>
      )}

      <button
        type="button"
        onClick={() => onDelete(id)}
        className="absolute top-1 right-1 bg-red-500/80 text-white text-xs p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        title="Remove image"
      >
        <FiX className="h-3 w-3" />
      </button>
    </div>
  );
}

export default function GalleryUploader({ 
  label, 
  value = [], 
  onChange,
  maxImages = MAX_IMAGES 
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState("");

  const images = Array.isArray(value) ? value : [];

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.url && img.isLocal) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [images]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);

    onChange(arrayMove(images, oldIndex, newIndex));
  };

  const handleFiles = async (files) => {
    const fileArray = Array.from(files);
    
    // Check max limit
    if (images.length + fileArray.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed.`);
      return;
    }

    // Validate each file
    for (const file of fileArray) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Only PNG, JPG, JPEG, WEBP, and SVG images are allowed.");
        return;
      }
      if (file.size > MAX_SIZE) {
        setError("Each image must be less than 2MB.");
        return;
      }
    }

    setError("");
    setUploading(true);
    setTotalCount(fileArray.length);
    setCompletedCount(0);
    setUploadProgress(0);

    const uploadedUrls = [];

    for (const file of fileArray) {
      try {
        const url = await uploadFile(file, setUploadProgress);
        uploadedUrls.push({ id: crypto.randomUUID(), url, status: "uploaded" });
        setCompletedCount((prev) => prev + 1);
      } catch (err) {
        // Upload failed silently
      }
    }

    onChange([...images, ...uploadedUrls]);
    setUploading(false);
    setTimeout(() => {
      setUploadProgress(0);
      setCompletedCount(0);
      setTotalCount(0);
    }, 500);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleRemove = (id) => {
    const img = images.find((i) => i.id === id);
    if (img?.isLocal && img.url) {
      URL.revokeObjectURL(img.url);
    }
    onChange(images.filter((img) => img.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm text-slate-300">
          {label}
          {images.length > 0 && (
            <span className="ml-2 text-xs text-slate-500">
              ({images.length}/{maxImages})
            </span>
          )}
        </label>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className={`
          cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-all
          ${error 
            ? "border-red-500/50 bg-red-500/5" 
            : "border-slate-700 bg-slate-900/50 hover:border-cyan-500 hover:bg-slate-900/70"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />

        <div className="text-3xl mb-2">📁</div>
        <p className="text-sm font-medium text-white">
          Drag & Drop or Click to Upload
        </p>
        <p className="text-xs text-slate-500 mt-1">
          PNG, JPG, JPEG, WEBP, SVG • Max {maxImages} images
        </p>
      </div>

      {uploading && totalCount > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Uploading... ({completedCount}/{totalCount})</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-red-400">
          <FiAlertCircle size={14} />
          {error}
        </p>
      )}

      {images.length > 0 && (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={images} strategy={horizontalListSortingStrategy}>
            <div className="flex flex-wrap gap-3">
              {images.map((img) => (
                <SortableImage
                  key={img.id}
                  id={img.id}
                  url={img.url}
                  status={img.status}
                  onDelete={handleRemove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}