import { type ReactNode, useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, View } from 'react-native';

import { useTheme } from './theme';

// Bottom sheet do DS — RN puro (Modal + Animated). Sobe de baixo, backdrop fecha.
// Sem biblioteca de terceiro. Drag-to-dismiss pode entrar depois via gesture-handler.
type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function Sheet({ visible, onClose, children }: Props) {
  const t = useTheme();
  const translateY = useRef(new Animated.Value(800)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    } else {
      translateY.setValue(800);
    }
  }, [visible, translateY]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar"
      />
      <Animated.View
        accessibilityViewIsModal
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '88%',
          transform: [{ translateY }],
          backgroundColor: t['--surface-default'],
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingBottom: 28,
        }}
      >
        <View style={{ alignItems: 'center', paddingVertical: 10 }}>
          <View
            style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: t['--border-strong'] }}
          />
        </View>
        {children}
      </Animated.View>
    </Modal>
  );
}
