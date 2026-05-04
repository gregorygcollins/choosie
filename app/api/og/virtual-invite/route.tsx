import { ImageResponse } from "next/og";

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const title = truncate(searchParams.get("title") || "Choosie movie list", 58);
  const posters = searchParams.getAll("poster").slice(0, 5);
  const logoUrl = `${origin}/choosie-logo-badge.png`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 52,
          padding: "70px 82px",
          background: "#F8F9FF",
          color: "#1A365D",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 610 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <img src={logoUrl} width={74} height={74} alt="Choosie" style={{ objectFit: "contain" }} />
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: 6, textTransform: "uppercase" }}>
              Choosie invite
            </div>
          </div>
          <div style={{ marginTop: 42, fontSize: 64, fontWeight: 850, lineHeight: 1.03 }}>
            {title}
          </div>
          <div style={{ marginTop: 28, fontSize: 31, color: "#31445F", lineHeight: 1.22 }}>
            Claim a role and help narrow the list to one movie.
          </div>
          <div style={{ marginTop: 34, display: "flex", alignItems: "center", gap: 10, color: "#00AFA3", fontSize: 22, fontWeight: 800 }}>
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
        </div>

        <div
          style={{
            position: "relative",
            width: 390,
            height: 420,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {posters.length > 0 ? (
            posters.map((poster, index) => {
              const offset = index - (posters.length - 1) / 2;
              return (
                <img
                  key={poster}
                  src={poster}
                  width={170}
                  height={255}
                  alt=""
                  style={{
                    position: "absolute",
                    objectFit: "cover",
                    borderRadius: 22,
                    border: "8px solid white",
                    boxShadow: "0 24px 48px rgba(26, 54, 93, 0.22)",
                    transform: `translateX(${offset * 48}px) translateY(${Math.abs(offset) * 18}px) rotate(${offset * 7}deg)`,
                    zIndex: 10 + index,
                  }}
                />
              );
            })
          ) : (
            <div
              style={{
                width: 320,
                height: 320,
                borderRadius: 52,
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 24px 48px rgba(26, 54, 93, 0.16)",
              }}
            >
              <img src={logoUrl} width={210} height={210} alt="Choosie" style={{ objectFit: "contain" }} />
            </div>
          )}
          <div
            style={{
              position: "absolute",
              right: 12,
              bottom: 12,
              borderRadius: 999,
              background: "#00D1C1",
              color: "#102A43",
              padding: "14px 22px",
              fontSize: 25,
              fontWeight: 850,
              zIndex: 30,
              boxShadow: "0 14px 30px rgba(0, 209, 193, 0.30)",
            }}
          >
            Narrow virtually
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
