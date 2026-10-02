import { Button } from '@rojaostudio/ds/components';
import { ArrowRight, Plus } from 'lucide-react';

export function Buttons({ go }: { go: () => void }) {
  return (
    <div>
      <Button onClick={go}>Salvar</Button>
      <Button size="lg">Primário</Button>
      <Button variant="outline">Contorno</Button>
      <Button variant="ghost" tone="neutral" size="sm">Discreto</Button>
      <Button
        variant="outline"
        tone="danger"
      >
        Excluir
      </Button>
      <Button tone="danger">Apagar tudo</Button>
      <Button icon={<ArrowRight />}>Avançar</Button>
      <Button icon={<Plus />} iconPosition="start" size="sm">Adicionar</Button>
      <Button className="w-full">Largo</Button>
      <Button className="mt-4 w-full">Largo com classe</Button>
      <Button>Normal</Button>
      <Button tone="neutral" variant="ghost">Já na 2.0</Button>
    </div>
  );
}
