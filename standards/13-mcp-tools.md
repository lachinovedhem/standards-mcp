# 13 — MCP Alətləri və Alət Siyasəti (geniş)

> **MCP-first siyasəti:** hər tapşırıqdan əvvəl "bu işi həll edən qurulu MCP varmı?" sualını ver.
> Yaddaşdan cavab vermə — əvvəlcə uyğun MCP/sənəd mənbəyini çağır. Bu, [01](01-golden-rules.md) §18
> qaydasının geniş formasıdır. Konkret server siyahısı mühitə görə dəyişir — naməlum imkan barədə
> "yoxdur" deməzdən əvvəl `ToolSearch` ilə yoxla.

## 1. Prinsip
1. **MCP-first:** uyğun MCP varsa çağır — yaddaşdan/təxmindən üstündür (cari, dəqiq).
2. **Doğru aləti seç** (aşağıdakı kateqoriyalar).
3. **Mürəkkəb qərar → əvvəlcə düşün** (sequential-thinking; lazımda ikinci model rəyi).
4. **Kod sonrası:** təhlükəsizlik skanı, UI perf, e2e axını.
5. **Token qənaəti:** aləti hədəfli çağır, nəticəni lazımsız təkrar emal etmə.
6. **Kəşf:** naməlum imkan üçün əvvəlcə `ToolSearch`.

## 2. Alət Kateqoriyaları (generik — konkret ad mühitə görə)

| Kateqoriya | İstifadə | Nümunə server |
|---|---|---|
| **Düşüncə/planlama** | Çoxmərhələli memarlıq/SQL qərarları | `sequential-thinking` |
| **Kitabxana sənədləri** | Framework/paket API-si (cari, dəqiq) — yaddaşdan əvvəl | `context7`, `microsoft-learn` |
| **Veb axtarış/scrape** | Geniş axtarış, strukturlaşdırılmış data | `exa`, `firecrawl`, `fetch` |
| **Verilənlər bazası** | SQL yazı/doğrulama/schema | Oracle → `oracle-sqlcl`, PG → `postgres`, SQL Server MCP |
| **UI — Grid/cədvəl** | AG Grid kolon/renderer/datasource/miqrasiya | **AG Grid MCP** (§4) |
| **UI — komponent** | Müasir/animasiyalı komponentlər | komponent registry MCP-ləri |
| **Test/debug** | E2E, brauzer avtomatlaşdırması, perf | `playwright`, chrome-devtools |
| **Təhlükəsizlik** | SAST/secret/SCA skanı (kod sonrası) | SAST/SCA MCP-ləri, CodeQL |
| **Kəşf** | Yeni MCP connector tapmaq | `mcp-registry` |

> Bəzi serverlər ilk istifadədə autentifikasiya tələb edə bilər. Legacy komponent kitabxana
> MCP-ləri **yalnız legacy** layihələrdə (yeni layihə Tailwind + layihə UI kit — [07](07-ui-ux.md) §12).

## 3. MCP Serverin Qeydiyyatı
- **Claude Code:** `claude mcp add <ad> <command> <args...>` və ya `~/.claude.json` `mcpServers` bölməsi.
- **Cursor/VS Code:** `mcp.json` (`command`, `args`, `env`).
- **Sirlər:** MCP `env`-də açar lazımdırsa **yalnız yerli konfiqdə** (repo-ya commit yox — [03](03-security.md) §1). Açarsız serverlərə üstünlük.
- Qeydiyyatdan sonra serverlər **yeni sessiyada** aktivləşir.

## 4. AG Grid MCP (grid işi üçün MƏCBURİ mənbə)

> Bütün desktop cədvəlləri **AG Grid**-dir ([07-ui-ux.md](07-ui-ux.md) §3). AG Grid kolon/cell-renderer/
> datasource/miqrasiya işində **AG Grid MCP** rəsmi, versiya-spesifik mənbədir — yaddaşdan yox, ondan çək.

**Rəsmi server:** [`ag-grid/ag-mcp`](https://github.com/ag-grid/ag-mcp) — LLM-optimize edilmiş, framework + versiya-spesifik AG Grid sənədi/API-si.

**Quraşdırma (Claude Code):**
```bash
claude mcp add ag-mcp npx ag-mcp
```

**Konfiqurasiya (`~/.claude.json` / Cursor `mcp.json`):**
```json
{
  "mcpServers": {
    "ag-mcp": { "command": "npx", "args": ["ag-mcp"] }
  }
}
```

**Verdiyi alətlər:**
| Alət | Nə edir |
|---|---|
| `search_docs` | Təbii dillə AG Grid sənəd/API axtarışı (versiya/framework override ilə) |
| `detect_version` | `package.json`-dan quraşdırılmış AG Grid versiyası + framework-u təyin edir |
| `set_version` | Monorepo üçün versiya/framework əl ilə təyin |
| `list_versions` | Miqrasiya üçün mövcud versiyaları verir |

**Prompt-lar:** `quick-start` (yeni grid, framework-spesifik), `upgrade-grid` (versiyalararası addım-addım miqrasiya).

**Framework dəstəyi:** React (bizim stack — [07](07-ui-ux.md)), Angular, Vue, vanilla JS.

**İstifadə qaydası:**
- Yeni grid qurarkən → `quick-start` prompt + `search_docs` (floating filter, virtualization, infinite row model konfiqi üçün — [07](07-ui-ux.md) §3.3).
- Versiya yüksəldərkən → `detect_version` + `upgrade-grid`.
- Kolon tipi/cell renderer/datasource sualı → `search_docs` (yaddaşdan cavab vermə — API versiyaya görə dəyişir).
- **Standart qaydalar dəyişmir:** MCP sənəd verir, amma [07](07-ui-ux.md) §3.3 qaydaları (floating filter, `suppressHeaderFilterButton`, `pagination: false`, virtualization) **qətidir**.

## 5. Anti-pattern-lər
- ❌ Kitabxana API-sini yaddaşdan yazmaq (versiya dəyişə bilər) — `context7`/`microsoft-learn`/AG Grid MCP çağır.
- ❌ AG Grid konfiqini təxminlə yazmaq — `search_docs` ilə versiya-dəqiq götür.
- ❌ MCP açarını repo-ya commit etmək.
- ❌ Naməlum imkan üçün `ToolSearch` etmədən "yoxdur" demək.

## Yoxlama Siyahısı
- [ ] Tapşırığa uyğun MCP varsa çağırılıb (yaddaşdan əvvəl); naməlum imkan `ToolSearch` ilə yoxlanıb
- [ ] Kitabxana sualı → `context7`/`microsoft-learn`; DB → DB MCP; grid → **AG Grid MCP**
- [ ] Grid işi AG Grid MCP-dən (`search_docs`/`detect_version`/`quick-start`/`upgrade-grid`) — amma [07](07-ui-ux.md) §3.3 qaydaları qəti
- [ ] MCP sirləri yalnız yerli konfiqdə (commit yox); açarsızlara üstünlük
- [ ] Kod sonrası təhlükəsizlik/perf/e2e MCP-ləri; mürəkkəb qərar əvvəl sequential-thinking
