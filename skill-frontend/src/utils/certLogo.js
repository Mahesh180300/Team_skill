import {
  FaJava, FaAws, FaCertificate, FaCode, FaServer,FaFacebook,
  FaDatabase, FaCloud, FaBug, FaChartBar, FaBrain,
  FaInfinity, FaTasks, FaShieldAlt, FaMicrosoft,
} from "react-icons/fa";
import { SiGooglecloud, SiGoogle } from "react-icons/si";
/**
 * type: "cdn"  → use an <img> from cdn.simpleicons.org  (real SVG logo)
 * type: "icon" → fallback react-icon component
 *
 * For cdn entries, `slug` is the Simple Icons slug (https://simpleicons.org)
 * and `color` is the official brand hex.
 */
const LOGO_MAP = [
  // ── Frontend Frameworks ──────────────────────────────────────────────────
  { keys: ["react"],        type: "cdn", slug: "react",           color: "#61DAFB" },
  { keys: ["angular"],      type: "cdn", slug: "angular",         color: "#DD0031" },
  { keys: ["vue"],          type: "cdn", slug: "vuedotjs",        color: "#42B883" },

  // ── Languages ────────────────────────────────────────────────────────────
  { keys: ["javascript"],   type: "cdn", slug: "javascript",      color: "#F7DF1E" },
  { keys: ["typescript"],   type: "cdn", slug: "typescript",      color: "#3178C6" },
  { keys: ["python"],       type: "cdn", slug: "python",          color: "#3776AB" },
  { keys: ["java"],         type: "cdn", slug: "openjdk",         color: "#ED8B00" },
  { keys: ["html"],         type: "cdn", slug: "html5",           color: "#E34F26" },
  { keys: ["css"],          type: "cdn", slug: "css",            color: "#1572B6" },

  // ── Backend / Runtime ────────────────────────────────────────────────────
  { keys: ["node.js", "nodejs", "node js"], type: "cdn", slug: "nodedotjs",  color: "#339933" },
  { keys: ["express"],      type: "cdn", slug: "express",         color: "#404040" },
  { keys: ["graphql"],      type: "cdn", slug: "graphql",         color: "#E10098" },
  { keys: ["spring"],       type: "cdn", slug: "spring",          color: "#6DB33F" },
  { keys: ["django"],       type: "cdn", slug: "django",          color: "#092E20" },
  { keys: ["flask"],        type: "cdn", slug: "flask",           color: "#404040" },
  { keys: ["laravel"],      type: "cdn", slug: "laravel",         color: "#FF2D20" },
  { keys: [".net", "dotnet", "asp.net"], type: "cdn", slug: "dotnet", color: "#512BD4" },

  // ── Databases ────────────────────────────────────────────────────────────
  { keys: ["mongodb", "mongo"],           type: "cdn", slug: "mongodb",       color: "#47A248" },
  { keys: ["postgresql", "postgres"],     type: "cdn", slug: "postgresql",    color: "#4169E1" },
  { keys: ["mysql"],                      type: "cdn", slug: "mysql",         color: "#4479A1" },
  { keys: ["oracle"],                     type: "cdn", slug: "sioracle",        color: "#F80000" },
  { keys: ["redis"],                      type: "cdn", slug: "redis",         color: "#DC382D" },
  { keys: ["firebase"],                   type: "cdn", slug: "firebase",      color: "#FFCA28" },
  { keys: ["dynamodb", "dynamo"],         type: "cdn", slug: "amazondynamodb",color: "#4053D6" },


 // ── Cloud Providers ────────────────────────────────────────────────
{ keys: ["aws", "amazon web services"], type: "cdn", slug: "amazonwebservices", color: "#FF9900" },
  { keys: ["azure", "microsoft azure"],   type: "icon", icon: FaMicrosoft,        color: "#0078D4" },
  { keys: ["google cloud", "gcp", "gke"], type: "icon", icon: SiGooglecloud,      color: "#4285F4" },
  {
  keys: ["google"],
  type: "icon",
  icon: SiGoogle,
  color: "#4285F4",
},

  // ── DevOps / Infrastructure ──────────────────────────────────────────────
  { keys: ["docker"],                     type: "cdn", slug: "docker",        color: "#2496ED" },
  { keys: ["kubernetes", "k8s"],          type: "cdn", slug: "kubernetes",    color: "#326CE5" },
  { keys: ["jenkins"],                    type: "cdn", slug: "jenkins",       color: "#D33833" },
  { keys: ["gitlab"],                     type: "cdn", slug: "gitlab",        color: "#FC6D26" },
  { keys: ["terraform"],                  type: "cdn", slug: "terraform",     color: "#7B42BC" },
  { keys: ["linux"],                      type: "cdn", slug: "linux",         color: "#FCC624" },
  { keys: ["github"],                     type: "cdn", slug: "github",        color: "#181717" },
  { keys: ["git"],                        type: "cdn", slug: "git",           color: "#F05032" },

  // ── Testing ──────────────────────────────────────────────────────────────
  { keys: ["cypress"],                    type: "cdn", slug: "cypress",       color: "#17202C" },
  { keys: ["selenium"],                   type: "cdn", slug: "selenium",      color: "#43B02A" },
  { keys: ["istqb"],                      type: "icon", icon: FaBug,          color: "#6366f1" },

  // ── Security ─────────────────────────────────────────────────────────────
  { keys: ["owasp"],                      type: "cdn", slug: "owasp",         color: "#000000" },
  { keys: ["comptia", "security+", "network+", "a+"], type: "cdn", slug: "comptia", color: "#C8202F" },
  { keys: ["ceh", "ec-council"],          type: "icon", icon: FaShieldAlt,    color: "#C8202F" },
  { keys: ["cissp", "isc2"],              type: "icon", icon: FaShieldAlt,    color: "#005A8E" },

  // ── Analytics / BI ───────────────────────────────────────────────────────
  // ── Analytics / BI ───────────────────────────────────────────────────────
  { keys: ["power bi", "powerbi"], type: "cdn", slug: "microsoftpowerbi", color: "#F2C811" },
  { keys: ["tableau"],             type: "cdn", slug: "tableau",          color: "#E97627" },

  // ── AI / ML ──────────────────────────────────────────────────────────────
  { keys: ["tensorflow"],                 type: "cdn", slug: "tensorflow",    color: "#FF6F00" },
  { keys: ["openai"],                     type: "cdn", slug: "openai",        color: "#412991" },

  // ── Vendors / Orgs ───────────────────────────────────────────────────────
  { keys: ["ibm"],                        type: "icon", icon: FaServer,       color: "#1F70C1" },
  { keys: ["meta"],                       type: "icon", icon: FaFacebook,     color: "#0082FB" },
  { keys: ["microsoft"],                  type: "icon", icon: FaMicrosoft,    color: "#618ee2" },

  // ── Agile / PM ───────────────────────────────────────────────────────────
  { keys: ["scrum", "psm", "csm", "safe"], type: "cdn", slug: "scrumalliance", color: "#009FDA" },
  { keys: ["pmp", "pmi"],                  type: "icon", icon: FaTasks,        color: "#003087" },
  { keys: ["itil", "peoplecert"],          type: "icon", icon: FaCertificate,  color: "#6B21A8" },

  // ── Generic categories (keep at bottom so specific matches win) ──────────
  { keys: ["full stack", "fullstack"],     type: "icon", icon: FaCode,         color: "#6366f1" },
  { keys: ["frontend", "front-end", "front end"], type: "icon", icon: FaCode,  color: "#E34F26" },
  { keys: ["backend", "back-end", "back end"],    type: "icon", icon: FaServer, color: "#64748b" },
  { keys: ["data analytics", "data analysis"],    type: "icon", icon: FaChartBar, color: "#0EA5E9" },
  { keys: ["machine learning", "deep learning"],  type: "icon", icon: FaBrain,  color: "#8B5CF6" },
  { keys: ["devops"],                      type: "icon", icon: FaInfinity,     color: "#0EA5E9" },
  { keys: ["agile", "project management"], type: "icon", icon: FaTasks,        color: "#10B981" },
  { keys: ["database", "sql"],             type: "icon", icon: FaDatabase,     color: "#64748b" },
  { keys: ["cloud"],                       type: "icon", icon: FaCloud,        color: "#38BDF8" },
  { keys: ["testing", "qa"],               type: "icon", icon: FaBug,          color: "#F59E0B" },
];

/**
 * Returns logo info for a certification name.
 *
 * Returns one of:
 *   { type: "cdn",  slug: string, color: string }
 *   { type: "icon", icon: ReactComponent, color: string }
 */
export function getCertificationLogo(certName = "") {
  const lower = certName.toLowerCase();
  const match = LOGO_MAP.find((entry) =>
    entry.keys.some((k) => lower.includes(k))
  );
  return match ?? { type: "icon", icon: FaCertificate, color: "#6366f1" };
}
