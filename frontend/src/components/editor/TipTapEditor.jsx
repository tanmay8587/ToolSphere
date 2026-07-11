import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

/**
 * Reusable, fully-controlled TipTap rich text editor.
 *
 * NOTE: In TipTap v3, `StarterKit` already bundles the following extensions
 * that were historically added separately: Bold, Italic, Strike, Underline,
 * Heading, BulletList, OrderedList, Blockquote, CodeBlock, HorizontalRule,
 * Link, and History (UndoRedo). They are configured here through the
 * StarterKit options object to avoid duplicate-extension errors.
 * `Placeholder` is the only extension added on top of StarterKit.
 *
 * Props:
 *  - value:     HTML string (controlled content)
 *  - onChange:  (html: string) => void
 *  - placeholder: string shown when empty
 *  - editable:  boolean, toggles edit mode
 *  - className: extra classes for the wrapper
 */
export default function TipTapEditor({
  value = "",
  onChange,
  placeholder = "Write something...",
  editable = true,
  className = "",
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            rel: "noopener noreferrer nofollow",
            target: "_blank",
          },
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable,
    editorProps: {
      attributes: {
        class: "tiptap-content focus:outline-none min-h-[300px] px-4 py-3 text-white",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // Keep the editor in sync when the external `value` changes (controlled behavior).
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  // Reflect the `editable` prop.
  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  if (!editor) return null;

  return (
    <div className={`tiptap-editor rounded-xl border border-slate-700 bg-slate-900 overflow-hidden ${className}`}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

/* =====================================
   TOOLBAR
   ===================================== */
function Toolbar({ editor }) {
  const btn = (active) =>
    `px-2.5 py-1.5 rounded-md text-sm font-medium transition ${
      active
        ? "bg-cyan-500/20 text-cyan-300"
        : "text-slate-300 hover:bg-white/5 hover:text-white"
    }`;

  const setLink = () => {
    const previous = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-slate-700 bg-slate-950/60 px-2 py-2">
      <button
        type="button"
        className={btn(editor.isActive("bold"))}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        B
      </button>
      <button
        type="button"
        className={btn(editor.isActive("italic"))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <span className="italic">I</span>
      </button>
      <button
        type="button"
        className={btn(editor.isActive("strike"))}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <span className="line-through">S</span>
      </button>
      <button
        type="button"
        className={btn(editor.isActive("underline"))}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline"
      >
        <span className="underline">U</span>
      </button>

      <span className="mx-1 h-5 w-px bg-slate-700" />

      {[1, 2, 3, 4].map((level) => (
        <button
          key={level}
          type="button"
          className={btn(editor.isActive("heading", { level }))}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
          title={`Heading ${level}`}
        >
          H{level}
        </button>
      ))}

      <span className="mx-1 h-5 w-px bg-slate-700" />

      <button
        type="button"
        className={btn(editor.isActive("bulletList"))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        • List
      </button>
      <button
        type="button"
        className={btn(editor.isActive("orderedList"))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Ordered List"
      >
        1. List
      </button>
      <button
        type="button"
        className={btn(editor.isActive("blockquote"))}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Blockquote"
      >
        ❝
      </button>
      <button
        type="button"
        className={btn(editor.isActive("codeBlock"))}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="Code Block"
      >
        {"</>"}
      </button>
      <button
        type="button"
        className={btn(editor.isActive("link"))}
        onClick={setLink}
        title="Link"
      >
        🔗
      </button>
      <button
        type="button"
        className={btn(false)}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        ―
      </button>

      <span className="mx-1 h-5 w-px bg-slate-700" />

      <button
        type="button"
        className={btn(false)}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        ↶
      </button>
      <button
        type="button"
        className={btn(false)}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        ↷
      </button>
    </div>
  );
}