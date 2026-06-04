import { ImageResponse } from "next/og";

export const runtime = "edge";

function moduleColors(module: string) {
  const key = module.toLowerCase();
  if (key === "food") return { bg: "#ECFDF5", accent: "#047857", soft: "#A7F3D0" };
  if (key === "anything") return { bg: "#FFF1F2", accent: "#BE123C", soft: "#FFE4E6" };
  if (key === "books") return { bg: "#EFF6FF", accent: "#1D4ED8", soft: "#DBEAFE" };
  if (key === "music") return { bg: "#F5F3FF", accent: "#6D28D9", soft: "#EDE9FE" };
  return { bg: "#F0FDFA", accent: "#0F766E", soft: "#CCFBF1" };
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1).trim()}...` : value;
}

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const title = truncate(searchParams.get("title") || "Shared Choosie list", 58);
  const moduleName = truncate(searchParams.get("module") || "List", 18);
  const count = searchParams.get("count") || "0";
  const items = truncate(searchParams.get("items") || "", 96);
  const colors = moduleColors(moduleName);
  const logoUrl = `${origin}/choosie-logo-badge.png`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 72,
          background: "#F8F9FF",
          color: "#1A365D",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRadius: 34,
            background: colors.bg,
            border: `2px solid ${colors.soft}`,
            padding: 54,
            boxShadow: "0 24px 70px rgba(26, 54, 93, 0.16)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <img src={logoUrl} width={74} height={74} alt="Choosie" style={{ objectFit: "contain" }} />
              <div style={{ fontSize: 32, fontWeight: 800, color: "#0878B8" }}>Choosie</div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: 999,
                background: "#FFFFFF",
                color: colors.accent,
                padding: "12px 22px",
                fontSize: 26,
                fontWeight: 800,
              }}
            >
              {moduleName}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ fontSize: 76, lineHeight: 1.02, fontWeight: 850, letterSpacing: 0 }}>
              {title}
            </div>
            <div style={{ display: "flex", color: "#4B5563", fontSize: 32, fontWeight: 650 }}>
              {count} {Number(count) === 1 ? "item" : "items"}
              {items ? ` - ${items}` : ""}
            </div>
          </div>

          <div style={{ display: "flex", color: colors.accent, fontSize: 28, fontWeight: 800 }}>
            Open the shared list
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
