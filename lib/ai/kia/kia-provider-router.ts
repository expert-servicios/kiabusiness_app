import type { WabaAiMessage } from '@/lib/integrations/waba-ai';
import { getConfiguredWabaAiProviders } from '@/lib/integrations/waba-ai';
import type { KiaTaskType } from './kia-output-schema';
import type { KiaToolCall, KiaToolDefinition } from './kia-tool-definitions';
import { extractJsonObject } from './kia-output-schema';
import { redactJson, safeErrorMessage } from './kia-redaction';

export type KiaAiProvider = 'anthropic' | 'openai';
export type KiaEffort = 'low' | 'medium' | 'high' | 'xhigh';

export interface KiaProviderRequest {
  taskType: KiaTaskType;
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  responseSchema?: unknown;
  tools?: KiaToolDefinition[];
  effort?: KiaEffort;
  maxTokens?: number;
  temperature?: number;
}

export interface KiaProviderResult {
  provider: KiaAiProvider;
  model: string;
  rawText?: string;
  parsedJson?: unknown;
  toolCalls?: KiaToolCall[];
  usage?: unknown;
  error?: string;
}

interface ProviderConfig {
  provider: KiaAiProvider;
  apiKey: string;
  model: string;
}

export function getKiaProviderOrder(): ProviderConfig[] {
  return getConfiguredWabaAiProviders().map((provider) => ({
    provider: provider.provider,
    apiKey: provider.apiKey,
    model: provider.model,
  }));
}

export function defaultEffortForTask(taskType: KiaTaskType): KiaEffort {
  if (taskType === 'waba_reply') return 'low';
  if (taskType === 'admin_ai_compose') return 'medium';
  if (['document_classification', 'document_extraction', 'viability_reasoning', 'readiness_reasoning', 'next_best_action', 'checkout_decision'].includes(taskType)) return 'high';
  return 'xhigh';
}

export async function runKiaProviderRequest(request: KiaProviderRequest): Promise<KiaProviderResult> {
  const providers = getKiaProviderOrder();
  if (providers.length === 0) {
    return { provider: 'anthropic', model: 'none', error: 'No AI provider configured' };
  }

  let lastError = '';
  for (const provider of providers) {
    try {
      const result = provider.provider === 'anthropic'
        ? await callAnthropic(provider, request)
        : await callOpenAi(provider, request);
      return result;
    } catch (error) {
      lastError = safeErrorMessage(error);
      console.error('[Kia provider router] provider failed', redactJson({
        provider: provider.provider,
        model: provider.model,
        taskType: request.taskType,
        error: lastError,
      }));
    }
  }

  const fallbackProvider = providers[0];
  return {
    provider: fallbackProvider.provider,
    model: fallbackProvider.model,
    error: lastError || 'All providers failed',
  };
}

function parseMaybeJson(text: string): unknown | undefined {
  if (!text.trim()) return undefined;
  try {
    return extractJsonObject(text);
  } catch {
    return undefined;
  }
}

async function callAnthropic(provider: ProviderConfig, request: KiaProviderRequest): Promise<KiaProviderResult> {
  let { response, data } = await postAnthropic(provider, buildAnthropicBody(request, true));

  if (!response.ok) {
    const error = extractApiError(data, response.status);
    if (request.tools?.some((tool) => tool.strict === true) && /strict|tool/i.test(error)) {
      console.warn('[Kia provider router] Anthropic strict tools unsupported; retrying compatible schema', redactJson({
        provider: provider.provider,
        model: provider.model,
        taskType: request.taskType,
        error,
      }));
      ({ response, data } = await postAnthropic(provider, buildAnthropicBody(request, false)));
    }
  }

  if (!response.ok) throw new Error(extractApiError(data, response.status));

  const toolCalls: KiaToolCall[] = [];
  const textParts: string[] = [];
  for (const part of Array.isArray(data?.content) ? data.content : []) {
    if (part?.type === 'text' && typeof part.text === 'string') textParts.push(part.text);
    if (part?.type === 'tool_use' && typeof part.name === 'string') {
      toolCalls.push({ id: part.id, name: part.name, arguments: (part.input ?? {}) as Record<string, unknown> });
    }
  }

  const rawText = textParts.join('\n').trim();
  return {
    provider: 'anthropic',
    model: provider.model,
    rawText,
    parsedJson: parseMaybeJson(rawText),
    toolCalls,
    usage: data?.usage,
  };
}

function buildAnthropicBody(request: KiaProviderRequest, includeStrict: boolean): Record<string, unknown> {
  const body: Record<string, unknown> = {
    max_tokens: request.maxTokens ?? 900,
    temperature: request.temperature ?? 0.2,
    system: request.systemPrompt,
    messages: request.messages,
  };

  if (request.tools?.length) {
    body.tools = request.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
      ...(includeStrict && tool.strict === true ? { strict: true } : {}),
    }));
  }

  return body;
}

async function postAnthropic(provider: ProviderConfig, body: Record<string, unknown>): Promise<{ response: Response; data: any }> {
  body.model = provider.model;
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': provider.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return { response, data };
}

async function callOpenAi(provider: ProviderConfig, request: KiaProviderRequest): Promise<KiaProviderResult> {
  const messages: Array<{ role: 'system' | WabaAiMessage['role']; content: string }> = [
    { role: 'system', content: request.systemPrompt },
    ...request.messages,
  ];

  const body: Record<string, unknown> = {
    model: provider.model,
    max_tokens: request.maxTokens ?? 900,
    temperature: request.temperature ?? 0.2,
    messages,
  };

  if (request.responseSchema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: {
        name: 'kia_decision',
        strict: true,
        schema: request.responseSchema,
      },
    };
  }

  if (request.tools?.length) {
    body.tools = request.tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema,
        strict: tool.strict === true,
      },
    }));
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${provider.apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(extractApiError(data, response.status));

  const message = data?.choices?.[0]?.message;
  const rawText = typeof message?.content === 'string' ? message.content.trim() : '';
  const toolCalls: KiaToolCall[] = Array.isArray(message?.tool_calls)
    ? message.tool_calls
        .filter((call: { function?: { name?: string } }) => typeof call?.function?.name === 'string')
        .map((call: { id?: string; function: { name: string; arguments?: string } }) => ({
          id: call.id,
          name: call.function.name,
          arguments: parseToolArguments(call.function.arguments),
        }))
    : [];

  return {
    provider: 'openai',
    model: provider.model,
    rawText,
    parsedJson: parseMaybeJson(rawText),
    toolCalls,
    usage: data?.usage,
  };
}

function parseToolArguments(value: string | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function extractApiError(data: unknown, status: number): string {
  if (typeof data === 'object' && data && 'error' in data) {
    const error = (data as { error?: { message?: string } }).error;
    if (typeof error?.message === 'string') return `HTTP ${status}: ${error.message}`;
  }
  return `HTTP ${status}`;
}
