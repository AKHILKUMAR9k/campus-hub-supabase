const { onCall } = require('firebase-functions/v2/https');
const { genkit } = require('genkit');
const { googleAI } = require('@genkit-ai/google-genai');

const ai = genkit({
  plugins: [googleAI()],
});

const suggestEventTags = ai.defineFlow(
  {
    name: 'suggestEventTags',
    inputSchema: {
      type: 'object',
      properties: {
        description: { type: 'string' },
      },
      required: ['description'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['tags'],
    },
  },
  async (input) => {
    const prompt = ai.definePrompt({
      name: 'suggestEventTagsPrompt',
      model: 'gemini-pro',
      input: { schema: inputSchema },
      output: { schema: outputSchema },
      prompt: `You are an event tag suggestion expert. Given an event description, you will suggest relevant tags for the event.

Description: ${input.description}

Suggest at least 5 tags. The tags should be short and descriptive. The tags should be suitable for filtering and searching events. Return a JSON array of strings.`,
    });

    const { output } = await prompt(input);
    return output;
  }
);

exports.suggestEventTags = onCall(suggestEventTags);
