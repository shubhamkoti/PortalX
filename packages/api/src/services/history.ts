import { v4 as uuidv4 } from 'uuid';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface Chat {
    id: string;
    title: string;
    messages: Message[];
    createdAt: number;
}

// In-memory store
const chats: Map<string, Chat> = new Map();

export const historyService = {
    createChat: (title?: string): Chat => {
        const id = uuidv4();
        const chat: Chat = {
            id,
            title: title || 'New Chat',
            messages: [],
            createdAt: Date.now(),
        };
        chats.set(id, chat);
        return chat;
    },

    getChat: (id: string): Chat | undefined => {
        return chats.get(id);
    },

    getAllChats: (): Chat[] => {
        return Array.from(chats.values()).sort((a, b) => b.createdAt - a.createdAt);
    },

    addMessage: (chatId: string, role: 'user' | 'assistant', content: string) => {
        const chat = chats.get(chatId);
        if (chat) {
            chat.messages.push({ role, content, timestamp: Date.now() });
            // Update title based on first user message if it's "New Chat"
            if (role === 'user' && chat.title === 'New Chat') {
                chat.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
            }
        }
    },

    getContext: (chatId: string): string[] => {
        const chat = chats.get(chatId);
        if (!chat) return [];
        return chat.messages.map(m => m.content);
    },

    clear: () => {
        chats.clear();
    },

    // ADDED FOR PERSISTENCE FIX
    deleteChat: (id: string): boolean => {
        return chats.delete(id);
    }
};
