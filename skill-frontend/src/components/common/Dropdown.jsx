import { useState, useRef, useEffect } from "react";

export default function Dropdown({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  name,
  disabled = false,
  className = "",
  ...props
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  const selected = options.find(
    (o) => (typeof o === "object" ? o.value : o) === value
  );

  const label = selected
    ? typeof selected === "object"
      ? selected.label
      : selected
    : placeholder;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (val) => {
    onChange({ target: { name, value: val } });
    setOpen(false);
    setSearch("");
  };

  // Filter options
  const filteredOptions = options.filter((opt) => {
    const lbl = typeof opt === "object" ? opt.label : opt;
    return lbl.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div
      ref={ref}
      className={`dropdown-common-wrap${className ? ` ${className}` : ""}`}
      {...props}
    >
      <button
        type="button"
        className={`dropdown-common${disabled ? " dropdown-common--disabled" : ""}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
      >
        <span className={value ? "" : "dropdown-placeholder"}>
          {label}
        </span>
      </button>

      {open && (
        <div className="dropdown-options">
          {/* Search input */}
          <div className="dropdown-search">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <ul className="dropdown-options-list">
            <li
              className="dropdown-option"
              onClick={() => handleSelect("")}
            >
              {placeholder}
            </li>

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const val = typeof opt === "object" ? opt.value : opt;
                const lbl = typeof opt === "object" ? opt.label : opt;

                return (
                  <li
                    key={val}
                    className={`dropdown-option${
                      val === value ? " dropdown-option--selected" : ""
                    }`}
                    onClick={() => handleSelect(val)}
                  >
                    {lbl}
                  </li>
                );
              })
            ) : (
              <li className="dropdown-option dropdown-option--empty">
                No results found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}