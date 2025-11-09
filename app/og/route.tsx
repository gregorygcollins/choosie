import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  const width = 1200;
  const height = 630;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F6EEE5',
        }}
      >
        {/* Logo - dark rounded square with custom checkmark */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 280,
          height: 280,
          background: '#12130F',
          borderRadius: 70,
          marginBottom: 40,
          position: 'relative',
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)'
        }}>
          {/* Draw checkmark using positioned divs */}
          <div style={{ position: 'relative', width: 160, height: 160 }}>
            {/* Short stroke */}
            <div style={{
              position: 'absolute',
              width: 18,
              height: 80,
              background: '#F6EEE5',
              transform: 'rotate(45deg)',
              left: 32,
              top: 62,
              borderRadius: 10,
            }} />
            {/* Long stroke */}
            <div style={{
              position: 'absolute',
              width: 18,
              height: 145,
              background: '#F6EEE5',
              transform: 'rotate(-50deg)',
              left: 54,
              top: 10,
              borderRadius: 10,
            }} />
          </div>
        </div>

        <div style={{
          fontSize: 72,
          color: '#12130F',
          fontWeight: 700,
          letterSpacing: -2,
          marginBottom: 16,
        }}>
          Choosie
        </div>
        <div style={{
          fontSize: 36,
          color: '#3A3A38',
          fontWeight: 400,
          maxWidth: 900,
          textAlign: 'center',
          lineHeight: 1.3,
        }}>
          Do Only What You Love—Together.
        </div>
      </div>
    ),
    { width, height }
  );
}
