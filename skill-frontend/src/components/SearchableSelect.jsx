import { useState, useRef, useEffect } from "react";

/**
 * SearchableSelect
 * Props:
 *   value        – current selected value (string)
 *   onChange     – (value: string) => void
 *   options      – array of { id, value } OR array of strings
 *   placeholder  – string shown when nothing is selected
 *   disabled     – boolean
 */
export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  // Normalise options to { id, label } shape
  const normalised = options.map((o) =>
    typeof o === "string" ? { id: o, label: o } : { id: o.id ?? o.value, label: o.value ?? o.label ?? o.id }
  );

  const filtered = normalised.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  const selectedLabel =
    normalised.find((o) => o.label === value || o.id === value)?.label || "";

  const handleSelect = (label) => {
    onChange(label);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  return (
    <div
      className={`ss-container${disabled ? " ss-disabled" : ""}`}
      ref={containerRef}
    >
      {/* Trigger */}
      <div
        className={`ss-trigger${open ? " ss-trigger--open" : ""}`}
        onClick={() => !disabled && setOpen((v) => !v)}
      >
        <span className={`ss-trigger-text${!selectedLabel ? " ss-placeholder" : ""}`}>
          {selectedLabel || placeholder}
        </span>
        <span className="ss-trigger-icons">
          {selectedLabel && !disabled && (
            <span className="ss-clear" onMouseDown={handleClear}>✕</span>
          )}
          <span className="ss-arrow">{open ? "▲" : "▼"}</span>
        </span>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="ss-dropdown">
          <div className="ss-search-wrap">
            <input
              ref={searchRef}
              className="ss-search"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
            />
          </div>
          <div className="ss-list">
            {/* Empty / clear option */}
            <div
              className={`ss-option ss-option-empty${!value ? " ss-option--selected" : ""}`}
              onMouseDown={() => handleSelect("")}
            >
              {placeholder}
            </div>
            {filtered.length === 0 ? (
              <div className="ss-no-results">No results found</div>
            ) : (
              filtered.map((o) => (
                <div
                  key={o.id}
                  className={`ss-option${o.label === value ? " ss-option--selected" : ""}`}
                  onMouseDown={() => handleSelect(o.label)}
                >
                  {o.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
