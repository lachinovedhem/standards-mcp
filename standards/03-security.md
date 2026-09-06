# 03 — Təhlükəsizlik Tələbləri

> Vendor-neutral sərt təhlükəsizlik qaydaları. Konkret host/açar konfiqdən gəlir.

## 1. API Key / Secrets
- API key, JWT secret, connection string, LDAP parol **yalnız server env / secret store** (Vault/Key Vault). Repo/appsettings/log/frontend/brauzerdə **qadağan**.
- **Pre-commit secret scan** (gitleaks/aikido). **Rotasiya planı** (müntəzəm + insident sonrası); JWT açarları `kid` ilə. Sızıbsa: dərhal revoke + rotate.

## 2. Token / Replay
- Hər sorğuda `Exp` (Unix saniyə) yoxlanılır; vaxtı bitmiş token **rədd**.
- Hub/server-to-server rejimdə `Iat` **±60s replay window** yoxlanılır.

## 3. HTTPS
- Bütün redirect/çağırış HTTPS. HTTP üzərindən yönləndirmə qadağan.

## 4. Avtorizasiya — Boolean İcazə (rol adı YOX)
- Düymə/keçid/endpoint icazəsi **boolean** dəyərə görə: `Permissions.Modul.AltModul.Approve == true`. `if(role=="Admin")` **qadağan**.

## 5. Authenticated Encryption — AES-256-GCM (yeni servislər)
GCM həm məxfilik, həm **inteqrallıq** (tag) verir. **AES-CBC (HMAC-sız) qadağan.**
- Açar **`PadRight()` ilə törədilmir** → **HKDF** (paylaşılan açardan) / **PBKDF2/Argon2id** (paroldan).
- **Nonce (12 bayt) hər şifrələmədə unikal** (`RandomNumberGenerator`) — GCM-də nonce təkrarı fataldır. Hər şifrələmədə təsadüfi salt.
- Parol hash: **Argon2id**/yüksək iterasiyalı PBKDF2. **MD5/SHA1 qadağan**.
```csharp
// Format: [salt(16)][nonce(12)][ciphertext][tag(16)] → Base64
byte[] salt = RandomNumberGenerator.GetBytes(16), nonce = RandomNumberGenerator.GetBytes(12);
byte[] key = HKDF.DeriveKey(HashAlgorithmName.SHA256, ikm: Encoding.UTF8.GetBytes(masterKey),
                            outputLength: 32, salt: salt, info: Encoding.UTF8.GetBytes("<layihe>-aead-v1"));
using var aes = new AesGcm(key, 16);
aes.Encrypt(nonce, plain, cipher, tag);
```
Master açar `AEAD_MASTER_KEY` (env/secret store). Deşifrədə tag uyğunsuzsa yalnız ümumi "decryption failed".

## 6. Daxili JWT Təhlükəsizliyi
- İmza **RS256** (tövsiyə) və ya güclü **HS256** (≥256-bit secret). Validasiya: `exp`, `nbf`, **`iss`**, **`aud`**. `alg: none` **rədd**. Secret env/secret store; `kid` rotasiya.

## 7. Rate Limiting (məcburi)
Qatlı: Nginx kobud filtr + .NET dəqiq limit.

| Endpoint | Limit | Pəncərə/açar |
|---|---|---|
| Auth | 5–10 | 1 dəq / IP |
| Authenticated API | 100 | 1 dəq / user (JWT sub) |
| Ağır (BI/export) | 5 paralel | concurrency / user |
| Anonim/public | 30 | 1 dəq / IP |

```csharp
builder.Services.AddRateLimiter(o => {
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext,string>(ctx =>
        RateLimitPartition.GetSlidingWindowLimiter(ctx.Connection.RemoteIpAddress?.ToString() ?? "?",
            _ => new SlidingWindowRateLimiterOptions { PermitLimit = 100, Window = TimeSpan.FromMinutes(1), SegmentsPerWindow = 6 }));
    o.AddPolicy("auth", ctx => RateLimitPartition.GetFixedWindowLimiter(ctx.Connection.RemoteIpAddress?.ToString() ?? "?",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(1) }));
});
app.UseRateLimiter();
app.MapPost("/api/auth/callback", H).RequireRateLimiting("auth");
```
> ⚠️ Reverse proxy arxasında `ForwardedHeaders` (`X-Forwarded-For`) konfiqurasiya et — əks halda rate-limit + audit **yanlış IP** yazar. Çox-instance-da **Redis əsaslı** paylanmış limiter.

## 8. Security Headers (hər cavabda)
| Başlıq | Dəyər |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `Content-Security-Policy` | `default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), camera=(), microphone=()` |
> HSTS-i yalnız Nginx-də **VƏ YA** .NET-də (ikiqat yox). React/Vite inline üçün `'unsafe-inline'` əvəzinə nonce/hash.

## 9. CORS / CSRF
- CORS: `Access-Control-Allow-Origin: *` **qadағan** — allowlist (`CORS_ALLOWED_ORIGINS`). `credentials:'include'` ilə wildcard işləməz.
- CSRF: refresh cookie `httpOnly` → **`SameSite=Strict/Lax` + `Secure`** + Origin/Referer yoxlaması (və ya anti-forgery token).

## 10. Input Validasiya və SQL Injection
- **Həmişə parametrli sorğu** (`@param`/`:param`); string konkatenasiya ilə SQL **qadağan** (injection + AOT interceptor-u sındırır — `DAP###`).
- Gələn modellər server tərəfdə validasiya (tip/uzunluq/aralıq/allowlist). Payload ölçü limiti (`MaxRequestBodySize`) + timeout.

## 11. IDOR / BOLA (obyekt-səviyyə avtorizasiya)
- Boolean permission **kifayət deyil**. Hər resurs sorğusunda istifadəçinin **həmin obyektə** (filial/şirkət/sənəd) sahibliyi server tərəfdə yoxlanılır: `WHERE store_id = @userStoreId`.
- `GET /api/orders/{id}` — id istifadəçinin scope-una düşmədən qaytarılmır. Ardıcıl id (1,2,3…) riski artırır.

## 12. Fayl Yükləmə
- **Allowlist** uzantı **və** MIME/magic-byte (yalnız uzantıya güvənmə). Excel → `.xlsx` + faktiki OOXML imzası.
- Ölçü limiti (≤10MB) + sətir limiti (zip-bomb). Fayllar **webroot-dan kənar**/obyekt-storage; təsadüfi ad (path traversal). AV skan. Formula injection: hüceyrə `=+-@` ilə başlayırsa neytrallaşdır.

## 13. TLS / Sertifikat
- Min **TLS 1.2**, tövsiyə **1.3**. SSLv3/TLS 1.0/1.1 deaktiv. Yalnız güclü ECDHE suite-lər (forward secrecy). Sertifikatlar avtomatik yenilənir (ACME).
- **Daxili domen istisnası:** `INTERNAL_DOMAIN_SUFFIX` hostları üçün sertifikat yoxlaması buraxıla bilər (daxili CA/self-signed). HTTPS özü qalır.
  - **Qlobal söndürmə QADAĞAN** (`NODE_TLS_REJECT_UNAUTHORIZED=0`, global callback, yoxlamasız handler). Xarici hosta güzəşt qadağan.
```csharp
string internalSuffix = cfg["INTERNAL_DOMAIN_SUFFIX"]!;
builder.Services.AddHttpClient("internal").ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler {
    SslOptions = new SslClientAuthenticationOptions {
        RemoteCertificateValidationCallback = (s, cert, chain, errors) => {
            if (errors == SslPolicyErrors.None) return true;
            var host = (cert as X509Certificate2)?.GetNameInfo(X509NameType.DnsName, false) ?? "";
            return host.EndsWith(internalSuffix, StringComparison.OrdinalIgnoreCase);   // YALNIZ daxili
        }
    }
});
```

## 14. Audit / Xəta / Asılılıqlar
- Audit: auth success/fail, permission denial, kritik əməliyyatlar (detal [06](06-optional-sso-audit.md)).
- **Masking:** token/API key/parol/PII **heç vaxt log-a düşmür** (Serilog destructuring + redaction).
- Prod-da `ProblemDetails`; stack trace/daxili detal sızması yox; auth xətaları ümumi (user enumeration).
- **SCA** (aikido/endor) CI-da; SBOM + secret scan.

## Yoxlama Siyahısı
- [ ] Secrets yalnız env/secret store; pre-commit scan + rotasiya
- [ ] `Exp` hər sorğuda; hub-da `Iat` ±60s; redirect HTTPS
- [ ] İcazə boolean (rol adı yox); token deşifrəsi yalnız backend
- [ ] Rate limiting (auth sərt; doğru `X-Forwarded-For`)
- [ ] Yeni şifrələmə AES-256-GCM + KDF (CBC/PadRight yox); JWT `iss/aud/exp/nbf`, `alg:none` rədd
- [ ] Security headers; CORS allowlist; CSRF (SameSite+Origin)
- [ ] SQL parametrli; payload limiti; IDOR obyekt-scope; fayl yükləmə (MIME+ölçü+təhlükəsiz saxlama)
- [ ] TLS 1.2+; daxili domen istisnası scoped (qlobal söndürmə yox); audit + PII masking; SCA CI-da
