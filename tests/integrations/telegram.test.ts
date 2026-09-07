import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendTelegramMessage, notifyAdminsTelegram } from '@/lib/integrations/telegram';

describe('telegram integration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sendTelegramMessage no-ops when TELEGRAM_BOT_TOKEN is unset', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', '');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await sendTelegramMessage({ chatId: '123', text: 'hola' });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sendTelegramMessage no-ops when chatId is empty', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'test-token');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await sendTelegramMessage({ chatId: '', text: 'hola' });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sendTelegramMessage calls the Telegram Bot API with the configured token', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'test-token');
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, text: async () => '' });
    vi.stubGlobal('fetch', fetchSpy);

    await sendTelegramMessage({ chatId: '456', text: 'hola equipo' });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.telegram.org/bottest-token/sendMessage',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          chat_id: '456',
          text: 'hola equipo',
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      })
    );
  });

  it('sendTelegramMessage swallows network errors without throwing', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'test-token');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    await expect(sendTelegramMessage({ chatId: '456', text: 'hola' })).resolves.toBeUndefined();
  });

  it('notifyAdminsTelegram no-ops when TELEGRAM_ADMIN_CHAT_ID is unset', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'test-token');
    vi.stubEnv('TELEGRAM_ADMIN_CHAT_ID', '');
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await notifyAdminsTelegram('alerta');

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('notifyAdminsTelegram sends to the configured admin chat', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'test-token');
    vi.stubEnv('TELEGRAM_ADMIN_CHAT_ID', '789');
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, text: async () => '' });
    vi.stubGlobal('fetch', fetchSpy);

    await notifyAdminsTelegram('alerta');

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.telegram.org/bottest-token/sendMessage',
      expect.objectContaining({
        body: JSON.stringify({
          chat_id: '789',
          text: 'alerta',
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      })
    );
  });
});
