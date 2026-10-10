import type { SVGProps } from 'react';

export interface PixIconProps extends SVGProps<SVGSVGElement> {
  /** Width and height in px. Default 16. */
  size?: number;
}

/**
 * The Pix symbol (Banco Central do Brasil) as a line icon, as Figma [RDS] Icons icon/finance/pix (08/10): its outline
 * in a 1.5 stroke at 24 (2 closes the symbol's gaps), the shape 18 wide with 3 around it, in currentColor, so it sits
 * with the other line icons wherever they get recoloured. Decorative by default (aria-hidden); name it with
 * aria-label and role="img" when it stands alone. The filled, coloured symbol belongs to brand contexts, not to UI.
 */
export function PixIcon({ size = 16, ...props }: PixIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-85.33 -85.33 682.67 682.67"
      fill="none"
      stroke="currentColor"
      strokeWidth={42.67}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path d="M242.4 292.5c5.4-5.4 14.7-5.4 20.1 0l77 77c14.2 14.2 33.1 22 53.1 22h15.1l-97.1 97.1c-30.3 30.3-79.5 30.3-109.8 0L103.3 391.2h9.3c20 0 38.9-7.8 53.1-22l76.7-76.7z" />
      <path d="M262.5 218.9c-5.4 5.4-14.7 5.4-20.1 0l-76.7-76.7c-14.2-14.2-33.1-22-53.1-22h-9.3l97.4-97.4c30.3-30.3 79.5-30.3 109.8 0l97.1 97.1h-15.1c-20 0-38.9 7.8-53.1 22l-77 77z" />
      <path d="M112.6 142.7c13.8 0 27.4 5.6 37.2 15.4l76.7 76.7c7.3 7.3 17 10.9 26.6 10.9s19.3-3.6 26.6-10.9l77-77c9.8-9.8 23.4-15.4 37.2-15.4h37.2l58.4 58.4c30.3 30.3 30.3 79.5 0 109.8l-58.4 58.4h-37.2c-13.8 0-27.4-5.6-37.2-15.4l-77-77c-14.2-14.2-39-14.2-53.2 0l-76.7 76.7c-9.8 9.8-23.4 15.4-37.2 15.4H75.4L17 310.7c-30.3-30.3-30.3-79.5 0-109.8l58.4-58.4h37.2z" />
    </svg>
  );
}
