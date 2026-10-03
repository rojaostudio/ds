import { Separator, Phone, Bubble } from '@rojaostudio/ds/components';

export function Showcase() {
  return (
    <Phone className="h-[600px]">
      <Bubble>Oi! Como posso ajudar?</Bubble>
      <Separator />
      <Bubble align="end" variant="fill" aria-label="Sua mensagem">Quero um orçamento</Bubble>
      <Separator orientation="vertical" />
    </Phone>
  );
}
