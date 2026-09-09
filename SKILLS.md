# Skills Catalog

> Bu layihədə əlçatan bütün skillərin kataloqu (**DevExpress/DevExtreme skilləri çıxarılıb**).
> Dizayn skilləri `.agents/skills/` qovluğunda real fayl kimi mövcuddur; built-in skillər environment/plugin
> tərəfindən verilir və `Skill` aləti ilə çağırılır.
>
> Tarix: 2026-09-09

---

## 1. Bizim quraşdırdığımız dizayn skilləri (`.agents/skills/`)

### taste-skill paketi (Leonxlnx/taste-skill)
- **design-taste-frontend** — anti-slop frontend: landing, portfolio, redesign üçün standart
- **design-taste-frontend-v1** — v1 geriyə-uyğunluq variantı
- **high-end-visual-design** — premium vizual dizayn
- **minimalist-ui** — minimalist interfeys
- **industrial-brutalist-ui** — industrial/brutalist estetika
- **redesign-existing-projects** — mövcud layihəni audit-first yenidən dizayn
- **brandkit** — brend qaydaları, loqo sistemləri, identity deck
- **image-to-code** — dizayn şəkli/mockup → kod
- **imagegen-frontend-web** — web frontend üçün AI şəkil generasiyası
- **imagegen-frontend-mobile** — mobil frontend üçün AI şəkil generasiyası
- **full-output-enforcement** — tam, kəsilməmiş output
- **stitch-design-taste** — taste kalibrasiyası (stitch)
- **gpt-taste** — taste kalibrasiyası (gpt)

### Vercel
- **web-design-guidelines** — UI kodunu Web Interface Guidelines / accessibility / UX üzrə yoxlayır (`file:line` formatında)

### awesome-design-skills stilləri (bergside)
Minimal/clean: **minimal, clean, basic, flat, mono, refined, sleek, spacious, square, impeccable**
Modern/professional: **modern, contemporary, professional, corporate, enterprise, premium, editorial, shadcn, material**
Bold/expressive: **bold, brutalism, neobrutalism, expressive, dramatic, power, vibrant, colorful, gradient, neon, cosmic, futuristic, immersive**
Textured/depth: **glassmorphism, claymorphism, neumorphism, skeumorphism, perspective, levels, pulse**
Artistic/playful: **artistic, creative, doodle, sketch, dithered, riso, paper, friendly, storytelling, geometric, bento**
Retro/themed: **retro, vintage, cafe, terracotta, fantasy, fiction, sega, roku, matrix, pacman, tetris**
Agent/tool-native: **agentic, claude, codex, stitch, lingo, ant**

---

## 2. Built-in dizayn / frontend / animasiya skilləri

- **animate** — sıfırdan web animasiyası qurmaq (tool/curve/duration/interrupt qərarları)
- **animate-expo** — React Native / Expo animasiyaları (Reanimated, Gesture Handler, haptics)
- **animation-vocabulary** — effekt təsvirini düzgün terminə çevirən lüğət
- **apple-design** — Apple tərzi fluid/physical motion, web üçün
- **ask-sonner** — Sonner toast kitabxanası üzrə bələdçi
- **banner-design** — sosial media / reklam / web hero / print bannerləri
- **brand** — brend səsi, vizual kimlik, mesaj çərçivələri
- **design** — kompleks dizayn: brend, token, loqo, CIP, slaydlar, banner, ikon, sosial foto
- **design-accessibility-review** — WCAG 2.1 AA uyğunluq auditi
- **design-system** — token arxitekturası, komponent spesifikasiyaları, slayd generasiyası
- **emil-design-eng** — dizayn-mühəndislik yanaşması
- **find-animation-opportunities** — animasiya imkanlarını tapmaq
- **improve-animations** — mövcud kod bazasında animasiyaları auditləmək
- **remove-ai-marks** — AI izlərini mətndən təmizləmək
- **slides** — təqdimat slaydları
- **ui-styling** — UI stil/theming
- **ui-ux-pro-max** — 50+ stil, palitralar, font cütləri, UX qaydaları (React/Next/Vue/Svelte/SwiftUI/RN/Flutter/Tailwind/shadcn/HTML)
- **write-swift** — Swift kod yazmaq
- **impeccable** — frontend interfeysi dizayn/redesign/audit/polish

---

## 3. Data vizualizasiya & artefakt

- **dataviz** — hər cür chart/graph/dashboard üçün dizayn sistemi (oxunmadan chart kodu yazma)
- **artifact-design** — Artifact səhifələri üçün dizayn bələdçisi
- **artifact-diagramming** — Artifact-larda inline SVG diaqramlar
- **artifact-capabilities** — Artifact runtime imkanları (canlı data, state, fayl və s.)

---

## 4. Anthropic skilləri (`anthropic-skills:…`)

- **algorithmic-art** — alqoritmik/generativ art
- **consolidate-memory** — yaddaşı birləşdirmək
- **import-memory** — yaddaş idxalı
- **docx** — Word sənədləri (.docx/.dotx) yaratmaq/redaktə
- **pdf** — PDF emalı
- **pptx** — PowerPoint təqdimatları
- **xlsx** — Excel cədvəlləri
- **explain-usage** — istifadə izahı
- **morning** — səhər brifinqi
- **schedule** — planlaşdırılmış agentlər (cron)
- **setup-cowork** — cowork quraşdırması
- **skill-creator** — yeni skill yaratmaq
- **web-artifacts-builder** — web artefakt qurmaq
- **remove-ai-marks** — AI izlərini təmizləmək

---

## 5. Claude Code iş axını / sistem

- **code-review** — cari diff / PR / branch üzrə kod review (səviyyələrlə)
- **simplify** — dəyişmiş kodu sadələşdirmə/təmizləmə (yalnız keyfiyyət)
- **security-review** — təhlükəsizlik review
- **fewer-permission-prompts** — icazə sorğularını azaltmaq üçün allowlist
- **update-config** — settings.json / hooks / permissions konfiqi
- **keybindings-help** — klaviatura qısayollarını fərdiləşdirmək
- **loop** — prompt/slash komandasını təkrar intervalda işlətmək
- **schedule** — planlaşdırılmış cloud agentlər (routines)
- **run** — layihənin app-ını işə salıb dəyişikliyi görmək
- **init** — CLAUDE.md-ni initializasiya etmək
- **workflow-authoring** — Workflow script yazmaq üçün istinad
- **claude-api** — Claude API / Anthropic SDK istinadı (model id, qiymət, streaming, tool use)

---

## İstifadə qaydası

Dizayn/UI işi üçün axın (bax: `standards/14-design-skills.md` və `CLAUDE.md`):
**stil skill-i (lazımsa) → taste-skill ilə qur → web-design-guidelines ilə yoxla → düzəlt → təqdim et.**
