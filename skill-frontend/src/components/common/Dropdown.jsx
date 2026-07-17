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
  const ref = useRef(null);

  const selected = options.find((o) => (typeof o === "object" ? o.value : o) === value);
  const label = selected ? (typeof selected === "object" ? selected.label : selected) : placeholder;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (val) => {
    onChange({ target: { name, value: val } });
    setOpen(false);
  };

  return (
    <div ref={ref} className={`dropdown-common-wrap${className ? ` ${className}` : ""}`} {...props}>
      <button
        type="button"
        className={`dropdown-common${disabled ? " dropdown-common--disabled" : ""}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
      >
        <span className={value ? "" : "dropdown-placeholder"}>{label}</span>
      </button>
      {open && (
        <ul className="dropdown-options">
          <li className="dropdown-option" onClick={() => handleSelect("")}>
            {placeholder}
          </li>
          {options.map((opt) => {
            const val = typeof opt === "object" ? opt.value : opt;
            const lbl = typeof opt === "object" ? opt.label : opt;
            return (
              <li
                key={val}
                className={`dropdown-option${val === value ? " dropdown-option--selected" : ""}`}
                onClick={() => handleSelect(val)}
              >
                {lbl}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
