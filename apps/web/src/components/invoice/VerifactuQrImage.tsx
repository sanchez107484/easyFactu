'use client';

import { QRCodeSVG } from 'qrcode.react';

interface VerifactuQrImageProps {
  value: string;
  size?: number;
}

export function VerifactuQrImage({ value, size = 96 }: VerifactuQrImageProps) {
  return <QRCodeSVG value={value} size={size} level="M" marginSize={1} />;
}
