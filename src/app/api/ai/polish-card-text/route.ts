import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const anthropic = new Anthropic();

interface ValueInput {
  id: string;
  name: string;
  rawTagline: string;
  rawCommitment: string;
}

interface PolishedValue {
  id: string;
  name: string;
  tagline: string;
  commitment: string;
}

// Fallback function if AI fails - returns cleaned-up versions
function getFallbackPolish(values: ValueInput[]): { values: PolishedValue[] } {
  return {
    values: values.map((v) => ({
      id: v.id,
      name: v.name,
      tagline: v.rawTagline || `Living by ${v.name} every day`,
      commitment: v.rawCommitment
        ? v.rawCommitment
            .replace(/^If\s+/i, 'When ')
            .replace(/,\s*then I will\s*/i, ', I ')
        : `I commit to honoring ${v.name} in my daily choices.`,
    })),
  };
}

export async function POST(request: Request) {
  let requestValues: ValueInput[] = [];

  try {
    const body = await request.json();
    const { values, story } = body as { values: ValueInput[]; story: string };
    requestValues = values || [];

    // Validate input
    if (!values || !Array.isArray(values) || values.length === 0) {
      return NextResponse.json({ error: 'No values provided' }, { status: 400 });
    }

    // Handle missing story gracefully
    const storyContext = story?.trim()
      ? `The user wrote this story about their values:\n"${story}"`
      : 'The user did not provide a story.';

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `You are a professional copywriter creating beautiful, inspiring text for a personal values card.

CONTEXT:
${storyContext}

Their three core values with raw text are:
${values.map((v, i) => `
${i + 1}. ${v.name} (id: ${v.id})
   Raw tagline: "${v.rawTagline || 'none'}"
   Raw commitment: "${v.rawCommitment || 'none'}"
`).join('')}

YOUR TASK:
Polish each value's tagline and commitment into beautiful, card-ready copy.

REQUIREMENTS:
1. TAGLINE (5-10 words):
   - Inspiring, personal statement
   - Use active voice
   - Complete thought (no fragments)
   - Example: "Embracing growth through every challenge"

2. COMMITMENT (15-25 words):
   - Transform awkward "If X, then I will Y" into flowing prose
   - Keep the if-then intent but make it sound natural
   - Make it personal and actionable
   - Example: "When fear of failure arises, I pause and remind myself that growth happens outside my comfort zone."

Respond with JSON only (no markdown):
{
  "values": [
    { "id": "value_id", "name": "VALUE_NAME", "tagline": "...", "commitment": "..." }
  ]
}`
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      console.error('Polish API: Non-text response from Claude');
      return NextResponse.json(getFallbackPolish(values));
    }

    // Parse JSON with error handling
    try {
      // Strip markdown code blocks if present
      const jsonText = content.text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const result = JSON.parse(jsonText);

      // Validate result structure
      if (!result.values || !Array.isArray(result.values)) {
        console.error('Polish API: Invalid response structure');
        return NextResponse.json(getFallbackPolish(values));
      }

      return NextResponse.json(result);
    } catch (parseError) {
      console.error('Polish API: JSON parse error', parseError);
      return NextResponse.json(getFallbackPolish(values));
    }
  } catch (error) {
    console.error('Polish API error:', error);
    // Return fallback instead of error - graceful degradation
    if (requestValues.length > 0) {
      return NextResponse.json(getFallbackPolish(requestValues));
    }
    return NextResponse.json({
      values: [],
      error: 'Failed to polish text'
    }, { status: 500 });
  }
}
