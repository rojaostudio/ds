'use client';

import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from './button';
import { Tooltip } from './tooltip';
import { ImageCropModal, type CropPreset } from './image-crop-modal';

/**
 * ImageUpload — upload com preview e remoção.
 *
 * variant="button"   → botão + preview simples (inline, form denso)
 * variant="dropzone" → zona de drop grande com drag & drop (upload é o herói: banner, galeria)
 * variant="tile"     → tile COMPACTO auto-contido (ativo único e pequeno: logo, avatar). O
 *                      próprio tile é o alvo de clique/drop; quando preenchido, vira o preview
 *                      com botões-ícone de trocar/remover no canto (sem fileira de controles
 *                      separada, sem largura full). Todos os estados no mesmo footprint.
 *
 * Textos são i18n-áveis via `labels` (defaults pt-BR preservam o comportamento atual).
 *
 * Uso:
 *   <ImageUpload name="logo" value={url} onChange={setUrl}
 *     onUpload={async (file) => { ... return url; }} variant="tile" aspect="logo" />
 */

export type ImageUploadAspect  = 'logo' | 'banner' | 'square';
export type ImageUploadVariant = 'button' | 'dropzone' | 'tile';

export interface ImageUploadLabels {
  /** Botão/prompt do estado vazio (button/dropzone/tile). */
  select:    string;
  /** Ação de trocar a imagem (botão + aria-label do tile). */
  change:    string;
  /** Ação de remover. */
  remove:    string;
  /** Texto durante o upload. */
  uploading: string;
  /** Título da dropzone vazia. */
  dropTitle: string;
  /** Subtítulo da dropzone vazia. */
  dropHint:  string;
  /** aria-label da área de upload. */
  aria:      string;
  /** Mensagem de erro genérica de upload. */
  error:     string;
}

const DEFAULT_LABELS: ImageUploadLabels = {
  select:    'Selecionar imagem',
  change:    'Trocar imagem',
  remove:    'Remover',
  uploading: 'Enviando…',
  dropTitle: 'Arraste e solte uma imagem aqui',
  dropHint:  'ou clique para selecionar do seu computador',
  aria:      'Área de upload de imagem',
  error:     'Erro ao fazer upload',
};

/** Config de crop: quando presente, a imagem selecionada passa pelo ImageCropModal antes do upload. */
export interface ImageUploadCrop {
  /** Presets de proporção. 1 só preset (ex.: 'free') = recorte livre, sem barra de presets. */
  presets?:      CropPreset[];
  minAspect?:    number;
  maxAspect?:    number;
  maxSizeBytes?: number;
  title?:        string;
  confirmLabel?: string;
}

export interface ImageUploadProps {
  /** Sobrescreve o tamanho/estilo do preview (dropzone/tile). */
  previewClassName?: string;
  /** Classe do wrapper do preview (ex.: simular o fundo claro/escuro da vitrine). */
  previewWrapperClassName?: string;
  name:       string;
  value:      string;
  onChange:   (url: string) => void;
  onUpload:   (file: File) => Promise<string>;
  label?:     string;
  hint?:      string;
  aspect?:    ImageUploadAspect;
  accept?:    string;
  className?: string;
  variant?:   ImageUploadVariant;
  /** Quando definido, abre o crop (ImageCropModal) entre selecionar o arquivo e subir. */
  crop?:      ImageUploadCrop;
  /** Textos exibidos — mescla com os defaults pt-BR (passe só o que quiser sobrescrever). */
  labels?:    Partial<ImageUploadLabels>;
}

const BUTTON_PREVIEW: Record<ImageUploadAspect, string> = {
  logo:   'h-16 w-auto max-w-[160px] object-contain rounded-(--radius-control) border border-stroke-default bg-surface-raised p-1',
  banner: 'w-full h-auto rounded-(--radius-control) border border-stroke-default',
  square: 'size-20 object-cover rounded-(--radius-control) border border-stroke-default',
};

const DROPZONE_PREVIEW: Record<ImageUploadAspect, string> = {
  logo:   'max-h-36 w-auto max-w-full object-contain rounded-(--radius-control) border border-stroke-default bg-surface-raised p-2',
  banner: 'w-full max-h-36 object-cover rounded-(--radius-control) border border-stroke-default shrink-0',
  square: 'size-36 object-cover rounded-(--radius-control) border border-stroke-default shrink-0',
};

// Footprint do tile por aspecto — compacto e proporcional ao ativo (não full-width).
const TILE_BOX: Record<ImageUploadAspect, string> = {
  logo:   'h-20 w-full max-w-[220px]',
  banner: 'h-24 w-full max-w-xs',
  square: 'size-28',
};

export function ImageUpload({
  name,
  value,
  onChange,
  onUpload,
  label,
  hint,
  aspect = 'logo',
  accept = 'image/jpeg,image/png,image/webp',
  className = '',
  variant = 'button',
  previewClassName,
  previewWrapperClassName,
  crop,
  labels,
}: ImageUploadProps) {
  const L = { ...DEFAULT_LABELS, ...labels };
  const inputRef   = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging,  setDragging]  = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  // Arquivo aguardando recorte (só quando `crop` está ligado): abre o modal ANTES do estado de
  // upload, pra o dropzone não mostrar "Enviando…" enquanto o lojista ainda enquadra.
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  async function processFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const url = await onUpload(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : L.error);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  // Seleção → recorte (se `crop`) ou upload direto. Reset do input fica no processFile/onCancel.
  async function selectFile(file: File) {
    if (crop) { setError(null); setPendingFile(file); return; }
    await processFile(file);
  }

  async function handleCropConfirm(blob: Blob) {
    const base = pendingFile;
    setPendingFile(null);
    const name = (base?.name ?? 'image').replace(/\.[^./\\]+$/, '') + '.jpg';
    await processFile(new File([blob], name, { type: blob.type || 'image/jpeg' }));
  }

  function handleCropCancel() {
    setPendingFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await selectFile(file);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await selectFile(file);
  }

  const cropModal = crop ? (
    <ImageCropModal
      open={!!pendingFile}
      file={pendingFile}
      onCancel={handleCropCancel}
      onConfirm={handleCropConfirm}
      presets={crop.presets}
      minAspect={crop.minAspect}
      maxAspect={crop.maxAspect}
      maxSizeBytes={crop.maxSizeBytes}
      title={crop.title}
      confirmLabel={crop.confirmLabel}
    />
  ) : null;

  const openPicker = () => { if (!uploading) inputRef.current?.click(); };

  const hiddenInputs = (
    <>
      <input type="hidden" name={name} value={value} />
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
      />
    </>
  );

  // ── variant="tile" — compacto, auto-contido, controles no canto ──────────────
  if (variant === 'tile') {
    return (
      <div className={['space-y-2', className].join(' ')}>
        {label && <p className="text-label font-medium text-fg-primary">{label}</p>}

        {value ? (
          // Preenchido: o tile É o preview. Trocar/Remover são botões-ícone SEMPRE visíveis no
          // canto (não dependem de hover — a11y/baixa visão), sobre um scrim pra legibilidade.
          <div
            className={[
              'relative overflow-hidden rounded-(--radius-control) border border-stroke-default bg-surface-raised',
              'flex items-center justify-center p-2',
              TILE_BOX[aspect],
              previewWrapperClassName,
            ].filter(Boolean).join(' ')}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="preview" className={previewClassName ?? 'max-h-full max-w-full object-contain'} />
            <div className="absolute top-1 right-1 flex gap-1">
              <Tooltip content={L.change}>
                <button
                  type="button"
                  aria-label={L.change}
                  onClick={openPicker}
                  disabled={uploading}
                  className="flex items-center justify-center size-7 rounded-md bg-surface-default border border-stroke-default text-fg-secondary shadow-sm hover:bg-surface-raised hover:text-fg-primary disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Upload size={14} />
                </button>
              </Tooltip>
              <Tooltip content={L.remove}>
                <button
                  type="button"
                  aria-label={L.remove}
                  onClick={() => onChange('')}
                  className="flex items-center justify-center size-7 rounded-md bg-surface-default border border-stroke-default text-fg-secondary shadow-sm hover:bg-danger-soft hover:text-danger-text transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </Tooltip>
            </div>
          </div>
        ) : (
          // Vazio: o tile inteiro é o alvo de clique/drop.
          <div
            role="button"
            tabIndex={0}
            aria-label={label ?? L.aria}
            onClick={openPicker}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker(); } }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={[
              'rounded-(--radius-control) border-2 border-dashed cursor-pointer transition-colors p-2',
              'flex flex-col items-center justify-center gap-1.5 text-center',
              TILE_BOX[aspect],
              dragging
                ? 'border-brand-primary bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)]'
                : 'border-stroke-default bg-surface-page hover:border-stroke-strong hover:bg-surface-raised',
            ].join(' ')}
          >
            <Upload size={18} className="text-brand-primary shrink-0" />
            <span className="text-caption font-medium text-fg-secondary leading-tight">
              {uploading ? L.uploading : L.select}
            </span>
          </div>
        )}

        {error && <p className="text-caption text-danger-text">{error}</p>}
        {hint  && <p className="text-caption text-fg-muted">{hint}</p>}
        {hiddenInputs}
        {cropModal}
      </div>
    );
  }

  // ── variant="dropzone" ───────────────────────────────────────────────────────
  if (variant === 'dropzone') {
    return (
      <div className={['space-y-3', className].join(' ')}>
        {label && <p className="text-label font-medium text-fg-primary">{label}</p>}

        {/* Zona de drop */}
        <div
          role="button"
          tabIndex={0}
          aria-label={label ?? L.aria}
          onClick={openPicker}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={[
            'rounded-(--radius-control) border-2 border-dashed cursor-pointer transition-colors p-4',
            dragging
              ? 'border-brand-primary bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)]'
              : 'border-stroke-default bg-surface-page hover:border-stroke-strong hover:bg-surface-raised',
          ].join(' ')}
        >
          {/* Com imagem: só o preview — as instruções ficariam espremidas ao
              lado em colunas estreitas, e Trocar/Remover já cobrem a ação. */}
          {value ? (
            <div className={['flex items-center justify-center transition-colors', previewWrapperClassName].filter(Boolean).join(' ')}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="preview" className={previewClassName ?? DROPZONE_PREVIEW[aspect]} />
            </div>
          ) : (
            <div className="flex items-center justify-center py-4">
              <div className="flex flex-col items-center gap-2 min-w-0">
                <div className="size-10 rounded-full bg-[color-mix(in_srgb,var(--brand-primary)_10%,transparent)] flex items-center justify-center">
                  <Upload size={18} className="text-brand-primary" />
                </div>
                <p className="text-label font-medium text-fg-primary text-center">
                  {uploading ? L.uploading : L.dropTitle}
                </p>
                <p className="text-caption text-fg-muted text-center">
                  {L.dropHint}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="sm"
            loading={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {value ? L.change : L.select}
          </Button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-label text-fg-muted hover:text-danger-text transition-colors"
            >
              {L.remove}
            </button>
          )}
        </div>

        {error  && <p className="text-caption text-danger-text">{error}</p>}
        {hint   && <p className="text-caption text-fg-muted">{hint}</p>}
        {hiddenInputs}
        {cropModal}
      </div>
    );
  }

  // ── variant="button" — original ──────────────────────────────────────────────
  return (
    <div className={['space-y-2', className].join(' ')}>
      {label && <p className="block text-caption font-medium text-fg-secondary">{label}</p>}

      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="preview" className={BUTTON_PREVIEW[aspect]} />
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? L.uploading : value ? L.change : L.select}
        </Button>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-caption text-fg-muted hover:text-danger-text transition-colors"
          >
            {L.remove}
          </button>
        )}
      </div>

      {error  && <p className="text-caption text-danger-text">{error}</p>}
      {hint   && <p className="text-caption text-fg-muted">{hint}</p>}
      {hiddenInputs}
      {cropModal}
    </div>
  );
}
