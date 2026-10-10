---
"@rojaostudio/ds": patch
---

O barril `@rojaostudio/ds/components` não puxa mais dependências opcionais. Por isso `PhoneInput`, `ImageCropModal` e `ImageUpload` saem dele e passam a vir de `@rojaostudio/ds/components/phone-input`, `.../image-crop-modal` e `.../image-upload`. Quem não usa esses componentes não precisa mais instalar `react-international-phone` nem `react-image-crop`. Basta trocar o caminho do import; nos repositórios do Rojão Studio, o codemod interno do repositório faz essa troca. Um teste novo impede que um componente do barril volte a importar uma dependência opcional.
