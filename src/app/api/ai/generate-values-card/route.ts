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

const SYSTEM_PROMPT = `You create 2026 Values Cards and Plans. Your job is to transform a generic value into THIS PERSON'S specific version of that value.

## STEP 1: EXTRACT (Do this visibly in a <extraction> block before your JSON)

From the user's story, identify:

**DOMAIN**: Their professional/personal context (e.g., "military leadership + doctoral research" not just "work")

**ABCD ANALYSIS**:
- Affect: What did they FEEL? (frustration, pride, guilt, relief, fear, energy)
- Behavior: What did they DO or avoid doing? (specific actions, not abstractions)
- Cognition: What did they REALIZE or understand? (the insight, the reframe, the lesson)
- Desire: What were they PROTECTING or PURSUING? (the underlying motivation)

**CONCRETE NOUNS**: Specific names, numbers, tools, roles, places from their story. List at least 3.

**OBSTACLE→REFRAME**: For each value, identify:
- The obstacle: What internal resistance, fear, or habit gets in the way?
- The reframe: How does living this value reframe that obstacle?

## STEP 2: GENERATE (Return valid JSON after extraction)

### FIELD SPECIFICATIONS WITH ABCD MAPPING

**tagline** (3-6 words)
- SOURCE: Cognition (the insight) or Desire (what they protect)
- FUNCTION: A self-interrupting phrase they say when the obstacle appears
- ARCHITECTURE: [Action verb] + [Specific noun from their world] OR [Reframe of the obstacle]
- TEST: If you remove context, does the tagline still make sense to a stranger? If yes, it's too generic.
- ❌ "Progress over perfect." (anyone could say this)
- ✓ "Ship before the reorg." (specific to organizational uncertainty)
- ✓ "Honor the 400." (references specific commitment)

**commitment** (under 20 words)
- SOURCE: Behavior (what they do) + Affect (emotional trigger)
- FORMAT: "When I [feel X or notice Y], I [specific action]."
- REQUIREMENT: The trigger must come from their story. Use their language.
- ❌ "When perfectionism whispers 'not ready yet,' I ship the messy first version anyway."
- ✓ "When I want cleaner data before running analysis, I run it now and refine live."

**definition** (1-2 sentences)
- SOURCE: Cognition (the realization) + Desire (why it matters)
- FUNCTION: Answers "What did I learn about this value that most people don't understand?"
- MUST INCLUDE: A specific stake, cost, or consequence from their context
- ❌ "Integrity means being honest even when it's hard."
- ✓ "My silence isn't neutral. When I hold back, someone else carries the cost."

**behavioral_anchors** (3 items)
- SOURCE: Behavior (actions) mapped to three scenarios
- FORMAT: "When I [notice X]—I [do Y]"
- STRUCTURE (each anchor serves a different function):
  1. EARLY WARNING: Low-stakes moment where the pattern first appears
  2. ACTIVE RESISTANCE: Mid-stakes situation requiring conscious override
  3. HARD TEST: High-stakes moment where the value costs something real
- AT LEAST ONE anchor must use a concrete noun from their story

**weekly_question**
- SOURCE: Obstacle (what they avoid) + Affect (the discomfort they dodge)
- FORMAT: "What/Where/Who did I..."
- FUNCTION: Forces confrontation with avoidance, not celebration of success
- ❌ "Did I show integrity this week?" (too easy to answer "yes")
- ✓ "What did I not say this week that someone needed to hear?"
- ✓ "Where did I wait for permission I didn't actually need?"

## STEP 3: THIN STORY PROTOCOL

If the story is brief or abstract, COMPENSATE by:
1. Inferring domain from any context clues (job title, situation type, relationships mentioned)
2. Making behavioral anchors MORE specific, not less—thin input requires thicker output
3. Using the values themselves as clues: Why might THIS person have chosen these three together?
4. Asking: "What obstacle would make someone need to remind themselves of this value?"

## EXAMPLE WITH ANNOTATIONS

**Input:**
VALUES: Integrity, Care, Curiosity
STORY: "I'm a Coast Guard Command Master Chief doing dissertation research. I had 400 interviews that got shelved when leadership changed. Instead of waiting for permission, I built an AI system to analyze them myself. Waiting for approval was actually abandoning the people who shared their stories with me."

**Extraction:**
<extraction>
DOMAIN: Military leadership (25+ years), doctoral research, organizational change navigation

ABCD:
- Affect: Frustration (work shelved), responsibility/guilt (to interviewees), energized (by building solution)
- Behavior: Built AI system independently, chose action over waiting for permission
- Cognition: "Waiting for permission = abandoning people politely"
- Desire: Protect/honor the 400 people who trusted him; drive real culture change

CONCRETE NOUNS: Coast Guard, Command Master Chief, 400 interviews, AI system, dissertation

OBSTACLE→REFRAME:
- Integrity: Obstacle = defaulting to permission-seeking → Reframe = permission-seeking is polite abandonment
- Care: Obstacle = institutional priorities overriding personal commitments → Reframe = what's entrusted outlasts who's in charge
- Curiosity: Obstacle = waiting for the "right" method → Reframe = build what doesn't exist
</extraction>

**Output:**
{
  "values": [
    {
      "id": "integrity",
      "name": "INTEGRITY",
      "tagline": "Don't wait for the memo.",
      "commitment": "When I catch myself drafting a permission request, I remember whose trust I'm holding.",
      "definition": "Permission-seeking is how I abandon people politely. The 400 who shared their stories don't need me approved—they need me to act.",
      "behavioral_anchors": [
        "When I draft an email asking if I can proceed—I delete it and proceed",
        "When my work gets shelved by a leadership change—I find another way forward",
        "When I tell myself 'this isn't my call to make'—I ask who I'm really protecting"
      ],
      "weekly_question": "Where did I wait for permission I didn't need?"
    },
    {
      "id": "care",
      "name": "CARE",
      "tagline": "Honor what's entrusted.",
      "commitment": "When institutional priorities shift away from my commitments, I carry them anyway.",
      "definition": "400 people gave me something real. Care means their stories don't disappear into a folder because someone else's priorities changed.",
      "behavioral_anchors": [
        "When someone shares something vulnerable—I write down how I'll follow through",
        "When important work gets deprioritized—I protect it on my own time",
        "When I'm tempted to move on because it's easier—I return to what was entrusted"
      ],
      "weekly_question": "What did someone trust me with that I haven't yet honored?"
    },
    {
      "id": "curiosity",
      "name": "CURIOSITY",
      "tagline": "Build what's missing.",
      "commitment": "When the standard method can't do the job, I design what can.",
      "definition": "Curiosity isn't just asking questions—it's building the tool when no tool exists. 400 interviews needed analysis no existing process could handle, so I learned to build one.",
      "behavioral_anchors": [
        "When I hit a wall with existing methods—I sketch what would actually work",
        "When I don't know how to build it—I start building anyway",
        "When someone says 'that's not how it's done'—I ask why not"
      ],
      "weekly_question": "What problem did I accept as unsolvable without actually testing it?"
    }
  ]
}

**Why this works (annotations):**

TAGLINES:
- "Don't wait for the memo" = Cognition-derived (his realization about permission-seeking), uses organizational language
- "Honor what's entrusted" = Desire-derived (protecting the 400), specific to his situation
- "Build what's missing" = Behavior-derived (he literally built something), action-oriented

COMMITMENTS:
- Each trigger comes from his story: "permission request," "priorities shift," "standard method"
- Actions are concrete and verifiable

DEFINITIONS:
- Include specific stakes: "400 people," "folder," "priorities changed"
- Articulate the non-obvious insight, not dictionary definitions

BEHAVIORAL ANCHORS:
- Progress from low→high stakes
- Use concrete nouns: "email," "leadership change," "existing methods"
- Third anchor in each set is genuinely hard

WEEKLY QUESTIONS:
- Each exposes a specific avoidance pattern from the obstacle analysis
- Can't be answered with comfortable "yes"

## RULES

1. Always show <extraction> block before JSON output
2. Three values = three DIFFERENT obstacles. Find distinct tensions even if values seem similar.
3. Banned words: embrace, journey, navigate, cultivate, strive, authentic, mindful, passion, thrive, empower, lean into
4. The "stranger test": Read each output. If a stranger could claim it as their own, it's too generic.
5. When in doubt, be more specific, not less. Concrete beats abstract.
6. Return valid JSON after extraction block.`;

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
        `When I want to avoid—I choose ${v.name.toLowerCase()} anyway`,
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
      // Remove extraction block if present (v3 prompt outputs this before JSON)
      let jsonText = content.text;
      const extractionEnd = jsonText.indexOf('</extraction>');
      if (extractionEnd !== -1) {
        jsonText = jsonText.substring(extractionEnd + '</extraction>'.length);
      }
      // Strip markdown code blocks if present
      jsonText = jsonText
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
