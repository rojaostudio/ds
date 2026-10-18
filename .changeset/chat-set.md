---
"@rojaostudio/ds": minor
---

Chat set: Composer, FloatingPanel and the delivery status of a Message (ds#178, ds#179, ds#180).

- `Composer` (new): where a chat is written, the text and the send button in one box. It grows from 1 to 4 lines (`maxRows`) and then scrolls. Enter sends the trimmed text, Shift+Enter breaks the line; `sending` turns the button and blocks a second send; `disabled`. Controlled (`value` + `onValueChange`) or not (`defaultValue`, emptied after each send).
- `FloatingPanel` (new): a window over the page that does not block it (support chat, help, assistant). Non-modal dialog: no veil, the focus is not trapped, a click outside keeps it open, Esc and the close button close it and the focus goes back to the opener. From lg: 400 × 640 at the bottom right, 24 from the edges, never taller than the screen less 96; compact: the whole screen with a back button. Parts: `title`, `status`, `avatar`, the scrolling body (`children`) and `footer`. New viewport tokens `--layout-floating-panel-width|height|radius`.
- `Message`: `status="sending" | "sent" | "failed"` on the person's own message (`align="end"`), with `onRetry`. sending shows a Spinner and "Enviando" in place of the time; failed turns the Bubble to the error colours and adds "Não enviada · Tentar de novo". Each change is announced by a polite live region. New token `--message-failed`.
