---
'@rojaostudio/ds': minor
---

PasswordInput ganha o medidor de força (`showStrength`, desligado por padrão): quatro segmentos e a palavra (Fraca, Razoável, Boa, Forte) entre o campo e a dica, calculado enquanto se digita (`passwordStrength`, exportado) ou vindo do produto (`strength`), com o nível anunciado quando muda (ds#97). Drawer e Dialog aceitam `returnFocus`; com ele, o PhoneInput no celular leva o foco ao número depois de escolher o país. SummaryBar `layout="grid"`: teste em 310.
