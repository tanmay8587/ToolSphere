import { useEffect, useRef, useState } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";

/**
 * CodeBlock component for rendering fenced code blocks with syntax highlighting
 * 
 * Features:
 * - Syntax highlighting using PrismJS
 * - Copy to clipboard functionality
 * - Language label display
 * - Responsive design
 */

// Import PrismJS core FIRST so the global `Prism` object exists before the
// language component files (which reference the global `Prism`) are evaluated.
import Prism from "prismjs";

// Import a PrismJS theme (dark, matches the site's GitHub-dark code surface).
import "prismjs/themes/prism-tomorrow.css";

// Import PrismJS language definitions (these attach to the global Prism object)
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-graphql";

export default function CodeBlock({ code, language = "plaintext" }) {
  const codeRef = useRef(null);
  const highlightedRef = useRef(false);
  const [copied, setCopied] = useState(false);

  // Highlight the code block only after it has been rendered into the DOM.
  // Guard with a ref so the effect never highlights the same element twice
  // (e.g. under React StrictMode's double-invoked effects).
  useEffect(() => {
    const el = codeRef.current;
    if (!el || highlightedRef.current) return;

    try {
      Prism.highlightElement(el);
      highlightedRef.current = true;
    } catch (error) {
      // If highlighting fails, just show the plain code
      console.error("Prism highlighting error:", error);
    }
  }, [code]);

  // Reset the guard when the code content changes so it can be re-highlighted.
  useEffect(() => {
    highlightedRef.current = false;
  }, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  return (
    <div className="relative group">
      {/* Language label */}
      <span className="absolute top-0 right-0 bg-[#161b22] text-[#8b949e] text-xs px-3 py-1 border-b-left-radius border-top-right-radius font-mono uppercase tracking-wider z-10">
        {language}
      </span>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 bg-[#161b22] border border-[#30363d] text-[#8b949e] px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 hover:bg-[#21262d] hover:text-[#e6edf3] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 flex items-center gap-1 z-10"
        aria-label="Copy code to clipboard"
      >
        {copied ? (
          <>
            <FiCheck size={12} />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <FiCopy size={12} />
            <span>Copy</span>
          </>
        )}
      </button>

      {/* Code block */}
      <pre className="!mt-8 !mr-0">
        <code ref={codeRef} className={`language-${language}`}>
          {code}
        </code>
      </pre>
    </div>
  );
}