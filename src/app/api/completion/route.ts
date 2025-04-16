/ src/app/api/completion/route.ts
import {NextResponse} from 'next/server';
import {VertexAI} from '@google-cloud/vertexai';

export async function POST(req: Request) {
  if (!process.env.GOOGLE_CLOUD_PROJECT || !process.env.GOOGLE_CLOUD_LOCATION) {
    throw new Error(
      'GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION must be defined'
    );
  }

  const vertexAI = new VertexAI({
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GOOGLE_CLOUD_LOCATION,
  });

  const model = vertexAI.getGenerativeModel({
    model: 'gemini-pro',
    generation_config: {
      max_output_tokens: 2048,
      temperature: 0.9,
      top_p: 1,
    },
    safety_settings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  });

  const {prompt} = await req.json();

  const streamingResp = await model.generateContentStream({
    contents: [{role: 'user', parts: [{text: prompt}]}],
  });

  // [START aiplatform_gemini_response_stream]
  let fullText = '';
  for await (const item of streamingResp.stream) {
    if (item.text) {
      fullText += item.text;
    }
  }
  // [END aiplatform_gemini_response_stream]

  return NextResponse.json({output: fullText});
}
