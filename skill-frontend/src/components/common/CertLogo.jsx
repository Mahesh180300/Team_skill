import { useState } from "react";
import { getCertificationLogo } from "../../utils/certLogo";
import { FaCertificate } from "react-icons/fa";

/**
 * Renders the real official brand logo for a certification name.
 *
 * - Known brands: fetched as SVG from cdn.simpleicons.org (real logos, original colors)
 * - Unknown / generic: react-icon fallback with category color
 *
 * Props:
 *   name  – certification name string
 *   size  – logo size in px (default 38)
 */
export default function CertLogo({ name = "", size = 38 }) {
  const logo = getCertificationLogo(name);
  const [imgError, setImgError] = useState(false);

  if (logo.type === "cdn" && !imgError) {
    return (
      <img
        src={`https://cdn.simpleicons.org/${logo.slug}`}
        alt={name}
        width={size}
        height={size}
        style={{ objectFit: "contain", flexShrink: 0 }}
        onError={() => setImgError(true)}
      />
    );
  }

  // react-icon fallback (also used when CDN image fails to load)
  const Icon = logo.type === "icon" ? logo.icon : FaCertificate;
  const color = logo.color ?? "#6366f1";
  return <Icon style={{ color, fontSize: size, flexShrink: 0 }} />;
}
