# 14 — Dizayn Skilləri və Tətbiq Axını (brend-neytral)

> **ƏSAS TƏLƏB:** Bu layihədə hər hansı **dizayn / UI / frontend / vizual** iş quraşdırılmış
> **dizayn skilləri** (taste-skills) ilə aparılmalıdır. Bu opsional deyil — dizayn nəticəsi
> istehsaldan **əvvəl** uyğun skill çağırılmalıdır. Skillər `.agents/skills/` altındadır.
>
> Bu standart [07-ui-ux.md](07-ui-ux.md)-i əvəz etmir, onu **tamamlayır**: §07 struktur və
> token qaydalarını, bu standart isə **iş axını və skill seçimini** təyin edir.

## 1. Məcburi dizayn axını

Dizayn/UI tapşırığı üçün ardıcıllıq:

1. **Stil** — istifadəçi konkret görünüş/estetika istəyirsə, əvvəlcə uyğun **stil skill-i** yüklə.
2. **Qur** — işə uyğun **taste-skill** ilə qur (məcburi). Şablon görünüşlü (templated) çıxış qadağandır.
3. **Yoxla** — `web-design-guidelines` skill-i ilə UI-ı Web Interface Guidelines, accessibility
   və UX baxımından yoxla (məcburi qapı/gate).
4. **Düzəlt** — tapılan problemləri (findings) təqdimatdan əvvəl həll et.

> Qısa: **stil → qur (taste-skill) → yoxla (web-design-guidelines) → düzəlt → təqdim et.**

## 2. Əsas taste-skilləri (məcburi qurma addımı)

| Skill | Nə vaxt |
|---|---|
| `design-taste-frontend` | Əksər frontend/dizayn tapşırıqları üçün **standart** (landing, portfolio, redesign) |
| `design-taste-frontend-v1` | Yalnız dəqiq v1 geriyə-uyğunluq tələb olunanda |
| `high-end-visual-design` | Premium / yüksək səviyyəli vizual iş |
| `minimalist-ui` | Minimalist interfeys |
| `industrial-brutalist-ui` | Brutalist / industrial estetika |
| `redesign-existing-projects` | Mövcud kodu yenidən dizayn (audit-first) |
| `brandkit` | Brend qaydaları, loqo sistemləri, identity deck |
| `image-to-code` | Dizayn şəkli/mockup → kod |
| `imagegen-frontend-web` / `imagegen-frontend-mobile` | Web/mobil üçün AI şəkil generasiyası |
| `full-output-enforcement` | Dizayn çıxışında tam, kəsilməmiş output |
| `stitch-design-taste` / `gpt-taste` | Taste kalibrasiyası üçün istinad |

## 3. Yoxlama qapısı — web-design-guidelines (MƏCBURİ)

Hər UI/frontend iş bitmiş sayılmazdan əvvəl **web-design-guidelines** (Vercel Web Interface
Guidelines) skill-i ilə yoxlanmalıdır:

- UI kodunu, accessibility-ni, UX-i və web best-practice uyğunluğunu yoxlayır.
- Ən son qaydaları `raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`
  ünvanından çəkir və hədəf faylları hər qaydaya qarşı yoxlayır, nəticəni `file:line` formatında verir.
- Həm yeni UI qurarkən, həm mövcud UI-ı redesign edərkən tətbiq olunur.

## 4. Stil skilləri (lazım gəldikcə istifadə et)

`bergside/awesome-design-skills`-dən ~67 dizayn-sistem stil skill-i quraşdırılıb. İstifadəçi stil
adlandıranda və ya nəzərdə tutanda (məs. "glassmorphic et", "brutalist landing", "təmiz SaaS
dashboard") uyğun stil skill-i **əvvəlcə** yüklənməlidir.

- **Minimal / clean:** `minimal`, `clean`, `basic`, `flat`, `mono`, `refined`, `sleek`, `spacious`, `square`, `impeccable`
- **Modern / professional:** `modern`, `contemporary`, `professional`, `corporate`, `enterprise`, `premium`, `editorial`, `shadcn`, `material`
- **Bold / expressive:** `bold`, `brutalism`, `neobrutalism`, `expressive`, `dramatic`, `power`, `vibrant`, `colorful`, `gradient`, `neon`, `cosmic`, `futuristic`, `immersive`
- **Textured / depth:** `glassmorphism`, `claymorphism`, `neumorphism`, `skeumorphism`, `perspective`, `levels`, `pulse`
- **Artistic / playful:** `artistic`, `creative`, `doodle`, `sketch`, `dithered`, `riso`, `paper`, `friendly`, `storytelling`, `geometric`, `bento`
- **Retro / themed:** `retro`, `vintage`, `cafe`, `terracotta`, `fantasy`, `fiction`, `sega`, `roku`, `matrix`, `pacman`, `tetris`
- **Agent/tool-native:** `agentic`, `claude`, `codex`, `stitch`, `lingo`, `ant`

Stil skilləri əsas taste-skill qurma addımını və `web-design-guidelines` yoxlama qapısını **əvəz
etmir**, onlarla birlikdə işləyir.

## 5. Checklist (Definition of Done — dizayn)

- [ ] Stil tələb olunurdusa, uyğun stil skill-i yükləndi.
- [ ] İş uyğun **taste-skill** ilə quruldu (şablon görünüş yoxdur).
- [ ] UI **web-design-guidelines** ilə yoxlandı; findings `file:line` formatında.
- [ ] Bütün findings həll edildi.
- [ ] §07 struktur/token qaydalarına uyğundur — kodda hardcoded rəng/şrift/host yoxdur.
