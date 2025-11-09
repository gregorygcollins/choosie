import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  const width = 1200;
  const height = 630;
  
  // Fetch the logo SVG
  const logoSvg = await fetch(
    new URL('../../public/logo-check.svg', import.meta.url)
  ).then((res) => res.arrayBuffer());
  
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
        {/* Logo */}
        <img 
          src={`data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`}
          width="280"
          height="280"
          style={{ marginBottom: 40 }}
        />
        
        <div style={{ 
          fontSize: 72, 
          color: '#12130F', 
          fontWeight: 700, 
          letterSpacing: -2,
          marginBottom: 20
        }}>
          Choosie
        </div>
        <div style={{ 
          fontSize: 36, 
          color: '#3A3A38', 
          fontWeight: 400, 
          maxWidth: 900, 
          textAlign: 'center', 
          lineHeight: 1.3 
        }}>
          Do Only What You Love—Together.
        </div>
      </div>
    ),
    { width, height }
  );
}
