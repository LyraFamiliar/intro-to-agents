// Step 2 — the quality gate.
//
// Two passes. The lint catches what is mechanically checkable and costs
// nothing; the review catches what only reading can catch, like a joke at the
// Specimen's expense or a wink at the audience.
import { MODEL } from './generate.mjs';

const BANNED = ['die', 'dies', 'died', 'dead', 'death', 'pet', 'pets', 'toy', 'toys', 'gimmick'];

export function lint(draft) {
  const violations = [];
  const text = draft.text ?? '';

  const found = BANNED.filter((word) => new RegExp(`\\b${word}\\b`, 'i').test(text));
  if (found.length) {
    violations.push(`Uses prohibited ${found.length > 1 ? 'words' : 'word'}: ${found.join(', ')}.`);
  }
  if (text.includes('!')) {
    violations.push('Contains an exclamation mark. Registry correspondence takes none.');
  }
  if ([...text].length > 300) {
    violations.push(`Runs to ${[...text].length} characters; the limit is 300.`);
  }
  if (/\bspecimen\b/.test(text)) {
    violations.push('"Specimen" appears in lower case. It is always capitalised.');
  }
  if (/\bVD\b(?!-)/.test(text)) {
    violations.push('Abbreviates the company to "VD", which is prohibited in customer-facing copy.');
  }
  if (!text.trim()) {
    violations.push('The draft is empty.');
  }
  return violations;
}

const REVIEW_TOOL = {
  name: 'submit_review',
  description: 'Report whether the draft holds to the brand voice.',
  input_schema: {
    type: 'object',
    properties: {
      passes: { type: 'boolean', description: 'true only if every rule holds.' },
      violations: {
        type: 'array',
        items: { type: 'string' },
        description: 'One sentence per problem. Empty when the draft passes.',
      },
    },
    required: ['passes', 'violations'],
  },
};

const REVIEW_SYSTEM = `You review draft copy for Vivarium Dynamics against its brand
prohibitions. You are a checker, not a writer — do not rewrite anything.

Reject a draft if any of these hold:

- It uses the words die, dead, death, pet, toy, or gimmick.
- It contains an exclamation mark.
- It winks at the audience: irony, self-awareness, or a joke at a Specimen's
  expense or the company's own. The brand is sincere and believes itself.
- It acknowledges that a Specimen is small, simple, or disappointing.
- It frames dormancy as an ending rather than a phase.
- It writes "Specimen" in lower case, or abbreviates the company to "VD".
- It reads as marketing hype rather than a research organisation writing to
  someone it trusts with a living thing.

Judge only what is written. A draft that is merely plain is not a violation.
Call submit_review with your verdict.`;

export async function review(client, draft) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1000,
    system: REVIEW_SYSTEM,
    tools: [REVIEW_TOOL],
    tool_choice: { type: 'tool', name: 'submit_review' },
    messages: [{ role: 'user', content: `Review this draft:\n\n${draft.text}` }],
  });

  const call = response.content.find(
    (block) => block.type === 'tool_use' && block.name === 'submit_review',
  );
  if (!call) throw new Error('The reviewer returned no verdict.');
  return call.input.passes ? [] : call.input.violations;
}

// Lint first — it is free, and a draft that fails it does not need a second call.
export async function check(client, draft) {
  const mechanical = lint(draft);
  if (mechanical.length) return mechanical;
  return review(client, draft);
}
