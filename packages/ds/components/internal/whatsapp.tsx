// What the WhatsApp mockups share: the platform a WhatsAppChat hands down to the messages and templates inside it.
// Not exported. Styles: internal/whatsapp.css (the palette of each platform).
import { createContext, useContext } from 'react';

export type WhatsAppPlatform = 'android' | 'ios';

export const WhatsAppPlatformContext = createContext<WhatsAppPlatform | undefined>(undefined);

/** The platform: the prop, else the chat's, else android. */
export function useWhatsAppPlatform(platform: WhatsAppPlatform | undefined): WhatsAppPlatform {
  const inherited = useContext(WhatsAppPlatformContext);
  return platform ?? inherited ?? 'android';
}
