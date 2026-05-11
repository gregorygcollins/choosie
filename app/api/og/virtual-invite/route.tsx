import { ImageResponse } from "next/og";

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const title = truncate(searchParams.get("title") || "Choosie list", 58);
  const posters = searchParams.getAll("poster").slice(0, 8);
  const logoUrl = `${origin}/choosie-logo-badge.png`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          padding: "58px 72px",
          background: "#F8F9FF",
          color: "#1A365D",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <img src={logoUrl} width={62} height={62} alt="Choosie" style={{ objectFit: "contain" }} />
          <div style={{ fontSize: 30, fontWeight: 850, letterSpacing: 11, textTransform: "uppercase" }}>
            TIME TO CHOOSIE.
          </div>
        </div>

        <div style={{ maxWidth: 1020, textAlign: "center", fontSize: 76, fontWeight: 900, lineHeight: 1 }}>
          {title}
        </div>

        <div
          style={{
            position: "relative",
            width: 900,
            height: 230,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {posters.length > 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              {posters.map((poster, index) => {
                const offset = index - (posters.length - 1) / 2;
                const isCenter = Math.abs(offset) < 1;
                return (
                  <img
                    key={poster}
                    src={poster}
                    width={132}
                    height={198}
                    alt=""
                    style={{
                      objectFit: "cover",
                      borderRadius: 14,
                      border: "5px solid white",
                      boxShadow: "0 18px 36px rgba(26, 54, 93, 0.22)",
                      marginLeft: index === 0 ? 0 : -12,
                      transform: `translateY(${Math.abs(offset) * 5}px) scale(${isCenter ? 1.06 : 1})`,
                      zIndex: 20 - Math.abs(offset),
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <div
              style={{
                width: 320,
                height: 190,
                borderRadius: 34,
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 24px 48px rgba(26, 54, 93, 0.16)",
              }}
            >
              <img src={logoUrl} width={160} height={160} alt="Choosie" style={{ objectFit: "contain" }} />
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#00AFA3", fontSize: 26, fontWeight: 850 }}>
          <span>Curator</span>
          <span style={{ color: "#8EA0B8" }}>→</span>
          <span>Editor</span>
          <span style={{ color: "#8EA0B8" }}>→</span>
          <span>Programmer</span>
          <span style={{ color: "#8EA0B8" }}>→</span>
          <span>Selector</span>
          <span style={{ color: "#8EA0B8" }}>→</span>
          <span>Decider</span>
        </div>

        <div
          style={{
            borderRadius: 999,
            background: "#00D1C1",
            color: "#102A43",
            padding: "15px 28px",
            fontSize: 28,
            fontWeight: 900,
            boxShadow: "0 14px 30px rgba(0, 209, 193, 0.30)",
          }}
        >
          Choose your role
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
