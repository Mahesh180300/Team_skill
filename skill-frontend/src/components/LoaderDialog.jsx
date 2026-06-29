export default function LoaderDialog({ message = "Loading..." }) {
  return (
    <div className="loader-dialog-overlay">
      <div className="loader-dialog-box">
        <div className="loader-dialog-spinner" />
        <p className="loader-dialog-text">{message}</p>
      </div>
    </div>
  );
}
