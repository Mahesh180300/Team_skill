import { forwardRef } from "react";

const InputField = forwardRef(function InputField(
  {
    label,
    type = "text",
    value,
    onChange,
    onBlur,
    placeholder,
    required = false,
    disabled = false,
    readOnly = false,
    error = "",
    hint = "",
    variant = "default",
    size = "md",
    className = "",
    id,
    name,
    ...props
  },
  ref
) {
  const fieldId = id || name || undefined;
  const sizeClass = size === "sm" ? "field--sm" : size === "lg" ? "field--lg" : "";
  const variantClass = variant !== "default" ? `field--${variant}` : "";

  return (
    <div className={`form-group ${variantClass} ${sizeClass} ${className}`.trim()}>
      {label && (
        <label htmlFor={fieldId}>
          {label}
          {required && <span style={{ color: "var(--danger)" }}> *</span>}
        </label>
      )}
      <input
        ref={ref}
        id={fieldId}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        onChange={onChange}
        onBlur={onBlur}
        className={error ? "input-error" : ""}
        {...props}
      />
      {hint && !error && <div className="field-hint">{hint}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
});

export default InputField;
