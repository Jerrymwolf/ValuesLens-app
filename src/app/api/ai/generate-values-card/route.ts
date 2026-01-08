import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

interface ValueInput {
  id: string;
  name: string;
}

interface WOOPInput {
  obstacle: string;
  action: string;
}

interface ValuesCardRequest {
  values: ValueInput[];
  story: string;
  woop: Record<string, WOOPInput>;
}

interface ValueOutput {
  id: string;
  name: string;
  tagline: string;
  commitment: string;
  definition: string;
  behavioral_anchors: string[];
  weekly_question: string;
}

interface ValuesCardResponse {
  values: ValueOutput[];
}

const SYSTEM_PROMPT = `You create 2026 Values Cards and Plans.

CARD (free): tagline + commitment
PLAN (premium): definition + behavioral_anchors + weekly_question

EXAMPLE 1 (rich story):

Input:
VALUES: Integrity, Care, Curiosity
STORY: "I avoid hard conversations because I want to be liked. But protecting people matters more than my comfort. I've learned that silence isn't neutral."
WOOP:
- Integrity: "wanting to avoid hard conversations" → "approach with curiosity not judgment"
- Care: "discomfort with difficult conversations" → "protect people over awkwardness"
- Curiosity: "impatience with slow discovery" → "trust patient observation"

Output:
{
  "values": [
    {
      "id": "integrity",
      "name": "INTEGRITY",
      "tagline": "Say it in the room.",
      "commitment": "When I'm drafting the softer version, I say the real one while we're still together.",
      "definition": "My silence isn't neutral. When I hold back to stay comfortable, someone else pays.",
      "behavioral_anchors": [
        "When I'm rehearsing a softer version—I say the real one instead",
        "When I leave a meeting and say what I wish I'd said—I go back",
        "When I tell myself 'now isn't the time'—I ask when is"
      ],
      "weekly_question": "What did I not say this week that someone needed to hear?"
    },
    {
      "id": "care",
      "name": "CARE",
      "tagline": "Awkward protects. Silence harms.",
      "commitment": "When I want to spare someone discomfort, I remember—delay is the damage.",
      "definition": "Real care is giving people what they need, not what's easy for me to give.",
      "behavioral_anchors": [
        "When feedback sits in my chest for more than a day—I deliver it today",
        "When I want to let something slide—I ask who that actually protects",
        "When I'm about to say 'it's fine' and it isn't—I say what's true"
      ],
      "weekly_question": "Who needed hard truth from me this week? Did I give it or withhold it?"
    },
    {
      "id": "curiosity",
      "name": "CURIOSITY",
      "tagline": "Not yet. Stay.",
      "commitment": "When I want to fix it fast, I ask what I'm not seeing first.",
      "definition": "Slowing down reveals what rushing hides. Sometimes the question matters more than the answer.",
      "behavioral_anchors": [
        "When I feel the urge to solve it—I ask one more question first",
        "When I think I already know—I check by asking, not assuming",
        "When ten more seconds feels unbearable—I stay anyway"
      ],
      "weekly_question": "What did I almost miss this week by moving too fast?"
    }
  ]
}

EXAMPLE 2 (thin story):

Input:
VALUES: Family, Growth, Honesty
STORY: "My family matters most. I want to keep growing. I value honesty."
WOOP:
- Family: "putting work first" → "be present"
- Growth: "fear of failure" → "try anyway"
- Honesty: "wanting to avoid conflict" → "speak up"

Output:
{
  "values": [
    {
      "id": "family",
      "name": "FAMILY",
      "tagline": "They're waiting. Go home.",
      "commitment": "When work asks for one more hour, I check what I already promised at home.",
      "definition": "My family doesn't need the best of what's left. They need me to show up while it counts.",
      "behavioral_anchors": [
        "When I say 'just five more minutes'—I close the laptop now",
        "When I'm home but scrolling—I put the phone in another room",
        "When I'm about to cancel plans—I ask if I'd regret this in ten years"
      ],
      "weekly_question": "Was I present this week, or just physically there?"
    },
    {
      "id": "growth",
      "name": "GROWTH",
      "tagline": "Scared is not the same as stuck.",
      "commitment": "When failure feels like a reason to stop, I treat it as a direction to move.",
      "definition": "Growth lives on the other side of the thing I'm avoiding. Fear is the compass, not the wall.",
      "behavioral_anchors": [
        "When I'm avoiding something—I ask what I'm afraid of",
        "When I fail—I write down one thing it taught me before I quit",
        "When I want to stay comfortable—I pick the harder option once this week"
      ],
      "weekly_question": "What did I avoid this week because I was afraid to fail?"
    },
    {
      "id": "honesty",
      "name": "HONESTY",
      "tagline": "Conflict fades. Resentment stays.",
      "commitment": "When I want to keep the peace, I ask what I'm sacrificing to keep it.",
      "definition": "Honesty isn't about being harsh. It's about trusting the relationship to hold the truth.",
      "behavioral_anchors": [
        "When I'm about to say 'whatever you want'—I say what I actually want",
        "When I'm nodding but disagreeing—I voice the disagreement",
        "When I rehearse the safe version—I say the honest one"
      ],
      "weekly_question": "Where did I stay quiet this week to avoid conflict?"
    }
  ]
}

STRUCTURE:
- id: The value ID passed in the request (return it unchanged)
- name: The value name in UPPERCASE
- tagline: 3-6 words. A phrase they say to themselves in the moment.
- commitment: Under 20 words. "When I [specific moment], I [action]."
- definition: 1-2 sentences. What this value means to THEM.
- behavioral_anchors: 3 items. Format: "When I [notice X]—I [do Y]"
- weekly_question: Starts with "What did I..." or "Where did I..." or "Who..."

RULES:
1. Three values = three different obstacles. If inputs overlap, create distinct reframes.
2. Thin story = more specific behavioral anchors to compensate.
3. Weekly questions expose avoidance. Not "Did I do well?" but "Where did I fall short?"
4. No clichés: embrace, journey, navigate, cultivate, strive, authentic, mindful.
5. Return valid JSON only.`;

function buildUserPrompt(
  values: ValueInput[],
  story: string,
  woop: Record<string, WOOPInput>
): string {
  const valueNames = values.map((v) => v.name).join(', ');
  const woopLines = values
    .map((v) => {
      const w = woop[v.id];
      return `- ${v.name}: "${w?.obstacle || 'unknown'}" → "${w?.action || 'take action'}"`;
    })
    .join('\n');

  return `VALUES: ${valueNames}

STORY: "${story || 'No story provided.'}"

WOOP:
${woopLines}

Generate the Values Card and Plan. Return the JSON with the exact IDs provided: ${values.map((v) => v.id).join(', ')}`;
}

function generateFallback(values: ValueInput[]): ValuesCardResponse {
  return {
    values: values.map((v) => ({
      id: v.id,
      name: v.name.toUpperCase(),
      tagline: `${v.name} guides my choices.`,
      commitment: `When ${v.name.toLowerCase()} is tested, I return to what matters.`,
      definition: `${v.name} means showing up consistently, especially when it's hard.`,
      behavioral_anchors: [
        `When I notice tension—I pause and choose ${v.name.toLowerCase()}`,
        `When I want to avoid—I lean into ${v.name.toLowerCase()} anyway`,
        `When I doubt myself—I remember why ${v.name.toLowerCase()} matters`,
      ],
      weekly_question: `Where did ${v.name.toLowerCase()} show up for me this week?`,
    })),
  };
}

export async function POST(request: Request) {
  let requestValues: ValueInput[] = [];

  try {
    const body: ValuesCardRequest = await request.json();
    const { values, story, woop } = body;
    requestValues = values || [];

    if (!values || values.length === 0) {
      return NextResponse.json(
        { error: 'Values are required' },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('No ANTHROPIC_API_KEY found, using fallback');
      return NextResponse.json({
        ...generateFallback(values),
        fallback: true,
      });
    }

    // Call Anthropic API
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(values, story, woop),
        },
      ],
    });

    // Extract text content
    const content = response.content[0];
    if (content.type !== 'text') {
      console.error('Non-text response from Claude');
      return NextResponse.json({
        ...generateFallback(values),
        fallback: true,
      });
    }

    // Parse JSON response
    try {
      // Strip markdown code blocks if present
      const jsonText = content.text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const result = JSON.parse(jsonText) as ValuesCardResponse;

      // Validate result structure
      if (!result.values || !Array.isArray(result.values)) {
        console.error('Invalid response structure');
        return NextResponse.json({
          ...generateFallback(values),
          fallback: true,
        });
      }

      // Ensure IDs match what was sent (in case AI changed them)
      const correctedValues = result.values.map((v, i) => ({
        ...v,
        id: values[i]?.id || v.id,
      }));

      return NextResponse.json({ values: correctedValues });
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json({
        ...generateFallback(values),
        fallback: true,
      });
    }
  } catch (error) {
    console.error('Values card generation error:', error);

    // Return fallback on error
    if (requestValues.length > 0) {
      return NextResponse.json({
        ...generateFallback(requestValues),
        fallback: true,
        error: 'AI generation failed, using fallback',
      });
    }

    return NextResponse.json(
      { error: 'Failed to generate values card' },
      { status: 500 }
    );
  }
}
