import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

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
}

// ============ PROMPTS ============

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

<example input="rich story">
STORY: "I'm a Coast Guard Command Master Chief doing dissertation research. I had 400 interviews that got shelved when leadership changed. Instead of waiting for permission, I built an AI system to analyze them myself. Waiting for approval was actually abandoning the people who shared their stories."

VALUES: Integrity, Care, Curiosity

OUTPUT:
{
  "language_to_echo": [
    "400 interviews",
    "shelved",
    "waiting for permission",
    "abandoning",
    "leadership changed",
    "built an AI system",
    "shared their stories"
  ],
  "values_analysis": [
    {
      "value_id": "integrity",
      "value_name": "Integrity",
      "affect": {
        "surface": "frustration with bureaucratic delays",
        "deeper": "fear that acting without sanction makes him disloyal"
      },
      "behavior": {
        "protective": "drafting permission requests, waiting for approval",
        "aspirational": "acting decisively when it matters",
        "tell": "pausing when leadership shifts, saying 'I should run this by someone'"
      },
      "cognition": {
        "belief": "good soldiers wait for orders",
        "lie": "waiting is the honorable thing to do"
      },
      "desire": {
        "hungry_for": "to be trusted to act without oversight",
        "protecting": "his identity as a loyal servicemember",
        "relief_sought": "permission to lead without permission"
      },
      "wound": "fear that independent action means betraying the institution he loves",
      "wince_moment": "he's used 'waiting for permission' as cover for avoiding risk",
      "nod_moment": "he already broke the pattern once—he built the AI system"
    },
    {
      "value_id": "care",
      "value_name": "Care",
      "affect": {
        "surface": "guilt about the interviews sitting unused",
        "deeper": "fear of failing the people who trusted him with their stories"
      },
      "behavior": {
        "protective": "letting institutional timelines dictate his actions",
        "aspirational": "honoring trust even when it's inconvenient",
        "tell": "mentioning the specific number—400—showing he counts them"
      },
      "cognition": {
        "belief": "caring means keeping my word",
        "lie": "the institution will eventually do right by them"
      },
      "desire": {
        "hungry_for": "to be someone who doesn't let people down",
        "protecting": "his self-image as someone who honors trust",
        "relief_sought": "knowing the stories were worth sharing"
      },
      "wound": "the gap between his intentions and his impact",
      "wince_moment": "'shelved' is his word—he knows what it means to be archived",
      "nod_moment": "he called inaction 'abandoning'—he knows the stakes"
    },
    {
      "value_id": "curiosity",
      "value_name": "Curiosity",
      "affect": {
        "surface": "excitement about building the AI system",
        "deeper": "fear that creating without credentials makes him an imposter"
      },
      "behavior": {
        "protective": "framing innovation as 'just solving a problem'",
        "aspirational": "building what doesn't exist yet",
        "tell": "he built an AI system—not waited for one"
      },
      "cognition": {
        "belief": "real experts are given permission to innovate",
        "lie": "I'm not really a builder, I just had to do something"
      },
      "desire": {
        "hungry_for": "to create without apology",
        "protecting": "his credibility in traditional structures",
        "relief_sought": "validation that building was the right call"
      },
      "wound": "imposter fear around being a builder in uniform",
      "wince_moment": "he downplays the AI as necessity, not identity",
      "nod_moment": "he's already proven he can build—he just hasn't claimed it"
    }
  ]
}
</example>

<example input="thin story">
STORY: "I keep saying yes to everything and burning out."

VALUES: Growth, Balance, Connection

OUTPUT:
{
  "language_to_echo": [
    "saying yes to everything",
    "burning out"
  ],
  "values_analysis": [
    {
      "value_id": "growth",
      "value_name": "Growth",
      "affect": {
        "surface": "exhaustion, overwhelm",
        "deeper": "fear that slowing down means falling behind"
      },
      "behavior": {
        "protective": "automatic yes before thinking, filling every gap",
        "aspirational": "choosing depth over breadth",
        "tell": "overloaded calendar, skipped meals, 'I'll sleep when...'"
      },
      "cognition": {
        "belief": "busyness proves my worth",
        "lie": "I can handle one more thing"
      },
      "desire": {
        "hungry_for": "feeling real progress, not just motion",
        "protecting": "sense of being valuable and needed",
        "relief_sought": "permission to do less, better"
      },
      "wound": "belief that availability equals value",
      "wince_moment": "'yes' is often self-protection disguised as generosity",
      "nod_moment": "they named the pattern themselves—they're ready to change"
    },
    {
      "value_id": "balance",
      "value_name": "Balance",
      "affect": {
        "surface": "frustration at constant demands",
        "deeper": "guilt about wanting rest while others need them"
      },
      "behavior": {
        "protective": "postponing self-care until 'after this one thing'",
        "aspirational": "resting without earning it first",
        "tell": "canceling plans for myself, keeping plans for others"
      },
      "cognition": {
        "belief": "balance is for people with less responsibility",
        "lie": "I'll restore balance once things calm down"
      },
      "desire": {
        "hungry_for": "rest without guilt",
        "protecting": "identity as someone who shows up",
        "relief_sought": "believing I deserve rest"
      },
      "wound": "never learned that rest is productive",
      "wince_moment": "waiting for permission to stop",
      "nod_moment": "'burning out' means they know the cost"
    },
    {
      "value_id": "connection",
      "value_name": "Connection",
      "affect": {
        "surface": "loneliness despite busyness",
        "deeper": "fear that saying no costs relationships"
      },
      "behavior": {
        "protective": "performing availability to stay close",
        "aspirational": "being present instead of just present",
        "tell": "half-listening, mind on next task"
      },
      "cognition": {
        "belief": "I'm only valuable to others when I'm useful",
        "lie": "helping is connecting"
      },
      "desire": {
        "hungry_for": "relationships that don't depend on my utility",
        "protecting": "fear of being forgotten if they slow down",
        "relief_sought": "being loved for who I am, not what I do"
      },
      "wound": "conflating usefulness with lovability",
      "wince_moment": "the people they're 'connecting' with barely know them",
      "nod_moment": "they chose Connection as a value—they feel the gap"
    }
  ]
}
</example>

Use the story_analysis tool. Analyze deeply—Stage 2 quality depends entirely on the richness of this extraction.`;

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
- OUTCOME speaks to their specific DESIRE, not generic aspiration
- OBSTACLE names a FEELING (fear, guilt, belief), not just a behavior
- OBSTACLE would make them wince (uncomfortable) AND nod (true)
- REFRAME is sticky: rhythm + tension + surprise
- REFRAME uses their language or flips their behavior

And across all values:
- At least 2 different OBSTACLE_CATEGORIES used
- LANGUAGE_TO_ECHO phrases appear naturally in outputs
</quality_gate>

<example>
INPUT ANALYSIS (abbreviated):
{
  "language_to_echo": ["400 interviews", "shelved", "waiting for permission", "abandoning"],
  "values_analysis": [
    {
      "value_id": "integrity",
      "affect": { "deeper": "fear that acting without sanction makes him disloyal" },
      "behavior": { "protective": "waiting for approval", "aspirational": "acting decisively" },
      "cognition": { "lie": "waiting is the honorable thing to do" },
      "desire": { "hungry_for": "to be trusted to act without oversight", "relief_sought": "permission to lead without permission" },
      "wince_moment": "he's used 'waiting for permission' as cover for avoiding risk"
    }
  ]
}

OUTPUT:
{
  "woop": [
    {
      "value_id": "integrity",
      "outcome": "I act before the memo comes, and people trust me more for it—not less",
      "obstacle": "my fear that acting without approval means I've abandoned my place in the institution I love",
      "obstacle_category": "IDENTITY",
      "reframe": "My place is with the 400"
    }
  ]
}

WHY IT WORKS:
- Outcome: Speaks to "trusted to act without oversight" + "permission to lead"
- Obstacle: Names the deeper fear, includes wince moment (abandoned)
- Category: IDENTITY (protecting his role as loyal servicemember)
- Reframe: Uses "400" from their language, creates tension (place = belonging vs. duty)
</example>

Use the generate_woop tool. Every output should pass the wince-and-nod test.`;

// ============ TOOLS ============

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
            required: ['value_id', 'value_name', 'affect', 'behavior', 'cognition', 'desire', 'wound', 'wince_moment', 'nod_moment'],
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
              outcome: { type: 'string', description: '10-20 words, speaks to desire, starts with I' },
              obstacle: { type: 'string', description: 'Starts with "my [feeling]...", 8-15 words' },
              obstacle_category: {
                type: 'string',
                enum: ['AVOIDANCE', 'EXCESS', 'TIMING', 'SELF-PROTECTION', 'IDENTITY'],
              },
              reframe: { type: 'string', description: '3-8 words, rhythm + tension + surprise' },
            },
            required: ['value_id', 'outcome', 'obstacle', 'obstacle_category', 'reframe'],
          },
        },
      },
      required: ['woop'],
    },
  },
];

// ============ HELPERS ============

function buildAnalysisUserPrompt(values: ValueInput[], story: string): string {
  const valueList = values.map(v => `${v.name} (id: ${v.id})`).join(', ');
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

function extractToolUse<T>(response: Anthropic.Message, toolName: string): T | null {
  const toolUseBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === 'tool_use' && block.name === toolName
  );
  return toolUseBlock ? (toolUseBlock.input as T) : null;
}

function validateAnalysis(analysis: StoryAnalysis | null, values: ValueInput[]): boolean {
  if (!analysis) return false;
  if (!analysis.language_to_echo || analysis.language_to_echo.length === 0) return false;
  if (!analysis.values_analysis || analysis.values_analysis.length !== values.length) return false;
  return analysis.values_analysis.every(v =>
    v.affect?.deeper && v.behavior?.protective && v.desire?.hungry_for
  );
}

function validateWoop(woop: { woop: WOOPItem[] } | null, values: ValueInput[]): boolean {
  if (!woop?.woop) return false;
  if (woop.woop.length !== values.length) return false;
  return woop.woop.every(w =>
    w.outcome && w.obstacle && w.obstacle_category && w.reframe
  );
}

// ============ FALLBACKS ============

function generateFallbackAnalysis(values: ValueInput[], story: string): StoryAnalysis {
  // Extract any phrases from story
  const words = (story || '').split(/\s+/).filter(w => w.length > 4);
  const language = words.slice(0, 5);

  return {
    language_to_echo: language.length > 0 ? language : ['growth', 'change'],
    values_analysis: values.map(v => ({
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
  const categories: Array<WOOPItem['obstacle_category']> = [
    'AVOIDANCE', 'TIMING', 'SELF-PROTECTION', 'EXCESS', 'IDENTITY'
  ];

  return analysis.values_analysis.map((a, i) => ({
    value_id: a.value_id,
    outcome: a.desire.relief_sought || `I live ${a.value_name.toLowerCase()} fully and feel aligned`,
    obstacle: `my ${a.affect.deeper || 'fear'} that keeps me from ${a.behavior.aspirational || 'moving forward'}`,
    obstacle_category: categories[i % categories.length],
    reframe: 'The obstacle is the way',
  }));
}

// ============ MAIN HANDLER ============

export async function POST(request: Request) {
  try {
    const { values, story } = (await request.json()) as WOOPRequest;

    // Validate request
    if (!values || values.length === 0) {
      return NextResponse.json({ error: 'Values are required' }, { status: 400 });
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('[WOOP] No ANTHROPIC_API_KEY, using fallback');
      const fallbackAnalysis = generateFallbackAnalysis(values, story || '');
      return NextResponse.json({
        language_to_echo: fallbackAnalysis.language_to_echo,
        analysis: fallbackAnalysis.values_analysis,
        woop: generateFallbackWoop(fallbackAnalysis),
        fallback: true,
      });
    }

    // ====== STAGE 1: Deep Analysis ======
    console.log('[WOOP] Stage 1: Analyzing story...');

    const analysisResponse = await client.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 2000,
      temperature: 0.5,
      tools: analysisTools,
      tool_choice: { type: 'tool', name: 'story_analysis' },
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildAnalysisUserPrompt(values, story) }],
    });

    let analysis = extractToolUse<StoryAnalysis>(analysisResponse, 'story_analysis');

    // Validate Stage 1 output
    if (!validateAnalysis(analysis, values)) {
      console.warn('[WOOP] Stage 1 validation failed, using fallback analysis');
      analysis = generateFallbackAnalysis(values, story || '');
    }

    console.log('[WOOP] Stage 1 complete. Language captured:', analysis!.language_to_echo);

    // ====== STAGE 2: WOOP Generation ======
    console.log('[WOOP] Stage 2: Generating WOOP statements...');

    const woopResponse = await client.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 1000,
      temperature: 0.7,
      tools: woopTools,
      tool_choice: { type: 'tool', name: 'generate_woop' },
      system: WOOP_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildWoopUserPrompt(analysis!) }],
    });

    let woopResult = extractToolUse<{ woop: WOOPItem[] }>(woopResponse, 'generate_woop');

    // Validate Stage 2 output
    if (!validateWoop(woopResult, values)) {
      console.warn('[WOOP] Stage 2 validation failed, using fallback WOOP');
      woopResult = { woop: generateFallbackWoop(analysis!) };
    }

    console.log('[WOOP] Stage 2 complete. Categories:', woopResult!.woop.map(w => w.obstacle_category));

    // Return complete response
    return NextResponse.json({
      language_to_echo: analysis!.language_to_echo,
      analysis: analysis!.values_analysis,
      woop: woopResult!.woop,
    } as WOOPResponse);

  } catch (error) {
    console.error('[WOOP] Pipeline error:', error);

    // Try to get values from request for fallback
    try {
      const body = await request.clone().json();
      const values = body.values || [];
      const story = body.story || '';

      if (values.length > 0) {
        const fallbackAnalysis = generateFallbackAnalysis(values, story);
        return NextResponse.json({
          language_to_echo: fallbackAnalysis.language_to_echo,
          analysis: fallbackAnalysis.values_analysis,
          woop: generateFallbackWoop(fallbackAnalysis),
          fallback: true,
          error: 'Pipeline failed, using fallback',
        });
      }
    } catch {
      // Ignore parse error
    }

    return NextResponse.json(
      { error: 'Failed to generate WOOP analysis' },
      { status: 500 }
    );
  }
}
