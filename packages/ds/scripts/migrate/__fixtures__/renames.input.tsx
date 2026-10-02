import { Divider, PhoneFrame, ChatBubble } from '@rojaostudio/ds/components';

export function Showcase() {
  return (
    <PhoneFrame className="h-[600px]">
      <ChatBubble variant="bot">Oi! Como posso ajudar?</ChatBubble>
      <Divider variant="subtle" />
      <ChatBubble variant="user" ariaLabel="Sua mensagem">Quero um orçamento</ChatBubble>
      <Divider orientation="vertical" />
    </PhoneFrame>
  );
}
