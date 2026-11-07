const BRAND = process.env.NEXT_PUBLIC_BRAND ?? 'novafactura';

/** NaFactura stays out on purpose, even if its deployment sets the flag by mistake. */
export const isHelpChatEnabled =
  BRAND === 'novafactura' && process.env.NEXT_PUBLIC_HELP_CHAT_ENABLED === 'true';

export const HELP_CHAT_MAX_MESSAGE_LENGTH = 2000;
