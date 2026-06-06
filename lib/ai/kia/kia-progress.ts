export type KiaProgressEvent =
  | { type: 'thinking' }
  | { type: 'classifying' }
  | { type: 'tool_call'; tool: string; reason: string }
  | { type: 'tool_result'; tool: string; ok: boolean }
  | { type: 'judging' }
  | { type: 'complete'; draft: string; structured: boolean; quickReplies?: Array<{ id: string; title: string }>; decision?: Record<string, unknown> }
  | { type: 'error'; message: string };

export type KiaProgressCallback = (event: KiaProgressEvent) => void;
