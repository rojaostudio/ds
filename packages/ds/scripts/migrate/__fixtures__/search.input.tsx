import { useState } from 'react';
import { Search } from '@rojaostudio/ds/components';
import { X } from 'lucide-react';

export function Filter() {
  const [query, setQuery] = useState('');
  return (
    <div>
      <Search aria-label="Buscar lojas" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome" />
      <Search aria-label="Pedidos" value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery('')} size="sm" width="full" />
      <X />
    </div>
  );
}
