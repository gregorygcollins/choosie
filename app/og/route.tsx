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
          position: 'relative'
        }}>
          {/* Draw checkmark using positioned divs */}
          <div style={{
            display: 'flex',
            position: 'relative',
            width: 160,
            height: 160,
          }}>
            {/* Short stroke of check */}
            <div style={{
              position: 'absolute',
              width: 16,
              height: 70,
              background: '#F6EEE5',
              transform: 'rotate(45deg)',
              left: 35,
              top: 60,
              borderRadius: 8,
            }} />
            {/* Long stroke of check */}
            <div style={{
              position: 'absolute',
              width: 16,
              height: 130,
              background: '#F6EEE5',
              transform: 'rotate(-50deg)',
              left: 50,
              top: 15,
              borderRadius: 8,
            }} />
          </div>
        </div>
        
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
