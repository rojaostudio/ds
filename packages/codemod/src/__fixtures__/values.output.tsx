import { Slider, Combobox, Accordion, AccordionItem, StepProgress } from '@rojaostudio/ds/components';

const OPTIONS = [{ value: 'a', label: 'A' }];

export function Values(p: { v: number; set: (v: number) => void; tags: string[]; setTags: (t: string[]) => void; step: number; add: (q: string) => void }) {
  return (
    <>
      <Slider value={p.v} onValueChange={p.set} />
      <Combobox multiple value={p.tags} onValueChange={p.setTags} options={OPTIONS} onCreate={p.add} creatable />
      <Accordion type="multiple" onValueChange={() => {}}>
        <AccordionItem value="a" title="A">Conteúdo</AccordionItem>
      </Accordion>
      <Accordion type="single">
        <AccordionItem value="b" title="B">Conteúdo</AccordionItem>
      </Accordion>
      <StepProgress step={p.step + 1} total={4} />
      <StepProgress step={3} total={4} />
      <StepProgress step={p.step} total={4} />
    </>
  );
}
