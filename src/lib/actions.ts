'use server';

import { generateWhoAmIContent, type GenerateWhoAmIContentInput, type GenerateWhoAmIContentOutput } from '@/ai/flows/generate-who-am-i-content';
import { z } from 'zod';

const WhoAmIFormSchema = z.object({
  theme: z.string().min(3, "Theme must be at least 3 characters long."),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  numCharacters: z.coerce.number().min(3).max(10),
  numQuestionsPerCharacter: z.coerce.number().min(3).max(10),
});

export type WhoAmIFormState = {
  message?: string | null;
  data?: GenerateWhoAmIContentOutput | null;
  errors?: {
    theme?: string[];
    difficulty?: string[];
    numCharacters?: string[];
    numQuestionsPerCharacter?: string[];
  };
};

export async function createWhoAmIChallenge(prevState: WhoAmIFormState, formData: FormData): Promise<WhoAmIFormState> {
  // Return initial state if form is empty (for resetting)
  if (!formData.get('theme')) {
    return { message: null, data: null, errors: {} };
  }
  
  const validatedFields = WhoAmIFormSchema.safeParse({
    theme: formData.get('theme'),
    difficulty: formData.get('difficulty'),
    numCharacters: formData.get('numCharacters'),
    numQuestionsPerCharacter: formData.get('numQuestionsPerCharacter'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Invalid form data. Please check your inputs.',
      data: null,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const gameContent = await generateWhoAmIContent(validatedFields.data as GenerateWhoAmIContentInput);
    if (!gameContent.characters || gameContent.characters.length === 0) {
      return {
        message: 'The AI failed to generate characters. Please try a different category.',
        data: null,
      }
    }
    return {
      message: 'Game created successfully!',
      data: gameContent,
    };
  } catch (error) {
    console.error(error);
    return {
      message: 'Failed to generate game content. Please try again later.',
      data: null,
    };
  }
}
