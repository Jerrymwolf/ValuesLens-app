import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { VALUES_BY_ID } from '@/lib/data/values';

const client = new Anthropic();

interface DefinitionsRequest {
  sessionId: string;
  rankedValues: string[];
  transcript: string;
  sortedValues: { very: string[]; somewhat: string[]; less: string[] };
  goals: Record<string, string>;
  customValue?: { id: string; name: string };
}

interface ValueDefinition {
  tagline: string;
  definition?: string;
  behavioralAnchors?: string[];
  userEdited: boolean;
}

const tools: Anthropic.Tool[] = [
  {
    name: 'generate_value_definitions',
    description: 'Generate personalized definitions for user values based on their story and goals',
    input_schema: {
      type: 'object' as const,
      properties: {
        definitions: {
          type: 'object',
          description: 'Map of value IDs to their personalized definitions',
          additionalProperties: {
            type: 'object',
            properties: {
              tagline: {
                type: 'string',
                description: 'A short, punchy tagline (5-10 words) that captures how this person lives this value',
              },
              definition: {
                type: 'string',
                description: 'A 1-2 sentence personalized definition based on their story and goals',
              },
              behavioralAnchors: {
                type: 'array',
                items: { type: 'string' },
                description: '2-3 specific behavioral examples of living this value',
              },
            },
            required: ['tagline'],
          },
        },
      },
      required: ['definitions'],
    },
  },
];

function buildSystemPrompt(): string {
  return `You are a values coach helping people articulate their personal values for 2026.

Your job is to create PERSONALIZED definitions that reflect how THIS specific person lives their values, based on:
1. Their story/transcript (what they shared about their values)
2. Their WOOP goals (their if-then commitments)
3. The specific values they chose

GUIDELINES:
- Taglines should be punchy and personal (5-10 words), not generic dictionary definitions
- Definitions should reference their specific context when possible
- Behavioral anchors should be concrete, actionable examples
- Write in second person ("You..." or "Your...")
- Make it feel like THEIR definition, not a textbook definition

EXAMPLES OF GOOD TAGLINES:
- "Speaking truth even when your voice shakes"
- "Choosing growth over comfort, always"
- "Making space for what actually matters"
- "Standing firm when others would bend"

Use the generate_value_definitions tool to return structured output.`;
}

function buildUserPrompt(
  values: Array<{ id: string; name: string }>,
  transcript: string,
  goals: Record<string, string>
): string {
  const valuesList = values
    .map((v, i) => `${i + 1}. ${v.name} (ID: ${v.id})`)
    .join('\n');

  const goalsList = values
    .map((v) => `- ${v.name}: "${goals[v.id] || 'No goal set'}"`)
    .join('\n');

  let prompt = `Generate personalized definitions for these top values:

VALUES (in order of importance):
${valuesList}

`;

  if (transcript && transcript.trim()) {
    prompt += `USER'S STORY:
"${transcript}"

`;
  }

  prompt += `USER'S COMMITMENTS (if-then goals):
${goalsList}

Generate a tagline, definition, and 2-3 behavioral anchors for each value ID.
Use the generate_value_definitions tool.`;

  return prompt;
}

function generateFallbackDefinitions(
  values: Array<{ id: string; name: string }>
): Record<string, ValueDefinition> {
  const definitions: Record<string, ValueDefinition> = {};

  for (const value of values) {
    const baseValue = VALUES_BY_ID[value.id];
    definitions[value.id] = {
      tagline: baseValue?.cardText || `Living ${value.name} with intention`,
      definition: `${value.name} guides your decisions and shapes who you're becoming.`,
      behavioralAnchors: [
        `Notice moments when ${value.name.toLowerCase()} shows up in your life`,
        `Choose ${value.name.toLowerCase()} even when it's difficult`,
      ],
      userEdited: false,
    };
  }

  return definitions;
}

export async function POST(request: Request) {
  try {
    const body: DefinitionsRequest = await request.json();
    const { rankedValues, transcript, goals, customValue } = body;

    if (!rankedValues || rankedValues.length === 0) {
      return NextResponse.json(
        { error: 'Ranked values are required' },
        { status: 400 }
      );
    }

    // Get top 3 values with names
    const top3Values = rankedValues.slice(0, 3).map((id) => {
      if (id.startsWith('custom_') && customValue?.id === id) {
        return { id, name: customValue.name };
      }
      const value = VALUES_BY_ID[id];
      return { id, name: value?.name || id };
    });

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('No ANTHROPIC_API_KEY found, using fallback definitions');
      return NextResponse.json({
        definitions: generateFallbackDefinitions(top3Values),
        fallback: true,
      });
    }

    // Call Anthropic API
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      tools,
      system: buildSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(top3Values, transcript || '', goals || {}),
        },
      ],
    });

    // Extract tool_use block
    const toolUseBlock = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    if (toolUseBlock && toolUseBlock.name === 'generate_value_definitions') {
      const input = toolUseBlock.input as {
        definitions: Record<string, Omit<ValueDefinition, 'userEdited'>>;
      };

      // Add userEdited: false to each definition
      const definitions: Record<string, ValueDefinition> = {};
      for (const [id, def] of Object.entries(input.definitions)) {
        definitions[id] = { ...def, userEdited: false };
      }

      return NextResponse.json({ definitions });
    }

    // Fallback if no tool use
    return NextResponse.json({
      definitions: generateFallbackDefinitions(top3Values),
      fallback: true,
    });
  } catch (error) {
    console.error('Definition generation error:', error);

    // Try to return fallback on error
    try {
      const body: DefinitionsRequest = await request.clone().json();
      const top3 = (body.rankedValues || []).slice(0, 3).map((id) => {
        if (id.startsWith('custom_') && body.customValue?.id === id) {
          return { id, name: body.customValue.name };
        }
        return { id, name: VALUES_BY_ID[id]?.name || id };
      });

      return NextResponse.json({
        definitions: generateFallbackDefinitions(top3),
        fallback: true,
        error: 'AI generation failed, using fallback definitions',
      });
    } catch {
      return NextResponse.json(
        { error: 'Failed to generate definitions' },
        { status: 500 }
      );
    }
  }
}
