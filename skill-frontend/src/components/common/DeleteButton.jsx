export default function DeleteButton({ onClick, disabled, title = "Delete" }) {
  return (
    <button
      type="button"
      className="resume-btn resume-btn-icon resume-btn-icon-danger"
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      <i className="fas fa-trash"></i>
    </button>
  );
}
