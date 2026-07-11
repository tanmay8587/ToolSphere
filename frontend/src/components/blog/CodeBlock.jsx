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

// Import PrismJS styles
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

// Dynamic import for Prism core to avoid SSR issues
let Prism = null;

export default function CodeBlock({ code, language = "plaintext" }) {
  const codeRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [isPrismLoaded, setIsPrismLoaded] = useState(false);

  // Load PrismJS dynamically
  useEffect(() => {
    const loadPrism = async () => {
      if (typeof window !== "undefined" && !Prism) {
        try {
          Prism = (await import("prismjs")).default;
          setIsPrismLoaded(true);
        } catch (error) {
          console.error("Failed to load PrismJS:", error);
        }
      } else if (Prism) {
        setIsPrismLoaded(true);
      }
    };

    loadPrism();
  }, []);

  // Highlight code when Prism is loaded or code changes
  useEffect(() => {
    if (isPrismLoaded && Prism && codeRef.current) {
      try {
        Prism.highlightElement(codeRef.current);
      } catch (error) {
        // If highlighting fails, just show the plain code
        console.error("Prism highlighting error:", error);
      }
    }
  }, [isPrismLoaded, code]);

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
        className="absolute top-2 right-2 bg-[#161b22] border border-[#30363d] text-[#8b949e] px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-[#21262d] hover:text-[#e6edf3] flex items-center gap-1 z-10"
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