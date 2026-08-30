import type { SVGProps } from 'react';

// Símbolo oficial do Pix (Banco Central), monocromático — herda a cor via currentColor
// pra casar com os demais ícones de método de pagamento. Três paths: chevron superior,
// chevron inferior e a barra central (braços esquerdo+direito). Use a versão colorida
// só em contexto de marca; aqui é ícone de UI.
export function PixIcon({ size = 16, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="currentColor"
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
