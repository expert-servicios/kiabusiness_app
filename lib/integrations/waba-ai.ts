export type WabaAiProvider = 'anthropic' | 'openai';

export interface WabaAiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface WabaAiResult {
  text: string;
  provider: WabaAiProvider;
  model: string;
}

interface ConfiguredProvider {
  provider: WabaAiProvider;
  apiKey: string;
  model: string;
}

const DEFAULT_ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';
const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini';

function normalizeProvider(value?: string): WabaAiProvider {
  return value?.toLowerCase() === 'openai' ? 'openai' : 'anthropic';
}

export function getConfiguredWabaAiProviders(): ConfiguredProvider[] {
  const preferred = normalizeProvider(process.env.AI_PROVIDER);
  const providers: ConfiguredProvider[] = [];

  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (anthropicKey) {
    providers.push({
      provider: 'anthropic',
      apiKey: anthropicKey,
      model: process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL,
    });
  }

  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (openAiKey) {
    providers.push({
      provider: 'openai',
      apiKey: openAiKey,
      model: process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL,
    });
  }

  return providers.sort((a, b) => {
    if (a.provider === preferred) return -1;
    if (b.provider === preferred) return 1;
    return 0;
  });
}

export async function generateWabaAiText({
  systemPrompt,
  messages,
  maxTokens = 500,
}: {
  systemPrompt: string;
  messages: WabaAiMessage[];
  maxTokens?: number;
}): Promise<WabaAiResult | null> {
  const providers = getConfiguredWabaAiProviders();

  for (const provider of providers) {
    try {
      const text =
        provider.provider === 'anthropic'
          ? await generateWithAnthropic(provider, systemPrompt, messages, maxTokens)
          : await generateWithOpenAi(provider, systemPrompt, messages, maxTokens);

      if (text) {
        return { text, provider: provider.provider, model: provider.model };
      }
    } catch (error) {
      console.error('[WABA AI] provider failed:', {
        provider: provider.provider,
        model: provider.model,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return null;
}

async function generateWithAnthropic(
  provider: ConfiguredProvider,
  systemPrompt: string,
  messages: WabaAiMessage[],
  maxTokens: number
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(extractApiError(data, response.status));
  }

  return typeof data?.content?.[0]?.text === 'string' ? data.content[0].text.trim() : '';
}

async function generateWithOpenAi(
  provider: ConfiguredProvider,
  systemPrompt: string,
  messages: WabaAiMessage[],
  maxTokens: number
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${provider.apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: provider.model,
      max_tokens: maxTokens,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(extractApiError(data, response.status));
  }

  return typeof data?.choices?.[0]?.message?.content === 'string' ? data.choices[0].message.content.trim() : '';
}

function extractApiError(data: unknown, status: number): string {
  if (typeof data === 'object' && data && 'error' in data) {
    const error = (data as { error?: { message?: string } }).error;
    if (typeof error?.message === 'string') return `HTTP ${status}: ${error.message}`;
  }

  return `HTTP ${status}`;
}
