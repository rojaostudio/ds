import { Button } from '@rojaostudio/ds/components';
import { PixIcon } from '@rojaostudio/ds/icons';

export const METHODS = [{ key: 'PIX', Icon: PixIcon }];

export function Pay() {
  return (
    <Button icon={<PixIcon />}>Pagar com Pix</Button>
  );
}
