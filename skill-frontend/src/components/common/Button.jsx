export default function Button({
  variant = "primary",
  size = "base",
  onClick,
  children,
  icon,
  disabled,
  loading = false,
  type = "button",
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      className={`btn-common btn-variant-${variant} btn-size-${size}${className ? ` ${className}` : ""}`}
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
