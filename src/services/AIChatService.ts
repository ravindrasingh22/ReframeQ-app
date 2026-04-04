import {apiRequest} from './api';

type Language = 'en' | 'hinglish';

const enReplies = [
  'I hear you. Let us slow down and take one deep breath together.',
  'Thanks for sharing that. What is one small step that would help right now?',
  'That sounds heavy. You are not alone. Want to try a quick grounding exercise?',
];

const hinglishReplies = [
  'Samajh raha hoon. Chalo ek deep breath saath mein lete hain.',
  'Share karne ke liye thanks. Abhi ek chota sa step kya ho sakta hai?',
  'Yeh mushkil lag raha hai. Tum akela nahi ho. Quick grounding try karein?',
];

export function getAssistantReply(message: string, language: Language): string {
  const normalized = message.trim().toLowerCase();
  const pool = language === 'hinglish' ? hinglishReplies : enReplies;

  if (normalized.includes('anx') || normalized.includes('stress')) {
    return language === 'hinglish'
      ? 'Anxiety feel ho rahi hai to 4-4-6 breathing try karo: 4 inhale, 4 hold, 6 exhale.'
      : 'If anxiety feels high, try 4-4-6 breathing: inhale 4, hold 4, exhale 6.';
  }

  if (normalized.includes('sad') || normalized.includes('low')) {
    return language === 'hinglish'
      ? 'Agar low feel ho raha hai to ek caring thought likho: "Main abhi struggle kar raha hoon, but I can handle this step by step."'
      : 'If you feel low, write one caring thought: "I am struggling right now, and I can handle this step by step."';
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

export async function getAssistantReplyFromBackend(
  token: string,
  message: string,
  language: Language,
  threadId?: number,
): Promise<string> {
  const data = await apiRequest<{reply?: string}>('/api/app/chat/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({message, language, thread_id: threadId}),
  });
  return String(data?.reply ?? '');
}

export type ChatThread = {
  id: number;
  title: string;
  thread_date: string;
  created_at: string;
  preview?: string | null;
};

export type ChatThreadMessage = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export async function fetchThreads(token: string): Promise<ChatThread[]> {
  const data = await apiRequest<{items?: ChatThread[]}>('/api/app/chat/threads', {
    headers: {Authorization: `Bearer ${token}`},
  });
  return (data?.items ?? []) as ChatThread[];
}

export async function fetchThreadDetail(
  token: string,
  threadId: number,
): Promise<{thread: ChatThread; messages: ChatThreadMessage[]}> {
  const data = await apiRequest<{thread: ChatThread; messages?: any[] }>(`/api/app/chat/threads/${threadId}`, {
    headers: {Authorization: `Bearer ${token}`},
  });
  return {
    thread: data.thread as ChatThread,
    messages: (data.messages ?? []).map((m: any) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      created_at: m.created_at,
    })),
  };
}

export async function sendChatMessage(
  token: string,
  message: string,
  language: Language,
  threadId?: number,
): Promise<{
  reply: string;
  thread_id: number;
  thread_title: string;
  safety_decision: {
    risk_score: 'low' | 'medium' | 'high' | 'critical';
    safety_level: 'support' | 'heightened_support' | 'crisis_danger';
    trigger_codes: string[];
    recommended_action: string;
    requires_interrupt: boolean;
    feature_applied: boolean;
  };
  support_card?: {
    title: string;
    body: string;
    actions: Array<{kind: string; label: string; value: string}>;
  } | null;
}> {
  const data = await apiRequest<any>('/api/app/chat/message', {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
    body: JSON.stringify({message, language, thread_id: threadId}),
  });
  return {
    reply: String(data.reply ?? ''),
    thread_id: Number(data.thread_id),
    thread_title: String(data.thread_title ?? ''),
    safety_decision: {
      risk_score: String(data?.safety_decision?.risk_score ?? 'low') as 'low' | 'medium' | 'high' | 'critical',
      safety_level: String(data?.safety_decision?.safety_level ?? 'support') as 'support' | 'heightened_support' | 'crisis_danger',
      trigger_codes: Array.isArray(data?.safety_decision?.trigger_codes) ? data.safety_decision.trigger_codes.map(String) : [],
      recommended_action: String(data?.safety_decision?.recommended_action ?? 'continue'),
      requires_interrupt: Boolean(data?.safety_decision?.requires_interrupt),
      feature_applied: Boolean(data?.safety_decision?.feature_applied),
    },
    support_card: data?.support_card
      ? {
          title: String(data.support_card.title ?? ''),
          body: String(data.support_card.body ?? ''),
          actions: Array.isArray(data.support_card.actions)
            ? data.support_card.actions.map((item: any) => ({
                kind: String(item?.kind ?? ''),
                label: String(item?.label ?? ''),
                value: String(item?.value ?? ''),
              }))
            : [],
        }
      : null,
  };
}
