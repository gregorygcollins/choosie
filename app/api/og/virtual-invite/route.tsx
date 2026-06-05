import { ImageResponse } from "next/og";

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const title = truncate(searchParams.get("title") || "Choosie list", 42);
  const description = "Turn reluctant agreement into enthusiastic overlap!";
  const posters = searchParams.getAll("poster").slice(0, 5);
  const logoUrl = `${origin}/choosie-logo-badge.png`;
  const roles = ["Curator", "Editor", "Programmer", "Selector", "Decider"];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          alignItems: "center",
          justifyContent: "center",
          padding: "76px 84px",
          background: "#F8F9FF",
          color: "#1A365D",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(255,255,255,0.92), rgba(243,247,255,0.72))",
          }}
        />

        <div style={{ position: "relative", display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", width: 600, flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <img src={logoUrl} width={70} height={70} alt="Choosie" style={{ objectFit: "contain" }} />
              <div style={{ fontSize: 23, fontWeight: 500, letterSpacing: 12, textTransform: "uppercase" }}>
                CHOOSIE INVITE
              </div>
            </div>

            <div style={{ marginTop: 54, fontSize: 62, fontWeight: 650, lineHeight: 1.05, letterSpacing: -1 }}>
              {title}
            </div>

            <div style={{ marginTop: 20, width: 560, color: "#29466d", fontSize: 32, fontWeight: 420, lineHeight: 1.15 }}>
              {description}
            </div>

            <div style={{ marginTop: 38, display: "flex", alignItems: "center", gap: 12, color: "#00AFA3", fontSize: 20, fontWeight: 520 }}>
              {roles.map((role, index) => (
                <div key={role} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span>{role}</span>
                  {index < roles.length - 1 && <span style={{ color: "#8EA0B8" }}>→</span>}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              position: "relative",
              width: 410,
              height: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 70,
                top: 122,
                width: 270,
                height: 160,
                borderRadius: 80,
                background: "rgba(26,54,93,0.13)",
                boxShadow: "0 28px 58px rgba(26,54,93,0.18)",
              }}
            />
            {posters.length > 0 ? (
              posters.map((poster, index) => {
                const rotations = [-14, -7, 0, 8, 15];
                const x = [16, 78, 140, 202, 264][index] || 140;
                const y = [70, 48, 35, 48, 72][index] || 45;
                return (
                  <img
                    key={poster}
                    src={poster}
                    width={145}
                    height={218}
                    alt=""
                    style={{
                      position: "absolute",
                      left: x,
                      top: y,
                      objectFit: "cover",
                      borderRadius: 16,
                      border: "7px solid white",
                      boxShadow: "0 18px 34px rgba(26, 54, 93, 0.24)",
                      transform: `rotate(${rotations[index] || 0}deg)`,
                      zIndex: 10 + index,
                    }}
                  />
                );
              })
            ) : (
              <div
                style={{
                  width: 250,
                  height: 170,
                  borderRadius: 28,
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 24px 48px rgba(26, 54, 93, 0.16)",
                }}
              >
                <img src={logoUrl} width={130} height={130} alt="Choosie" style={{ objectFit: "contain" }} />
              </div>
            )}
            <div
              style={{
                position: "absolute",
                right: 4,
                bottom: 36,
                borderRadius: 999,
                background: "#00D1C1",
                color: "#102A43",
                padding: "16px 30px",
                fontSize: 24,
                fontWeight: 750,
                boxShadow: "0 18px 28px rgba(0, 209, 193, 0.28)",
                zIndex: 30,
              }}
            >
              Narrow virtually
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
