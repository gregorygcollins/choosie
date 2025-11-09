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
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        {/* Logo container - simplified speech bubble with checkmark */}
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
          {/* Checkmark */}
          <div style={{
            display: 'flex',
            fontSize: 180,
            color: '#F6EEE5',
            marginTop: -20
          }}>
            ✓
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
