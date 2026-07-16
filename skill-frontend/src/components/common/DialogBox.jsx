import { useEffect } from "react";

export default function DialogBox({
  isOpen,
  onClose,
  title,
  children,
  footer,
  width = 560,
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = "",
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16 }}
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        className={className}
        style={{ background: "var(--card-bg,#fff)", borderRadius: 14, width: "100%", maxWidth: width, maxHeight: "calc(100vh - 32px)", display: "flex", flexDirection: "column", boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          {showCloseButton && (
            <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", lineHeight: 1, color: "var(--text-muted)" }}>✕</button>
          )}
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px" }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{ display: "flex", gap: 10, padding: "16px 24px", borderTop: "1px solid var(--border)", justifyContent: "flex-end", flexShrink: 0 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
