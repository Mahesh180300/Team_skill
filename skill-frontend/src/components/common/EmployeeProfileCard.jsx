function calcDuration(dateStr) {
  if (!dateStr) return "";
  const start = new Date(dateStr);
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (months < 0) return "";
  const yrs = Math.floor(months / 12);
  const mo = months % 12;
  if (yrs === 0) return `${mo}mo`;
  if (mo === 0) return `${yrs}yr`;
  return `${yrs}yr ${mo}mo`;
}

export default function EmployeeProfileCard({ emp, onEmailClick }) {
  const name = emp.firstName && emp.lastName ? `${emp.firstName} ${emp.lastName}` : emp.name;
  const initials = (emp.firstName || emp.name)?.charAt(0).toUpperCase();

  return (
    <div className="epc-card" 
    >
      
      {/* Left navy section */}
      <div className="epc-left">
        <div className="epc-dots" />
        <div className="epc-avatar-wrap">
          <div className="epc-avatar">
            {emp.avatar
              ? <img src={emp.avatar} alt={name} />
              : initials}
          </div>
        </div>
      </div>

      {/* Right content section */}
      <div className="epc-right">
        <div className="epc-name">{name}</div>
        {emp.jobTitle && <div className="epc-title">{emp.jobTitle}</div>}
        <div className="epc-meta-row">
          {emp.department && (
            <>
              <span className="epc-meta-item">
               <i class="fa-solid fa-briefcase"></i>
                Department : {emp.department}
              </span>
              <span className="epc-sep" />
            </>
          )}
          {emp.email && (
            <>
              <span className="epc-meta-item">
               
                 <i className="fa-solid fa-envelope"></i>
                {emp.email}
              </span>
              {emp.location && <span className="epc-sep" />}
            </>
          )}
          {/* {emp.location && (
            <span className="epc-meta-item">
              <svg className="epc-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 1.5C5.79 1.5 4 3.29 4 5.5C4 8.5 8 14.5 8 14.5C8 14.5 12 8.5 12 5.5C12 3.29 10.21 1.5 8 1.5Z" stroke="currentColor" strokeWidth="1.4"/>
                <circle cx="8" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              {emp.location}
            </span>
          )} */}
          {/* {!emp.location && (
            <span className="epc-meta-item">
              <svg className="epc-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 1.5C5.79 1.5 4 3.29 4 5.5C4 8.5 8 14.5 8 14.5C8 14.5 12 8.5 12 5.5C12 3.29 10.21 1.5 8 1.5Z" stroke="currentColor" strokeWidth="1.4"/>
                <circle cx="8" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              Chennai, India
            </span>
          )} */}
        </div>
      </div>

      <div className="emp-counts" style={{ marginRight: 25 }}>
        <span>{emp.skills?.length || 0} skills</span>
        <span>{emp.certifications?.length || 0} certs</span>
        {emp.dateOfJoining && <span>{calcDuration(emp.dateOfJoining)} exp</span>}
        {emp.billable === "yes" && <span style={{ color: "#22c55e" }}>Billable</span>}
        {emp.billable === "no" && <span style={{ color: "#f59e0b" }}>Non-Billable</span>}
        {onEmailClick && (
          <button className="resume-btn resume-btn-icon" style={{ border: "none", background: "none",fontSize: "20px" }} onClick={onEmailClick} title="Send Onboarding Email">
            <i style={{ color: "#43a1d8" }} className="fas fa-envelope"></i>
          </button>
        )}
      </div>
      

    </div>
  );
}
