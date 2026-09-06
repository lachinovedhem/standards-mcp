# 07 — UI/UX və Frontend Standartları (brend-neytral)

> **ƏSAS TƏLƏB:** İnterfeys **müasir, sadə, anlaşılan və özü özünü izah edən (self-explanatory)**
> olmalıdır. İstifadəçi hansı cihazdan daxil olursa olsun, istənilən əməliyyatı **həmin pəncərədən,
> sadə formada** icra edə bilməlidir.
>
> **KRİTİK PRİNSİP — heç bir rəng/şrift/asset kodda sabitlənmir.** Yalnız **struktur qaydaları** və
> **semantik design token adları** təyin olunur. Konkret dəyərləri (hex/RGB, şrift faylı, SVG asset)
> hər layihə öz brend paketindən verir. Kodda hex dəyəri **lint xətası**dır.
>
> **Asset yuvaları (slots)** — layihə doldurur: `<BREND_FON_SVG>`, `<BREND_LOQO_SVG>`,
> `<BREND_WORDMARK_FONT>`, `<PORTAL_URL>`.

## 1. Fundamental Prinsiplər
- **Self-explanatory axın:** istifadəçi təlimat oxumadan nə edəcəyini anlamalıdır.
- **Tək pəncərə tamlığı:** əməliyyat başladığı ekranda bitir — başqa ekrana "atmaq" minimuma.
- **Kompakt mətn:** qısa, konkret. Lazımsız söz yox.
- **Aydın oxunaqlılıq:** təmiz, sıx olmayan interfeys.

## 2. Responsivlik (Məcburi)
- Tam responsiv; bütün cihazlarda funksional. **Heç bir element kənara qaçmır** (overflow yox).
- Breakpoints: Mobil (320px+), Tablet (768px+), Laptop (1024px+), Desktop (1440px+).
- `min-width: 0`, overflow idarəsi, `flex-wrap`, `max-width: 100%`.

## 3. Data Göstərimi — Grid (Desktop) vs Tile Card (Mobil) — Məcburi

> **Qızıl qayda:** eyni data iki ayrı görünüşlə — desktopda **AG Grid**, mobildə **tile card**.
> Cədvəl mobilə uyğun deyil — mobil/planşetdə AG Grid **HEÇ VAXT** göstərilmir (nə kiçildilmiş, nə horizontal-scroll-lu).

### 3.1 Keçid (breakpoint)
| Ekran | Görünüş |
|---|---|
| **≥ 1024px** | AG Grid cədvəl |
| **< 1024px** | Tile card siyahısı |

Tətbiq = **şərti render** (CSS ilə gizlətmə yox, **render etmə**): `useMediaQuery` ilə `<DataGrid/>` və ya `<CardList/>`. Mobildə AG Grid DOM-u qurulmur.
```jsx
const isDesktop = useMediaQuery('(min-width: 1024px)');
return isDesktop ? <DataGrid rows={data} /> : <CardList items={data} />;
```

### 3.2 QADAĞAN
- ❌ Mobildə AG Grid-i horizontal scroll ilə göstərmək.
- ❌ Cədvəli kiçildib/zoom edib mobilə sığışdırmaq.
- ❌ Barmağa uyğun olmayan (< 44×44px) toxunma hədəfləri.

### 3.3 AG Grid — Desktop qaydaları
- **Floating filter** (hər sütun altında daimi sətir): `floatingFilter: true`.
- Başlıq advanced-filter düyməsi gizli: `suppressHeaderFilterButton: true` (köhnə: `suppressMenu: true`/`menuTabs: []`).
- **Virtualization məcburi** (row+column). **Pagination YOX → infinite scroll**: `pagination: false`.
- Açar sütun `pinned: 'left'`; mətn sütunları `flex`/`minWidth`.
- Grid teması **tokenlərə bağlanır** (`--ag-*` ← `--surface-*`/`--ink-*`/`--brand-*`) — dark mode avtomatik.
```js
const gridOptions = {
  pagination: false,
  rowModelType: 'infinite',
  defaultColDef: { floatingFilter: true, suppressHeaderFilterButton: true, sortable: true, resizable: true, minWidth: 120 },
};
```

### 3.4 Tile Card — Mobil qaydaları
- Bir qeyd = bir tile card. Şaquli siyahı, barmaqla idarə.
- **Başlıq:** əsas identifikator (qalın). **Sahələr:** yalnız 2–4 vacib sahə (`etiket: dəyər`); qalanı gizli.
- **Status:** rəngli chip/badge (semantic tonlar). **Əməliyyat:** əsas düymə + kebab (⋮) menyu / swipe.
- Toxunma hədəfi **≥ 44×44px**; kartlar arası 8pt; tam en. `rounded-2xl border bg-surface-2`.
- Yuxarıda filter/sort paneli. Infinite scroll; yüklənərkən skeleton kart.

### 3.5 Sütun → Kart xəritələnməsi
| Cədvəl | Kart |
|---|---|
| Açar sütunu | Başlıq |
| 1–2 ikincili sahə | Alt başlıq / `etiket: dəyər` |
| Status | Rəngli chip |
| Sətir əməliyyatları | Düymə / kebab |
| Az əhəmiyyətli | Gizli (detal) |

## 4. Performans Hissi (Donma Qadağası)
- **Donma və gecikmə hissi YOL VERİLMƏZ.**
- **Skeleton** ekranları (boş ekran yox). **Optimistik UI** (nəticəni dərhal göstər, arxada təsdiqlə).
- Uzun əməliyyatda progress/spinner + status mətni. `Button loading` halında rəng qalır + spinner.
- Ağır komponentlər lazy-load.

## 5. Animasiyalar
- **Yumşaq** animasiyalar; bounce/elastik easing **QADAĞAN**.
- Motion tokenləri: `--motion-fast:120ms`, `--motion-standard:200ms`, `--motion-emphasized:320ms`, `--ease-standard:cubic-bezier(.2,0,0,1)`.
- Düymələrdə **yalnız `transition-colors`** (`transition-all` yox). Keçidlər yumşaq fade/slide (150–320ms).
- **`prefers-reduced-motion` dəstəyi məcburidir** — bütün animasiya ~0ms-ə.

## 6. Şüşə Effekti (Glassmorphism)
Hədəfli yerlərdə: header (`bg-surface-2/85 backdrop-blur-md`), modal backdrop (`bg-scrim backdrop-blur-sm`), üzən panellər.
```css
.glass-panel { @apply rounded-2xl border border-subtle/70 bg-surface-2/80 backdrop-blur; }
```
Kontrast qorunur — şüşə fonu üzərində mətn **WCAG AA**. Mətn daşıyan əsas səthlər **qeyri-şəffaf** qalır.

## 7. Design Tokenləri (Məcburi)

### 7.0 Qızıl qayda — sabit dəyər yoxdur
- Kodda/Tailwind sinfində/CSS-də **hex/rgb sabiti QADAĞAN**. Yalnız token adı: `var(--brand-primary)`, `bg-brand-500`, `text-ink-900`.
- Bütün dəyərlər **tək mənbədə**: `src/styles/tokens.css` (`:root` + `.dark`) + `tailwind.config.ts`. Brend paketi yalnız bu iki faylı doldurur.

### 7.1 Brend rampı
9 pilləli `brand` (50…900), primary = `--brand-500`. **`--brand-500` `--brand-on-primary` mətnini daşıyan ən açıq pillə** olmalı — kontrast **≥ 4.5:1** (ölçülərək). Düymə/badge-də yalnız **500–700**. Brend gradienti tünd intervalda: `--brand-gradient: linear-gradient(135deg, var(--brand-700), var(--brand-600) 45%, var(--brand-500))`. Ramp **monoxrom** (eyni hue).

### 7.2 Neytral (ink) rampı — soyuq-neytral, mavi çalar YOX
`ink` (50…950). **`--ink-400`/`--ink-500` (muted text) per-theme dəyişən** — açıq və tünd fonda ayrı dəyər (hər ikisi ≥ 4.5:1). **Saf qara/boz QADAĞAN** (həmişə cüzi tint). Space-separated RGB (alpha modifikatorları işləsin).

### 7.3 Status və semantic
`--status-open/progress/done` (+ `-soft` fon, `-ink` mətn). **Soyuq = mərhələ, isti = prioritet** (`--warning`/`--danger` prioritetə saxlanır — statusa isti rəng vermə). Status həm **hue**, həm **lightness** ilə fərqlənir (greyscale + rəng korluğunda da ayrılsın). Semantic: `--info/success/warning/danger/accent` (+ soft/ink). Kontrast **≥ 4.5:1**.

### 7.4 Tipoqrafiya
- **UI şrifti self-hosted** (`public/fonts/`, `@font-face` woff2). Prod CSP `default-src 'self'` → **xarici şrift CDN QADAĞAN**. `latin-ext` slice (ə/ğ/ş/ı/ö/ü/ç).
- Adlı ölçü pillələri (`micro/meta/ui/ui-lg/title-sm/title`). Başlıqlarda `letter-spacing:-0.015em`.
- **Wordmark qaydası:** brend şrifti (`--font-brand`) **yalnız brend sözlərinə** (`.brand-word`); bütün digər mətn `--font-ui`.

### 7.5 Kölgə, radius, seçim
- Radius: kart/modal/panel `rounded-2xl`, düymə/input/nav `rounded-xl`, chip `rounded-full`.
- `boxShadow`: `soft`, `elevated`, `focus` (4px brend halqası), `brand`.
- `::selection` brend tonunda. Nazik scrollbar utiliti.

## 8. Fon — Dekorativ Kətan
- Arxa fon dekorativ **vektor SVG** (`<BREND_FON_SVG>`, `public/brand/app-bg.svg`). Yalnız kətanda (`absolute inset-0 pointer-events-none aria-hidden`), kartların altında.
- Kart səthləri **qeyri-şəffaf** (`bg-surface-2`) → mətn kontrastı fondan asılı deyil.
- `background-size:cover`, `attachment:fixed` (scroll-da sürüşmür). Light `opacity:0.85`, dark `opacity:0.4`.
- Vektor (~6KB), CSP-uyğun. Üstünə zəif brend radial glow (alpha ≤ 0.15 light / ≤ 0.08 dark).
- Kətan: `--surface-canvas` — light yumşaq boz, dark **saf qaradan bir az isti** (OLED strobe yox).

## 9. Layout — AppLayout, Header, Sidebar
- **AppLayout:** `h-screen overflow-hidden`; sidebar öz scroll-u, əsas sütun `overflow-y-auto`. Konteyner `max-w-[1400px] mx-auto`, `px-4 sm:px-6 lg:px-10`. Səhifə `ErrorBoundary` (resetKey=pathname).
- **Header (desktop):** `h-16`, `bg-surface-3/85 backdrop-blur-md` + alt border; mərkəzdə axtarış pill-i (`Ctrl K` palette), sağda əməliyyat klasteri bir pill içində (dil/tema/bildiriş). **Ctrl/Cmd+K** `e.code==="KeyK"` (input/dialog üstündə işə düşmür). Mobil: `h-14`, hamburger + loqo.
- **Sidebar:** açıq `w-[260px]`, collapsed `lg:w-[76px]` (localStorage persist). Mobil: off-canvas drawer + scrim. `bg-surface-3` qeyri-şəffaf. Aktiv nav = `--brand-gradient` pill + `--brand-on-primary`; idle `text-ink-700`, hover `bg-brand-50`. Portal promo kartı altda. İstifadəçi menyusu ən altda (click-outside bağlanır).
- **İkonlar: tək kitabxana (default `lucide-react`), vahid outline stil.** Qarışıq metafora (filled+outline) və ikinci kitabxana **QADAĞAN**.

## 10. Naviqasiya — Portala keçid
- Naviqasiyada ekosistem portalına keçid: `<PORTAL_URL>` (env-dən, `VITE_PORTAL_URL` — hardcode yox). Sidebar altında promo kart. **Yalnız açar təyin olunubsa.**

## 11. Dark Mode (Məcburi)
- Üç rejim: `light/dark/system`. Tailwind `darkMode:"class"`; `.dark` **`<html>`-də** (body yox — portal modal/dropdown da tema alsın). `document.documentElement.style.colorScheme` təyin olunur.
- `system` rejimdə `matchMedia` listener canlı izləyir. **Hər komponentdə `dark:` variantı məcburi.** Dark üçün ayrıca hardcode rəng yox — eyni token adı `.dark` blokunda yenidən təyin.
```css
:root { --surface-canvas:<light>; --surface-2:<light>; --border-subtle:<light>; }
.dark { --surface-canvas:<dark>;  --surface-2:<dark>;  --border-subtle:<dark>; }
```

## 12. Komponent Kitabxanası — Tailwind + layihə UI kit
> **Yeni layihələr `antd` İSTİFADƏ ETMİR.** Stack: Tailwind + layihənin öz UI kit-i (`src/components/ui/*`) + `lucide-react` + `cn()` (`clsx`+`tailwind-merge`). Ağır cədvəllər → AG Grid. `antd` yalnız **legacy** kodda (yeni koda importu yox).

Baza komponentlər: `Button` (variant/size/loading; primary = gradient + on-primary; yalnız `transition-colors`), `Card*`, `Badge` (tone + soft/ink), `Input/Textarea/Select/Field`, `Modal` (portal, glass backdrop, Escape/backdrop bağlanır, body scroll kilidi, `role="dialog" aria-modal`), `PageHeader`, `EmptyState`, `Skeleton`, `TileCard`/`TileCardList`.
- **Hardcode UI mətni QADAĞAN** (i18n açarı). **İnline `style={{}}` QADAĞAN** (dinamik dəyər istisna — o da tokendən). **Hex/rgb sabiti QADAĞAN**.

## 13. Brendinq və Loqo
- **Loqo şirkət kimliyidir** — UI palitrası ilə **rənglənmir** (`<BREND_LOQO_SVG>` öz sabit rənglərini daşıyır). Standart forma: yumru künclü kvadrat + kontrast qlif.
- Qlif ⟂ fon kontrastı ≥ 4.5:1. **Həm proqram loqosu, həm favicon.** Min hündürlük 32px (sidebar 36px), clear space.

## 14. PWA (Məcburi)
- Manifest + service worker + offline shell. İlk girişdə **"Yüklə" düyməsi**.
```js
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; showInstallButton(); });
async function onInstallClick() { if(!deferredPrompt) return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; hideInstallButton(); }
```
- `manifest.json`: loqo 192/512 + maskable, `theme_color`(=`--brand-700`), `background_color`(=splash/`--surface-canvas`), `display:standalone`. Rənglər **build-də tokenlərdən generasiya** olunur.

## 15. Layout və A11y Qaydaları
- **8pt grid** (boşluqlar 8-in qatı). Radius: kart 2xl / düymə-input xl / chip full.
- Focus görünən (`shadow-focus` / `focus-visible:ring`); `outline:none` yalnız əvəzedici halqa ilə.
- **Klaviatura ilə tam idarə**; semantik HTML + ARIA (`role="dialog" aria-modal`, `aria-busy`, dekorativ `aria-hidden`). Kontrast ≥ 4.5:1; toxunma hədəfi ≥ 44×44px; `prefers-reduced-motion`.
- İkonlar yalnız SVG (tək kitabxana, outline; idle 1.75 / aktiv 2 xətt qalınlığı).

## 16. Dizayn Skilləri (AI Agentləri üçün — Məcburi İstifadə)
Qlobal skillər (`~/.claude/skills/`) məsləhət mənbəyi, review aləti və **bu standartları yaxşılaşdırma mənbəyidir**. Mənbələr: [emilkowalski/skills](https://github.com/emilkowalski/skills), [impeccable.style](https://impeccable.style/), [tasteskill.dev](https://www.tasteskill.dev/).

| Skill | Çağırış | İstifadə |
|---|---|---|
| **emil-design-eng** | avtomatik | UI cilalama/animasiya fəlsəfəsi (AG Grid, UI kit, glass, token). |
| **review-animations** | `/review-animations` | Animasiya/motion review (Block/Approve). |
| **impeccable** | `/impeccable <command>` | 23 əmr (audit/polish/animate…) + `npx impeccable detect`. İlk dəfə: `/impeccable init`. |
| **taste-skill ailəsi (13)** | avtomatik | `design-taste-frontend`, `minimalist-ui`, `high-end-visual-design`, `redesign-existing-projects` və s. |

### Qaydalar və uzlaşma
- **Bu sənəd qətidir.** Skill prinsipi onu gücləndirmək üçündür; ziddiyyət olduqda **layihənin rəsmi brend qaydası** qalib gəlir.
- **Şrift konflikti:** impeccable/taste-skill bəzi geniş yayılmış UI şriftlərini pisləyə bilər. **Lakin layihənin rəsmi UI şrifti brend paketi ilə təyin olunubsa** (§7.4 `--font-ui`) → həmin şrift **icazəlidir**; bu anti-pattern tətbiq edilmir.
- **Qadağan anti-pattern-lər:** bənövşəyi→mavi gradient klişesi, kart içində kart, rəngli fonda boz mətn, saf qara/boz (həmişə tint), bounce/elastik easing, komponentdə hardcode rəng.
- Yeni faydalı qayda → bu sənədə əlavə et + `DECISIONS.md`-də səbəb.

## 17. Yoxlama Siyahısı
- [ ] Axın self-explanatory; tam responsiv, overflow yox
- [ ] ≥1024px AG Grid (floating filter, başlıq düyməsi gizli, virtualization, pagination yox); <1024px tile card (şərti render, ≥44px)
- [ ] **Kodda hex/rgb sabiti yoxdur** — hamısı token adı ilə; `tokens.css`+`tailwind.config.ts` tək mənbə
- [ ] `--brand-500` üzərində `--brand-on-primary` ≥ 4.5:1 ölçülüb
- [ ] Dark mode tam (`<html>`-də `.dark`, hər elementdə `dark:`, per-theme muted-text)
- [ ] Skeleton + yumşaq keçid (donma yox); `prefers-reduced-motion`; düymələrdə `transition-colors`
- [ ] Layihə UI kit (§12); antd yeni koda yox; wordmark yalnız `.brand-word`
- [ ] PWA + "Yüklə" düyməsi; manifest rəngləri tokenlərdən
- [ ] 8pt grid; radius kart 2xl / düymə xl; A11y (klaviatura, focus-visible, ARIA)
