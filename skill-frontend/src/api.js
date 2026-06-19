const BASE = "http://localhost:5009/api";

const headers = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const api = {
  // Auth
  register: (data) =>
    fetch(`${BASE}/auth/register`, { method: "POST", headers: headers(), body: JSON.stringify(data) }).then((r) => r.json()),
  login: (data) =>
    fetch(`${BASE}/auth/login`, { method: "POST", headers: headers(), body: JSON.stringify(data) }).then((r) => r.json()),
  me: (token) =>
    fetch(`${BASE}/auth/me`, { headers: headers(token) }).then((r) => r.json()),

  forgotPassword: (email) =>
    fetch(`${BASE}/auth/forgot-password`, { method: "POST", headers: headers(), body: JSON.stringify({ email }) }).then((r) => r.json()),
  verifyOtp: (email, otp) =>
    fetch(`${BASE}/auth/verify-otp`, { method: "POST", headers: headers(), body: JSON.stringify({ email, otp }) }).then((r) => r.json()),
  resetPassword: (email, otp, password) =>
    fetch(`${BASE}/auth/reset-password`, { method: "POST", headers: headers(), body: JSON.stringify({ email, otp, password }) }).then((r) => r.json()),

  // Profile
  getProfile: (token) =>
    fetch(`${BASE}/profile`, { headers: headers(token) }).then((r) => r.json()),
  updateProfile: (token, data) =>
    fetch(`${BASE}/profile`, { method: "PUT", headers: headers(token), body: JSON.stringify(data) }).then((r) => r.json()),
  uploadAvatar: (token, file) => {
    const fd = new FormData();
    fd.append("avatar", file);
    return fetch(`${BASE}/profile/avatar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    }).then((r) => r.json());
  },
  deleteAvatar: (token) =>
    fetch(`${BASE}/profile/avatar`, { method: "DELETE", headers: headers(token) }).then((r) => r.json()),

  // Skills
  addSkill: (token, data) =>
    fetch(`${BASE}/profile/skills`, { method: "POST", headers: headers(token), body: JSON.stringify(data) }).then((r) => r.json()),
  updateSkill: (token, skillId, data) =>
    fetch(`${BASE}/profile/skills/${skillId}`, { method: "PUT", headers: headers(token), body: JSON.stringify(data) }).then((r) => r.json()),
  deleteSkill: (token, skillId) =>
    fetch(`${BASE}/profile/skills/${skillId}`, { method: "DELETE", headers: headers(token) }).then((r) => r.json()),

  // Certifications
  addCert: (token, data, file) => {
    const fd = new FormData();
    fd.append("name", data.name);
    if (data.issuer) fd.append("issuer", data.issuer);
    if (data.year) fd.append("year", data.year);
    if (file) fd.append("file", file);
    return fetch(`${BASE}/profile/certifications`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    }).then((r) => r.json());
  },
  editCert: (token, certId, data, file) => {
    const fd = new FormData();
    fd.append("name", data.name);
    if (data.issuer) fd.append("issuer", data.issuer);
    if (data.year) fd.append("year", data.year);
    if (file) fd.append("file", file);
    return fetch(`${BASE}/profile/certifications/${certId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    }).then((r) => r.json());
  },
  deleteCert: (token, certId) =>
    fetch(`${BASE}/profile/certifications/${certId}`, { method: "DELETE", headers: headers(token) }).then((r) => r.json()),

  // Search & Filter
  searchEmployees: (token, params) => {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v))).toString();
    return fetch(`${BASE}/employees?${qs}`, { headers: headers(token) }).then((r) => r.json());
  },

  // Resume
  uploadResume: (token, file) => {
    const fd = new FormData();
    fd.append("resume", file);
    return fetch(`${BASE}/profile/resume`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd }).then((r) => r.json());
  },
  deleteResume: (token) =>
    fetch(`${BASE}/profile/resume`, { method: "DELETE", headers: headers(token) }).then((r) => r.json()),

  // Admin
  getStats: (token) =>
    fetch(`${BASE}/admin/stats`, { headers: headers(token) }).then((r) => r.json()),
  getAdminEmployees: (token) =>
    fetch(`${BASE}/admin/employees`, { headers: headers(token) }).then((r) => r.json()),
  deleteEmployee: (token, id) =>
    fetch(`${BASE}/admin/employees/${id}`, { method: "DELETE", headers: headers(token) }).then((r) => (r.status === 204 ? {} : r.json())),
  seedAdmin: () =>
    fetch(`${BASE}/admin/seed-admin`, { method: "POST", headers: headers() }).then((r) => r.json()),
};

export default api;
