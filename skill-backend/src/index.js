require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const multer = require("multer");

const fs = require("fs");
const path = require("path");
const multer = require("multer");
const app = express();
app.use(cors());
app.use(express.json());

// ── Multer config (memory storage — no local folder needed) ───────────────────
const ALLOWED_TYPES = { "application/pdf": true, "image/jpeg": true, "image/png": true };

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES[file.mimetype]) cb(null, true);
    else cb(new Error("Only PDF, JPG, JPEG, and PNG files are allowed"));
  },
});

const JWT_SECRET = process.env.JWT_SECRET || "kyyba_skill_jwt_secret_dev";

// ── MongoDB Connection ────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/kyyba_skill_tracker")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ── Schemas & Models ──────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["employee", "admin"], default: "employee" },
    department: { type: String, trim: true, default: "" },
    jobTitle: { type: String, trim: true, default: "" },
    yearsOfExperience: { type: Number, default: 0 },
    profileImage: { type: String, default: "" },
    skills: [
      {
        name: { type: String, required: true, trim: true },
        proficiency: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], required: true },
        yearsUsed: { type: Number, default: 0 },
      },
    ],
    certifications: [
      {
        name: { type: String, required: true, trim: true },
        issuer: { type: String, trim: true, default: "" },
        year: { type: Number },
        fileData: { type: String, default: null },
        fileType: { type: String, default: null },
        fileName: { type: String, default: null },
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// ── Auth Middleware ───────────────────────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
    next();
  });
};

// ── Auth Routes ───────────────────────────────────────────────────────────────
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, department, jobTitle, yearsOfExperience } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Name, email and password required" });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, department, jobTitle, yearsOfExperience });
    const payload = { id: user._id, name: user.name, email: user.email, role: user.role };
    res.status(201).json({ token: jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" }), user: payload });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: "Email already exists" });
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: "Invalid credentials" });
  const payload = { id: user._id, name: user.name, email: user.email, role: user.role };
  res.json({ token: jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" }), user: payload });
});

app.get("/api/auth/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
});

// ── Employee Profile ──────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 4 * 1024 * 1024 },
});

const removeProfileImageFile = (imageUrl) => {
  if (!imageUrl) return;
  const filename = path.basename(imageUrl);
  const filePath = path.join(uploadsDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

app.get("/api/profile", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
});

app.put("/api/profile", auth, async (req, res) => {
  const { name, department, jobTitle, yearsOfExperience } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name, department, jobTitle, yearsOfExperience },
    { new: true }
  ).select("-password");
  res.json(user);
});

app.post("/api/profile/image", auth, upload.single("profileImage"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Profile image required" });

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  removeProfileImageFile(user.profileImage);
  user.profileImage = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  await user.save();
  const responseUser = user.toObject();
  delete responseUser.password;
  res.json(responseUser);
});

app.delete("/api/profile/image", auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  removeProfileImageFile(user.profileImage);
  user.profileImage = "";
  await user.save();
  const responseUser = user.toObject();
  delete responseUser.password;
  res.json(responseUser);
});

// ── Skills ────────────────────────────────────────────────────────────────────
app.post("/api/profile/skills", auth, async (req, res) => {
  const { name, proficiency, yearsUsed } = req.body;
  if (!name || !proficiency) return res.status(400).json({ error: "Skill name and proficiency required" });
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $push: { skills: { name, proficiency, yearsUsed: yearsUsed || 0 } } },
    { new: true }
  ).select("-password");
  res.json(user);
});

app.put("/api/profile/skills/:skillId", auth, async (req, res) => {
  const { name, proficiency, yearsUsed } = req.body;
  const user = await User.findOneAndUpdate(
    { _id: req.user.id, "skills._id": req.params.skillId },
    { $set: { "skills.$.name": name, "skills.$.proficiency": proficiency, "skills.$.yearsUsed": yearsUsed } },
    { new: true }
  ).select("-password");
  if (!user) return res.status(404).json({ error: "Skill not found" });
  res.json(user);
});

app.delete("/api/profile/skills/:skillId", auth, async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $pull: { skills: { _id: req.params.skillId } } },
    { new: true }
  ).select("-password");
  res.json(user);
});

// ── Certifications ────────────────────────────────────────────────────────────
app.post("/api/profile/certifications", auth, upload.single("file"), async (req, res) => {
  try {
    const { name, issuer, year } = req.body;
    if (!name) return res.status(400).json({ error: "Certification name required" });
    const fileData = req.file ? req.file.buffer.toString("base64") : null;
    const fileType = req.file ? req.file.mimetype : null;
    const fileName = req.file ? req.file.originalname : null;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { certifications: { name, issuer, year: year ? Number(year) : undefined, fileData, fileType, fileName } } },
      { new: true }
    ).select("-password");
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch("/api/profile/certifications/:certId", auth, upload.single("file"), async (req, res) => {
  try {
    const { name, issuer, year } = req.body;
    if (!name) return res.status(400).json({ error: "Certification name required" });
    const user = await User.findOne({ _id: req.user.id, "certifications._id": req.params.certId });
    if (!user) return res.status(404).json({ error: "Certification not found" });
    const cert = user.certifications.id(req.params.certId);
    cert.name = name;
    cert.issuer = issuer || "";
    cert.year = year ? Number(year) : undefined;
    if (req.file) {
      cert.fileData = req.file.buffer.toString("base64");
      cert.fileType = req.file.mimetype;
      cert.fileName = req.file.originalname;
    }
    await user.save();
    const updated = await User.findById(req.user.id).select("-password");
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/profile/certifications/:certId", auth, async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $pull: { certifications: { _id: req.params.certId } } },
    { new: true }
  ).select("-password");
  res.json(user);
});

// ── Skill Search & Filters (Admin/Manager) ────────────────────────────────────
app.get("/api/employees", auth, async (req, res) => {
  const { skill, department, minExp, certification } = req.query;
  const query = { role: "employee" };

  if (skill) query["skills.name"] = { $regex: skill, $options: "i" };
  if (department) query.department = { $regex: department, $options: "i" };
  if (minExp) query.yearsOfExperience = { $gte: Number(minExp) };
  if (certification) query["certifications.name"] = { $regex: certification, $options: "i" };

  const employees = await User.find(query).select("-password");
  res.json(employees);
});

// ── Admin: Dashboard Stats ────────────────────────────────────────────────────
app.get("/api/admin/stats", adminAuth, async (req, res) => {
  const totalEmployees = await User.countDocuments({ role: "employee" });

  // Aggregate all skills across employees
  const skillAgg = await User.aggregate([
    { $match: { role: "employee" } },
    { $unwind: "$skills" },
    { $group: { _id: "$skills.name", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  // Department-wise skill distribution
  const deptAgg = await User.aggregate([
    { $match: { role: "employee", department: { $ne: "" } } },
    { $group: { _id: "$department", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Employees with no skills (skill gap indicator)
  const noSkillsCount = await User.countDocuments({ role: "employee", skills: { $size: 0 } });

  res.json({
    totalEmployees,
    topSkills: skillAgg,
    departmentDistribution: deptAgg,
    skillGapCount: noSkillsCount,
  });
});

// Admin: all employees management
app.get("/api/admin/employees", adminAuth, async (req, res) => {
  const employees = await User.find({ role: "employee" }).select("-password").sort({ createdAt: -1 });
  res.json(employees);
});

app.delete("/api/admin/employees/:id", adminAuth, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

// Seed admin (dev only)
app.post("/api/admin/seed-admin", async (req, res) => {
  const exists = await User.findOne({ role: "admin" });
  if (exists) return res.json({ message: "Admin already exists" });
  const hashed = await bcrypt.hash("admin123", 10);
  await User.create({ name: "Admin", email: "admin@kyyba.com", password: hashed, role: "admin" });
  res.json({ message: "Admin created: admin@kyyba.com / admin123" });
});

const PORT = process.env.PORT || 5009;
app.listen(PORT, () => console.log(`Skill Tracker server running on http://localhost:${PORT}`));

// Global error handler (return JSON for multer and other errors)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err && err.message ? err.message : err);
  if (err && err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File too large (max 4MB)' });
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: err?.message || 'Server error' });
});
