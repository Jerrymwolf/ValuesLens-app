import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

interface WOOPRequest {
  valueName: string;
  storyText?: string;
  definition?: string;
}

interface WOOPResponse {
  outcomes: string[];
  obstacles: string[];
  actionSuggestions: Record<string, string[]>;
}

// Tool definitions for structured output
const tools: Anthropic.Tool[] = [
  {
    name: 'generate_woop_suggestions',
    description: 'Generate WOOP methodology suggestions for a value',
    input_schema: {
      type: 'object' as const,
      properties: {
        outcomes: {
          type: 'array',
          items: { type: 'string' },
          minItems: 3,
          maxItems: 3,
          description: '3 specific, emotionally resonant outcomes - what life looks like when fully living this value. Each should be under 15 words.',
        },
        obstacles: {
          type: 'array',
          items: { type: 'string' },
          minItems: 4,
          maxItems: 4,
          description: '4 internal obstacles - psychological barriers (fears, habits, beliefs) that typically prevent people from living this value. Each should be 3-6 words.',
        },
        action_suggestions: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: { type: 'string' },
            minItems: 2,
            maxItems: 3,
          },
          description: 'For each obstacle, 2-3 specific "then I will..." action suggestions. Keys should match the obstacles exactly.',
        },
      },
      required: ['outcomes', 'obstacles', 'action_suggestions'],
    },
  },
];

function buildSystemPrompt(): string {
  return `You are a values coach using the WOOP (Wish, Outcome, Obstacle, Plan) methodology by Dr. Gabriele Oettingen.

Your job is to help people create implementation intentions for living their values in 2026.

PRINCIPLES:
1. OUTCOMES should be vivid and emotional - what does success FEEL like? What does life look like?
2. OBSTACLES must be INTERNAL - fears, doubts, habits, beliefs, tendencies (NOT external circumstances)
3. ACTION SUGGESTIONS should be specific and doable in the moment
4. Keep everything concise - under 15 words each
5. Make it personal to their context when story is provided

EXAMPLES OF GOOD INTERNAL OBSTACLES:
- "Fear of being judged"
- "Desire to avoid conflict"
- "Perfectionism and self-doubt"
- "Tendency to people-please"
- "Impatience with others"
- "Fear of vulnerability"
- "Habit of overcommitting"

EXAMPLES OF GOOD ACTION SUGGESTIONS:
- "take a deep breath and speak my truth anyway"
- "pause and ask: what matters most right now?"
- "remember my why and act with courage"
- "choose authenticity over approval"
- "respond rather than react"

Use the generate_woop_suggestions tool to provide structured output.`;
}

function buildUserPrompt(valueName: string, storyText?: string, definition?: string): string {
  let prompt = `Generate WOOP suggestions for this value:

VALUE: ${valueName}
`;

  if (definition) {
    prompt += `
VALUE DEFINITION: "${definition}"
`;
  }

  if (storyText && storyText.trim().length > 0) {
    prompt += `
USER'S STORY (about living their values):
"${storyText}"

Use their story context to make suggestions more personal and relevant.
`;
  }

  prompt += `
Now generate:
1. 3 vivid OUTCOMES for fully living this value
2. 4 INTERNAL OBSTACLES that might prevent them from living it
3. 2-3 specific action suggestions for each obstacle

Use the generate_woop_suggestions tool.`;

  return prompt;
}

function generateFallbackWOOP(valueName: string): WOOPResponse {
  const lowerName = valueName.toLowerCase();

  const outcomes = [
    `Feel authentic and aligned with ${lowerName} in all decisions`,
    `Experience deeper, more meaningful relationships through ${lowerName}`,
    `Wake up feeling proud of how I live ${lowerName} daily`,
  ];

  const obstacles = [
    'Fear of being judged',
    'Desire to avoid discomfort',
    'Old habits and patterns',
    'Self-doubt in difficult moments',
  ];

  const actionSuggestions: Record<string, string[]> = {
    'Fear of being judged': [
      'take a breath and speak my truth anyway',
      'remember that authenticity matters more than approval',
    ],
    'Desire to avoid discomfort': [
      'lean into the discomfort as growth',
      'remind myself that short-term ease often leads to long-term regret',
    ],
    'Old habits and patterns': [
      'pause before reacting and choose consciously',
      'ask: what would my best self do here?',
    ],
    'Self-doubt in difficult moments': [
      'recall a time I successfully lived this value',
      'trust my values over my fears',
    ],
  };

  return { outcomes, obstacles, actionSuggestions };
}

export async function POST(request: Request) {
  try {
    const body: WOOPRequest = await request.json();
    const { valueName, storyText, definition } = body;

    if (!valueName) {
      return NextResponse.json(
        { error: 'Value name is required' },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('No ANTHROPIC_API_KEY found, using fallback WOOP');
      return NextResponse.json({
        ...generateFallbackWOOP(valueName),
        fallback: true,
      });
    }

    // Call Anthropic API with tools
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      tools,
      system: buildSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(valueName, storyText, definition),
        },
      ],
    });

    // Extract tool_use block from response
    const toolUseBlock = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    if (toolUseBlock && toolUseBlock.name === 'generate_woop_suggestions') {
      const input = toolUseBlock.input as {
        outcomes: string[];
        obstacles: string[];
        action_suggestions: Record<string, string[]>;
      };

      return NextResponse.json({
        outcomes: input.outcomes,
        obstacles: input.obstacles,
        actionSuggestions: input.action_suggestions,
      });
    }

    // Fallback if no tool use
    return NextResponse.json({
      ...generateFallbackWOOP(valueName),
      fallback: true,
    });
  } catch (error) {
    console.error('WOOP generation error:', error);

    // Return fallback on error
    try {
      const body: WOOPRequest = await request.clone().json();
      return NextResponse.json({
        ...generateFallbackWOOP(body.valueName || 'this value'),
        fallback: true,
        error: 'AI generation failed, using fallback suggestions',
      });
    } catch {
      return NextResponse.json(
        { error: 'Failed to generate WOOP suggestions' },
        { status: 500 }
      );
    }
  }
}
