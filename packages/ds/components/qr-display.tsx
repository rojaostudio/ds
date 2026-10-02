import type { ReactNode } from 'react';
import { Card, CardContent } from './card';

export interface QRDisplayProps {
  /** The QR image, a data URL (PNG) or a URL. The caller generates it: the design system does not draw QR codes. */
  src: string;
  /** What the code is, for screen readers ("QR Code do Pix de R$ 50,00"). */
  alt?: string;
  /** The side in px. Render it 1:1 with the generated size, so it does not blur. */
  size?: number;
  /** A short line under the code (an instruction). */
  caption?: ReactNode;
  /** Between the code and the caption, such as a CopyField. */
  children?: ReactNode;
  className?: string;
}

/**
 * QRDisplay — a composition of the Card (Figma [RDS] Content/Card): the QR code centred, what goes with it and a
 * caption. It knows nothing of what the code means. The quiet zone comes with the image: generate it with its
 * white margin (4 modules), because in dark mode the card around it is dark. Styles: qr-display.css.
 */
export function QRDisplay({ src, alt = 'QR Code', size = 240, caption, children, className }: QRDisplayProps) {
  return (
    <Card as="div" className={['rds-qr-display', className].filter(Boolean).join(' ')}>
      <CardContent className="rds-qr-display__content">
        <img className="rds-qr-display__code" src={src} alt={alt} width={size} height={size} />
        {children}
        {caption && <p className="rds-qr-display__caption">{caption}</p>}
      </CardContent>
    </Card>
  );
}
