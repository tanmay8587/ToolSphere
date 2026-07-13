import { useState, useRef } from "react";
import { FiX, FiAlertCircle } from "react-icons/fi";

export default function TagInput({ 
  label, 
  placeholder, 
  value = [], 
  onChange,
  maxTags = 20,
  error: externalError,
}) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);
  const [error, setError] = useState("");

  const tags = Array.isArray(value) ? value : [];

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setError("Please enter a tag");
      return;
    }
    if (tags.length >= maxTags) {
      setError(`Maximum ${maxTags} tags allowed`);
      return;
    }
    const lowerTag = trimmed.toLowerCase();
    if (tags.includes(lowerTag)) {
      setError("This tag already exists");
      return;
    }

    onChange([...tags, lowerTag]);
    setInputValue("");
    setError("");
  };

  const removeTag = (index) => {
    const newTags = tags.filter((_, i) => i !== index);
    onChange(newTags);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    
    // Split by comma, newline, or semicolon
    const newTags = pastedText
      .split(/[,;\n]+/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    
    if (newTags.length === 0) return;
    
    // Check max tags limit
    const availableSlots = maxTags - tags.length;
    if (availableSlots <= 0) {
      setError(`Maximum ${maxTags} tags allowed`);
      return;
    }
    
    // Add tags, checking for duplicates (case-insensitive)
    const tagsLower = tags.map((t) => t.toLowerCase());
    const uniqueNewTags = [];
    
    for (const tag of newTags) {
      if (uniqueNewTags.length >= availableSlots) break;
      
      const lowerTag = tag.toLowerCase();
      if (!tagsLower.includes(lowerTag) && !uniqueNewTags.some((t) => t.toLowerCase() === lowerTag)) {
        uniqueNewTags.push(tag);
      }
    }
    
    if (uniqueNewTags.length > 0) {
      onChange([...tags, ...uniqueNewTags]);
      setInputValue("");
      setError("");
      
      // Show feedback if some tags were duplicates
      if (uniqueNewTags.length < newTags.length) {
        const duplicateCount = newTags.length - uniqueNewTags.length;
        if (uniqueNewTags.length === 0) {
          setError("All tags already exist");
        } else {
          setError(`Added ${uniqueNewTags.length} tags (${duplicateCount} duplicate${duplicateCount > 1 ? 's' : ''} skipped)`);
        }
      }
    } else {
      setError("All tags already exist");
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm text-slate-300">
          {label}
          {tags.length > 0 && (
            <span className="ml-2 text-xs text-slate-500">
              ({tags.length}/{maxTags})
            </span>
          )}
        </label>
      </div>
      
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 focus-within:border-cyan-500">
        {tags.map((tag, index) => (
          <div
            key={index}
            className="flex items-center gap-1.5 rounded-full bg-cyan-500/20 px-2.5 py-1 text-sm text-cyan-300 transition hover:bg-cyan-500/30"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="text-cyan-400 hover:text-red-400"
              aria-label={`Remove tag "${tag}"`}
              title="Remove tag"
            >
              <FiX className="h-3 w-3" />
            </button>
          </div>
        ))}
        
         <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (error) setError("");
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? placeholder : ""}
          disabled={tags.length >= maxTags}
          className="min-w-[120px] flex-1 border-none bg-transparent text-white outline-none placeholder:text-slate-500 disabled:opacity-50"
        />
      </div>

      {(error || externalError) && (
        <p className="flex items-center gap-1.5 text-xs text-red-400">
          <FiAlertCircle size={14} />
          {error || externalError}
        </p>
      )}

      {tags.length === 0 && !error && (
        <p className="text-xs text-slate-500">
          Type and press Enter or comma to add tags. You can also paste multiple tags separated by commas, semicolons, or newlines.
        </p>
      )}
    </div>
  );
}