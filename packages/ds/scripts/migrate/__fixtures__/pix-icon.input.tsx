import { Button, PixIcon } from '@rojaostudio/ds/components';

export const METHODS = [{ key: 'PIX', Icon: PixIcon }];

export function Pay() {
  return (
    <Button icon={<PixIcon />}>Pagar com Pix</Button>
  );
}
