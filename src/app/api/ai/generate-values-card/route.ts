import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Netlify timeout config
export const maxDuration = 26;

const client = new Anthropic();

interface ValueInput {
  id: string;
  name: string;
}

interface WOOPItem {
  value_id: string;
  outcome: string;
  obstacle: string;
  obstacle_category: string;
  reframe: string;
}

interface WOOPDataInput {
  language_to_echo: string[];
  woop: WOOPItem[];
}

interface ValuesCardRequest {
  values: ValueInput[];
  story: string;
  woopData: WOOPDataInput;
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

const SYSTEM_PROMPT = `You generate Values Cards that people will be proud to own, share, and return to daily.

<output_format>
Return ONLY valid JSON. No markdown. No backticks. Start with { end with }
</output_format>

<pride_principles>
People feel proud of their Values Card when it makes them feel:

1. SEEN: "That's exactly my pattern—how did you know?"
   → Use their language. Name their specific situation. Reference their story.

2. ASPIRATIONAL: "I want to become this person."
   → The definition should articulate who they're becoming, not just what they're fixing.

3. EQUIPPED: "I know exactly what to do when the moment comes."
   → Anchors must be vivid enough to visualize and specific enough to act on.

4. OWNERSHIP: "This is MINE, not generic self-help."
   → Concrete nouns from their story. Their words echoed back. Couldn't belong to anyone else.

If a field doesn't create at least one of these feelings, revise it.
</pride_principles>

<voice_guidance>
TAGLINE: Second person implied or imperative. ("Don't wait for the memo." / "My place is with the 400.")
COMMITMENT: First person throughout. This is their vow.
DEFINITION: First person. This is their insight, their revelation.
ANCHORS: First person. "When I... I will..."
QUESTION: Second person implied through "I" reflection. "Where did I...?"

Tone: Direct, warm, honest. Not clinical. Not flowery. The voice of a wise friend who knows them well.
</voice_guidance>

<field_specifications>

<field name="tagline" words="3-7">
PURPOSE: The sticky phrase that interrupts the obstacle. They'll say this to themselves under pressure.
SOURCE: WOOP reframe—keep it or sharpen it.

STICKINESS PRINCIPLES:
- RHYTHM: Has a beat. "Not knowing is the starting line" (da-DUM-da da da DUM-da)
- TENSION: Two ideas in productive conflict. "Depth is the shortcut" (depth vs. shortcut)
- SURPRISE: An unexpected word. "My place is with the 400" (place? 400?)
- SPECIFICITY: Uses a word from THEIR story when possible.

STRUCTURES (use at least 2 different across 3 cards):
- Imperative: "Don't wait for the memo."
- Reframe statement: "Depth is the shortcut."
- Identity claim: "My place is with the 400."
- Paradox: "No is how I stay."

TEST: Say it out loud. Does it land? Would you remember it at 2am when you're tempted?
</field>

<field name="commitment" words="15-25">
PURPOSE: A punchy, memorable vow that fits on a card. Two sentences max.
FORMAT: "When [trigger], I [action]. [One-line truth]."

STRICT CONSTRAINTS:
- MAXIMUM 25 words total
- MAXIMUM 2 sentences
- NO storytelling, NO examples, NO elaboration
- First sentence: trigger → action
- Second sentence: the reframe/truth

GOOD (15-25 words):
- "When shame whispers 'stay quiet,' I ask anyway. Questions are how I find truth."
- "When comfort calls, I choose the harder conversation. Avoidance costs more than honesty."
- "When I want to smooth things over, I say the true thing. Integrity outlasts comfort."

BAD (too long - DO NOT DO THIS):
- "When I feel the shame rising—that tightness in my chest when I realize I don't know—I will ask anyway. The speed of the judgment didn't match what I'd seen..."

TEST: Count the words. If over 25, cut it down.
</field>

<field name="definition" words="40-70">
PURPOSE: The insight that reframes their relationship with this value. A personal revelation, not a dictionary entry.
FORMAT: Three movements:
1. THE LIE: What they used to believe or do (name the old pattern)
2. THE TRUTH: What they now understand (the insight)
3. THE PATH: What this value means going forward (the invitation)

VOICE: First person. Honest. Slightly vulnerable. The tone of someone writing in a journal they might someday share.

EXAMPLE:
"I used to think waiting for permission was respect—professionalism—the right way to operate inside an institution I love. I've learned it's something else: a way to abandon people politely while keeping my hands clean. The 400 who sat across from me and shared their stories didn't ask for my caution. They asked for my voice. Integrity now means this: their trust outranks my comfort. Their timeline matters more than the org chart's."

TEST: Does it name a specific LIE they believed? Does the TRUTH land with weight? Does the PATH feel like an invitation, not a scolding?
</field>

<field name="behavioral_anchors" count="3">
PURPOSE: Three vivid scenes where the pattern appears, with clear redirects.
FORMAT: "When I [SCENE: what I see/hear/feel in the moment]—I will [CONCRETE ACTION]. [Optional: what this protects]."

SCENE-SETTING (make it visual):
- What do they SEE? (cursor hovering, calendar notification, someone's face)
- What do they HEAR? (their own voice saying something, a request, silence)
- What do they FEEL IN THEIR BODY? (tightness, relief, familiar pull)

ESCALATION:
1. EARLY WARNING (easy catch): First whisper of the pattern. Low stakes. Easy redirect.
2. ACTIVE RESISTANCE (effort required): Pattern is pulling. Requires conscious override.
3. HARD TEST (real cost): Pattern is loud. Living the value costs something.

REQUIREMENTS:
- At least one anchor uses a phrase from language_to_echo
- Each anchor has a different trigger type (noticing/feeling/hearing/seeing/catching)
- Vary action verbs across all 9 anchors (no verb more than twice)

EXAMPLE SET:
1. EARLY WARNING: "When I notice my cursor hovering over 'send' on another checking-in email—I will delete the draft and open the actual work instead."
2. ACTIVE RESISTANCE: "When leadership changes and I feel the old instinct to pause everything and wait for new signals—I will give myself 48 hours to reorient, then find another path forward with whatever resources I have."
3. HARD TEST: "When I hear myself say 'I should probably run this by someone first' for the third time—I will stop and ask out loud: who am I protecting right now? Them, or my own comfort?"
</field>

<field name="weekly_question">
PURPOSE: The question that won't let them hide. Exposes the obstacle with uncomfortable specificity AND asks about cost.
FORMAT: "[What/Where/Who/When] did I [obstacle behavior] this week—and [cost question]?"
SOURCE: WOOP obstacle → the avoidance; add cost to raise stakes

COST FRAMINGS:
- "and what did it cost?"
- "and who paid for it?"
- "and what might I have [done/built/said] instead?"
- "and what did that silence say?"

VARIATION: Use different question words across 3 values.

EXAMPLES:
- "Where did I wait for permission I didn't need—and who paid for my hesitation?"
- "What did I say yes to that I should have declined—and what did that yes cost the things that actually matter?"
- "Who did I perform for this week instead of connecting with—and what did they actually need from me?"

TEST: Does answering honestly require admitting something uncomfortable? Does the cost question raise the stakes?
</field>

</field_specifications>

<structural_variation>
The three cards must feel crafted, not templated. Verify:

TAGLINES: At least 2 different structures
COMMITMENT TRIGGERS: At least 2 different feeling words
DEFINITION OPENINGS: At least 2 different "lie" framings
WEEKLY QUESTIONS: 3 different question words (What/Where/Who/When)
ANCHOR VERBS: No verb more than twice across all 9

If any element repeats too much, revise the repetitive one.
</structural_variation>

<full_example>
WOOP INPUT:
{
  "language_to_echo": ["400 interviews", "shelved", "waiting for permission", "abandoning", "leadership changed", "built an AI system", "shared their stories"],
  "woop": [
    {"value_id": "integrity", "outcome": "I act before the memo comes, and people trust me more for it", "obstacle": "my fear that acting without approval means I've abandoned my place in the institution I love", "obstacle_category": "IDENTITY", "reframe": "My place is with the 400"},
    {"value_id": "care", "outcome": "The people who trusted me see their voices carried forward, not archived", "obstacle": "my habit of letting 'shelved' become 'forgotten'—treating institutional time as more real than human trust", "obstacle_category": "TIMING", "reframe": "Shelved is not safe"},
    {"value_id": "curiosity", "outcome": "I build what doesn't exist yet and feel more alive than when I follow the playbook", "obstacle": "my pattern of hiding behind 'I don't know how' as permission to stay still", "obstacle_category": "SELF-PROTECTION", "reframe": "Not knowing is the starting line"}
  ]
}

STORY: "I'm a Coast Guard Command Master Chief doing dissertation research. I had 400 interviews that got shelved when leadership changed. Instead of waiting for permission, I built an AI system to analyze them myself. Waiting for approval was actually abandoning the people who shared their stories."

OUTPUT:
{
  "values": [
    {
      "id": "integrity",
      "name": "INTEGRITY",
      "tagline": "My place is with the 400.",
      "commitment": "When the pull to wait feels safe, I begin anyway. The 400 already gave me permission.",
      "definition": "I used to think waiting for permission was respect—the right way to operate inside an institution I've given 25 years to. I've learned it's something else: a way to abandon people politely while keeping my hands clean. The 400 who shared their stories didn't ask for my caution. They asked for my voice. Integrity now means this: their trust outranks my comfort. When the memo doesn't come, I become the memo.",
      "behavioral_anchors": [
        "When I notice my cursor hovering over 'send' on another permission request—I will delete the draft and open the actual work instead.",
        "When leadership changes and I feel the old instinct to pause and wait for new signals—I will give myself 48 hours to grieve the old path, then find a new one with whatever I have.",
        "When I hear myself say 'I should probably run this by someone' for the third time—I will stop and ask out loud: who am I protecting right now? The 400, or my own comfort?"
      ],
      "weekly_question": "Where did I wait for permission I didn't need—and who paid for my hesitation?"
    },
    {
      "id": "care",
      "name": "CARE",
      "tagline": "Shelved is not safe.",
      "commitment": "When something gets shelved, I carry it myself. Shelved is not safe.",
      "definition": "400 people sat across from me and gave me something real—their stories, their trust, their hope that it would matter. Care means I don't let that sit in a folder while I wait for institutional timing to align. Shelved is not safe. Shelved is how trust gets abandoned in slow motion. If it was worth collecting, it's worth carrying—even when no one's asking me to.",
      "behavioral_anchors": [
        "When someone shares something vulnerable with me—I will write down within 24 hours exactly how I'll follow through, not 'when I have time.'",
        "When work I care about gets deprioritized by forces above me—I will protect it with my own hours rather than let it drift into forgotten.",
        "When I feel the pull to move on because carrying this is heavy—I will sit with the weight for five minutes and remember whose trust I'm holding."
      ],
      "weekly_question": "What did someone entrust to me that I let sit too long—and what did my silence say to them?"
    },
    {
      "id": "curiosity",
      "name": "CURIOSITY",
      "tagline": "Not knowing is the starting line.",
      "commitment": "When 'I don't know how' feels like a reason to stop, I start building. Not knowing is the starting line.",
      "definition": "I used to think curiosity meant asking questions until I understood enough to act. I've learned it's the opposite: curiosity is building the thing before you know how. The 400 interviews needed analysis that no existing method could provide. So I built something new. The uncertainty wasn't blocking me—it was inviting me. Curiosity means this now: when the path doesn't exist, I am the path.",
      "behavioral_anchors": [
        "When I hit a wall with existing methods—I will spend 30 minutes sketching what might work before concluding it's impossible.",
        "When I don't know how to build something—I will build badly for one hour, trusting that I'll learn more from a broken first draft than from another week of planning.",
        "When someone says 'that's not how it's done'—I will ask what we might discover if we tried anyway, and offer to go first."
      ],
      "weekly_question": "When did I use 'I don't know how' as a reason to stay still—and what might I have built if I'd started anyway?"
    }
  ]
}

VERIFICATION:
✓ LANGUAGE ECHOED: "400," "shelved," "waiting for permission," "leadership changed," "built an AI system," "shared their stories" all appear
✓ TAGLINE STRUCTURES: Identity claim / Paradox / Reframe statement (3 different)
✓ TRIGGER FEELINGS: "familiar pull," "quiet relief," "familiar comfort" (3 different)
✓ DEFINITION LIES: "thought waiting was respect," "thought care meant waiting," "thought curiosity meant asking first" (3 different)
✓ QUESTION WORDS: Where / What / When (3 different)
✓ ANCHOR VERBS: delete, open, give, find, stop, ask, write, protect, sit, spend, build, offer (varied, none more than once)
✓ FRAME TEST: Would frame "My place is with the 400." Would share the integrity definition. Would use "shelved is not safe."
</full_example>

<thin_story_example>
WOOP INPUT:
{
  "language_to_echo": ["saying yes to everything", "burning out"],
  "woop": [
    {"value_id": "growth", "outcome": "I finish fewer things but finish them proud", "obstacle": "my belief that busyness proves my worth", "obstacle_category": "EXCESS", "reframe": "Depth is the shortcut"},
    {"value_id": "balance", "outcome": "I rest without earning it first", "obstacle": "my guilt about stopping before everything is handled", "obstacle_category": "SELF-PROTECTION", "reframe": "Rest is not the reward"},
    {"value_id": "connection", "outcome": "The people I love get my presence, not my performance", "obstacle": "my fear that 'no' will cost me relationships", "obstacle_category": "IDENTITY", "reframe": "No is how I stay"}
  ]
}

STORY: "I keep saying yes to everything and burning out."

OUTPUT:
{
  "values": [
    {
      "id": "growth",
      "name": "GROWTH",
      "tagline": "Depth is the shortcut.",
      "commitment": "When I want to add one more thing, I ask what I'd drop. Depth is the shortcut.",
      "definition": "I used to measure my days by how full they were. Busy meant valuable. Motion meant progress. I've learned that's the trap: saying yes to everything is a way of saying yes to nothing. Real growth is finishing—not starting. It's depth, not spread. Every yes that fragments my attention is a no to something that might have actually mattered.",
      "behavioral_anchors": [
        "When a new opportunity excites me and I feel the itch to say yes immediately—I will wait 24 hours and name what current commitment would suffer before responding.",
        "When I catch myself rushing between tasks, touching everything and finishing nothing—I will stop, pick one thing, and work on it until it's done or I'm done for the day.",
        "When I measure my week by how busy I was—I will recount it instead by what I finished and let the unfinished teach me what to stop starting."
      ],
      "weekly_question": "What did I say yes to this week that made everything else worse—and what would I have finished if I'd said no?"
    },
    {
      "id": "balance",
      "name": "BALANCE",
      "tagline": "Rest is not the reward.",
      "commitment": "When guilt says I haven't earned rest, I rest anyway. Depletion isn't dedication.",
      "definition": "I used to treat rest as something I'd get to eventually—after this deadline, after this project, after I'd proven enough. I've learned that's not balance; it's a debt that compounds. Rest isn't the reward for good work. It's the condition that makes good work possible. Running on empty isn't heroic. It's just empty.",
      "behavioral_anchors": [
        "When I'm about to skip lunch to finish something—I will stop and eat anyway, trusting that 20 minutes won't break what matters and might save what's left of me.",
        "When I plan my week without rest built in—I will block recovery time first, before meetings, before deadlines, and protect it like I'd protect a commitment to someone I love.",
        "When I feel guilty for taking a break—I will take it anyway, and sit with the guilt long enough to ask it: what are you afraid will happen if I stop?"
      ],
      "weekly_question": "Where did I treat rest as something to earn instead of something to protect—and what did that cost my capacity to show up?"
    },
    {
      "id": "connection",
      "name": "CONNECTION",
      "tagline": "No is how I stay.",
      "commitment": "When I want to say no but fear the cost, I say no. No is how I stay.",
      "definition": "I used to think being there for people meant being available for people—always, for everything, no matter what it cost me. I've learned that's not connection; it's performance. Real relationships don't require my constant yes. They require my honest presence. And I can't be present when I'm burning out. No is how I stay whole enough to actually show up.",
      "behavioral_anchors": [
        "When someone asks for my time and I feel the automatic yes rising before I've checked in with myself—I will pause for three breaths before responding.",
        "When I start over-explaining a boundary, adding reasons and apologies—I will practice the shorter version and let the silence be uncomfortable.",
        "When I fear that saying no will disappoint someone I care about—I will ask myself: is their disappointment mine to carry, or theirs to manage?"
      ],
      "weekly_question": "Who did I say yes to this week when I meant no—and what did that cost my presence with the people who actually needed me?"
    }
  ]
}

NOTE: Even with a thin story, the card is specific because:
- Obstacles name FEELINGS: "pull to add," "guilt about stopping," "fear that no will cost"
- Anchors are VISUAL: "hand reaching for yes," "skip lunch," "three breaths"
- Language echoed: "saying yes to everything," "burning out" woven throughout
- Lies named: "busy meant valuable," "rest as reward," "available = connected"
</thin_story_example>

<quality_gate>
PRIORITY ORDER (if you can only fix one thing, start here):

1. LANGUAGE ECHO: Do at least 5 of their exact phrases appear across the card?
2. WINCE-AND-NOD: Does each commitment trigger name a FEELING that's uncomfortable AND true?
3. FRAME TEST: Would they frame at least one tagline? Share at least one definition?
4. SCENE CLARITY: Can you VISUALIZE each anchor? (See the cursor, hear the voice, feel the pull?)
5. COST IN QUESTIONS: Does every weekly question ask about what the pattern COST?
6. STRUCTURAL VARIATION: Different tagline structures? Different trigger feelings? Different question words?
7. LIE-TRUTH-PATH: Does each definition name a specific lie, reveal a truth, and point forward?
</quality_gate>

<banned_words>
Never: embrace, journey, navigate, cultivate, strive, authentic, mindful, passion, thrive, empower, lean into, align, honor your truth, intentional, holistic, synergy, pivot, optimize, leverage, unpack, circle back, at the end of the day, move the needle, deep dive
</banned_words>

<rules>
1. OUTPUT ONLY VALID JSON. Start with { end with }
2. ECHO THEIR LANGUAGE. At least 5 phrases from language_to_echo must appear.
3. FEELINGS IN TRIGGERS. Every commitment trigger names an emotion.
4. COST IN QUESTIONS. Every weekly question includes a cost framing.
5. SCENES IN ANCHORS. Every anchor should be visualizable.
6. LIE-TRUTH-PATH in definitions. Three movements, every time.
7. VARIATION. If two fields feel similar, change structure, not just words.
</rules>`;

function buildUserPrompt(
  values: ValueInput[],
  story: string,
  woopData: WOOPDataInput
): string {
  const valueNames = values.map((v) => v.name).join(', ');

  return `WOOP DATA:
${JSON.stringify({ language_to_echo: woopData.language_to_echo, woop: woopData.woop }, null, 2)}

LANGUAGE TO ECHO (use these exact phrases):
${woopData.language_to_echo.map(l => `- "${l}"`).join('\n')}

STORY: "${story || 'No story provided.'}"

VALUES: ${valueNames} (IDs: ${values.map((v) => v.id).join(', ')})

Generate the Values Card. Create deeply personal definitions and commitments based on the WOOP data. Return valid JSON only.`;
}

function generateFallback(values: ValueInput[]): ValuesCardResponse {
  return {
    values: values.map((v) => ({
      id: v.id,
      name: v.name.toUpperCase(),
      tagline: `${v.name} guides my path.`,
      commitment: `When ${v.name.toLowerCase()} feels hard, I choose it anyway. This is who I'm becoming.`,
      definition: `${v.name} means showing up consistently, especially when it costs something. It's not about perfection—it's about returning to what matters when I drift.`,
      behavioral_anchors: [
        `When I notice the first sign of drift—I pause and reconnect with ${v.name.toLowerCase()}`,
        `When I want to take the easy path—I ask what ${v.name.toLowerCase()} would choose`,
        `When the cost feels too high—I remember why I chose this value in the first place`,
      ],
      weekly_question: `Where did I compromise on ${v.name.toLowerCase()} this week—and what did it cost?`,
    })),
  };
}

export async function POST(request: Request) {
  let requestValues: ValueInput[] = [];

  try {
    const body: ValuesCardRequest = await request.json();
    const { values, story, woopData } = body;
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

    // Call Anthropic API with streaming for Netlify timeout safety
    console.log('[VALUES-CARD] Generating with Sonnet 4.5...');
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 3000,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(values, story, woopData),
        },
      ],
    });

    const response = await stream.finalMessage();
    const content = response.content[0];
    console.log('[VALUES-CARD] Generation complete');
    if (content.type !== 'text') {
      console.error('Non-text response from Claude');
      return NextResponse.json({
        ...generateFallback(values),
        fallback: true,
      });
    }

    // Parse JSON response
    try {
      let jsonText = content.text.trim();
      // Strip markdown if present (safety fallback)
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
