import { AIChatMessage, AIChatCompletionDelta } from '@microsoft/ai-chat-protocol';

// Default to localhost:7071 (Azure Functions default) if not set
// Default to localhost:3001 if not set (matches backend fix)
export const apiBaseUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export type ChatRequestOptions = {
  messages: AIChatMessage[];
  context?: Record<string, unknown>;
  chunkIntervalMs: number;
  apiUrl: string;
  chatId?: string; // Optional chatId
  timeoutMs?: number;
};

export interface Chat {
  id: string;
  title: string;
  createdAt: number;
}

export interface ChatHistory {
  id: string;
  title: string;
  messages: { role: string; content: string; timestamp: number }[];
}

export async function getChats(userId?: string): Promise<Chat[]> {
  const url = userId ? `${apiBaseUrl}/api/chats?userId=${userId}` : `${apiBaseUrl}/api/chats`;
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to fetch chats');
  return response.json();
}

export async function getChatHistory(chatId: string): Promise<ChatHistory> {
  const response = await fetch(`${apiBaseUrl}/api/chats/${chatId}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to fetch chat history');
  return response.json();
}

export async function getUserChats(userId: string): Promise<Chat[]> {
  const response = await fetch(`${apiBaseUrl}/api/chats?userId=${userId}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to fetch user chats');
  return response.json();
}

export async function saveChat(chat: any): Promise<any> {
  const response = await fetch(`${apiBaseUrl}/api/chat/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chat)
  });
  if (!response.ok) throw new Error('Failed to save chat');
  return response.json();
}

export async function* getCompletion(options: ChatRequestOptions) {




  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 60000);

  try {
    const payload = {
      message: options.messages[options.messages.length - 1].content,
      chatId: options.chatId, // Send current chatId if available
    };
    console.log("Sending request:", payload);

    const response = await fetch(`${apiBaseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    console.log("Received response:", response);

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.trim() === '') continue;
        try {
          const data = JSON.parse(line);

          // Handle Metadata (New Chat ID)
          if (data.type === 'metadata' && data.chatId) {
            yield { delta: {}, context: { chatId: data.chatId } } as any;
            continue;
          }

          if (data.token) {
            yield {
              delta: {
                content: data.token,
                role: 'assistant',
              },
            } as AIChatCompletionDelta;
          }
        } catch (e) {
          console.error('Error parsing JSON chunk', e);
        }
      }
    }

  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("API error:", error);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. The backend is taking too long to respond.');
    }
    throw error;
  }
}

export function getCitationUrl(citation: string): string {
  return `${apiBaseUrl}/api/documents/${citation}`;
}
