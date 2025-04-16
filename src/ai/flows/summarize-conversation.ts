'use server';

/**
 * @fileOverview Summarizes the last 10 messages of a conversation using AI.
 *
 * - summarizeConversation - A function that summarizes the last 10 messages of a conversation.
 * - SummarizeConversationInput - The input type for the summarizeConversation function.
 * - SummarizeConversationOutput - The return type for the summarizeConversation function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SummarizeConversationInputSchema = z.object({
  messages: z.array(
    z.object({
      sender: z.string(),
      text: z.string(),
    })
  ).max(10).describe('The last 10 messages of the conversation.'),
});
export type SummarizeConversationInput = z.infer<typeof SummarizeConversationInputSchema>;

const SummarizeConversationOutputSchema = z.object({
  summary: z.string().describe('The summary of the conversation.'),
});
export type SummarizeConversationOutput = z.infer<typeof SummarizeConversationOutputSchema>;

export async function summarizeConversation(input: SummarizeConversationInput): Promise<SummarizeConversationOutput> {
  return summarizeConversationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeConversationPrompt',
  input: {
    schema: z.object({
      messages: z.array(
        z.object({
          sender: z.string(),
          text: z.string(),
        })
      ).max(10).describe('The last 10 messages of the conversation.'),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string().describe('The summary of the conversation.'),
    }),
  },
  prompt: `Summarize the following conversation in a few sentences:\n\n{{#each messages}}\n{{sender}}: {{{text}}}\n{{/each}}`,
});

const summarizeConversationFlow = ai.defineFlow<
  typeof SummarizeConversationInputSchema,
  typeof SummarizeConversationOutputSchema
>({
  name: 'summarizeConversationFlow',
  inputSchema: SummarizeConversationInputSchema,
  outputSchema: SummarizeConversationOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
