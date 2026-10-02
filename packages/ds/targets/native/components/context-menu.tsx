import { type ReactElement, useState } from 'react';
import { Pressable } from 'react-native';

import { Menu, type MenuItem } from './menu';

// ContextMenu no RN: long-press no filho (trigger) abre o action sheet de ações.
// Não existe clique-direito no mobile — o gesto equivalente é manter pressionado.
type Props = {
  items: MenuItem[];
  children: ReactElement;
};

export function ContextMenu({ items, children }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable
        onLongPress={() => setVisible(true)}
        accessibilityHint="Mantenha pressionado para abrir as ações"
        delayLongPress={350}
      >
        {children}
      </Pressable>
      <Menu visible={visible} onClose={() => setVisible(false)} items={items} />
    </>
  );
}
