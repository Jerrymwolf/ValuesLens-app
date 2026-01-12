import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

// Netlify timeout config
export const maxDuration = 26;

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

// Fallback function if AI fails - returns stronger cleaned-up versions
function getFallbackPolish(values: ValueInput[]): { values: PolishedValue[] } {
  return {
    values: values.map((v) => ({
      id: v.id,
      name: v.name,
      tagline: v.rawTagline && v.rawTagline !== '[none provided]'
        ? v.rawTagline
        : `${v.name} guides my choices`,
      commitment: v.rawCommitment && v.rawCommitment !== '[none provided]'
        ? v.rawCommitment
            .replace(/^If\s+/i, 'When ')
            .replace(/,\s*then I will\s*/i, ', I ')
            .replace(/\.\s*$/, '') + '.'
        : `When tested, I return to ${v.name}. It anchors me.`,
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

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: `You are a master copywriter who transforms raw text into powerful, memorable personal declarations.

CONTEXT:
${storyContext}

VALUES TO POLISH:
${values.map((v, i) => `
${i + 1}. ${v.name}${v.id.startsWith('custom_') ? ' (custom value)' : ''} [id: ${v.id}]
   Raw tagline: "${v.rawTagline || '[none provided]'}"
   Raw commitment: "${v.rawCommitment || '[none provided]'}"
`).join('')}

YOUR TASK:
Transform each value into powerful, personal declarations that feel like battle cries—not greeting cards.

═══════════════════════════════════════
CRITICAL RULES (MUST FOLLOW):
═══════════════════════════════════════

1. NO CLICHÉS: Never use these words: "embrace", "journey", "path", "strive", "navigate", "cultivate", "empower", "mindful"

2. HONOR ORIGINAL INTENT: If raw commitment mentions a specific trigger (e.g., "fear of failure"), keep that trigger. Polish the language, don't replace the meaning.

3. HANDLE MISSING DATA:
   - If tagline is "[none provided]": Create one based on the value name and any story context
   - If commitment is "[none provided]": Create a general affirmation for that value

4. CUSTOM VALUES: For custom values, be especially thoughtful—these are deeply personal to the user.

═══════════════════════════════════════
TAGLINE (5-8 words):
═══════════════════════════════════════
- First person when possible ("I" statements)
- Punchy, memorable, quotable
- Complete thought

❌ WEAK: "Embracing growth through every challenge"
❌ WEAK: "Living with authenticity each day"
❌ WEAK: "Striving for excellence always"

✅ STRONG: "I bend but never break"
✅ STRONG: "My word is my bond"
✅ STRONG: "Truth over comfort, always"
✅ STRONG: "I show up, especially when it's hard"

═══════════════════════════════════════
COMMITMENT (15-25 words):
═══════════════════════════════════════
- Format: TRIGGER → ACTION
- Keep the user's original trigger if provided
- Make it a daily mantra they could repeat

❌ WEAK: "When challenges arise, I remind myself to stay positive and keep going forward"
❌ WEAK: "I will try to be more courageous in difficult situations"

✅ STRONG: "When doubt whispers, I take one step forward anyway. Motion defeats fear."
✅ STRONG: "When the easy path calls, I choose the right one. Integrity isn't optional."
✅ STRONG: "When I want to hide, I speak up. My voice matters."

Respond with JSON only (no markdown, no explanation):
{
  "values": [
    { "id": "value_id", "name": "VALUE_NAME", "tagline": "...", "commitment": "..." }
  ]
}`
      }]
    });

    const response = await stream.finalMessage();
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
