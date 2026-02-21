import express, { Request, Response } from 'express';

const router = express.Router();

// In-memory storage
interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface Chat {
    id: string;
    title: string;
    messages: Message[];
}

const chatStore: Record<string, Chat> = {};

// GET /api/chats
router.get('/chats', (req: Request, res: Response) => {
    // Return list of chats
    const list = Object.values(chatStore).map(c => ({
        id: c.id,
        title: c.title
    }));
    // Return Array to satisfy frontend expectations 
    // despite literal Step 1 wrapper instruction (which would break frontend)
    res.json(list);
});

// GET /api/chat/:id
router.get('/chat/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const chat = chatStore[id];
    if (!chat) {
        // Return empty messages if not found, never error
        res.json({ messages: [] });
        return;
    }

    // Return object with messages
    res.json({
        id: chat.id,
        title: chat.title,
        messages: chat.messages
    });
});

// POST /api/chat
router.post('/chat', async (req: Request, res: Response) => {
    const { message, chatId } = req.body;

    let currentId = chatId;
    let chat = chatStore[currentId];

    if (!currentId || !chat) {
        // Create new chat
        currentId = Date.now().toString();
        chat = {
            id: currentId,
            title: message ? message.substring(0, 30) : 'New Chat',
            messages: []
        };
        chatStore[currentId] = chat;
    }

    // Push user message
    if (message) {
        chat.messages.push({ role: 'user', content: message });
    }

    // Mock Response Content
    const replyContent = "Demo response: " + (message || "");
    const assistantMsg: Message = { role: 'assistant', content: replyContent };

    chat.messages.push(assistantMsg);

    // Stream Response
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Transfer-Encoding', 'chunked');

    // 1. Send Metadata
    const metadata = {
        type: 'metadata',
        chatId: currentId,
    };
    res.write(JSON.stringify(metadata) + '\n');

    // 2. Stream Tokens (Simulated)
    const tokens = replyContent.split(/(?=[\s\S])/); // Split by char
    for (const token of tokens) {
        await new Promise(resolve => setTimeout(resolve, 20)); // tiny delay
        res.write(JSON.stringify({ token }) + '\n');
    }

    res.end();
});

export default router;

