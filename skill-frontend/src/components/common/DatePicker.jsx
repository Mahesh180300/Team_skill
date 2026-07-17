import { forwardRef } from "react";
import InputField from "./InputField";

const DatePicker = forwardRef(function DatePicker(
  {
    label,
    value,
    onChange,
    onBlur,
    placeholder,
    required = false,
    disabled = false,
    min,
    max,
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
  return (
    <InputField
      ref={ref}
      id={id}
      name={name}
      type="date"
      label={label}
      value={value || ""}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      min={min}
      max={max}
      error={error}
      hint={hint}
      variant={variant}
      size={size}
      className={className}
      {...props}
    />
  );
});

export default DatePicker;
