---
"@rojaostudio/ds": minor
---

SocialLogo: the Figma [RDS] Icons `social/*` family in code (ds#196).

- `<SocialLogo name="github" color="brand" | "mono" tone="light" | "dark" size={24} />`, the same axes as the Figma sets: 29 logos of networks and services (`socialLogoNames` lists them).
- brand keeps the brand's colours; its black parts are the ink (`--social-ink`), so they turn white in the dark theme and on the brand plate. mono is `currentColor`. `tone` fixes the ink when the ground does not follow the theme.
- Decorative by default (`aria-hidden`); `aria-label` makes it `role="img"`. Ids of gradients and masks are unique per instance.
- In the components barrel and at `@rojaostudio/ds/components/social-logo`. The whole family is about 40 KB raw, 15 KB gzipped, and only reaches the bundle of who imports it.
