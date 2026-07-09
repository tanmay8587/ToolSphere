import { useState, useRef } from "react";
import { FiPlus, FiX, FiAlertCircle } from "react-icons/fi";

export default function DynamicList({ 
  label, 
  placeholder, 
  value = [], 
  onChange,
  minItems = 0,
  maxItems = 20,
  renderItem = null,
  error: externalError,
}) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);
  const [error, setError] = useState("");

  const items = Array.isArray(value) ? value : [];

  const addItem = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setError("Please enter a value");
      return;
    }
    if (items.length >= maxItems) {
      setError(`Maximum ${maxItems} items allowed`);
      return;
    }
    if (items.includes(trimmed)) {
      setError("This item already exists");
      return;
    }

    onChange([...items, trimmed]);
    setInputValue("");
    setError("");
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
    if (e.key === "Backspace" && !inputValue && items.length > 0) {
      removeItem(items.length - 1);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addItem();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm text-slate-300">
          {label}
          {items.length > 0 && (
            <span className="ml-2 text-xs text-slate-500">
              ({items.length}/{maxItems})
            </span>
          )}
        </label>
      </div>
      
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (error) setError("");
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={items.length >= maxItems}
          className={`
            flex-1 rounded-xl border px-4 py-2.5 text-white placeholder:text-slate-500 outline-none transition
            ${error || externalError ? "border-red-500 focus:border-red-500" : "border-slate-700 focus:border-cyan-500"}
            bg-slate-900 disabled:opacity-50
          `}
        />
        <button
          type="button"
          onClick={addItem}
          disabled={!inputValue.trim() || items.length >= maxItems}
          className="rounded-xl bg-cyan-500 px-4 py-2.5 text-white transition hover:bg-cyan-600 disabled:opacity-50"
          title="Add item"
        >
          <FiPlus className="h-4 w-4" />
        </button>
      </div>

      {(error || externalError) && (
        <p className="flex items-center gap-1.5 text-xs text-red-400">
          <FiAlertCircle size={14} />
          {error || externalError}
        </p>
      )}

      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => 
            renderItem ? (
              renderItem(item, index, removeItem)
            ) : (
              <div
                key={index}
                className="flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-700"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-slate-400 hover:text-red-400"
                  title="Remove"
                >
                  <FiX className="h-3 w-3" />
                </button>
              </div>
            )
          )}
        </div>
      )}

      {items.length === 0 && !error && (
        <p className="text-xs text-slate-500">
          Add items using the input above. Press Enter or click + to add.
        </p>
      )}
    </div>
  );
}