import { Input, Textarea } from '@rojaostudio/ds/components';
import { Search } from 'lucide-react';

export function Form({ errors }: { errors: Record<string, string | undefined> }) {
  return (
    <form>
      <Input label="Nome" helper="Como no documento" error={errors.name} size="lg" required />
      <Input label="Busca" iconLeft={<Search />} optional />
      <Input label="Senha" type="password" error={errors.password} />
      <Input label="PIN" type="password" passwordReveal={false} />
      <Textarea label="Bio" helper="Até 300" autoResize minRows={4} maxRows={8} optional />
    </form>
  );
}
