import { AIChatMessage } from '@microsoft/ai-chat-protocol';
import { getCompletion, getUserChats, getChatHistory, apiBaseUrl } from './api.js';

export interface ChatState {
    id: string;
    title: string;
    messages: AIChatMessage[];
    isLoading: boolean;
    isStreaming: boolean;
    hasError: boolean;
    input: string;
}

export class ChatStore extends EventTarget {
    public chats: Map<string, ChatState> = new Map();
    public activeChatId: string | null = null;
    public userId: string = '';
    public globalError: string | null = null;
    public isSidebarOpen: boolean = window.matchMedia('(width >= 800px)').matches;

    constructor() {
        super();
        this.userId = localStorage.getItem('userId') || crypto.randomUUID();
        localStorage.setItem('userId', this.userId);
    }

    get activeChat(): ChatState | undefined {
        return this.activeChatId ? this.chats.get(this.activeChatId) : undefined;
    }

    get sortedChats(): ChatState[] {
        // Sort by creation or update time would be ideal, but for now we rely on API order
        // We put new chats (starts with 'new-') at the top
        return Array.from(this.chats.values()).sort((a, b) => {
            if (a.id.startsWith('new-') && !b.id.startsWith('new-')) return -1;
            if (!a.id.startsWith('new-') && b.id.startsWith('new-')) return 1;
            return 0; // Preserve map insertion order (which is usually fetch order + new ones)
        });
    }

    async init() {
        await this.loadChats();
    }

    async loadChats() {
        try {
            const chatList = await getUserChats(this.userId);
            // Sync with backend list
            // We keep existing local chats if they are 'new-' (unsaved)
            // We update or add backend chats



            // We want to replace the map but keep new chats? 
            // Or just merge? Merging is safer to avoid UI flickering.

            for (const chat of chatList) {
                if (!this.chats.has(chat.id)) {
                    // New chat from backend
                    this.chats.set(chat.id, {
                        id: chat.id,
                        title: chat.title,
                        messages: [], // Load on demand
                        isLoading: false,
                        isStreaming: false,
                        hasError: false,
                        input: ''
                    });
                } else {
                    // Update title
                    const existing = this.chats.get(chat.id)!;
                    existing.title = chat.title;
                }
            }

            // Check for deleted chats (present locally but not in backend list, AND not 'new-')
            for (const id of this.chats.keys()) {
                if (!id.startsWith('new-') && !chatList.find(c => c.id === id)) {
                    this.chats.delete(id);
                }
            }

            this.notify();
        } catch (error) {
            console.error('Failed to load chats:', error);
            this.globalError = 'Failed to load chat history.';
            this.notify();
        }
    }

    async selectChat(chatId: string) {
        if (this.activeChatId === chatId) return;
        this.activeChatId = chatId;

        const chat = this.chats.get(chatId);
        if (!chat) return; // Should not happen

        if (chat.messages.length === 0 && !chat.isLoading && !chat.id.startsWith('new-')) {
            await this.loadChatHistory(chatId);
        }

        this.notify();
    }

    async loadChatHistory(chatId: string) {
        const chat = this.chats.get(chatId);
        if (!chat) return;

        chat.isLoading = true;
        chat.hasError = false;
        this.notify();

        try {
            const history = await getChatHistory(chatId);
            chat.messages = history.messages.map(m => ({
                role: m.role as 'user' | 'assistant' | 'system',
                content: m.content
            }));
            chat.title = history.title;
        } catch (e) {
            console.error(e);
            chat.hasError = true;
        } finally {
            chat.isLoading = false;
            this.notify();
        }
    }

    async createNewChat() {
        // Set activeChatId to null to indicate a new chat session waiting for user input
        this.activeChatId = null;

        if (!this.isSidebarOpen && window.innerWidth < 800) {
            this.isSidebarOpen = false;
        }
        this.notify();
    }

    async deleteChat(chatId: string) {
        // Handle transient chats directly (no backend record)
        if (chatId.startsWith('new-')) {
            this.chats.delete(chatId);
            if (this.activeChatId === chatId) {
                this.activeChatId = null;
                // Determine next chat
                if (this.chats.size > 0) {
                    this.activeChatId = this.sortedChats[0].id;
                    if (!this.sortedChats[0].messages.length && !this.sortedChats[0].id.startsWith('new-')) {
                        this.loadChatHistory(this.activeChatId);
                    }
                } else {
                    // If no chats, stay in "New Chat" null state
                    this.activeChatId = null;
                }
            }
            this.notify();
            return;
        }

        // Handle persistent chats: Delete from server first
        try {
            const response = await fetch(`${apiBaseUrl}/api/chats/${chatId}?userId=${this.userId}`, {
                method: 'DELETE',
                cache: 'no-store'
            });

            if (!response.ok) {
                console.error('Failed to delete chat remotely');
                throw new Error('Failed to delete chat');
            }

            // Success: Remove from local state
            this.chats.delete(chatId);

            if (this.activeChatId === chatId) {
                this.activeChatId = null;
                // Determine next chat to show
                if (this.chats.size > 0) {
                    // Select the first available chat
                    const nextChat = this.sortedChats[0];
                    this.activeChatId = nextChat.id;
                    if (!nextChat.messages.length && !nextChat.id.startsWith('new-')) {
                        this.loadChatHistory(this.activeChatId);
                    }
                }
                // Else activeChatId remains null (New Chat)
            }
            this.notify();

        } catch (e) {
            console.error('Failed to delete chat remotely', e);
        }
    }

    async sendMessage(content: string) {
        let currentChatId = this.activeChatId;
        const isNewStart = !currentChatId;
        let tempId: string | undefined;

        // 1. Optimistic Update
        // If it's a new start, we need a local container for the messages until we get the real ID content.
        if (isNewStart) {
            tempId = 'new-' + crypto.randomUUID();
            currentChatId = tempId;
            // Create temporary chat state
            this.chats.set(tempId, {
                id: tempId,
                title: 'New Chat',
                messages: [],
                isLoading: true,
                isStreaming: true,
                hasError: false,
                input: ''
            });
            this.activeChatId = tempId;
        }

        const chat = this.chats.get(currentChatId!);
        if (!chat) return;

        const userMsg: AIChatMessage = { role: 'user', content };
        chat.messages = [...chat.messages, userMsg];
        chat.input = '';
        chat.isLoading = true;
        this.notify();

        try {
            const stream = getCompletion({
                messages: chat.messages,
                chunkIntervalMs: 30, // Default
                apiUrl: apiBaseUrl,
                chatId: isNewStart ? undefined : currentChatId!, // Send undefined if new, else ID
                context: {
                    userId: this.userId,
                    // If new, no session ID yet.
                    sessionId: isNewStart ? undefined : currentChatId!
                }
            });

            const assistantMsg: AIChatMessage = { role: 'assistant', content: '' };
            chat.messages = [...chat.messages, assistantMsg];
            chat.isStreaming = true;
            this.notify();

            // We use a flag to track if we've received the real ID
            let realId: string | null = null;


            for await (const chunk of stream as AsyncGenerator<any>) {
                // Handle Metadata (Real Chat ID)
                if (chunk.context && chunk.context.chatId) {
                    const idFromBackend = chunk.context.chatId;

                    // If we have a temp ID, replace it with the real ID
                    if (isNewStart && tempId && idFromBackend !== tempId) {
                        // Swap in Map
                        this.chats.delete(tempId);
                        chat.id = idFromBackend;

                        // If backend sent a title in metadata, usage logic would be here, but for now we rely on simple swap
                        // Backend might have updated title logic, we can fetch later or assume "New Chat" until refresh
                        // The Prompt says: "Titles auto generate from first user message" -> Backend does this.
                        // But we don't get the title back in the stream metadata currently (only ID).
                        // We can live with "New Chat" title locally until reload, or update.
                        // Actually, the user prompt: "If response contains new conversationId → store it in activeConversationId"

                        this.chats.set(idFromBackend, chat);

                        // If user is still viewing this chat
                        if (this.activeChatId === tempId) {
                            this.activeChatId = idFromBackend;
                        }

                        realId = idFromBackend;
                        tempId = undefined; // Done swapping
                    }
                }

                if (chunk.delta && chunk.delta.content) {
                    assistantMsg.content += chunk.delta.content;
                    this.notify();
                }
            }

            chat.isStreaming = false;
            chat.isLoading = false;
            this.notify();

            // Persistence is handled by backend now. No need to call saveChat.
            // However, we might want to refresh the list to get the real title?
            // "Titles auto generate from first user message"
            // Since we only got the ID back, the title in local state is still "New Chat".
            // We should fetch the specific chat details to get the title, or just accept it's updated on next load.
            // Let's try to update the title if we have the real ID.

            if (realId) {
                try {
                    const history = await getChatHistory(realId);
                    if (history && history.title) {
                        chat.title = history.title;
                        this.notify();
                    }
                } catch (e) {
                    // Ignore background refresh error
                }
            }

        } catch (error) {
            console.error(error);
            chat.hasError = true;
            chat.isLoading = false;
            chat.isStreaming = false;
            this.notify();
        }
    }

    setSidebarOpen(open: boolean) {
        this.isSidebarOpen = open;
        this.notify();
    }

    notify() {
        this.dispatchEvent(new CustomEvent('state-changed'));
    }
}

export const store = new ChatStore();
