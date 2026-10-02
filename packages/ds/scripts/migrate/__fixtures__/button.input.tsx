import { Button } from '@rojaostudio/ds/components';
import { ArrowRight, Plus } from 'lucide-react';

export function Buttons({ go }: { go: () => void }) {
  return (
    <div>
      <Button onClick={go}>Salvar</Button>
      <Button variant="filled" color="primary" size="lg">Primário</Button>
      <Button variant="outline">Contorno</Button>
      <Button variant="ghost" color="secondary" size="sm">Discreto</Button>
      <Button
        variant="outline"
        color="danger"
      >
        Excluir
      </Button>
      <Button color="danger">Apagar tudo</Button>
      <Button iconRight={<ArrowRight />}>Avançar</Button>
      <Button iconLeft={<Plus />} size="sm">Adicionar</Button>
      <Button fullWidth>Largo</Button>
      <Button fullWidth className="mt-4">Largo com classe</Button>
      <Button fullWidth={false}>Normal</Button>
      <Button tone="neutral" variant="ghost">Já na 2.0</Button>
    </div>
  );
}
