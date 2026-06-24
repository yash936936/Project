import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

let _anthropic: Anthropic | null = null;
let _openai: OpenAI | null = null;

export function getAnthropic() {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}
export function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

export type LLMStreamResult = { stream: AsyncIterable<string>; model: string };

export async function streamCompletion(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 4096,
): Promise<LLMStreamResult> {
  const primary = process.env.LLM_PRIMARY ?? 'claude';
  if (primary === 'claude') {
    try { return await _streamClaude(systemPrompt, userMessage, maxTokens); }
    catch (err) {
      console.warn('[LLM] Claude failed -> GPT-4o fallback:', (err as Error).message);
      return _streamOpenAI(systemPrompt, userMessage, maxTokens);
    }
  }
  return _streamOpenAI(systemPrompt, userMessage, maxTokens);
}

async function _streamClaude(system: string, user: string, maxTokens: number): Promise<LLMStreamResult> {
  const stream = getAnthropic().messages.stream({
    model: 'claude-sonnet-4-6', max_tokens: maxTokens,
    system, messages: [{ role: 'user', content: user }],
  });
  async function* iter() {
    for await (const chunk of stream)
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta')
        yield chunk.delta.text;
  }
  return { stream: iter(), model: 'claude-sonnet-4-6' };
}

async function _streamOpenAI(system: string, user: string, maxTokens: number): Promise<LLMStreamResult> {
  const stream = await getOpenAI().chat.completions.create({
    model: 'gpt-4o', max_tokens: maxTokens, stream: true,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
  });
  async function* iter() {
    for await (const chunk of stream) {
      const t = chunk.choices[0]?.delta?.content;
      if (t) yield t;
    }
  }
  return { stream: iter(), model: 'gpt-4o' };
}
