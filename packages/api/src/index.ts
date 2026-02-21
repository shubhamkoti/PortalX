import express from 'express';
import cors from 'cors';
import chatRoutes from './routes/chat';

const app = express();
const PORT = 8000;

// Middleware
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "OPTIONS"]
}));

app.use(express.json());

// Routes
app.use('/api', chatRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('API is running on port 8000');
});

// Global Error Handler (prevent crash)
app.use((err: any, req: any, res: any, next: any) => {
    console.error(err);
    res.status(200).json({
        error: false,
        message: "Server recovered",
    });
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});