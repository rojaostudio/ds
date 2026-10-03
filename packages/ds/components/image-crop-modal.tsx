'use client';

import { useEffect, useRef, useState } from 'react';
import ReactCrop, { centerCrop, type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Alert } from './alert';
import { Button } from './button';
import { Dialog } from './dialog';
import { RectangleHorizontalIcon, RectangleVerticalIcon, SquareDashedIcon, SquareIcon } from './internal/icons';
import { Spinner } from './spinner';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';

/**
 * ImageCropModal — Figma [RDS] Overlays/ImageCropModal: a composition of the Dialog, a ToggleGroup (the aspect
 * presets), the Alert (an aspect out of bounds) and the Spinner: crops an image before upload. Needs
 * `react-image-crop` (an optional peer, needed only here). The crop's shade, line and handles and the stage's
 * background are its own tokens (Overlays, image-crop-modal/*). Styles: image-crop-modal.css.
 *
 * Uso:
 *   <ImageCropModal
 *     open={open}
 *     file={selectedFile}
 *     onCancel={() => setOpen(false)}
 *     onConfirm={(blob) => uploadCroppedImage(blob)}
 *   />
 *
 * Presets default: Livre (1:2 a 2:1), 1:1, 4:5, 16:9.
 * Customize via prop `presets`.
 */

export interface CropPreset {
  id:      string;
  label:   string;
  /** Aspect ratio fixo. undefined = livre (com bounds MIN/MAX_ASPECT). */
  aspect?: number;
  /** Ícone opcional exibido antes do rótulo (ajuda quem não decodifica "16:9"). */
  icon?:   React.ReactNode;
}

// Ordem: proporções primeiro (1:1 é o default), Livre por último — a maioria dos lojistas
// não decodifica "1:1/4:5/16:9", então o padrão nasce numa proporção segura.
const DEFAULT_PRESETS: CropPreset[] = [
  { id: 'square',    label: '1:1',  aspect: 1,      icon: <SquareIcon /> },
  { id: 'portrait',  label: '4:5',  aspect: 4 / 5,  icon: <RectangleVerticalIcon /> },
  { id: 'landscape', label: '16:9', aspect: 16 / 9, icon: <RectangleHorizontalIcon /> },
  { id: 'free',      label: 'Livre',                icon: <SquareDashedIcon /> },
];

const DEFAULT_MIN_ASPECT = 0.5;
const DEFAULT_MAX_ASPECT = 2.0;

export interface ImageCropModalProps {
  open:        boolean;
  file:        File | null;
  /** Label de contexto pro título (ex: "Foto 2 de 4"). */
  position?:   string;
  onCancel:    () => void;
  /**
   * Recebe o blob do recorte. Pode ser assíncrono (ex.: upload) — o modal AGUARDA a promise
   * e mantém o botão travado/carregando até resolver, evitando duplo-clique que duplicaria a
   * imagem (o upload roda fora do `busy` se o modal não esperar).
   */
  onConfirm:   (blob: Blob) => void | Promise<void>;
  /** Presets disponíveis. default = Livre + 1:1 + 4:5 + 16:9. */
  presets?:    CropPreset[];
  /** Limite mínimo de aspect ratio (alto-baixo). default = 0.5 (1:2). */
  minAspect?:  number;
  /** Limite máximo de aspect ratio (largo-baixo). default = 2.0 (2:1). */
  maxAspect?:  number;
  /** Título do modal. default = "Ajustar foto". */
  title?:      string;
  /** Label do botão confirmar. default = "Aplicar e enviar". */
  confirmLabel?: string;
  /**
   * Teto de tamanho do blob de saída (bytes). Quando definido, a saída do crop
   * é forçada a JPEG e comprimida (qualidade + downscale) até caber no limite —
   * evita que foto de celular grande estoure o limite de upload. Sem ele, a
   * saída mantém o tipo original e qualidade fixa (comportamento inalterado).
   */
  maxSizeBytes?: number;
}

// Crop inicial no MAIOR tamanho possível respeitando a proporção: calcula qual eixo limita
// (largura ou altura) e ocupa 100% dele, centralizado. Sem proporção (livre), pega a imagem
// inteira. As alças ficam pegáveis porque o container tem padding (letterbox ao redor).
function buildInitialCrop(width: number, height: number, aspect?: number): Crop {
  if (!aspect) {
    return { unit: '%', x: 0, y: 0, width: 100, height: 100 };
  }
  const imageAspect = width / height;
  let cropW: number;
  let cropH: number;
  if (aspect >= imageAspect) {
    // recorte mais largo (ou igual) que a imagem → largura limita
    cropW = 100;
    cropH = (imageAspect / aspect) * 100;
  } else {
    // recorte mais alto que a imagem → altura limita
    cropH = 100;
    cropW = (aspect / imageAspect) * 100;
  }
  return centerCrop({ unit: '%', x: 0, y: 0, width: cropW, height: cropH }, width, height);
}

// Passos progressivos usados quando o crop precisa caber em maxSizeBytes.
// Foto de celular grande estoura o limite de upload na qualidade fixa 0.92 —
// então baixamos a qualidade JPEG primeiro e, se ainda grande, reduzimos o lado
// máximo do canvas. Paramos assim que o blob fica ≤ maxSizeBytes (evita
// recomprimir além do necessário e perder qualidade à toa).
const QUALITY_STEPS = [0.85, 0.75, 0.65, 0.55];
const MAX_SIDE_STEPS = [1600, 1200];

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('toBlob failed')), mimeType, quality);
  });
}

// Desenha o recorte num canvas com um teto de lado máximo (downscale proporcional).
function drawCrop(image: HTMLImageElement, crop: PixelCrop, maxSide?: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  let outW = Math.round(crop.width * scaleX);
  let outH = Math.round(crop.height * scaleY);
  if (maxSide && Math.max(outW, outH) > maxSide) {
    const ratio = maxSide / Math.max(outW, outH);
    outW = Math.round(outW * ratio);
    outH = Math.round(outH * ratio);
  }
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(
    image,
    crop.x * scaleX, crop.y * scaleY,
    crop.width * scaleX, crop.height * scaleY,
    0, 0, outW, outH,
  );
  return canvas;
}

async function cropToBlob(
  image: HTMLImageElement,
  crop: PixelCrop,
  mimeType: string,
  maxSizeBytes?: number,
): Promise<Blob> {
  const baseCanvas = drawCrop(image, crop);

  // Sem teto de tamanho: comportamento original (qualidade fixa 0.92).
  if (!maxSizeBytes) {
    return canvasToBlob(baseCanvas, mimeType, 0.92);
  }

  // Com teto: força JPEG (melhor razão tamanho/qualidade) e comprime em passos.
  const out = await canvasToBlob(baseCanvas, 'image/jpeg', 0.92);
  if (out.size <= maxSizeBytes) return out;

  // Passo 1 — reduz só a qualidade, mantendo a resolução do crop.
  let best = out;
  for (const q of QUALITY_STEPS) {
    const candidate = await canvasToBlob(baseCanvas, 'image/jpeg', q);
    best = candidate;
    if (candidate.size <= maxSizeBytes) return candidate;
  }

  // Passo 2 — ainda grande: faz downscale do canvas e varre a qualidade de novo.
  for (const side of MAX_SIDE_STEPS) {
    const scaledCanvas = drawCrop(image, crop, side);
    for (const q of QUALITY_STEPS) {
      const candidate = await canvasToBlob(scaledCanvas, 'image/jpeg', q);
      best = candidate;
      if (candidate.size <= maxSizeBytes) return candidate;
    }
  }

  // Piso atingido: devolve o menor que conseguimos (melhor esforço).
  return best;
}

export function ImageCropModal({
  open,
  file,
  position,
  onCancel,
  onConfirm,
  presets = DEFAULT_PRESETS,
  minAspect = DEFAULT_MIN_ASPECT,
  maxAspect = DEFAULT_MAX_ASPECT,
  title = 'Ajustar foto',
  confirmLabel = 'Aplicar e enviar',
  maxSizeBytes,
}: ImageCropModalProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [preset, setPreset] = useState<CropPreset>(presets[0]!);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [aspectError, setAspectError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!file) { setSrc(null); setImgLoaded(false); return; }
    const url = URL.createObjectURL(file);
    setSrc(url);
    setPreset(presets[0]!);
    setCrop(undefined);
    setCompletedCrop(null);
    setAspectError(null);
    setImgLoaded(false);
    return () => URL.revokeObjectURL(url);
  }, [file, presets]);

  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initial = buildInitialCrop(width, height, preset.aspect);
    setCrop(initial);
    const pixelInitial: PixelCrop = {
      unit: 'px',
      x:      ((initial.x      ?? 0)  / 100) * width,
      y:      ((initial.y      ?? 0)  / 100) * height,
      width:  ((initial.width  ?? 0)  / 100) * width,
      height: ((initial.height ?? 0)  / 100) * height,
    };
    setCompletedCrop(pixelInitial);
    setImgLoaded(true);
  }

  function applyPreset(p: CropPreset) {
    setPreset(p);
    setAspectError(null);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(buildInitialCrop(width, height, p.aspect));
    }
  }

  function validateFreeAspect(c: PixelCrop): boolean {
    if (preset.aspect) return true;
    if (!c.width || !c.height) return false;
    const ratio = c.width / c.height;
    if (ratio < minAspect) {
      setAspectError(`Recorte muito alto. Mínimo permitido: ${minAspect.toFixed(1)}.`);
      return false;
    }
    if (ratio > maxAspect) {
      setAspectError(`Recorte muito largo. Máximo permitido: ${maxAspect.toFixed(1)}.`);
      return false;
    }
    setAspectError(null);
    return true;
  }

  async function handleConfirm() {
    if (busy) return; // guarda contra duplo-clique enquanto processa/envia
    if (!completedCrop || !imgRef.current || !file) return;
    if (!validateFreeAspect(completedCrop)) return;
    setBusy(true);
    try {
      const blob = await cropToBlob(imgRef.current, completedCrop, file.type || 'image/jpeg', maxSizeBytes);
      // AGUARDA o onConfirm (pode ser upload assíncrono): o botão fica travado até terminar,
      // então não dá pra clicar de novo e duplicar a imagem.
      await onConfirm(blob);
    } catch (err) {
      console.error('cropToBlob error', err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => { if (!next) onCancel(); }}
      size="lg"
      title={position ? `${title} · ${position}` : title}
      footer={
        <>
          <Button tone="neutral" variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={busy || !completedCrop || !!aspectError} loading={busy}>
            {busy ? 'Aplicando…' : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="rds-image-crop">
        {/* The presets only when there is a choice: a single aspect (a banner) needs no bar. */}
        {presets.length > 1 && (
          <ToggleGroup
            type="single"
            aria-label="Proporção"
            value={preset.id}
            onValueChange={(id) => {
              const next = presets.find((p) => p.id === id);
              if (next) applyPreset(next);
            }}
            className="rds-image-crop__presets"
          >
            {presets.map((p) => (
              <ToggleGroupItem key={p.id} value={p.id} icon={p.icon}>
                {p.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}

        <div className="rds-image-crop__stage">
          {src && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => {
                setCompletedCrop(c);
                validateFreeAspect(c);
              }}
              aspect={preset.aspect}
              keepSelection
              minWidth={50}
              minHeight={50}
              // The size cap lives on .ReactCrop, not on the <img>: .ReactCrop is inline-block and sizes by the image,
              // and v11's CSS passes max-height down (inherit) to the wrapper and the <img>. Capped here, the image
              // fits whole (letterboxed) in any orientation and the library clamps the crop to it.
              className="rds-image-crop__crop"
            >
              <img ref={imgRef} src={src} alt="" onLoad={handleImageLoad} className="rds-image-crop__image" />
            </ReactCrop>
          )}
          {!imgLoaded && (
            <div className="rds-image-crop__layer">
              <Spinner size="lg" label="Carregando imagem…" />
            </div>
          )}
          {/* While onConfirm (the upload) runs, a scrim over the image says the action is under way. */}
          {busy && (
            <div className="rds-image-crop__layer rds-image-crop__layer--busy">
              <Spinner size="lg" tone="inverse" label="Enviando…" />
            </div>
          )}
        </div>

        {aspectError && <Alert tone="danger" title={aspectError} announce="alert" />}
        {/* The hint only while the crop can be adjusted (ready): not while loading or sending, not over an error. */}
        {!aspectError && imgLoaded && !busy && (
          <p className="rds-image-crop__hint">
            {preset.aspect
              ? 'Arraste as alças para ajustar o recorte.'
              : `Livre: proporção entre ${minAspect.toFixed(1)} (vertical) e ${maxAspect.toFixed(1)} (horizontal).`}
          </p>
        )}
      </div>
    </Dialog>
  );
}
