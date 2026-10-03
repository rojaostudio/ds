import {
  Label,
  Themed,
  themeClass,
  Search,
  PaywallContent,
  PaywallState,
  PaywallModal,
  PaywallBanner,
  BlockerCard,
  CopilotHint,
} from '@rojaostudio/ds/components';

export function Legacy({ dark, find, open, close }: { dark: boolean; find: (q: string) => void; open: boolean; close: () => void }) {
  return (
    <main className={themeClass('loja', dark)}>
      <Label htmlFor="email" required tooltip="Usado no recibo">E-mail</Label>
      <Label htmlFor="bio" optional>Bio</Label>
      <Themed theme="loja" dark asChild>
        <section>Conteúdo</section>
      </Themed>
      <Search placeholder="Buscar pedidos" onSearch={find} />
      <Search placeholder="Buscar" width="hug" />
      <PaywallContent reason="feature" title="Recurso Pro" />
      <PaywallState reason="limit" title="Limite atingido" />
      <PaywallModal open={open} onClose={close} reason="feature" title="Recurso Pro" />
      <PaywallBanner variant="warn" title="80% do limite" />
      <BlockerCard title="Plano expirado" />
      <CopilotHint id="dica" title="Cadastre o primeiro produto" />
    </main>
  );
}
