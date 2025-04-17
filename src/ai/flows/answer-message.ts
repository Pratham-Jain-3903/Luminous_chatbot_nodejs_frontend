'use server';

/**
 * @fileOverview An AI agent for answering user messages.
 *
 * - answerMessage - A function that answers the user message.
 * - AnswerMessageInput - The input type for the answerMessage function.
 * - AnswerMessageOutput - The return type for the answerMessage function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const AnswerMessageInputSchema = z.object({
  message: z.string().describe('The message to respond to.'),
  conversationHistory: z.array(
    z.object({
      sender: z.string(),
      text: z.string(),
    })
  ).describe('The history of the conversation.'),
});
export type AnswerMessageInput = z.infer<typeof AnswerMessageInputSchema>;

const AnswerMessageOutputSchema = z.object({
  response: z.string().describe('The response to the message.'),
});
export type AnswerMessageOutput = z.infer<typeof AnswerMessageOutputSchema>;

export async function answerMessage(input: AnswerMessageInput): Promise<AnswerMessageOutput> {
  return answerMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerMessagePrompt',
  input: {
    schema: z.object({
      message: z.string().describe('The message to respond to.'),
      conversationHistory: z.array(
        z.object({
          sender: z.string(),
          text: z.string(),
        })
      ).describe('The history of the conversation.'),
    }),
  },
  output: {
    schema: z.object({
      response: z.string().describe('The response to the message.'),
    }),
  },
  prompt: `You are a helpful and informative AI assistant. Respond to the user's message based on the conversation history.
Conversation History:
{{#each conversationHistory}}
  {{sender}}: {{{text}}}
{{/each}}

User Message: {{{message}}}

Response:`,
});

const answerMessageFlow = ai.defineFlow<
  typeof AnswerMessageInputSchema,
  typeof AnswerMessageOutputSchema
>({
  name: 'answerMessageFlow',
  inputSchema: AnswerMessageInputSchema,
  outputSchema: AnswerMessageOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
