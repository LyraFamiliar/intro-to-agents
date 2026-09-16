// Step 1 — draft a post in the brand voice.
//
// The draft comes back through a forced tool call rather than as prose, so the
// result is a JSON object with known fields instead of something we have to
// parse out of a paragraph.
import { systemPrompt } from './brand.mjs';

export const MODEL = 'claude-opus-5';

const DRAFT_TOOL = {
  name: 'submit_draft',
  description: 'Submit the drafted post for review.',
  input_schema: {
    type: 'object',
    properties: {
      specimen_id: {
        type: 'string',
        description: 'The Registry identifier the post concerns, e.g. VD-0417-K.',
      },
      text: {
        type: 'string',
        description: 'The post itself, 300 characters or fewer.',
      },
      tone: {
        type: 'string',
        enum: ['standard', 'anomaly'],
        description: 'anomaly only for Specimens with reported variance.',
      },
      reasoning: {
        type: 'string',
        description: 'One sentence on why this framing suits the Specimen.',
      },
    },
    required: ['specimen_id', 'text', 'tone', 'reasoning'],
  },
};

function describe(specimen) {
  const lines = [
    `Specimen ${specimen.id}`,
    `Registry Class ${specimen.class}`,
    `Hatched ${specimen.hatched}`,
    `Status: ${specimen.status}`,
    `Authored traits: ${specimen.authored_traits.join('; ')}`,
  ];
  if (specimen.season_closed) lines.push(`Season closed ${specimen.season_closed}`);
  lines.push(
    specimen.variance.length
      ? `Reported variance: ${specimen.variance.join('; ')}`
      : 'Reported variance: none',
  );
  return lines.join('\n');
}

export async function generateDraft(client, brand, specimen, note) {
  const instruction = [
    'Draft one post about this Specimen from the Registry:',
    '',
    describe(specimen),
    '',
    note ? `This is a retry. The previous draft was rejected:\n${note}` : '',
    'Call submit_draft with the result.',
  ]
    .filter(Boolean)
    .join('\n');

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: systemPrompt(brand),
    tools: [DRAFT_TOOL],
    tool_choice: { type: 'tool', name: 'submit_draft' },
    messages: [{ role: 'user', content: instruction }],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('The model declined this request.');
  }

  const call = response.content.find(
    (block) => block.type === 'tool_use' && block.name === 'submit_draft',
  );
  if (!call) {
    throw new Error(`No draft returned (stop_reason: ${response.stop_reason}).`);
  }
  return call.input;
}
