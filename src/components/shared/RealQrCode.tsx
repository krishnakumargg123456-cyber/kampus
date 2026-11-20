import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface RealQrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export const RealQrCode: React.FC<RealQrCodeProps> = ({
  value,
  size = 168,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    QRCode.toCanvas(
      canvas,
      value,
      {
        width: size,
        margin: 2,
        color: {
          dark: '#172033',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      },
      () => {
        // rendered cleanly
      }
    );
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      aria-label="Scannable QR Verification Code"
      className={`rounded-lg bg-white ${className}`}
    />
  );
};
