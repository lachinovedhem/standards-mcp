# 05 — DevOps, Test və Observability

## 1. DevOps / CI-CD (opsional kontekst)
> Yalnız infra/deployment işlərində lazımdır. Sırf tətbiq kodudursa nəzərə almaya bilərsən.

- **İnfra:** Linux + Windows; Ansible playbooklar; Nginx reverse proxy.
- **CI/CD:** Docker; runner-lər. LDAP parametrləri **hardcode yox** (`LDAP_URL`/`LDAP_BASE_DN`/`LDAP_BIND_DN`/`LDAP_BIND_PASSWORD` — sonuncu secret store).

### CI Keyfiyyət Qapıları (bir qapı qırmızı = irəliləmə yox)
1. **Build** — analizatorlar **warning-as-error** (Dapper.AOT `DAP###` daxil).
2. **Test** — unit + integration (Testcontainers); qırıq test bloklayır.
3. **Təhlükəsizlik** — SAST+secret (aikido), SCA (endor), **CodeQL** (C#/Java). Kritik tapıntı bloklayır.
4. **AOT publish** — `dotnet publish -p:PublishAot=true` (native exe; **ODP.NET işləyir** — [02](02-architecture.md)). Runner-də native linker: Windows **VC++ Build Tools + `vswhere`**, Linux **clang+zlib**.
5. **Konteyner skanı + SBOM** (CycloneDX).
6. **DB migrasiya** — deploy öncəsi avtomatik.
7. **Deploy** — yalnız bütün qapılar yaşıl.

### Docker Sərtləşdirmə
- **Multi-stage**; runtime image minimal (distroless/chiseled/`runtime-deps`). **Non-root**; mümkünsə read-only FS.
- Sirlər image-ə **bake olunmur** (runtime env/secret store). Versiyalı tag (`latest` yox); base müntəzəm yenilənir. Registry `CONTAINER_REGISTRY`.

## 2. Test Standartları
> Test olmadan iş **"Done" sayılmır**.

- **Piramida:** çox unit → orta integration → az e2e (ice-cream cone anti-pattern qadağan).
- **.NET:** xUnit + FluentAssertions + NSubstitute/Moq. Integration **Testcontainers** (real Oracle/PostgreSQL — in-memory DB ilə əvəz qadağan; SQL dialekt fərqi gizli qalar). Dapper.AOT sorğular real DB-yə qarşı (interceptor+dialekt+literal yoxlanır). HTTP: `WebApplicationFactory<Program>`. gRPC: in-process test client.
- **Java:** JUnit 5 + AssertJ + Mockito; Testcontainers; `@SpringBootTest`/`MockMvc`/`WebTestClient`.
- **Frontend:** Vitest + React Testing Library (davranış, implementasiya yox); e2e **Playwright** (kritik axınlar: login redirect, grid→card 1024px, infinite scroll, form submit); şəbəkə **MSW**.
- **Coverage ≥ 70%** (Application/domen; Core daha yüksək) — **mənalı assertion** (gaming qadağan). **Flaky test qadağan**.
- **Prinsiplər:** AAA; təsviri test adı (`Should_Reject_ExpiredToken`); izolyasiya (paralel, öz datası); real sirr/IdP testdə yox (stub/dev bypass); **təhlükəsizlik regressləri** (auth/IDOR/rate-limit/validasiya). CI-da hər PR-da avtomatik.

## 3. Observability — Log / Metrik / Tracing (OpenTelemetry)
- **Structured logging:** Serilog/SLF4J+JSON. Hər sətrdə `timestamp/level/service/traceId/spanId/userId` (PII **maskalı**). Səviyyələr: `Error/Warning/Information/Debug` — **prod-da `Debug` yox**. Token/parol/API key/PII **heç vaxt log-a**.
- **Correlation:** hər sorğuya trace ID (yoxdursa yaradılır) — **W3C Trace Context** (`traceparent`), servislərarası ötürülür.
- **Distributed tracing:** OpenTelemetry span-ları (HTTP/gRPC/DB/cache) avtomatik; OTLP → Jaeger/Tempo (`OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`).
- **Metriklər:** **RED** (Rate/Errors/Duration) hər endpoint; **USE** resurslar; biznes metrikləri. Prometheus/OTLP → Grafana.
- **Health:** `/health/live` (proses sağ, restart), `/health/ready` (DB/cache/asılılıq hazır, trafik). Detal sızması yox.
- **Alerting:** **simptoma görə** (SLO pozulması, error rate), səbəbə görə yox. Hər alert hərəkət tələb etməli + **runbook** linki.
- **Error tracking — Sentry (self-hosted):** exception qruplaşdırma/dedup, release health, React source-map ilə real stack. **SaaS yox** (PII daxildə qalsın — `SENTRY_URL`). OTLP/OTel ingest (traceId zənciri qorunur). `SENTRY_DSN` env (hardcode yox). **`BeforeSend`/`beforeSend` ilə PII/secret scrubbing məcburi** (self-hosted olsa belə). OTel-i **əvəz etmir, tamamlayır**.

## Yoxlama Siyahısı
- [ ] CI qapıları: build (warning-as-error) → test → təhlükəsizlik (SAST/SCA/CodeQL) → AOT publish → konteyner skanı/SBOM → migrasiya → deploy
- [ ] Docker: multi-stage, non-root, sirr bake yox, versiyalı tag
- [ ] Test: unit + integration (Testcontainers real DB) + kritik e2e (Playwright); coverage ≥70% mənalı; flaky yox
- [ ] Təhlükəsizlik regressləri (auth/IDOR/rate-limit/validasiya)
- [ ] Structured log (traceId/spanId, PII maskalı); W3C trace context; OTel tracing; RED metrikləri
- [ ] `/health/live` + `/health/ready` ayrı; alertlər simptom-əsaslı + runbook
- [ ] Error tracking self-hosted Sentry, DSN env, PII/secret scrubbing, OTel traceId bağlı
