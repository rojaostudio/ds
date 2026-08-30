// Set de ícones do DS no RN = lucide (o mesmo set do web, icons/index.ts).
// Re-export para o app pegar os glifos do nosso DS, não direto de terceiros.
// Tree-shaking (Metro) garante que só os ícones importados entram no bundle.
export * from 'lucide-react-native';
