import type { ReactNode } from 'react';

export interface QRDisplayProps {
  /** Imagem do QR — dataURL (PNG) ou URL. Gerada por quem chama (o DS não gera QR). */
  src: string;
  /** Texto alternativo — inclua o contexto/valor pra leitor de tela (a11y). */
  alt?: string;
  /** Lado do QR em px. Renderize 1:1 com o tamanho gerado pra não borrar. */
  size?: number;
  /** Conteúdo abaixo do QR (ex.: instrução curta). */
  caption?: ReactNode;
  /** Slot entre o QR e a caption (ex.: <CopyField/>). */
  children?: ReactNode;
  className?: string;
}

// Moldura de exibição de QR Code — card branco com quiet zone garantida (contraste e
// leitura ótica), agnóstico de domínio: recebe uma imagem + slots, não sabe o que é.
// O QR SEMPRE em fundo branco sólido, independente do tema (leitores exigem quiet zone).
export function QRDisplay({
  src,
  alt = 'QR Code',
  size = 240,
  caption,
  children,
  className = '',
}: QRDisplayProps) {
  return (
    <div className={['flex flex-col items-center gap-4', className].join(' ')}>
      <div className="rounded-(--radius-card) bg-white p-4 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element -- dataURL, não otimizável */}
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          style={{ width: size, height: size }}
          className="block"
        />
      </div>
      {children}
      {caption && (
        <div className="max-w-xs text-center text-sm text-fg-secondary leading-snug">{caption}</div>
      )}
    </div>
  );
}
