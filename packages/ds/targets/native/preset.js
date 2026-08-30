// AUTO-GERADO por scripts/build-native.ts — não editar à mão.
// Preset NativeWind do tema padrão do DS. As cores apontam pras vars de theme.css.
// Uso no app: presets: [require("nativewind/preset"), require("@rojaostudio/ds/native/preset")]
module.exports = {
  theme: {
    extend: {
      colors: {
              "surface": {
                      "DEFAULT": "var(--ds-surface-default)",
                      "page": "var(--ds-surface-page)",
                      "raised": "var(--ds-surface-raised)",
                      "overlay": "var(--ds-surface-overlay)",
                      "invert": "var(--ds-surface-invert)"
              },
              "fg": {
                      "DEFAULT": "var(--ds-text-primary)",
                      "secondary": "var(--ds-text-secondary)",
                      "muted": "var(--ds-text-muted)",
                      "disabled": "var(--ds-text-disabled)",
                      "inverse": "var(--ds-text-inverse)",
                      "placeholder": "var(--ds-text-placeholder)"
              },
              "icon": {
                      "DEFAULT": "var(--ds-icon-default)"
              },
              "line": {
                      "DEFAULT": "var(--ds-border-default)",
                      "subtle": "var(--ds-border-subtle)",
                      "strong": "var(--ds-border-strong)",
                      "focus": "var(--ds-border-focus)"
              },
              "brand": {
                      "DEFAULT": "var(--ds-brand-primary)",
                      "hover": "var(--ds-brand-hover)",
                      "secondary": "var(--ds-brand-secondary)",
                      "accent": "var(--ds-brand-accent)",
                      "accent-light": "var(--ds-brand-accent-light)",
                      "on-primary": "var(--ds-brand-on-primary)",
                      "on-secondary": "var(--ds-brand-on-secondary)",
                      "on-accent": "var(--ds-brand-on-accent)"
              },
              "danger": {
                      "DEFAULT": "var(--ds-danger)",
                      "soft": "var(--ds-danger-soft)",
                      "border": "var(--ds-danger-border)",
                      "text": "var(--ds-danger-text)"
              },
              "success": {
                      "DEFAULT": "var(--ds-success)",
                      "soft": "var(--ds-success-soft)",
                      "border": "var(--ds-success-border)",
                      "text": "var(--ds-success-text)"
              },
              "warning": {
                      "DEFAULT": "var(--ds-warning)",
                      "soft": "var(--ds-warning-soft)",
                      "border": "var(--ds-warning-border)",
                      "text": "var(--ds-warning-text)"
              },
              "info": {
                      "DEFAULT": "var(--ds-info)",
                      "soft": "var(--ds-info-soft)",
                      "border": "var(--ds-info-border)",
                      "text": "var(--ds-info-text)"
              }
      },
    },
  },
};
