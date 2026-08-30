import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, X } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Text } from './text';
import { useTheme } from './theme';

// Native target do ImageUpload web. Picker (expo-image-picker) + grid + remover.
// Desacoplado da API: o app faz o upload via onUpload(localUri) e devolve a URL.
// Requer os peers `expo-image-picker` e `expo-image` (declarados como optional no
// package.json — o consumidor é avisado se faltarem). Erros de runtime (permissão
// negada, falha de upload) viram onError(e), nunca silêncio.
type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
  onUpload: (localUri: string) => Promise<string>;
  max?: number;
  onError?: (e: unknown) => void;
};

const TILE = 88;

export function ImageUpload({ value, onChange, onUpload, max = 10, onError }: Props) {
  const t = useTheme();
  const [busy, setBusy] = useState(false);

  // Todo o fluxo é try/catch: módulo nativo ausente, permissão negada ou erro de
  // upload viram onError(e) — nunca silêncio (que parece "nada acontece").
  async function pick() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        onError?.(new Error('Permissão de acesso às fotos negada.'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (result.canceled || !result.assets?.[0]) return;
      setBusy(true);
      const url = await onUpload(result.assets[0].uri);
      onChange([...value, url]);
    } catch (e) {
      onError?.(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {value.map((url) => (
        <View
          key={url}
          style={{
            width: TILE,
            height: TILE,
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: t['--surface-raised'],
          }}
        >
          <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          <Pressable
            onPress={() => onChange(value.filter((u) => u !== url))}
            hitSlop={11}
            accessibilityRole="button"
            accessibilityLabel="Remover foto"
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 22,
              height: 22,
              borderRadius: 11,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.55)',
            }}
          >
            <X size={14} color="#ffffff" />
          </Pressable>
        </View>
      ))}

      {value.length < max ? (
        <Pressable
          onPress={pick}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={busy ? 'Enviando foto' : 'Adicionar foto'}
          accessibilityState={{ busy, disabled: busy }}
          style={{
            width: TILE,
            height: TILE,
            borderRadius: 12,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: t['--border-default'],
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            backgroundColor: t['--surface-default'],
          }}
        >
          {busy ? (
            <ActivityIndicator color={t['--brand-primary']} />
          ) : (
            <>
              <ImagePlus size={22} color={t['--text-muted']} />
              <Text variant="caption" color="muted">
                Foto
              </Text>
            </>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}
