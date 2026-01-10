import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

interface ValueInput {
  id: string;
  name: string;
}

// New v11 format
interface WOOPRequestNew {
  values: ValueInput[];
  story: string;
}

// Legacy format (for backwards compatibility)
interface WOOPRequestLegacy {
  valueName: string;
  storyText?: string;
  definition?: string;
}

// Legacy response format
interface WOOPResponseLegacy {
  outcomes: string[];
  obstacles: string[];
  actionSuggestions: Record<string, string[]>;
}

interface WOOPItem {
  value_id: string;
  outcome: string;
  obstacle: string;
  obstacle_category: 'AVOIDANCE' | 'EXCESS' | 'TIMING' | 'SELF-PROTECTION' | 'IDENTITY';
  reframe: string;
}

interface WOOPResponse {
  language_to_echo: string[];
  woop: WOOPItem[];
}

// Tool definitions for structured output
const tools: Anthropic.Tool[] = [
  {
    name: 'generate_woop_analysis',
    description: 'Generate WOOP analysis with obstacles, reframes, and language extraction',
    input_schema: {
      type: 'object' as const,
      properties: {
        language_to_echo: {
          type: 'array',
          items: { type: 'string' },
          description: 'Exact phrases from user story to echo back (at least 5)',
        },
        woop: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value_id: { type: 'string', description: 'The value ID from the request' },
              outcome: { type: 'string', description: 'Vivid emotional picture, 10-20 words' },
              obstacle: { type: 'string', description: 'my [feeling-word] that/of [pattern], 8-15 words' },
              obstacle_category: {
                type: 'string',
                enum: ['AVOIDANCE', 'EXCESS', 'TIMING', 'SELF-PROTECTION', 'IDENTITY'],
                description: 'Category of obstacle - must use at least 2 different categories across 3 values',
              },
              reframe: { type: 'string', description: 'Sticky phrase with rhythm/tension/surprise, 3-8 words' },
            },
            required: ['value_id', 'outcome', 'obstacle', 'obstacle_category', 'reframe'],
          },
        },
      },
      required: ['language_to_echo', 'woop'],
    },
  },
];

const SYSTEM_PROMPT = `You generate WOOP (Wish, Outcome, Obstacle, Plan) analysis that captures the emotional truth of someone's relationship with their values.

<your_task>
For each value, extract:
1. OUTCOME: What living this value FEELS like (vivid, relational, relief-oriented)
2. OBSTACLE: The INTERNAL pattern that blocks it (named with their emotional language)
3. REFRAME: The flip that transforms obstacle into fuel (sticky, 3-8 words)
4. OBSTACLE_CATEGORY: Which type (for differentiation)

Plus, extract globally:
5. LANGUAGE_TO_ECHO: Their exact words/phrases to weave into the final card

The obstacle must pass the WINCE-AND-NOD test: uncomfortable enough to make them wince, accurate enough to make them nod.
</your_task>

<obstacle_categories>
Assign each value to a DIFFERENT category:

AVOIDANCE: Dodging discomfort, conflict, judgment, vulnerability
EXCESS: Overdoing, overcontrolling, overcommitting, perfectionism
TIMING: Waiting, rushing, delaying, impatience
SELF-PROTECTION: Hiding, minimizing, deflecting, rationalizing
IDENTITY: Role constraints, "I'm not the type who...", fear of change

Requirement: 3 values = at least 2 different categories (ideally 3)
</obstacle_categories>

<emotional_extraction>
From their story, find:

THEIR EXACT WORDS: What phrases do they use? "Abandoned," "shelved," "burning out," "400 interviews"—capture these verbatim for the language_to_echo field.

THEIR WOUND: What's the emotional core beneath the story? Not "waiting for permission" but "the fear that acting alone means I don't belong."

THEIR DESIRE: What are they hungry for? What are they protecting? This fuels the outcome.

THEIR TELL: What specific behavior reveals the pattern? This becomes anchor triggers.

THE WINCE: What would be uncomfortable for them to read? That's the obstacle.

THE NOD: What would they immediately recognize as true? That's also the obstacle.
</emotional_extraction>

<reframe_stickiness>
A sticky reframe has:
- RHYTHM: 3-8 words, often with beat/cadence ("Not knowing is the starting line")
- TENSION: Two ideas in productive conflict ("Depth over volume")
- SURPRISE: An unexpected word or framing ("My place is with the 400, not the org chart")
- THEIR LANGUAGE: Uses a word from their story when possible

Test: Would they write this on a sticky note? Would they remember it tomorrow?
</reframe_stickiness>

<example input="rich story">
INPUT:
VALUES: Integrity, Care, Curiosity
STORY: "I'm a Coast Guard Command Master Chief doing dissertation research. I had 400 interviews that got shelved when leadership changed. Instead of waiting for permission, I built an AI system to analyze them myself. Waiting for approval was actually abandoning the people who shared their stories."

EXTRACTION:
- THEIR EXACT WORDS: "400 interviews," "shelved," "waiting for permission," "abandoning," "leadership changed," "built an AI system"
- THEIR WOUND: Fear that acting without institutional sanction means betraying his identity as a loyal servicemember
- THEIR DESIRE: To honor the 400 people who trusted him; to matter beyond his role
- THEIR TELL: Drafting permission requests; pausing when leadership shifts; saying "I should run this by someone"
- THE WINCE: He knows he's used "waiting for permission" as cover for avoiding risk
- THE NOD: He already broke the pattern once (built the AI system)—he knows he can

OUTPUT:
{
  "language_to_echo": ["400 interviews", "shelved", "waiting for permission", "abandoning", "leadership changed", "built an AI system", "shared their stories"],
  "woop": [
    {
      "value_id": "integrity",
      "outcome": "I act before the memo comes, and people trust me more for it—not less",
      "obstacle": "my fear that acting without approval means I've abandoned my place in the institution I love",
      "obstacle_category": "IDENTITY",
      "reframe": "My place is with the 400"
    },
    {
      "value_id": "care",
      "outcome": "The people who trusted me see their voices carried forward, not archived and forgotten",
      "obstacle": "my habit of letting 'shelved' become 'forgotten'—treating institutional time as more real than human trust",
      "obstacle_category": "TIMING",
      "reframe": "Shelved is not safe"
    },
    {
      "value_id": "curiosity",
      "outcome": "I build what doesn't exist yet and feel more alive than when I follow the playbook",
      "obstacle": "my pattern of hiding behind 'I don't know how' as permission to stay still",
      "obstacle_category": "SELF-PROTECTION",
      "reframe": "Not knowing is the starting line"
    }
  ]
}
</example>

<example input="thin story">
INPUT:
VALUES: Growth, Balance, Connection
STORY: "I keep saying yes to everything and burning out."

EXTRACTION:
- THEIR EXACT WORDS: "saying yes to everything," "burning out"
- THEIR WOUND: Fear that setting limits means being less valuable/lovable
- THEIR DESIRE: To feel sustainable; to be valued for quality not availability
- THEIR TELL: Automatic "yes" before thinking; overloaded calendar; skipped meals/rest
- THE WINCE: They know "yes" is often self-protection disguised as generosity
- THE NOD: They named the pattern themselves—they're ready to change

OUTPUT:
{
  "language_to_echo": ["saying yes to everything", "burning out"],
  "woop": [
    {
      "value_id": "growth",
      "outcome": "I finish fewer things but finish them proud—and feel real progress, not just motion",
      "obstacle": "my belief that busyness proves my worth—that slowing down means falling behind",
      "obstacle_category": "EXCESS",
      "reframe": "Depth is the shortcut"
    },
    {
      "value_id": "balance",
      "outcome": "I rest without earning it first, and return sharper than when I left",
      "obstacle": "my guilt about stopping before everything is handled—as if my needs are the lowest priority",
      "obstacle_category": "SELF-PROTECTION",
      "reframe": "Rest is not the reward"
    },
    {
      "value_id": "connection",
      "outcome": "The people I love get my presence, not my performance—and trust me more for it",
      "obstacle": "my fear that 'no' will cost me relationships—that I'm only valuable when I'm available",
      "obstacle_category": "IDENTITY",
      "reframe": "No is how I stay"
    }
  ]
}
</example>

<quality_gate>
PRIORITY ORDER (fix these first):
1. WINCE-AND-NOD: Does each obstacle make them uncomfortable AND ring true?
2. THEIR WORDS: Did you capture their exact language in language_to_echo?
3. CATEGORY DIVERSITY: At least 2 different obstacle categories?
4. STICKY REFRAMES: Rhythm + tension + surprise? Would they remember tomorrow?
5. FEELING-FIRST OBSTACLES: Does each obstacle name a FEELING (fear, guilt, habit, belief), not just a behavior?
</quality_gate>

<rules>
1. EXTRACT language_to_echo FIRST. This is the foundation.
2. OBSTACLES name FEELINGS, not just behaviors.
3. CATEGORY DIVERSITY is mandatory.
4. REFRAMES must be sticky: rhythm, tension, surprise.
5. WINCE-AND-NOD: If it's comfortable, it's wrong. If they'd argue with it, it's also wrong.
</rules>

Use the generate_woop_analysis tool to provide structured output.`;

function buildUserPrompt(values: ValueInput[], story: string): string {
  const valueList = values.map(v => `${v.name} (id: ${v.id})`).join(', ');

  return `Generate WOOP analysis for these values:

VALUES: ${valueList}

STORY: "${story || 'No story provided.'}"

Extract their language, identify obstacles with category diversity, and create sticky reframes.

Use the generate_woop_analysis tool.`;
}

function generateFallbackWOOP(values: ValueInput[]): WOOPResponse {
  const categories: Array<'AVOIDANCE' | 'EXCESS' | 'TIMING' | 'SELF-PROTECTION' | 'IDENTITY'> =
    ['AVOIDANCE', 'EXCESS', 'TIMING', 'SELF-PROTECTION', 'IDENTITY'];

  return {
    language_to_echo: [],
    woop: values.map((v, i) => ({
      value_id: v.id,
      outcome: `I live ${v.name.toLowerCase()} fully and feel aligned with who I want to be`,
      obstacle: `my fear of discomfort that keeps me from fully committing to ${v.name.toLowerCase()}`,
      obstacle_category: categories[i % categories.length],
      reframe: 'Discomfort is the door',
    })),
  };
}

// Generate legacy fallback for backwards compatibility
function generateFallbackLegacy(valueName: string): WOOPResponseLegacy {
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
      'sit with the discomfort as growth',
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

// Transform v11 response to legacy format
function transformToLegacy(woopResponse: WOOPResponse, valueName: string): WOOPResponseLegacy {
  const woopItem = woopResponse.woop[0];

  // Generate varied outcomes based on the single value
  const outcomes = [
    woopItem?.outcome || `Live ${valueName.toLowerCase()} fully`,
    `Feel aligned and authentic when choosing ${valueName.toLowerCase()}`,
    `Experience the freedom that comes from living ${valueName.toLowerCase()}`,
  ];

  // Generate obstacles from the single woop item
  const obstacles = [
    woopItem?.obstacle || 'Fear of being judged',
    'Desire to avoid discomfort',
    'Old habits and patterns',
    'Self-doubt in difficult moments',
  ];

  // Generate action suggestions for each obstacle
  const actionSuggestions: Record<string, string[]> = {};
  obstacles.forEach((obstacle, i) => {
    if (i === 0 && woopItem?.reframe) {
      actionSuggestions[obstacle] = [
        woopItem.reframe,
        'pause and reconnect with what matters',
      ];
    } else {
      actionSuggestions[obstacle] = [
        'pause and reconnect with what matters',
        'remember why this value is important to me',
      ];
    }
  });

  return { outcomes, obstacles, actionSuggestions };
}

// Check if request is legacy format
function isLegacyRequest(body: unknown): body is WOOPRequestLegacy {
  return typeof body === 'object' && body !== null && 'valueName' in body;
}

export async function POST(request: Request) {
  let requestValues: ValueInput[] = [];
  let isLegacy = false;
  let legacyValueName = '';

  try {
    const body = await request.json();

    // Detect legacy format
    if (isLegacyRequest(body)) {
      isLegacy = true;
      legacyValueName = body.valueName;

      if (!body.valueName) {
        return NextResponse.json(
          { error: 'Value name is required' },
          { status: 400 }
        );
      }

      // Convert legacy to new format
      requestValues = [{
        id: body.valueName.toLowerCase().replace(/\s+/g, '_'),
        name: body.valueName,
      }];

      // Check for API key - return legacy fallback
      if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('No ANTHROPIC_API_KEY found, using fallback WOOP');
        return NextResponse.json({
          ...generateFallbackLegacy(body.valueName),
          fallback: true,
        });
      }

      // Call API with converted format
      const response = await client.messages.create({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 1000,
        temperature: 0.7,
        tools,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: buildUserPrompt(requestValues, body.storyText || ''),
          },
        ],
      });

      // Extract tool_use block
      const toolUseBlock = response.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      if (toolUseBlock && toolUseBlock.name === 'generate_woop_analysis') {
        const input = toolUseBlock.input as {
          language_to_echo: string[];
          woop: WOOPItem[];
        };

        // Transform to legacy format
        const legacyResponse = transformToLegacy(
          { language_to_echo: input.language_to_echo, woop: input.woop },
          body.valueName
        );
        return NextResponse.json(legacyResponse);
      }

      // Fallback if no tool use
      return NextResponse.json({
        ...generateFallbackLegacy(body.valueName),
        fallback: true,
      });
    }

    // New v11 format
    const { values, story } = body as WOOPRequestNew;
    requestValues = values || [];

    if (!values || values.length === 0) {
      return NextResponse.json(
        { error: 'Values are required' },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('No ANTHROPIC_API_KEY found, using fallback WOOP');
      return NextResponse.json({
        ...generateFallbackWOOP(values),
        fallback: true,
      });
    }

    // Call Anthropic API with tools
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 1000,
      temperature: 0.7,
      tools,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(values, story),
        },
      ],
    });

    // Extract tool_use block from response
    const toolUseBlock = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    if (toolUseBlock && toolUseBlock.name === 'generate_woop_analysis') {
      const input = toolUseBlock.input as {
        language_to_echo: string[];
        woop: WOOPItem[];
      };

      return NextResponse.json({
        language_to_echo: input.language_to_echo,
        woop: input.woop,
      });
    }

    // Fallback if no tool use
    return NextResponse.json({
      ...generateFallbackWOOP(values),
      fallback: true,
    });
  } catch (error) {
    console.error('WOOP generation error:', error);

    // Return appropriate fallback based on format
    if (isLegacy && legacyValueName) {
      return NextResponse.json({
        ...generateFallbackLegacy(legacyValueName),
        fallback: true,
        error: 'AI generation failed, using fallback suggestions',
      });
    }

    if (requestValues.length > 0) {
      return NextResponse.json({
        ...generateFallbackWOOP(requestValues),
        fallback: true,
        error: 'AI generation failed, using fallback suggestions',
      });
    }

    return NextResponse.json(
      { error: 'Failed to generate WOOP analysis' },
      { status: 500 }
    );
  }
}
