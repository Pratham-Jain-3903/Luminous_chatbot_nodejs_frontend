'use server';

/**
 * @fileOverview Generates a descriptive name for a conversation based on the first message.
 *
 * - nameConversation - A function that names the conversation.
 * - NameConversationInput - The input type for the nameConversation function.
 * - NameConversationOutput - The return type for the nameConversation function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const NameConversationInputSchema = z.object({
  firstMessage: z.string().describe('The first message of the conversation.'),
});
export type NameConversationInput = z.infer<typeof NameConversationInputSchema>;

const NameConversationOutputSchema = z.object({
  conversationName: z.string().describe('The generated name for the conversation.'),
});
export type NameConversationOutput = z.infer<typeof NameConversationOutputSchema>;

export async function nameConversation(input: NameConversationInput): Promise<NameConversationOutput> {
  return nameConversationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'nameConversationPrompt',
  input: {
    schema: z.object({
      firstMessage: z.string().describe('The first message of the conversation.'),
    }),
  },
  output: {
    schema: z.object({
      conversationName: z.string().describe('The generated name for the conversation.'),
    }),
  },
  prompt: `Generate a short, descriptive name for the following conversation based on its first message. Be concise and relevant.
First Message: {{{firstMessage}}}`,
});

const nameConversationFlow = ai.defineFlow<
  typeof NameConversationInputSchema,
  typeof NameConversationOutputSchema
>({
  name: 'nameConversationFlow',
  inputSchema: NameConversationInputSchema,
  outputSchema: NameConversationOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
