export default function Button({
  variant = "primary",
  size = "base",
  active = false,
  onClick,
  children,
  icon,
  disabled,
  loading = false,
  type = "button",
  className = "",
  ...props
}) {
  const activeClass = active ? " btn-active" : "";
  return (
    <button
      type={type}
      className={`btn-common btn-variant-${variant} btn-size-${size}${activeClass}${className ? ` ${className}` : ""}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="btn-spinner" />}
      {!loading && icon && <span>{icon}</span>}
      {children}
    </button>
  );
}
