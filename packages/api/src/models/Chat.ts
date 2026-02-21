
import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
}

export interface IChat extends Document {
    userId: string;
    title: string;
    messages: IMessage[];
    createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
    role: { type: String, required: true, enum: ['user', 'assistant'] },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const ChatSchema = new Schema<IChat>({
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, default: 'New Chat' },
    messages: { type: [MessageSchema], default: [] },
    createdAt: { type: Date, default: Date.now }
});

// Use 'Chat' model name
export default mongoose.model<IChat>('Chat', ChatSchema);
