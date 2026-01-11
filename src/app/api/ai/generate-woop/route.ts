import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Netlify timeout config
export const maxDuration = 26;

const client = new Anthropic();

// ============ CONFIGURATION ============

// Stage 1: Lower temp for analytical accuracy
const STAGE1_CONFIG = {
  model: 'claude-sonnet-4-5-20250929' as const,
  max_tokens: 2000,
  temperature: 0.5,
};

// Stage 2: Higher temp for creative WOOP generation
const STAGE2_CONFIG = {
  model: 'claude-sonnet-4-5-20250929' as const,
  max_tokens: 1000,
  temperature: 0.7,
};

// ============ TYPES ============

interface ValueInput {
  id: string;
  name: string;
}

interface WOOPRequest {
  values: ValueInput[];
  story: string;
}

interface AffectAnalysis {
  surface: string;
  deeper: string;
}

interface BehaviorAnalysis {
  protective: string;
  aspirational: string;
  tell: string;
}

interface CognitionAnalysis {
  belief: string;
  lie: string;
}

interface DesireAnalysis {
  hungry_for: string;
  protecting: string;
  relief_sought: string;
}

interface ValueAnalysis {
  value_id: string;
  value_name: string;
  affect: AffectAnalysis;
  behavior: BehaviorAnalysis;
  cognition: CognitionAnalysis;
  desire: DesireAnalysis;
  wound: string;
  wince_moment: string;
  nod_moment: string;
}

interface StoryAnalysis {
  language_to_echo: string[];
  values_analysis: ValueAnalysis[];
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
  analysis: ValueAnalysis[];
  woop: WOOPItem[];
  fallback?: boolean;
  error?: string;
}

// ============ STAGE 1: ANALYSIS PROMPT ============

const ANALYSIS_SYSTEM_PROMPT = `You are a values psychologist analyzing someone's story to understand their relationship with their core values.

<abcd_framework>
For each value, extract:

**AFFECT** (Feelings)
What emotions arise when they live or violate this value?
- Surface emotions (frustration, guilt, pride)
- Deeper feelings (fear of abandonment, longing for belonging)

**BEHAVIOR** (Actions)
What do they DO when this value is activated or threatened?
- Protective behaviors (avoiding, hiding, over-controlling)
- Aspirational behaviors (what they wish they did)
- Tell behaviors (the subtle signs of the pattern)

**COGNITION** (Thoughts)
What beliefs or narratives drive the pattern?
- "I'm not the type who..."
- "If I do X, then Y will happen..."
- The lie they tell themselves

**DESIRE** (Motivations)
What are they truly hungry for?
- What are they protecting?
- What would fulfillment look like?
- What relief are they seeking?
</abcd_framework>

<extraction_targets>
Also extract globally:

**LANGUAGE_TO_ECHO**: Their exact words and phrases (minimum 5)
- Vivid verbs ("abandoned," "shelved," "burning out")
- Specific details ("400 interviews," "leadership changed")
- Emotional language ("I keep saying yes")

And per value:

**WOUND**: The core emotional injury beneath the story
**TELL**: The specific behavior that reveals the pattern
**WINCE_MOMENT**: What would be uncomfortable for them to read?
**NOD_MOMENT**: What would they immediately recognize as true?
</extraction_targets>

<thin_story_handling>
If the story is sparse (under 30 words), you must still extract meaningful patterns:
1. Use the chosen VALUES as signals - why might someone choose these?
2. Infer likely ABCD patterns from common human experiences
3. Make educated guesses about wounds and desires
4. Note that thin stories often indicate AVOIDANCE or SELF-PROTECTION patterns

Even "I want to be better" contains signal:
- Affect: dissatisfaction, hope
- Behavior: self-criticism (likely), aspiration without specifics
- Cognition: belief that current self isn't enough
- Desire: self-acceptance, growth, pride
</thin_story_handling>

Use the story_analysis tool. Analyze deeply—Stage 2 quality depends entirely on the richness of this extraction.`;

// ============ STAGE 2: WOOP PROMPT ============

const WOOP_SYSTEM_PROMPT = `You generate WOOP statements that make people wince AND nod—uncomfortable enough to land, accurate enough to resonate.

<input_context>
You receive deep ABCD analysis for each value:
- AFFECT: Their feelings (surface and deeper)
- BEHAVIOR: Their patterns (protective, aspirational, tells)
- COGNITION: Their beliefs and the lies they tell themselves
- DESIRE: What they're hungry for, protecting, seeking relief from
- WOUND: Core emotional injury
- WINCE/NOD: The uncomfortable truth they'd recognize

Plus LANGUAGE_TO_ECHO: Their exact phrases to weave into outputs.
</input_context>

<woop_generation_rules>

**OUTCOME** (10-20 words)
- Speaks directly to their DESIRE (hungry_for + relief_sought)
- Vivid, emotional, relational—shows what living this value FEELS like
- Uses their language when possible
- Starts with "I" and is in present tense

**OBSTACLE** (8-15 words)
- MUST start with "my [feeling-word]..."
- Names their AFFECT (the deeper feeling, not surface)
- Includes pattern from BEHAVIOR or COGNITION
- Must pass wince-and-nod test
- Format: "my [feeling] that/of [pattern]"

**OBSTACLE_CATEGORY**
Assign each value a DIFFERENT category:
- AVOIDANCE: Dodging discomfort, conflict, vulnerability
- EXCESS: Overdoing, overcontrolling, perfectionism
- TIMING: Waiting, rushing, delaying
- SELF-PROTECTION: Hiding, minimizing, deflecting
- IDENTITY: Role constraints, "I'm not the type who..."

REQUIREMENT: 3 values = at least 2 different categories (ideally 3)

**REFRAME** (3-8 words)
- Flips their protective BEHAVIOR into fuel
- Uses their LANGUAGE when possible
- Has RHYTHM (beats, cadence)
- Has TENSION (two ideas in productive conflict)
- Has SURPRISE (unexpected word or framing)
- Test: Would they write this on a sticky note? Remember it tomorrow?

</woop_generation_rules>

<quality_gate>
Before returning, verify each value passes:
□ OUTCOME speaks to their specific DESIRE, not generic aspiration
□ OBSTACLE names a FEELING (fear, guilt, belief), not just a behavior
□ OBSTACLE would make them wince (uncomfortable) AND nod (true)
□ REFRAME is sticky: rhythm + tension + surprise
□ REFRAME uses their language or flips their behavior

And across all values:
□ At least 2 different OBSTACLE_CATEGORIES used
□ LANGUAGE_TO_ECHO phrases appear naturally in outputs
</quality_gate>

Use the generate_woop tool. Every output should pass the wince-and-nod test.`;

// ============ TOOL SCHEMAS ============

const analysisTools: Anthropic.Tool[] = [
  {
    name: 'story_analysis',
    description: 'Deep ABCD analysis of story for each value',
    input_schema: {
      type: 'object' as const,
      properties: {
        language_to_echo: {
          type: 'array',
          items: { type: 'string' },
          description: 'Exact phrases from story (minimum 2, aim for 5+)',
        },
        values_analysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value_id: { type: 'string' },
              value_name: { type: 'string' },
              affect: {
                type: 'object',
                properties: {
                  surface: { type: 'string' },
                  deeper: { type: 'string' },
                },
                required: ['surface', 'deeper'],
              },
              behavior: {
                type: 'object',
                properties: {
                  protective: { type: 'string' },
                  aspirational: { type: 'string' },
                  tell: { type: 'string' },
                },
                required: ['protective', 'aspirational', 'tell'],
              },
              cognition: {
                type: 'object',
                properties: {
                  belief: { type: 'string' },
                  lie: { type: 'string' },
                },
                required: ['belief', 'lie'],
              },
              desire: {
                type: 'object',
                properties: {
                  hungry_for: { type: 'string' },
                  protecting: { type: 'string' },
                  relief_sought: { type: 'string' },
                },
                required: ['hungry_for', 'protecting', 'relief_sought'],
              },
              wound: { type: 'string' },
              wince_moment: { type: 'string' },
              nod_moment: { type: 'string' },
            },
            required: [
              'value_id',
              'value_name',
              'affect',
              'behavior',
              'cognition',
              'desire',
              'wound',
              'wince_moment',
              'nod_moment',
            ],
          },
        },
      },
      required: ['language_to_echo', 'values_analysis'],
    },
  },
];

const woopTools: Anthropic.Tool[] = [
  {
    name: 'generate_woop',
    description: 'Generate WOOP statements from ABCD analysis',
    input_schema: {
      type: 'object' as const,
      properties: {
        woop: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value_id: { type: 'string' },
              outcome: {
                type: 'string',
                description: '10-20 words, speaks to desire, starts with I',
              },
              obstacle: {
                type: 'string',
                description: 'Starts with "my [feeling]...", 8-15 words',
              },
              obstacle_category: {
                type: 'string',
                enum: ['AVOIDANCE', 'EXCESS', 'TIMING', 'SELF-PROTECTION', 'IDENTITY'],
              },
              reframe: { type: 'string', description: '3-8 words, sticky' },
            },
            required: ['value_id', 'outcome', 'obstacle', 'obstacle_category', 'reframe'],
          },
        },
      },
      required: ['woop'],
    },
  },
];

// ============ USER PROMPT BUILDERS ============

function buildAnalysisUserPrompt(values: ValueInput[], story: string): string {
  const valueList = values.map((v) => `${v.name} (id: ${v.id})`).join(', ');
  return `Analyze this story for the following values:

VALUES: ${valueList}

STORY: "${story || 'No story provided. Infer patterns from the chosen values.'}"

Extract ABCD analysis for each value. Use the story_analysis tool.`;
}

function buildWoopUserPrompt(analysis: StoryAnalysis): string {
  return `Generate WOOP statements based on this analysis:

${JSON.stringify(analysis, null, 2)}

Create outcome, obstacle, category, and reframe for each value. Use the generate_woop tool.`;
}

// ============ VALIDATION HELPERS ============

function validateAnalysis(analysis: StoryAnalysis | null, values: ValueInput[]): boolean {
  if (!analysis) return false;
  if (!analysis.language_to_echo || analysis.language_to_echo.length === 0) return false;
  if (!analysis.values_analysis || analysis.values_analysis.length !== values.length) return false;
  return analysis.values_analysis.every(
    (v) => v.affect?.deeper && v.behavior?.protective && v.desire?.hungry_for
  );
}

function validateWoop(woop: { woop: WOOPItem[] } | null, values: ValueInput[]): boolean {
  if (!woop?.woop) return false;
  if (woop.woop.length !== values.length) return false;
  return woop.woop.every((w) => w.outcome && w.obstacle && w.obstacle_category && w.reframe);
}

function extractToolUse<T>(response: Anthropic.Message, toolName: string): T | null {
  const toolUseBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use' && block.name === toolName
  );
  return toolUseBlock ? (toolUseBlock.input as T) : null;
}

// ============ FALLBACK FUNCTIONS ============

function generateFallbackAnalysis(values: ValueInput[], story: string): StoryAnalysis {
  const words = story.split(/\s+/).filter((w) => w.length > 4);
  const language = words.slice(0, 5);

  return {
    language_to_echo: language.length > 0 ? language : ['growth', 'change'],
    values_analysis: values.map((v) => ({
      value_id: v.id,
      value_name: v.name,
      affect: {
        surface: 'frustration with current patterns',
        deeper: `fear of not living ${v.name.toLowerCase()} fully`,
      },
      behavior: {
        protective: 'staying in comfortable routines',
        aspirational: `embodying ${v.name.toLowerCase()} daily`,
        tell: 'moments of hesitation before acting',
      },
      cognition: {
        belief: 'change is hard',
        lie: "I'll start when conditions are right",
      },
      desire: {
        hungry_for: `living ${v.name.toLowerCase()} without compromise`,
        protecting: 'sense of safety and predictability',
        relief_sought: 'alignment between values and actions',
      },
      wound: 'gap between who I am and who I want to be',
      wince_moment: 'knowing I could do more but choosing comfort',
      nod_moment: 'I chose this value because I feel the gap',
    })),
  };
}

function generateFallbackWoop(analysis: StoryAnalysis): WOOPItem[] {
  const categories: WOOPItem['obstacle_category'][] = [
    'AVOIDANCE',
    'TIMING',
    'SELF-PROTECTION',
    'EXCESS',
    'IDENTITY',
  ];

  return analysis.values_analysis.map((a, i) => ({
    value_id: a.value_id,
    outcome:
      a.desire.relief_sought || `I live ${a.value_name.toLowerCase()} fully and feel aligned`,
    obstacle: `my ${a.affect.deeper || 'fear'} that keeps me from ${a.behavior.aspirational || 'moving forward'}`,
    obstacle_category: categories[i % categories.length],
    reframe: 'The obstacle is the way',
  }));
}

// ============ MAIN HANDLER ============

export async function POST(request: Request) {
  let requestValues: ValueInput[] = [];
  let requestStory = '';

  try {
    const body = (await request.json()) as WOOPRequest;
    requestValues = body.values || [];
    requestStory = body.story || '';

    if (requestValues.length === 0) {
      return NextResponse.json({ error: 'Values are required' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('[WOOP] No API key, using fallback');
      const fallbackAnalysis = generateFallbackAnalysis(requestValues, requestStory);
      return NextResponse.json({
        language_to_echo: fallbackAnalysis.language_to_echo,
        analysis: fallbackAnalysis.values_analysis,
        woop: generateFallbackWoop(fallbackAnalysis),
        fallback: true,
      });
    }

    // ====== STAGE 1: Deep Analysis ======
    console.log('[WOOP] Stage 1: Analyzing story...');

    const stage1Stream = await client.messages.stream({
      ...STAGE1_CONFIG,
      tools: analysisTools,
      tool_choice: { type: 'tool', name: 'story_analysis' },
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildAnalysisUserPrompt(requestValues, requestStory) }],
    });

    const stage1Response = await stage1Stream.finalMessage();
    const extractedAnalysis = extractToolUse<StoryAnalysis>(stage1Response, 'story_analysis');

    // Use validated analysis or fallback
    const analysis: StoryAnalysis = validateAnalysis(extractedAnalysis, requestValues)
      ? extractedAnalysis!
      : generateFallbackAnalysis(requestValues, requestStory);

    if (!extractedAnalysis || !validateAnalysis(extractedAnalysis, requestValues)) {
      console.warn('[WOOP] Stage 1 validation failed, using fallback analysis');
    }

    console.log('[WOOP] Stage 1 complete. Language captured:', analysis.language_to_echo);

    // ====== STAGE 2: WOOP Generation ======
    console.log('[WOOP] Stage 2: Generating WOOP statements...');

    const stage2Stream = await client.messages.stream({
      ...STAGE2_CONFIG,
      tools: woopTools,
      tool_choice: { type: 'tool', name: 'generate_woop' },
      system: WOOP_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildWoopUserPrompt(analysis) }],
    });

    const stage2Response = await stage2Stream.finalMessage();
    const extractedWoop = extractToolUse<{ woop: WOOPItem[] }>(stage2Response, 'generate_woop');

    // Use validated WOOP or fallback
    const woopResult: { woop: WOOPItem[] } = validateWoop(extractedWoop, requestValues)
      ? extractedWoop!
      : { woop: generateFallbackWoop(analysis) };

    if (!extractedWoop || !validateWoop(extractedWoop, requestValues)) {
      console.warn('[WOOP] Stage 2 validation failed, using fallback WOOP');
    }

    console.log(
      '[WOOP] Stage 2 complete. Categories:',
      woopResult.woop.map((w) => w.obstacle_category)
    );

    // Return complete response
    return NextResponse.json({
      language_to_echo: analysis.language_to_echo,
      analysis: analysis.values_analysis,
      woop: woopResult.woop,
    } as WOOPResponse);
  } catch (error) {
    console.error('[WOOP] Pipeline error:', error);

    if (requestValues.length > 0) {
      const fallbackAnalysis = generateFallbackAnalysis(requestValues, requestStory);
      return NextResponse.json({
        language_to_echo: fallbackAnalysis.language_to_echo,
        analysis: fallbackAnalysis.values_analysis,
        woop: generateFallbackWoop(fallbackAnalysis),
        fallback: true,
        error: 'Pipeline failed, using fallback',
      });
    }

    return NextResponse.json({ error: 'Failed to generate WOOP analysis' }, { status: 500 });
  }
}
