import { ImageResponse } from 'next/og';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#111',
        color: '#fff',
        width: '100%',
        height: '100%',
        fontSize: 115,
        fontWeight: 600,
        letterSpacing: -14,
        paddingRight: 12,
      }}
    >
      tm
    </div>,
    size,
  );
}
