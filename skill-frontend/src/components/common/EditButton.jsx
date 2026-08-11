export default function EditButton({ onClick, disabled, title = "Edit", style }) {
  return (
    <button
      type="button"
      className="resume-btn resume-btn-icon"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={style}
    >
      <i className="fas fa-pencil-alt"></i>
    </button>
  );
}
