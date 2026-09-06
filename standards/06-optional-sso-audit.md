# 06 — OPSİONAL: SSO/Auth və Mərkəzi Audit patternləri

> ⚠️ **BU BÖLMƏ OPSİONALDIR.** İstifadəçinin qərarı ilə **SSO məcburi deyil**, təşkilati struktur və
> mərkəzi servislər vacib deyil. Bu patternlər yalnız **layihə onları tələb edərsə** tətbiq olunur —
> əks halda layihə öz auth/audit yanaşmasını seçir. Buradakı texniki ideyalar (self-renewal JWT,
> non-blocking audit queue, returnTo sanitizasiyası) hər auth sxemində faydalıdır.

---

## 1. SSO / Auth (opsional pattern)

Layihə mərkəzi kimlik servisi (IdP) istifadə edərsə: bütün auth `AUTH_ISSUER_URL` üzərindən; lokal login formu yerinə IdP-nin öz səhifəsi.

**Axın:** istifadəçi → IdP redirect → login → token ilə geri (`redirectUri?token=...`) → frontend tokeni **öz backend-inə** göndərir → **deşifrə YALNIZ backend-də** → daxili JWT sessiyası.

**Dev vs Prod:** dev-də "developer user" bypass (`AUTH_DEV_BYPASS_ENABLED=true`); prod-da tam IdP, bypass **qadağan** (kod prod build-ə düşməməli).

### 1.1 Daxili JWT Self-Renewal (faydalı pattern)
- IdP tokeni **yalnız ilk girişdə** (qısa ömürlü). Sonra sessiya **daxili JWT** üzərində — yenilənmə **tamamilə daxildə** (IdP-yə getmədən).
- **Sliding sessiya** (qısa ömür, məs. 15 dəq); **proaktiv silent refresh** (ömrün ~75%-i / bitməyə 90s qalmış). `/api/auth/refresh` yeni JWT verir (refresh token `httpOnly` cookie).
- **401 fallback:** bir dəfə refresh cəhdi; uğursuzsa IdP-yə. **Single-flight** (paralel refresh bir dəfə). Yenilənmə yalnız proqram açıq/aktiv olduqda.
```js
let inflight = null;
function refreshOnce() {
  if (!inflight) inflight = fetch('/api/auth/refresh', { method:'POST', credentials:'include' })
    .then(r=>r.json()).then(s=>localStorage.setItem('jwt', s.accessToken)).finally(()=>{ inflight=null; });
  return inflight;
}
```

### 1.2 returnTo / Deep Link (open-redirect qorunması — universal faydalı)
Login-dən sonra istifadəçi **ilkin dərin linkə** qayıtmalı (ana səhifəyə yox).
- **Tut:** giriş tələb olunan an `pathname+search+hash`-i saxla (`sessionStorage`, app-a xas açar `<app>:return-url`).
- **Qaytar:** callback-də token mübadiləsindən sonra saxlanmış hədəfə naviqasiya + təmizlə.
- **Sanitizasiya (məcburi):** yalnız **daxili/nisbi** yol (tək `/` ilə başlamalı; `//`, `http:`, `https:`, `\`, xarici host **qadağan**). Login/callback route-udursa atma (loop qoruması). `sessionStorage` (tab-scoped), `localStorage` yox.
```ts
function sanitizeReturnTo(v) {
  if (!v) return null;
  if (!/^\/(?!\/)/.test(v)) return null;   // tək '/', sxem/host qadağan
  if (isAuthRoute(v)) return null;         // loop qoruması
  return v;
}
```

### 1.3 OIDC/OAuth2/SAML uyğunluğu (qısa)
- Konkret IdP-yə bağlı deyil (Keycloak/Entra/Auth0/Okta/öz). **Lokal login formu yenə qadağan** (login IdP-də). **Token/kod mübadiləsi həmişə backend-də** (OIDC: confidential client + auth code + PKCE; SPA-da implicit/`client_secret` qadağan). IdP tokeni yalnız ilk girişdə. **Avtorizasiya rol adı ilə deyil, boolean icazə ilə** (IdP claim-i → boolean ağaca map).

### 1.4 İcazə Ağacı (Permission JSON)
Boolean icazə ağacı — LEAF (`"default": false` olan obyekt) və GROUP (nested). Açar adları **camelCase**, ağac boyu **unikal**. Metadata: GROUP `_label_az`, LEAF `label_az` + `description` (Azərbaycanca, ≤1 cümlə). Avtorizasiya yalnız bu boolean-lara: `Permissions.Modul.AltModul.Approve == true`.
```json
{ "modulA": { "_label_az": "Modul A",
    "modulAApprove": { "label_az": "Təsdiq", "description": "Sənədi təsdiqləmək icazəsi.", "default": false } } }
```

---

## 2. Mərkəzi Audit (opsional pattern)

Layihə mərkəzi audit servisi istifadə edərsə: hadisələr `POST {AUDIT_SINK_URL}/api/v1/audit-logs` (auth `X-Api-Key`), **`AUDIT_ENABLED`** ilə söndürülə bilən. Lokal audit DB yalnız offline/hüquqi istisna (DECISIONS-da əsaslandır).

### 2.1 Non-blocking Queue (universal faydalı pattern)
Audit yazısı sorğunu **heç vaxt bloklamamalı**; uğursuzluğu sorğunu sındırmamalı. Producer bounded channel-a yazır; background consumer batch göndərir.
```csharp
public sealed class ChannelAuditLogger : IAuditLogger {
    private readonly Channel<AuditEvent> _ch = Channel.CreateBounded<AuditEvent>(
        new BoundedChannelOptions(10_000) { FullMode = BoundedChannelFullMode.DropOldest });
    public ChannelReader<AuditEvent> Reader => _ch.Reader;
    public void Log(AuditEvent e) { if (!_ch.Writer.TryWrite(e)) AuditMetrics.Dropped.Add(1); } // metrik, səssiz itki yox
}
// BackgroundService consumer: batch ≤200 və ya kanal boşalanda flush → HTTP POST (retry/backoff); shutdown-da flush.
```

### 2.2 Qaydalar
- **Nə loglanır:** biznes (CREATE/UPDATE/DELETE/APPROVE/REJECT/STATUS_CHANGE/EXPORT/IMPORT) + təhlükəsizlik (PERMISSION_DENIED/IDOR_ATTEMPT/CONFIG_CHANGE). Adi `GET`/siyahı yox. Auth hadisələri IdP-yə buraxılır (mərkəzə göndərilmirsə).
- **Secret göndərmə:** token/parol/kart `summary`/`detailMarkdown`/`metadata`-ya düşməməli (yazıdan əvvəl maskala).
- **`detailMarkdown` Markdown** (başlıq/siyahı/qalın/kod/cədvəl); `summary` bir sətir düz mətn. `actor` serverdə kimlik token-indən (müştəridən gələnə etibar yox).
- Ingest **rate-limitli** (flooding yox); render-də **XSS sanitizasiya** (`detailMarkdown` etibarsız məzmun). Hər qeyddə `traceId` (texniki logla körpü).
- **Dəyişməzlik:** lokal cədvəl işlədilirsə append-only (DB rolu UPDATE/DELETE-siz); retention partition drop.

---

## 3. Daxili Servis Reyestri (opsional pattern)
Daxili endpointlər **konfiqdə** elan olunur (host hardcode yox): hər servis üçün `name` (məntiqi ad — kod yalnız bunu bilir), `configKey` (base URL env açarı), `authMode` (none/apiKey/jwt/mtls), `authKeyRef` (açarın env adı), `healthPath`, `timeoutMs`, `retry`, `criticality` (required/optional). `optional` asılılıq düşəndə servis degrade işləyir (readiness sınmır). Yeni asılılıq əvvəl reyestrə, sonra kod (allowlist).

---

## Opsional konfiq (yalnız bu patternlər istifadə olunarsa)
`AUTH_ISSUER_URL`, `AUTH_API_KEY` (secret), `AUTH_MODE`, `AUTH_DEV_BYPASS_ENABLED`, `JWT_SIGNING_KEY` (secret), `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `AUDIT_SINK_URL`, `AUDIT_ENABLED`, `INTERNAL_DOMAIN_SUFFIX`.
