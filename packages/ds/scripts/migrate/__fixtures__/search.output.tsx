import { useState } from 'react';
import { Input } from '@rojaostudio/ds/components';
import { X, SearchIcon } from 'lucide-react';

export function Filter() {
  const [query, setQuery] = useState('');
  return (
    <div>
      <Input aria-label="Buscar lojas" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome" type="search" leadingIcon={<SearchIcon />} clearable />
      <Input aria-label="Pedidos" value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery('')} type="search" leadingIcon={<SearchIcon />} clearable />
      <X />
    </div>
  );
}
