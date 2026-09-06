# 01 — Qızıl Qaydalar (portativ)

> Kodlama üstünlüklərinin xülasəsi. Detallar müvafiq fayllarda. **SSO və mərkəzi servislər opsionaldır**
> (bax [06-optional-sso-audit.md](06-optional-sso-audit.md)).

**Platforma**
1. Backend = **.NET (C#)** və ya **Java** (layihə üzrə vahid). Frontend = **React + Vite** (Blazor yox).
2. **Clean Architecture** (Core → Application → Infrastructure → WebAPI; asılılıq içəriyə). .NET: **Native AOT** + **Dapper.AOT** (klassik `Dapper` qadağan) + Minimal API.
3. Hər API-da: OpenAPI/Swagger, structured log, `/health/live` + `/health/ready`.
4. DB: Oracle / PostgreSQL / SQLite. `DISTINCT` yox → `GROUP BY`/`ROW_NUMBER()`. SQL **AOT-safe** (literal/`const`). Bağlantı yalnız `DB_CONNECTION_STRING`.

**Sıfır hardcoded kimlik (universal)**
5. Host, açar, rəng, şrift, loqo, daxili domen — **heç biri kodda deyil**. Hamısı `ENV` açarı / token / brend slotu. Kodda hex rəng və ya daxili host = **lint xətası**.
6. **İcazə = boolean** (`Permissions.Modul.Alt.Approve == true`), **rol adına görə yox** (`if(role=="Admin")` qadağan).
7. Secrets (API key, JWT secret, connection string, parol) **yalnız server env / secret store** — repo/frontend/Git/log/brauzerdə yox.

**Şəbəkə/təhlükəsizlik**
8. **HTTPS məcburi.** Sertifikat yoxlama istisnası **yalnız** `INTERNAL_DOMAIN_SUFFIX`-ə scoped; qlobal söndürmə (`NODE_TLS_REJECT_UNAUTHORIZED=0`, global callback) və xarici hosta güzəşt qadağan.
9. Hər API-da **rate limiting**. Yeni şifrələmələrdə **AES-256-GCM + düzgün KDF** (CBC/`PadRight` yox). Security headers (HSTS/CSP/nosniff/X-Frame-Options).
10. **SQL injection:** həmişə parametrli sorğu (`@param`/`:param`); string konkatenasiya ilə SQL qadağan (həm injection, həm AOT interceptor-u sındırır).

**Servislərarası**
11. Backend↔backend = **gRPC** (versiyalı `.proto`, deadline, daxili mTLS). Frontend↔backend = REST (RFC 7807, cursor pagination).
12. 100k+ nəticə **heç vaxt** bir cavabda — **streaming/batch** (~1000-lik keyset; `OFFSET` yox).
13. Tez oxunan/nadir dəyişən data **keşlənir** (HybridCache/Redis; TTL + invalidation; **scope-lu açar** → tenant izolyasiyası).
14. **Resilience:** timeout + retry (backoff) + circuit breaker; kritik yazılarda idempotency.

**UI/UX** (detal [07-ui-ux.md](07-ui-ux.md))
15. Self-explanatory, tam responsiv (overflow yox). ≥1024px → **AG Grid** (floating filter, virtualization, **pagination yox → infinite scroll**); <1024px → **tile card** (≥44px toxunma).
16. **Yalnız design tokenləri** (hex qadağan); Tailwind + layihə UI kit (yeni layihədə `antd` yox); **tam dark mode**; tək ikon kitabxanası; donma qadağası (skeleton, 120–320ms).
17. **PWA** + quraşdırma düyməsi.

**Alətlər / keyfiyyət**
18. **MCP-first** — yaddaşdan cavab vermə, əvvəlcə uyğun MCP/sənəd mənbəyini çağır (`context7`, DB MCP-ləri, `sequential-thinking` və s.).
19. **Dizayn skilləri** hər UI işində məcburi (audit / animasiya review / anti-slop).
20. Kod sonrası: təhlükəsizlik skanı (SAST/secret/SCA), UI perf yoxlaması; kod qraf analizi **CodeQL** (C#/Java).

**Data**
21. Tarix/vaxt **UTC saxla, yerli göstər** (ISO 8601). Pul **`decimal`/`BigDecimal`** (float qadağan). Locale/vaxt/valyuta konfiqdən (`APP_DEFAULT_LOCALE`/`APP_TIMEZONE`/`APP_CURRENCY`).
22. **i18n:** UI mətnləri hardcode yox — açar-əsaslı; default dil + `en` məcburi; dil seçici anında (reload yox).
23. **PII:** minimallıq, at-rest şifrələmə (həssas), log/xətada maskalanma, retention + silmə.
24. **Excel export = `.xlsx`** (CSV yox): tarix real DateTime, barcode mətn (`@`), decimal real ədəd + number format.
