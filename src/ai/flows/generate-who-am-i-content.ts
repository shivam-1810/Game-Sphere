'use server';
/**
 * @fileOverview An AI agent to generate 'Who Am I?' game content.
 *
 * - generateWhoAmIContent - A function that generates 'Who Am I?' game content.
 * - GenerateWhoAmIContentInput - The input type for the generateWhoAmIContent function.
 * - GenerateWhoAmIContentOutput - The return type for the generateWhoAmIContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWhoAmIContentInputSchema = z.object({
  theme: z.string().describe('The theme for the game content.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the game.'),
  ageRange: z.string().describe('The age range of the players.'),
  numCharacters: z.number().min(3).max(10).default(5).describe('The number of characters to generate.'),
  numQuestionsPerCharacter: z.number().min(3).max(10).default(5).describe('The number of questions to generate per character.'),
});
export type GenerateWhoAmIContentInput = z.infer<typeof GenerateWhoAmIContentInputSchema>;

const GenerateWhoAmIContentOutputSchema = z.object({
  characters: z.array(
    z.object({
      name: z.string().describe('The name of the character.'),
      questions: z.array(z.string()).describe('A list of questions for the character.'),
    })
  ).describe('A list of characters with their questions.'),
});
export type GenerateWhoAmIContentOutput = z.infer<typeof GenerateWhoAmIContentOutputSchema>;

export async function generateWhoAmIContent(input: GenerateWhoAmIContentInput): Promise<GenerateWhoAmIContentOutput> {
  return generateWhoAmIContentFlow(input);
}

const generateWhoAmIContentPrompt = ai.definePrompt({
  name: 'generateWhoAmIContentPrompt',
  input: {schema: GenerateWhoAmIContentInputSchema},
  output: {schema: GenerateWhoAmIContentOutputSchema},
  prompt: `You are a creative game content generator for the 'Who Am I?' game.

  Your task is to generate characters and questions based on the given theme, difficulty, and age range.

  Theme: {{{theme}}}
  Difficulty: {{{difficulty}}}
  Age Range: {{{ageRange}}}

  Generate {{{numCharacters}}} characters, and for each character, generate {{{numQuestionsPerCharacter}}} questions that players can use to guess the character.

  The output should be a JSON object with a 'characters' field, which is an array of characters. Each character should have a 'name' and a 'questions' field. The 'questions' field should be an array of strings.

  The difficulty should influence the complexity of the questions. Easy questions should be simple and direct, while hard questions can be more obscure and require more knowledge.

  Ensure that the questions are appropriate for the specified age range.
  `,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const generateWhoAmIContentFlow = ai.defineFlow(
  {
    name: 'generateWhoAmIContentFlow',
    inputSchema: GenerateWhoAmIContentInputSchema,
    outputSchema: GenerateWhoAmIContentOutputSchema,
  },
  async input => {
    const {output} = await generateWhoAmIContentPrompt(input);
    return output!;
  }
);
