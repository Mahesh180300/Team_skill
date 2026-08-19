import { useLocation, useNavigate } from "react-router-dom";

const CRUMB_MAP = {
  "/profile":        [{ label: "My profile",path: "/profile"  }, {label: " Dashboard" }],
  "/skills":         [{ label: "My Profile", path: "/profile" }, { label: "My Skills" }],
  "/certifications": [{ label: "My Profile", path: "/profile" }, { label: "My Certifications" }],
  "/documents":      [{ label: "My Profile", path: "/profile" }, { label: "My Documents" }],
  "/employees":      [{ label: "Dashboard", path: "/dashboard" }, { label: "Employee Management" }],
  "/employees/:id":  [{ label: "Dashboard", path: "/dashboard" }, { label: "Employee Management", path: "/employees" }, { label: "Employee Details" }],
  "/lookup":         [{ label: "Dashboard", path: "/dashboard" }, { label: "Master Data" }],
};

function resolveCrumbs(pathname) {
  if (CRUMB_MAP[pathname]) return CRUMB_MAP[pathname];
  if (/^\/employees\/[^/]+$/.test(pathname)) return CRUMB_MAP["/employees/:id"];
  return null;
}

export default function Breadcrumb({ action }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const crumbs = resolveCrumbs(pathname);
  if (!crumbs) return null;

  return (
    <div className="breadcrumb-bar">
      <nav className="breadcrumb" aria-label="breadcrumb">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={i} style={{ display: "contents" }}>
              {i > 0 && <span className="breadcrumb-sep">›</span>}
              {crumb.path && !isLast ? (
                <button className="breadcrumb-item breadcrumb-link" onClick={() => navigate(crumb.path)}>
                  {crumb.label}
                </button>
              ) : (
                <span className="breadcrumb-item breadcrumb-current">{crumb.label}</span>
              )}
            </span>
          );
        })}
      </nav>
      {action && <div className="breadcrumb-action">{action}</div>}
    </div>
  );
}
