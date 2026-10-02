import { Input, Textarea, PasswordInput } from '@rojaostudio/ds/components';
import { Search } from 'lucide-react';

export function Form({ errors }: { errors: Record<string, string | undefined> }) {
  return (
    <form>
      <Input label="Nome" hint="Como no documento" errorMessage={errors.name} required />
      <Input label="Busca" leadingIcon={<Search />} />
      <PasswordInput label="Senha" errorMessage={errors.password} />
      <Input label="PIN" type="password" />
      <Textarea label="Bio" hint="Até 300" rows={4} />
    </form>
  );
}
