'use server';
import { suggestEventTags } from '@/ai/flows/suggested-event-tagging';

export async function getSuggestedTags(description: string) {
  if (!description || description.trim().length < 20) {
    return { tags: [], error: "Description must be at least 20 characters long." };
  }
  try {
    const result = await suggestEventTags({ description });
    return result;
  } catch (error) {
    console.error('Error getting suggested tags:', error);
    return { tags: [], error: "Failed to get suggestions. Please try again later." };
  }
}
