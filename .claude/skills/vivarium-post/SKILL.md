---
name: vivarium-post
description: Draft and publish a Bluesky post as Vivarium Dynamics, the fictional biotech brand in this repo. Use when asked to write, draft, or post brand content for Vivarium, the Registry, or a Specimen. Enforces the brand's voice prohibitions before anything is published.
---

# Vivarium Dynamics — post to Bluesky

Draft copy in the Vivarium Dynamics voice, run it through the mechanical voice
check, and publish it to `@vivariumdynamics.bsky.social`.

## Before drafting

Read these two files. They are the source of truth; do not write from memory of
them.

- `vivarium-dynamics/copy.md` — approved lines, voice rules, nomenclature
- `registry.json` — the Specimens available to write about

Pick the Specimen the post concerns. Unless told otherwise, prefer the one
whose season closed most recently — that is the one the Registry has something
to say about. A Specimen with entries in `variance` is Anomalous and takes the
Recovery Program framing.

## Voice

Institutional sincerity. A research organisation writing to someone it trusts
with a living thing: warm, precise, faintly formal, never cute. Specimens are
*observed* and *recorded*. Dormancy is a *phase*.

Hard prohibitions — a draft breaking any of these does not get published:

1. Never the words die, dead, death, pet, toy, gimmick.
2. No exclamation marks.
3. Never wink at the audience. The brand is sincere and believes itself. No
   irony, no self-awareness, no humour at a Specimen's expense or the
   company's own. (P-04)
4. "Specimen" is always capitalised. Never abbreviate the company to "VD".
5. Never acknowledge that a Specimen is small, simple, or disappointing.
6. 300 characters maximum. Aim for about 240.

## Check before posting

Always run the lint. It is mechanical, free, and catches the rules a careful
reader still misses:

```bash
node -e "import('./scripts/lib/voice-check.mjs').then(({lint}) => {
  const v = lint({text: process.argv[1]});
  console.log(v.length ? v.join('\n') : 'PASS');
})" "DRAFT TEXT HERE"
```

A failing draft is rewritten, not argued with. Re-run until it passes.

Beyond the lint, read the draft once more against rule 3 — the wink is the one
prohibition no regex catches, and it is the one that kills the brand.

## Publish

Show the user the draft and get their go-ahead first. Posting is public and
cannot be quietly undone.

```bash
node scripts/post-to-bsky.mjs "APPROVED TEXT"
```

It prints the live post URL. Credentials come from `.env`; never print or echo
that file.

## Scope

This skill is the human-in-the-loop path. The unattended agent
(`npm run draft`) is a separate thing that needs `ANTHROPIC_API_KEY` — do not
reach for it here.
