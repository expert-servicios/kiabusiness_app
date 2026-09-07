function getBotToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || undefined;
}

function getAdminChatId(): string | undefined {
  return process.env.TELEGRAM_ADMIN_CHAT_ID?.trim() || undefined;
}

export interface TelegramOutbound {
  chatId: string;
  text: string;
}

/** Sends a Telegram message. Best-effort: resolves silently if not configured or on failure. */
export async function sendTelegramMessage({ chatId, text }: TelegramOutbound): Promise<void> {
  const token = getBotToken();
  if (!token || !chatId) return;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      console.error('[telegram] sendMessage failed:', res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.error('[telegram] sendMessage error:', err);
  }
}

/** Sends a Telegram message to the configured admin chat. No-op if TELEGRAM_ADMIN_CHAT_ID is unset. */
export async function notifyAdminsTelegram(text: string): Promise<void> {
  const chatId = getAdminChatId();
  if (!chatId) return;
  await sendTelegramMessage({ chatId, text });
}
