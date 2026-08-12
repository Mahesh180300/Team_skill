const BASE = import.meta.env.VITE_API_URL || "http://localhost:5009/api";

const safeJson = (r) => r.json().then((data) => { if (!r.ok) throw new Error(data?.message || r.statusText); return data; });

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
  bulkAddSkills: (token, skills) =>
    fetch(`${BASE}/profile/skills/bulk`, { method: "POST", headers: headers(token), body: JSON.stringify({ skills }) }).then((r) => r.json()),
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
    if (data.issuedOn) fd.append("issuedOn", data.issuedOn);
    if (data.expiryDate) fd.append("expiryDate", data.expiryDate);
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
    if (data.issuedOn) fd.append("issuedOn", data.issuedOn);
    if (data.expiryDate) fd.append("expiryDate", data.expiryDate);
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
  updateEmployee: (token, id, data) =>
    fetch(`${BASE}/admin/employees/${id}`, { method: 'PATCH', headers: headers(token), body: JSON.stringify(data) }).then((r) => r.json()),
  deleteEmployee: (token, id) =>
    fetch(`${BASE}/admin/employees/${id}`, { method: "DELETE", headers: headers(token) }).then((r) => (r.status === 204 ? {} : r.json())),
  getAdmins: (token) =>
    fetch(`${BASE}/admin/admins`, { headers: headers(token) }).then((r) => r.json()),
  createAdmin: (token, data) =>
    fetch(`${BASE}/admin/admins`, { method: "POST", headers: headers(token), body: JSON.stringify(data) }).then((r) => r.json()),
  sendOnboardingEmail: (token, id, data) =>
    fetch(`${BASE}/admin/employees/${id}/send-onboarding-email`, { method: "POST", headers: headers(token), body: JSON.stringify(data) }).then((r) => r.json()),
  seedAdmin: () =>
    fetch(`${BASE}/admin/seed-admin`, { method: "POST", headers: headers() }).then((r) => r.json()),

  // Chat
  getChatContacts: (token) =>
    fetch(`${BASE}/chat/contacts`, { headers: headers(token) }).then(safeJson),
  getChatMessages: (token, otherUserId) =>
    fetch(`${BASE}/chat/messages/${encodeURIComponent(otherUserId)}`, { headers: headers(token) }).then(safeJson),
  sendChatMessage: (token, data) =>
    fetch(`${BASE}/chat/messages`, { method: 'POST', headers: headers(token), body: JSON.stringify(data) }).then(safeJson),
  markChatRead: (token, otherUserId) =>
    fetch(`${BASE}/chat/read/${encodeURIComponent(otherUserId)}`, { method: 'PATCH', headers: headers(token) }).then(safeJson),
  updateChatMessage: (token, messageId, content) =>
    fetch(`${BASE}/chat/messages/${encodeURIComponent(messageId)}`, { method: 'PATCH', headers: headers(token), body: JSON.stringify({ content }) }).then(safeJson),
  deleteChatMessage: (token, messageId) =>
    fetch(`${BASE}/chat/messages/${encodeURIComponent(messageId)}`, { method: 'DELETE', headers: headers(token) }).then(safeJson),

  getChatUnreadCount: (token) =>
    fetch(`${BASE}/chat/unread`, { headers: headers(token) }).then(safeJson),

  updateLastSeen: (token) =>
    fetch(`${BASE}/profile/last-seen`, { method: 'PATCH', headers: headers(token) }).then((r) => r.json()),


  // Lookup
  getLookupValues: (type) =>
    fetch(`${BASE}/lookup/values?type=${encodeURIComponent(type)}`).then((r) => r.json()),
  getCertificationOptions: (token) =>
  fetch(`${BASE}/profile/certifications/options`, {
    headers: headers(token),
  }).then(safeJson),
  getCertStats: (token) =>
    fetch(`${BASE}/profile/certifications/stats`, { headers: headers(token) }).then(safeJson),
  getAllLookupTypes: (token) =>
    fetch(`${BASE}/lookup/types`, { headers: headers(token) }).then((r) => r.json()),
  createLookupType: (token, name) =>
    fetch(`${BASE}/lookup/types`, { method: 'POST', headers: headers(token), body: JSON.stringify({ name }) }).then((r) => r.json()),
  updateLookupType: (token, id, name) =>
    fetch(`${BASE}/lookup/types/${id}`, { method: 'PATCH', headers: headers(token), body: JSON.stringify({ name }) }).then((r) => r.json()),
  deleteLookupType: (token, id) =>
    fetch(`${BASE}/lookup/types/${id}`, { method: 'DELETE', headers: headers(token) }).then((r) => (r.ok ? {} : r.json())),
  createLookupValue: (token, typeId, value) =>
    fetch(`${BASE}/lookup/types/${typeId}/values`, { method: 'POST', headers: headers(token), body: JSON.stringify({ value }) }).then((r) => r.json()),
  updateLookupValue: (token, id, value) =>
    fetch(`${BASE}/lookup/values/${id}`, { method: 'PATCH', headers: headers(token), body: JSON.stringify({ value }) }).then((r) => r.json()),
  deleteLookupValue: (token, id) =>
    fetch(`${BASE}/lookup/values/${id}`, { method: 'DELETE', headers: headers(token) }).then((r) => (r.ok ? {} : r.json())),
};

export default api;
