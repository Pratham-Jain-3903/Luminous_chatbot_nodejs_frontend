import { NextResponse } from 'next/server';
import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';

export const runtime = 'edge';

// TYPES
interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ChatRequest {
  conversationId: string;
  messages: Message[];
  stream?: boolean;
}

// In-memory cache (replace with Redis/DB in production)
const conversationCache = new Map<string, { messages: Message[]; response: string }>();

// Adapt Vertex AI async iterable into text chunks
async function* streamVertexAIResponse(vertexStream: AsyncIterable<any>): AsyncGenerator<string> {
  for await (const chunk of vertexStream) {
    const text = chunk?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text === 'string') {
      yield text;
    }
  }
}

// Map our Message[] to Gemini's expected format
function mapMessagesToGeminiContent(messages: Message[]) {
  return messages.map(msg => ({ role: msg.role, parts: [{ text: msg.content }] }));
}

export async function POST(req: Request) {
  if (!process.env.GOOGLE_CLOUD_PROJECT || !process.env.GOOGLE_CLOUD_LOCATION) {
    return NextResponse.json(
      { error: 'GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION must be defined' },
      { status: 500 }
    );
  }

  try {
    const url = new URL(req.url);
    const streamMode = url.searchParams.get('stream') !== 'false';

    const { conversationId, messages }: ChatRequest = await req.json();
    if (!conversationId || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'conversationId and messages are required' },
        { status: 400 }
      );
    }

    // Check cache for duplicate conversation
    const cached = conversationCache.get(conversationId);
    if (cached && JSON.stringify(cached.messages) === JSON.stringify(messages)) {
      if (streamMode) {
        const cachedStream = new ReadableStream<string>({
          start(controller) {
            controller.enqueue(cached.response);
            controller.close();
          }
        });
        return new Response(cachedStream, {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
      return NextResponse.json({ result: cached.response });
    }

    // Initialize Vertex AI
    const vertexAI = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.GOOGLE_CLOUD_LOCATION
    });

    const model = vertexAI.getGenerativeModel({
      model: 'gemini-1.0-pro',
      generationConfig: { maxOutputTokens: 2048, temperature: 0.7, topP: 1 },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }
      ]
    });

    const formatted = mapMessagesToGeminiContent(messages);

    if (streamMode) {
      const streamingResult = await model.generateContentStream({ contents: formatted });
      let fullResponse = '';
      const stream = new ReadableStream<string>({
        async pull(controller) {
          for await (const chunk of streamVertexAIResponse(streamingResult.stream)) {
            fullResponse += chunk;
            controller.enqueue(chunk);
          }
          controller.close();
          conversationCache.set(conversationId, { messages, response: fullResponse });
        }
      });
      return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }

    const result = await model.generateContent({ contents: formatted });
    const text = result.response?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    conversationCache.set(conversationId, { messages, response: text });

    return NextResponse.json({ result: text });
  } catch (error) {
    console.error('Error in completion route:', error);
    return NextResponse.json(
      { error: 'An error occurred processing your request.' },
      { status: 500 }
    );
  }
}
