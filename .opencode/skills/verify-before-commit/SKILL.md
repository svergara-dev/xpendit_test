---
name: verify-before-commit
description: Use when user asks to commit. Runs lint, build, and test before committing.
---

# Verify Before Commit

When the user asks to commit code, always run verification steps first:

## Steps

1. Run `npm run lint` — fix any lint errors
2. Run `npm run build` — ensure TypeScript compiles
3. Run `npm run test` — all tests must pass
4. Only if all pass, proceed with `git add` and `git commit`

## If verification fails

- Do NOT commit
- Show the user what failed
- Offer to fix the issues
- Re-run verification before committing

## Commit message format

Follow conventions in AGENTS.md:
- Format: `type(scope): description`
- Language: English
- Imperative mood
