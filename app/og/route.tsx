import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(req: Request) {
  const width = 1200;
  const height = 630;
  const origin = new URL(req.url).origin;
  const logoUrl = `${origin}/choosie-logo-badge.png`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 56,
          padding: '72px 88px',
          background: '#F8F9FF',
        }}
      >
        <img
          src={logoUrl}
          width={300}
          height={312}
          alt="Choosie"
          style={{
            objectFit: 'contain',
            filter: 'drop-shadow(0 14px 36px rgba(26, 54, 93, 0.18))',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 680 }}>
          <div style={{ fontSize: 76, color: '#1A365D', fontWeight: 800, lineHeight: 1 }}>
            Choosie
          </div>
          <div style={{ marginTop: 22, fontSize: 38, color: '#31445F', fontWeight: 500, lineHeight: 1.25 }}>
            Do Only What You Love, Together.
          </div>
          <div style={{ marginTop: 28, fontSize: 28, color: '#00AFA3', fontWeight: 700 }}>
            Turn reluctant consensus into passionate overlap.
          </div>
        </div>
      </div>
    ),
    { width, height }
  );
}
