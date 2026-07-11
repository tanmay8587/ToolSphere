import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { Image } from "@tiptap/extension-image";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { useEffect, useRef, useState } from "react";
import { uploadImage } from "../../services/adminApi";

/* ============================================================
   UploadableImage
   ------------------------------------------------------------
   A drop-in replacement for the default TipTap `Image` node that
   uploads files through the EXISTING backend upload API
   (`POST /api/upload`, see services/adminApi.uploadImage) and
   renders a rich React NodeView with:

     - Drag & Drop insertion
     - Paste-image insertion
     - Resize handles (responsive, width-driven)
     - Alt text editing
     - Loading (spinner) state while the file uploads
     - Error state with retry / remove

   The transient states (uploading / error) are kept in node
   attributes that are intentionally NOT serialized to HTML, so
   saved content stays clean.
   ============================================================ */

// Allowed MIME types (mirrors backend multer config).
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB (mirrors backend limit)

// Keep a reference to the original File for each in-flight upload so the
// NodeView can offer a "Retry" without forcing the user to re-pick the file.
const pendingFiles = new Map();

function isImageFile(file) {
  return file && file.type && file.type.startsWith("image/");
}

function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, message: "Unsupported image type." };
  }
  if (file.size > MAX_SIZE) {
    return { ok: false, message: "Image must be 5 MB or smaller." };
  }
  return { ok: true };
}

// Build a Cloudinary-responsive `srcset` when the URL is a Cloudinary asset.
function buildSrcSet(src) {
  const marker = "/image/upload/";
  const idx = src.indexOf(marker);
  if (idx === -1) return null;
  const base = src.slice(0, idx + marker.length);
  const rest = src.slice(idx + marker.length);
  const widths = [400, 800, 1200, 1600];
  return widths
    .map((w) => `${base}w_${w},q_auto,f_auto/${rest} ${w}w`)
    .join(", ");
}

// Find the document position of an image node by its current `src`.
function findImagePosBySrc(editor, src) {
  let found = null;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "uploadableImage" && node.attrs.src === src) {
      found = pos;
      return false;
    }
  });
  return found;
}

// Patch an image node's attributes by matching its (temporary) src.
function updateImageNode(editor, src, attrs) {
  const pos = findImagePosBySrc(editor, src);
  if (pos == null) return;
  const node = editor.state.doc.nodeAt(pos);
  if (!node) return;
  editor.view.dispatch(
    editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs })
  );
}

// Insert a placeholder image node and kick off the upload.
function insertAndUpload(editor, file) {
  if (!isImageFile(file)) return;

  const validation = validateFile(file);
  const objectUrl = URL.createObjectURL(file);
  const defaultAlt = file.name ? file.name.replace(/\.[^.]+$/, "") : "";

  const pos = editor.state.selection.from;
  editor
    .chain()
    .focus()
    .insertContentAt(pos, {
      type: "uploadableImage",
      attrs: {
        src: objectUrl,
        alt: defaultAlt,
        "data-uploading": "true",
      },
    })
    .run();

  if (!validation.ok) {
    updateImageNode(editor, objectUrl, {
      "data-uploading": null,
      "data-error": "true",
      "data-error-message": validation.message,
    });
    return;
  }

  pendingFiles.set(objectUrl, file);
  doUpload(editor, objectUrl);
}

async function doUpload(editor, objectUrl) {
  const file = pendingFiles.get(objectUrl);
  if (!file) return;

  const uploadFn = editor.storage.uploadableImage?.uploadFn;
  try {
    const result = uploadFn
      ? await uploadFn(file)
      : await uploadImage(file).then((res) => ({
          url: res.data?.url || res.data?.secure_url,
          publicId: res.data?.publicId || res.data?.public_id,
        }));

    if (!result || !result.url) {
      throw new Error("Upload returned no URL");
    }

    updateImageNode(editor, objectUrl, {
      src: result.url,
      publicId: result.publicId || "",
      "data-uploading": null,
      "data-error": null,
      "data-error-message": null,
    });
  } catch (err) {
    updateImageNode(editor, objectUrl, {
      "data-uploading": null,
      "data-error": "true",
      "data-error-message":
        err?.response?.data?.message ||
        err?.message ||
        "Upload failed. Please try again.",
    });
  } finally {
    pendingFiles.delete(objectUrl);
    URL.revokeObjectURL(objectUrl);
  }
}

/* ============================================================
   NODE VIEW
   ============================================================ */
function ImageNodeView({ node, updateAttributes, editor, deleteNode, selected }) {
  const { src, alt, width, "data-uploading": uploading, "data-error": error, "data-error-message": errorMessage } =
    node.attrs;

  const imgRef = useRef(null);
  const resizingRef = useRef(null);
  const [editingAlt, setEditingAlt] = useState(false);
  const [altDraft, setAltDraft] = useState(alt || "");

  const isUploading = uploading === "true" || uploading === true;
  const isError = error === "true" || error === true;
  const editable = editor.isEditable;

  useEffect(() => {
    setAltDraft(alt || "");
  }, [alt]);

  // ---- Resize handling (width-driven, keeps aspect ratio) ----
  const onResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const img = imgRef.current;
    if (!img) return;
    const startX = e.clientX;
    const startWidth = img.clientWidth || Number(width) || 320;
    const ratio = img.clientHeight / img.clientWidth || 1;
    resizingRef.current = { startX, startWidth, ratio };

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const next = Math.max(80, Math.round(startWidth + dx));
      updateAttributes({ width: next, height: Math.round(next * ratio) });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      resizingRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const srcset = !isError ? buildSrcSet(src) : null;

  return (
    <NodeViewWrapper
      className={`editor-image-node group relative inline-block my-4 ${
        selected ? "ring-2 ring-cyan-500/70 rounded-lg" : ""
      }`}
      data-drag-handle
    >
      {isUploading && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 p-6 text-slate-300">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-400" />
          <span className="text-xs">Uploading image…</span>
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 p-6 text-red-200">
          <span className="text-xs font-medium">
            {errorMessage || "Upload failed"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-100 hover:bg-red-500/30"
              onClick={() => doUpload(editor, src)}
            >
              Retry
            </button>
            <button
              type="button"
              className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-white/20"
              onClick={() => deleteNode?.()}
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {!isUploading && !isError && (
        <>
          <img
            ref={imgRef}
            src={src}
            alt={alt || ""}
            width={width || null}
            height={node.attrs.height || null}
            loading="lazy"
            srcSet={srcset || undefined}
            sizes="(max-width: 768px) 100vw, 800px"
            className="editor-image block max-w-full rounded-lg"
            draggable={false}
          />

          {editable && (
            <>
              {/* Alt-text edit button */}
              <button
                type="button"
                title="Edit alt text"
                onClick={() => setEditingAlt((v) => !v)}
                className="absolute left-2 top-2 rounded-md bg-slate-900/80 px-2 py-1 text-xs text-slate-200 opacity-0 transition hover:bg-slate-900 group-hover:opacity-100 [div.editor-image-node:hover_&]:opacity-100"
              >
                Alt
              </button>

              {/* Resize handle */}
              <span
                onPointerDown={onResizeStart}
                title="Drag to resize"
                className="absolute bottom-1 right-1 h-4 w-4 cursor-nwse-resize rounded-sm border-2 border-cyan-400 bg-slate-900/80 opacity-0 transition group-hover:opacity-100 [div.editor-image-node:hover_&]:opacity-100"
              />

              {/* Remove button */}
              <button
                type="button"
                title="Remove image"
                onClick={() => deleteNode?.()}
                className="absolute right-2 top-2 rounded-md bg-slate-900/80 px-2 py-1 text-xs text-red-300 opacity-0 transition hover:bg-red-500/30 group-hover:opacity-100 [div.editor-image-node:hover_&]:opacity-100"
              >
                ✕
              </button>
            </>
          )}

          {editingAlt && (
            <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-lg border border-slate-700 bg-slate-900 p-2 shadow-xl">
              <input
                autoFocus
                value={altDraft}
                onChange={(e) => setAltDraft(e.target.value)}
                placeholder="Describe this image…"
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-500"
              />
              <div className="mt-1.5 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-md bg-white/10 px-2.5 py-1 text-xs text-slate-200 hover:bg-white/20"
                  onClick={() => setEditingAlt(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-md bg-cyan-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-cyan-600"
                  onClick={() => {
                    updateAttributes({ alt: altDraft });
                    setEditingAlt(false);
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </NodeViewWrapper>
  );
}

/* ============================================================
   EXTENSION
   ============================================================ */
export const UploadableImage = Image.extend({
  name: "uploadableImage",

  // Keep the same `image` parse rule so existing content still loads.
  addAttributes() {
    return {
      ...this.parent?.(),
      // Transient states — intentionally NOT serialized to HTML.
      "data-uploading": {
        default: null,
        rendered: false,
        renderHTML: () => ({}),
        parseHTML: () => null,
      },
      "data-error": {
        default: null,
        rendered: false,
        renderHTML: () => ({}),
        parseHTML: () => null,
      },
      "data-error-message": {
        default: null,
        rendered: false,
        renderHTML: () => ({}),
        parseHTML: () => null,
      },
      publicId: {
        default: null,
        rendered: false,
        renderHTML: () => ({}),
        parseHTML: () => null,
      },
    };
  },

  addStorage() {
    return {
      uploadFn: this.options.uploadFn,
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },

  addCommands() {
    return {
      ...this.parent?.(),
      // Insert one or more image files and upload them via the backend.
      uploadImageFiles:
        (files) =>
        ({ editor }) => {
          const list = Array.from(files || []).filter(isImageFile);
          if (!list.length) return false;
          list.forEach((file) => insertAndUpload(editor, file));
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("uploadableImageHandlers"),
        props: {
          handlePaste: (view, event) => {
            const files = event.clipboardData?.files;
            if (!files || !files.length) return false;
            const images = Array.from(files).filter(isImageFile);
            if (!images.length) return false;
            view.focus();
            images.forEach((file) => insertAndUpload(view.editor, file));
            return true;
          },
          handleDrop: (view, event) => {
            const files = event.dataTransfer?.files;
            if (!files || !files.length) return false;
            const images = Array.from(files).filter(isImageFile);
            if (!images.length) return false;
            event.preventDefault();
            const coordinates = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            });
            const pos = coordinates?.pos ?? view.state.selection.from;
            images.forEach((file) =>
              insertAndUploadAt(view.editor, file, pos)
            );
            return true;
          },
          // Visual feedback while dragging files over the editor.
          handleDOMEvents: {
            dragover: (view) => {
              view.dom.classList.add("editor-drag-over");
              return false;
            },
            dragleave: (view) => {
              view.dom.classList.remove("editor-drag-over");
              return false;
            },
            drop: (view) => {
              view.dom.classList.remove("editor-drag-over");
              return false;
            },
            dragend: (view) => {
              view.dom.classList.remove("editor-drag-over");
              return false;
            },
          },
        },
      }),
    ];
  },
});

// Variant of insertAndUpload that drops at a specific position (used by DnD).
function insertAndUploadAt(editor, file, pos) {
  if (!isImageFile(file)) return;
  const validation = validateFile(file);
  const objectUrl = URL.createObjectURL(file);
  const defaultAlt = file.name ? file.name.replace(/\.[^.]+$/, "") : "";

  editor
    .chain()
    .focus()
    .insertContentAt(pos, {
      type: "uploadableImage",
      attrs: {
        src: objectUrl,
        alt: defaultAlt,
        "data-uploading": "true",
      },
    })
    .run();

  if (!validation.ok) {
    updateImageNode(editor, objectUrl, {
      "data-uploading": null,
      "data-error": "true",
      "data-error-message": validation.message,
    });
    return;
  }
  pendingFiles.set(objectUrl, file);
  doUpload(editor, objectUrl);
}

export default UploadableImage;
