export default function Loader({ fullScreen = false, message = "Loading..." }) {
  return (
    <div className={`loader-wrapper ${fullScreen ? "loader-fullscreen" : "loader-inline"}`}>
      <div className="loader-spinner"></div>
      <p className="loader-text">{message}</p>
    </div>
  );
}

export function BtnSpinner() {
  return <span className="btn-spinner" />;
}
