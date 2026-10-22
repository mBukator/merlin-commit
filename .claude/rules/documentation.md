---
paths:
    - "src/**/*.ts"
    - "docs/**/*.md"
---

# Documentation Sync

When adding or changing user-facing behavior (new flags, new config fields, new commands,
changed defaults, changed UX), you MUST update the relevant `docs/` file in the same branch and
commit. Never leave `docs/` out of sync with `src/`.

Mapping:

- New CLI flags → `docs/reference/cli-reference.md`
- New config fields → `docs/reference/config-schema.md` + `docs/reference/configuration.md`
- New commands → `docs/reference/cli-reference.md` + `docs/index.md`
- New features → the matching guide under `docs/usage/` or `docs/guides/`
- Behavior changes → whichever doc describes that behavior
- Contributor-facing changes (architecture, testing, releases) → `docs/development/`

CI runs `npx prettier --check "docs/**/*.md"`, so format any doc you touch.
