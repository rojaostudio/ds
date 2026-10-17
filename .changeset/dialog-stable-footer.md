---
"@rojaostudio/ds": patch
---

Dialog `stableHeight`: the footer stays at the foot of the box on a shorter step. 2.15.0 kept the box's height, but the body did not take it, so the footer rose with the shorter content and left a gap under it (ds#160).
