export default function ConfirmDialog({ icon, title, message, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel, danger = true }) {
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-icon-wrap ${danger ? "confirm-icon-danger" : "confirm-icon-primary"}`}>
          <span>{icon}</span>
        </div>
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn-cancel" onClick={onCancel}>{cancelText}</button>
          <button className={`confirm-btn-ok ${danger ? "confirm-btn-danger" : "confirm-btn-primary"}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
