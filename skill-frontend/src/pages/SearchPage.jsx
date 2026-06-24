import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import LoaderDialog from "../components/LoaderDialog";
import { useApi } from "../hooks/useApi";

const LEVEL_COLOR = { Beginner: "badge-beginner", Intermediate: "badge-intermediate", Advanced: "badge-advanced" };

export default function SearchPage() {
  const { token } = useAuth();
  const [filters, setFilters] = useState({ skill: "", department: "", minExp: "", certification: "" });
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const callSearch = useApi(setLoading);

  const search = async (e) => {
    e.preventDefault();
    await callSearch(async () => {
      const data = await api.searchEmployees(token, filters);
      setResults(Array.isArray(data) ? data : []);
      setSearched(true);
    });
  };

  const set = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <>
      {loading && <LoaderDialog message="Searching employees..." />}
      <div className="page">
      <div className="page-header"><h2>Skill-Based Search</h2></div>
      <div className="card form-card">
        <form onSubmit={search}>
          <div className="filter-grid">
            <div className="form-group">
              <label>Skill</label>
              <input name="skill" placeholder="e.g. React, Node.js, AWS" value={filters.skill} onChange={set} disabled={loading} />
            </div>
            <div className="form-group">
              <label>Departments</label>
              <input name="department" placeholder="e.g. Engineering" value={filters.department} onChange={set} disabled={loading} />
            </div>
            <div className="form-group">
              <label>Min. Experience (years)</label>
              <input name="minExp" type="number" min="0" placeholder="e.g. 2" value={filters.minExp} onChange={set} disabled={loading} />
            </div>
            <div className="form-group">
              <label>Certification</label>
              <input name="certification" placeholder="e.g. AWS Certified" value={filters.certification} onChange={set} disabled={loading} />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Searching..." : "Search Employees"}</button>
        </form>
      </div>

      {searched && (
        <div className="results-section">
          <h3>{results.length} employee{results.length !== 1 ? "s" : ""} found</h3>
          {results.length === 0 ? (
            <div className="empty">No employees match the search criteria.</div>
          ) : (
            <div className="employee-list">
              {results.map((emp) => (
                <div key={emp._id} className="employee-card">
                  <div className="emp-header" onClick={() => setExpanded(expanded === emp._id ? null : emp._id)}>
                    <div className="emp-avatar">{emp.name?.charAt(0).toUpperCase()}</div>
                    <div className="emp-info">
                      <div className="emp-name">{emp.name}</div>
                      <div className="emp-meta">
                        {emp.jobTitle && <span>{emp.jobTitle}</span>}
                        {emp.department && <span className="sep">•</span>}
                        {emp.department && <span>{emp.department}</span>}
                        {emp.yearsOfExperience > 0 && <span className="sep">•</span>}
                        {emp.yearsOfExperience > 0 && <span>{emp.yearsOfExperience} yrs exp</span>}
                      </div>
                    </div>
                    <div className="emp-counts">
                      <span>{emp.skills?.length || 0} skills</span>
                      <span>{emp.certifications?.length || 0} certs</span>
                    </div>
                    <span className="expand-icon">{expanded === emp._id ? "▲" : "▼"}</span>
                  </div>
                  {expanded === emp._id && (
                    <div className="emp-details">
                      {emp.skills?.length > 0 && (
                        <div className="detail-section">
                          <h4>Skills</h4>
                          <div className="skills-inline">
                            {emp.skills.map((s) => (
                              <span key={s._id} className={`badge ${LEVEL_COLOR[s.proficiency]}`}>
                                {s.name} · {s.proficiency}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {emp.certifications?.length > 0 && (
                        <div className="detail-section">
                          <h4>Certifications</h4>
                          <div className="certs-inline">
                            {emp.certifications.map((c) => (
                              <span key={c._id} className="badge badge-cert">🏆 {c.name}{c.issuer ? ` (${c.issuer})` : ""}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
