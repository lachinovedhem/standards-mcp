# Mühəndislik Standartları — Kürasiya Kodlama Profili

> **Nədir:** portativ, brend-neytral kodlama qaydaları və üstünlüklər dəsti. İstənilən layihədə
> tətbiq oluna bilər. Mənbə: "Portativ Mühəndislik Standartları v1.0"-dan **kodlama hissəsi** —
> təşkilati/enterprise apparatı (məcburi SSO, mərkəzi kimlik/audit/struktur servisləri) **çıxarılıb
> və ya opsional edilib**.
>
> **Versiya:** 1.0 (kürasiya) · **Tarix:** 2026-09-06

## İki əsas prinsip (bu profildə saxlanılan)

1. **Sıfır hardcoded kimlik.** Host, açar, rəng, şrift, loqo — heç biri kodda deyil. Hamısı `ENV`
   açarı və ya token/brend slotu. Kodda hex rəng / daxili host = **lint xətası**.
2. **Rol adı, məhsul adı yox.** İcazə = **boolean** dəyər (`Permissions.Modul.Alt.Approve == true`),
   rol adına görə yox. Servislər məntiqi ad + konfiq açarı ilə (host hardcode yox).

## Bu profildə NƏ VAR

| Fayl | Mövzu |
|---|---|
| [01-golden-rules.md](01-golden-rules.md) | Portativ qızıl qaydalar (SSO/org opsional) |
| [02-architecture.md](02-architecture.md) | .NET AOT + Dapper.AOT, Clean Architecture, gRPC, streaming, cache, resilience, DB migrasiya |
| [03-security.md](03-security.md) | Rate limiting, AES-GCM/AEAD, security headers, CORS/CSRF, IDOR, fayl yükləmə, secrets, TLS, SQL injection |
| [04-api-i18n-privacy.md](04-api-i18n-privacy.md) | REST + RFC 7807, cursor pagination, i18n, vaxt/valyuta, Excel export, PII |
| [05-devops-test-observability.md](05-devops-test-observability.md) | CI keyfiyyət qapıları, Docker sərtləşdirmə, test piramidası, OpenTelemetry, Sentry |
| [06-optional-sso-audit.md](06-optional-sso-audit.md) | **OPSİONAL** patternlər — SSO/JWT self-renewal, mərkəzi audit (yalnız layihə tələb edərsə) |
| [07-ui-ux.md](07-ui-ux.md) | UI/UX — AG Grid vs tile card, dizayn tokenləri, dark mode, PWA, glass |
| [08-grpc.md](08-grpc.md) | gRPC (geniş) — proto/versiyalama, deadline, xəta, streaming, mTLS, Native AOT, health |
| [09-compression-caching.md](09-compression-caching.md) | Compression & caching — REST/gRPC compression (BREACH), static asset, output cache, HTTP/2·3 |
| [10-validation-errors.md](10-validation-errors.md) | Validasiya & error handling — source-gen validation, IExceptionHandler, ProblemDetails |
| [11-configuration-options.md](11-configuration-options.md) | Konfiqurasiya & Options — typed options, ValidateOnStart, AOT source-gen, secrets, feature flags |
| [12-background-messaging.md](12-background-messaging.md) | Background jobs & messaging — BackgroundService, outbox, idempotent consumer, retry/DLQ |
| [13-mcp-tools.md](13-mcp-tools.md) | MCP alətləri & alət siyasəti — MCP-first, kateqoriyalar, AG Grid MCP konfiqi |

## NƏ ÇIXARILIB (bu profildə YOXDUR / opsionaldır)

- ❌ **Məcburi SSO / lokal login qadağası** — [06](06-optional-sso-audit.md)-da **opsional** pattern kimidir. Layihə istədiyi auth yanaşmasını seçir.
- ❌ **Mərkəzi Kimlik/Audit/Struktur servisləri** — org-specific; opsional.
- ❌ **Brend tələb anketi apparatı** — token-əsaslı brend-neytrallıq (§07 UI) saxlanılır, amma enterprise anket prosesi yox.
- ❌ **Məcburi proses/vəziyyət sənədləri** (STATE/PLAN/JOURNAL/task-stream) — layihə istəsə tətbiq edər.

## Necə tətbiq olunur

- Bu qaydalar **məsləhət + review mənbəyidir**, hər layihəyə məcbur deyil. Layihə hansı hissələri
  götürdüyünü öz `DECISIONS.md`-ində qeyd edə bilər.
- **Universal olanlar** (dilə/platformaya bağlı olmayan): sıfır-hardcoded-kimlik, boolean icazə,
  cursor pagination, RFC 7807, UTC saxla/yerli göstər, pul `decimal`, secrets env-də, security headers.
- **.NET-ə xas olanlar** (Dapper.AOT, ODP.NET AOT resepti və s.): yalnız .NET layihələrində.
