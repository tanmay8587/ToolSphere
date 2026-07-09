import { useRef, useState, useEffect } from "react";
import { uploadFile } from "../../../services/uploadService";
import { FiUpload, FiX, FiRefreshCw, FiAlertCircle } from "react-icons/fi";

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export default function ImageUploader({ 
  label, 
  value, 
  onChange,
  onUpload,
  accept = "image/*",
  maxSize = MAX_SIZE,
  allowedTypes = ALLOWED_TYPES,
  previewSize = "large", // "small" or "large"
  placeholder = "https://placehold.co/150x150?text=No+Image"
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  // Local object URL used to show an instant preview before the upload finishes.
  const [previewUrl, setPreviewUrl] = useState("");

  // Revoke any object URL we created to avoid memory leaks.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validation
    if (!allowedTypes.includes(file.type)) {
      setError("Only PNG, JPG, JPEG, WEBP, and SVG images are allowed.");
      return;
    }

    if (file.size > maxSize) {
      setError("Image size must be less than 2MB.");
      return;
    }

    setError("");

    // Show an immediate local preview while the file uploads in the background.
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    setUploading(true);
    setUploadProgress(0);

    try {
      const url = await uploadFile(file, setUploadProgress);
      onChange(url);
      if (onUpload) onUpload(url);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRemove = () => {
    onChange("");
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReplace = () => {
    fileInputRef.current?.click();
  };

  const sizeClasses = previewSize === "small" 
    ? "h-20 w-20" 
    : "h-32 w-32";

  // Prefer the instant local preview, then the saved value, then the placeholder.
  const displaySrc = previewUrl || value || placeholder;
  const hasImage = Boolean(previewUrl || value);

  return (
    <div className="space-y-3">
      <label className="block text-sm text-slate-300">
        {label}
        {value && <span className="ml-2 text-xs text-emerald-400">(Uploaded)</span>}
      </label>
      
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onClick={handleReplace}
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
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
            e.target.value = "";
          }}
          className="hidden"
        />
        
        {hasImage ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <img
                src={displaySrc}
                alt="Preview"
                className={`${sizeClasses} rounded-xl object-cover border border-slate-700`}
                onError={(e) => {
                  e.target.src = placeholder;
                }}
              />
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
                  <FiRefreshCw className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReplace();
                }}
                disabled={uploading}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                disabled={uploading}
                className="rounded-lg bg-red-600/20 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-600/30 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
              <FiUpload className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-white">
              Drag & Drop or Click to Upload
            </p>
            <p className="text-xs text-slate-500">
              PNG, JPG, JPEG, WEBP, SVG • Max 2MB
            </p>
          </div>
        )}
      </div>

      {uploading && uploadProgress > 0 && uploadProgress < 100 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Uploading...</span>
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
    </div>
  );
}