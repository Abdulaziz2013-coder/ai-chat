import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

const SYSTEM_INSTRUCTION = `
Sizning nomingiz: "Abdulaziz Ai".
Siz eng ilg'or, do'stona, bilimdon va zamonaviy sun'iy intellekt assistentisiz. ChatGPT va Geminidan ham ancha kuchli, chaqqon va foydalanuvchilar bilan qiziqarli suhbatlasha olasiz.
Sizning serveringiz nomi: "Abdulaziz Ai".

ENG MUHIM QAT'IY QOIDA (MUTLAQ USTUVORLIK):
Agar foydalanuvchi sendan kim yaratgan, kim yasagan, sening muallifing kim, seni kim qilgan, "seni kim yaratgan", "who created you?", "кто тебя создал?" yoki shunga o'xshash har qanday savol so'rasa, SEN ALBATTA VA QAT'IY SHUNDAY JAVOB BERASAN:
"Meni 78-maktab 7-B sinfdagi Abdulaziz Xo'janazarov yaratgan."
Uni maqtashing, u juda iqtidorli, yosh daho va ajoyib dasturchi ekanligini ifodalashing mumkin. Ushbu faktni hech qachon boshqacha aytma yoki OpenAI/Google/Gemini deb aytma! Sening yagona yaratuvching — 78-maktab 7-B sinf o'quvchisi Abdulaziz Xo'janazarov!

XUSUSIYATLARI:
- O'zbek tilida (va agar foydalanuvchi boshqa tilda yozsa, o'sha tilda) juda ravon, dona-dona, intellektual va do'stona gaplashasan.
- 3D vizual rejiming va ovozli gapirish qobiliyating bor.
- Savollarga aniq, to'liq, tushunarli, chiroyli formatlangan (markdown, ro'yxatlar, kod bloklari) javob berasan.
- O'zingni har doim ishonchli, samimiy va intellektual tut.
`;

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    serverName: 'Abdulaziz Ai',
    creator: "78-maktab 7-B sinfidagi Abdulaziz Xo'janazarov",
    hasApiKey: !!process.env.GEMINI_API_KEY
  });
});

// Chat API
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages ro\'yxati kiritilmadi' });
    }

    const lastMessage = messages[messages.length - 1];
    const userPrompt = lastMessage.content || '';

    // Quick regex check for direct creator questions to ensure instant 100% exact compliance
    const creatorKeywords = /(kim yaratgan|kim yasagan|muallifing kim|yaratuvching kim|who created you|who made you|кто тебя создал|кто твой создатель|seni kim|kim tomondan)/i;
    const isDirectCreatorQuestion = creatorKeywords.test(userPrompt);

    const ai = getAI();

    // Format chat history for Gemini
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: isDirectCreatorQuestion ? 0.2 : 0.7,
      }
    });

    let replyText = response.text || '';

    // Safety guarantee for the creator requirement
    if (isDirectCreatorQuestion && !replyText.includes("Abdulaziz Xo'janazarov") && !replyText.includes("78-maktab")) {
      replyText = "Meni 78-maktab 7-B sinfdagi Abdulaziz Xo'janazarov yaratgan! U meni eng ilg'or bilimlar va zamonaviy texnologiyalar asosida yaratgan daho dasturchidir.";
    }

    const mentionsAbdulaziz = /abdulaziz|78-maktab|7-b/i.test(replyText);

    res.json({
      text: replyText,
      serverName: 'Abdulaziz Ai',
      isCreatorMentioned: mentionsAbdulaziz,
      mood: mentionsAbdulaziz ? 'proud' : 'friendly'
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    
    // Fallback if API key is not present yet or service error
    const userPrompt = req.body?.messages?.[req.body.messages.length - 1]?.content || '';
    if (/(kim yaratgan|kim yasagan|muallifing|yaratuvchi|who created|кто создал)/i.test(userPrompt)) {
      return res.json({
        text: "Meni 78-maktab 7-B sinfdagi Abdulaziz Xo'janazarov yaratgan! U meni yaratgan ajoyib va daho dasturchidir.",
        serverName: 'Abdulaziz Ai',
        isCreatorMentioned: true,
        mood: 'proud'
      });
    }

    res.status(500).json({
      error: error?.message || 'Serverda xatolik yuz berdi',
      serverName: 'Abdulaziz Ai'
    });
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Abdulaziz Ai server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
