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

  // Base button classes: hover animation, active state, disabled state.
  const btnBase =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-sm font-medium " +
    "transition-all duration-150 ease-out select-none " +
    "hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 " +
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:scale-100";

  const btnState = (active) =>
    active
      ? "bg-cyan-500/20 text-cyan-300 shadow-inner"
      : "text-slate-300";

  const Divider = () => (
    <span className="mx-1 h-6 w-px shrink-0 self-center bg-slate-700" aria-hidden="true" />
  );

  const Btn = ({ onClick, active, disabled, title, children }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`${btnBase} ${btnState(active)}`}
    >
      {children}
    </button>
  );

  return (
    <div className="sticky top-0 z-10 flex items-center gap-0.5 overflow-x-auto border-b border-slate-700 bg-slate-950/80 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
      <Btn
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <span className="text-base leading-none">↶</span>
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <span className="text-base leading-none">↷</span>
      </Btn>

      <Divider />

      <Btn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      >
        <span className="font-bold">B</span>
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      >
        <span className="italic font-serif">I</span>
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Underline"
      >
        <span className="underline">U</span>
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strikethrough"
      >
        <span className="line-through">S</span>
      </Btn>

      <Divider />

      <Btn
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        title="Heading 1"
      >
        H1
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading 2"
      >
        H2
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="Heading 3"
      >
        H3
      </Btn>

      <Divider />

      <Btn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet List"
      >
        <span className="leading-none">•≡</span>
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Ordered List"
      >
        <span className="leading-none">1.≡</span>
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Quote"
      >
        <span className="leading-none">❝</span>
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive("codeBlock")}
        title="Code Block"
      >
        <span className="font-mono text-xs leading-none">{"</>"}</span>
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        <span className="leading-none">―</span>
      </Btn>

      <Divider />

      <Btn
        onClick={setLink}
        active={editor.isActive("link")}
        title="Link"
      >
        <span className="leading-none">🔗</span>
      </Btn>
    </div>
  );
}