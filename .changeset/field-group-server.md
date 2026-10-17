---
"@rojaostudio/ds": patch
---

FieldGroup and CheckboxGroup load in a Server Component again (2.15.0 broke them on import: the FieldGroup context was created in a module the server React also reads, where createContext does not exist). FieldGroup is a client component now; the context and the fields' ids hook moved to a client module of their own. The dist contract gained a check: every module without `'use client'` loads under the `react-server` condition, with the client modules stubbed as the App Router does.
