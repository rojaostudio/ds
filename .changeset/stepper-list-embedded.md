---
"@rojaostudio/ds": minor
---

Stepper: the steps are an ordered list inside the "Etapas" navigation, and each step says its position after its label for screen readers ("Endereço, etapa 2 de 4"; `positionLabel` words it); later steps stay aria-disabled, readable and reachable by Tab. New `variant="embedded"`: no surface, border or shadow, for a Stepper inside a Dialog or a card (`floating`, the raised pill, stays the default). (ds#159)
