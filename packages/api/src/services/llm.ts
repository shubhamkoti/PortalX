import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOllama } from '@langchain/ollama';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { studentSystemPrompt, ollamaChatModel } from '../constants.js';

export class LLMService {
    private model: BaseChatModel;

    constructor() {
        // Enforce Ollama usage
        this.model = new ChatOllama({
            baseUrl: "http://localhost:11434", // Force local default
            model: "mistral", // Force fast model
            temperature: 0.1, // Reduce creativity for speed
            // numCtx: 4096, // Optional: context window
        });
        console.log(`LLMService: Initialized with Ollama model '${ollamaChatModel}' at '${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}'`);
    }

    async getAnswer(message: string, history: string[] = [], retrievedContext: string[] = []): Promise<string> {
        const chain = this.createChain(history, retrievedContext);
        try {
            console.log("Calling Ollama model...");
            return await chain.invoke({ input: message });
        } catch (error) {
            console.error('LLM Error:', error);
            return "I'm having trouble connecting to my local brain (Ollama). Please ensure 'ollama serve' is running.";
        }
    }

    async *streamAnswer(message: string, history: string[] = [], retrievedContext: string[] = []): AsyncGenerator<string> {
        const chain = this.createChain(history, retrievedContext);
        try {
            console.log("Calling Ollama model...");
            const stream = await chain.stream({ input: message });
            for await (const chunk of stream) {
                yield chunk;
            }
        } catch (error) {
            console.error('LLM Stream Error:', error);
            yield "I'm having trouble connecting to my local brain (Ollama).";
        }
    }

    private createChain(history: string[], retrievedContext: string[] = []) {
        const systemMessages = [['system', studentSystemPrompt]];

        // Only attach context if relevant documents were found (Prompt Size Optimization)
        if (retrievedContext.length > 0) {
            systemMessages.push(['system', `Context:\n${retrievedContext.join("\n")}`]);
        }

        const messages = [
            ...systemMessages,
            ...history.map(msg => ['human', msg]),
            ['human', '{input}']
        ] as any;

        const prompt = ChatPromptTemplate.fromMessages(messages);
        return prompt.pipe(this.model).pipe(new StringOutputParser());
    }
}

export const llmService = new LLMService();
