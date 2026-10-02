import { Slider, Combobox, Accordion, AccordionItem, StepProgress } from '@rojaostudio/ds/components';

const OPTIONS = [{ value: 'a', label: 'A' }];

export function Values(p: { v: number; set: (v: number) => void; tags: string[]; setTags: (t: string[]) => void; step: number; add: (q: string) => void }) {
  return (
    <>
      <Slider value={p.v} onChange={p.set} size="sm" showRange />
      <Combobox multi value={p.tags} onChange={p.setTags} options={OPTIONS} size="sm" onCreate={p.add} />
      <Accordion type="multi" onChange={() => {}}>
        <AccordionItem value="a" title="A">Conteúdo</AccordionItem>
      </Accordion>
      <Accordion type="single" collapsible>
        <AccordionItem value="b" title="B">Conteúdo</AccordionItem>
      </Accordion>
      <StepProgress current={p.step} total={4} />
      <StepProgress current={2} total={4} />
      <StepProgress current={p.step - 1} total={4} />
    </>
  );
}
