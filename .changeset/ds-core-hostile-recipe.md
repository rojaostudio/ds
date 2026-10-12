---
'@rojaostudio/ds-core': patch
---

Security (review of 11/10/2026): `isSafeColor` no longer backtracks for seconds on a long hostile value (ReDoS, CWE-1333: a length cap and a required separator between channels). `emitCss` now checks the recipe before writing CSS (CWE-74): the theme name, the fonts and the palettes go through the allow lists, every generated value is checked, and the description stays on one line inside its comment. New helpers `isSafeThemeName` and `isSafeCssValue`.
