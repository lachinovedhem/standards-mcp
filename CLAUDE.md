# Project rules

## Skills usage (MANDATORY — applies to ALL tasks)

Every installed skill must be used whenever it is relevant — skills are not optional extras. Before
producing output for any task, check whether a matching skill exists and, if so, invoke it via the
Skill tool first. The full catalog of available skills (excluding DevExpress) is in [SKILLS.md](SKILLS.md).

Rules:

- **Check first, then act.** For any task, match it to a skill in `SKILLS.md` and load that skill
  before doing the work from memory.
- **Design/UI/frontend** → the design skills are mandatory (see the Design section below).
- **Documents** → `docx` / `pdf` / `pptx` / `xlsx` for those file types; `slides` for presentations.
- **Charts / dashboards / any data visualization** → `dataviz` before writing chart code.
- **Animation / motion** → `animate` (web) or `animate-expo` (React Native/Expo).
- **Code review / cleanup / security** → `code-review`, `simplify`, `security-review`.
- **Artifacts (published web pages)** → `artifact-design`, and `artifact-capabilities` / `artifact-diagramming` as needed.
- **Anything else with a matching skill** → use it. If unsure whether a skill fits, prefer using it over guessing.
- Skills **complement**, they do not replace, the engineering standards (standards 01–14) or the
  mandatory design review gate.

## Design (MANDATORY)

Any design, UI, frontend, or visual work in this project **must** apply the taste-skills installed under `.agents/skills/`. This is not optional — invoke the relevant skill via the Skill tool before producing design output.

Available design skills and when to use each:

- **design-taste-frontend** — default for landing pages, portfolios, redesigns, and any non-templated UI. Use this first for most frontend/design tasks.
- **design-taste-frontend-v1** — only when exact backward-compatible v1 behavior is explicitly required.
- **high-end-visual-design** — premium/high-end visual design work.
- **minimalist-ui** — minimalist interface styling.
- **industrial-brutalist-ui** — brutalist/industrial aesthetic.
- **stitch-design-taste** / **gpt-taste** — design taste references for taste calibration.
- **redesign-existing-projects** — when redesigning or restyling existing code (audit-first).
- **brandkit** — brand guidelines, logo systems, identity decks, visual-world presentations.
- **image-to-code** — converting a design image/mockup into code.
- **imagegen-frontend-web** / **imagegen-frontend-mobile** — AI image generation for web/mobile frontends.
- **full-output-enforcement** — enforce complete, non-truncated output on design deliverables.

Rule of thumb: pick the skill(s) that match the task, read them, and follow their guidance. Never ship design/UI output in this project without going through the appropriate taste-skill.

## Web Interface Guidelines review (MANDATORY)

Before any UI/frontend work is considered done, it **must** be reviewed with the **web-design-guidelines** skill (Vercel Web Interface Guidelines). This is a required gate, not optional:

- Use it to review UI code, check accessibility, audit design/UX, and verify compliance with web best practices.
- The skill fetches the latest guidelines from `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md` and checks the target files against every rule, reporting findings in `file:line` format.
- Apply it both when building new UI (review the result) and when redesigning existing UI.

Combined flow for design/UI tasks in this project: **build with the matching taste-skill → review with `web-design-guidelines` → fix findings before shipping.**

## Design-system style skills (use as needed)

A library of ~67 design-system / visual-style skills (from `bergside/awesome-design-skills`) is installed under `.agents/skills/`. **Use them whenever a task calls for a specific visual direction or aesthetic** — pick the one(s) that match the requested look and apply their tokens, components, and guidance.

Available styles:

- **Minimal / clean:** minimal, clean, basic, flat, mono, refined, sleek, spacious, square, impeccable
- **Modern / professional:** modern, contemporary, professional, corporate, enterprise, premium, editorial, shadcn, material
- **Bold / expressive:** bold, brutalism, neobrutalism, expressive, dramatic, power, vibrant, colorful, gradient, neon, cosmic, futuristic, immersive
- **Textured / depth:** glassmorphism, claymorphism, neumorphism, skeumorphism, perspective, levels, pulse
- **Artistic / playful:** artistic, creative, doodle, sketch, dithered, riso, paper, friendly, storytelling, geometric, bento
- **Retro / themed:** retro, vintage, cafe, terracotta, fantasy, fiction, sega, roku, matrix, pacman, tetris
- **Agent/tool-native:** agentic, claude, codex, stitch, lingo, ant

Rule of thumb: if the user names or implies a style (e.g. "make it glassmorphic", "brutalist landing page", "clean SaaS dashboard"), load the matching style skill first. These complement — not replace — the mandatory taste-skill build step and the `web-design-guidelines` review gate above.
