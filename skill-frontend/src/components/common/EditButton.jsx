export default function EditButton({ onClick, disabled, title = "Edit" }) {
  return (
    <button
      type="button"
      className="resume-btn resume-btn-icon"
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      <i className="fas fa-pencil-alt"></i>
    </button>
  );
}
