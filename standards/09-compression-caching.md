# 09 — Compression, Caching və Transport (geniş)

> REST cavab/sorğu sıxılması, statik asset sıxılması, response/output caching, HTTP/2·HTTP/3.
> Məqsəd: bandwidth azaltma + responsivlik — **təhlükəsizliyi pozmadan**. Server-tərəf keş üçün bax:
> [02-architecture.md](02-architecture.md) §8; gRPC compression: [08-grpc.md](08-grpc.md) §12.

## 1. Response Compression (REST) — Prinsip

**Sıxılma harada?** Tövsiyə: **edge/reverse-proxy** (Nginx) — mərkəzləşmiş, backend CPU-sunu yormur.
Backend birbaşa açılırsa (proxy yoxdursa) ASP.NET Core middleware. **İkisini birdən etmə** (ikiqat sıxılma).

- **Brotli + Gzip** provayderləri (Brotli daha yaxşı sıxır, müasir brauzerlər dəstəkləyir; Gzip fallback).
- `Accept-Encoding` sorğu başlığına görə seçilir; cavabda `Content-Encoding` + **`Vary: Accept-Encoding`** (keş düzgün olsun).
- Yalnız **sıxılmağa dəyən** MIME tipləri: `application/json`, `text/*`, `application/javascript`, `image/svg+xml`. **Artıq sıxılmış** (jpg/png/webp/mp4/zip/woff2) **təkrar sıxılmır** (faydasız CPU).

## 2. ⚠️ Təhlükəsizlik — CRIME / BREACH (KRİTİK)

> HTTPS üzərində **dinamik** cavabların sıxılması **CRIME/BREACH** hücumlarına yol aça bilər (sıxılmış cavab ölçüsü sirri sızdırır).

- ASP.NET Core-da `EnableForHttps` **default `false`dır** — **səbəb təhlükəsizlikdir**. Onu `true` etmək **şüurlu qərar** tələb edir.
- **Qayda:** sirr (token, PII, CSRF) **və** hücumçunun idarə etdiyi giriş (reflected input) **eyni** sıxılmış cavabda olmamalıdır.
- **Azaltmalar:** həssas cavabları sıxma; **antiforgery (CSRF) token** (per-request dəyişir → BREACH-i çətinləşdirir); cavab uzunluğunu gizlətmə (random padding); statik/dəyişməz məzmunu sıxmaq təhlükəsizdir (reflected sirr yoxdur).
- **Qeyd:** IIS/App Service `EnableForHttps=false` olsa belə öz Gzip-ini tətbiq edə bilər — `Server` + `Content-Encoding` başlıqlarını yoxla.

## 3. ASP.NET Core Response Compression (konfiq)

```csharp
builder.Services.AddResponseCompression(o => {
    o.EnableForHttps = false;   // ⚠️ default; true = CRIME/BREACH riski (bax §2) — şüurlu qərar
    o.Providers.Add<BrotliCompressionProvider>();
    o.Providers.Add<GzipCompressionProvider>();
    o.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(["application/json"]);
});
builder.Services.Configure<BrotliCompressionProviderOptions>(o => o.Level = CompressionLevel.Fastest); // latentlik üçün
builder.Services.Configure<GzipCompressionProviderOptions>(o => o.Level = CompressionLevel.Fastest);
...
app.UseResponseCompression();   // ⚠️ SIXAN middleware-dən ƏVVƏL çağırılmalıdır
```
- **Sıra vacib:** `UseResponseCompression()` sıxılacaq cavabı yaradan middleware-dən **əvvəl**.
- **Level:** `Fastest` (dinamik API, latentlik) vs `Optimal`/`SmallestSize` (statik asset, ölçü). Dinamik cavabda `Optimal` CPU yükünü artırır.
- **AOT qeydi:** response compression middleware AOT-uyğundur; providerlər reflection işlətmir.

## 4. gRPC Compression (xülasə)
gRPC öz mesaj sıxılmasını işlədir (REST middleware **gRPC-yə aid deyil**). Default provayder **gzip**; `ResponseCompressionAlgorithm`/`ResponseCompressionLevel` (bax [08-grpc.md](08-grpc.md) §12). Client `grpc-accept-encoding` göndərməlidir.

## 5. Request Decompression (gələn sıxılmış sorğu)
Client sıxılmış body göndərirsə (`Content-Encoding: gzip`), server açır:
```csharp
builder.Services.AddRequestDecompression();
app.UseRequestDecompression();
```
- ⚠️ **Zip-bomb qoruması:** açılmış ölçü limiti + `MaxRequestBodySize` (bax [03](03-security.md) §10). Naməlum/nəhəng sıxılmış body-yə etibar etmə.

## 6. Statik Asset Sıxılması (Frontend — React + Vite)
- **Pre-compressed** (build zamanı `.br` + `.gz` yarat) — runtime CPU sərf etmə. Vite plugin (`vite-plugin-compression`) və ya build sonrası.
- Nginx **pre-compressed faylı** birbaşa verir: `gzip_static on;` + `brotli_static on;` (module varsa). Runtime sıxılmadan daha sürətli.
- Hash-lənmiş asset adları (`app.[hash].js`) + `Cache-Control: public, max-age=31536000, immutable`. `index.html` **keşlənmir** (`no-cache`) — yeni deploy dərhal görünsün.

## 7. Response / Output Caching (server-tərəf HTTP keş)
- **Output caching** (`AddOutputCache`/`UseOutputCache`) — server tam cavabı keşləyir (tez oxunan, nadir dəyişən public endpoint). Tag ilə invalidation.
  ```csharp
  builder.Services.AddOutputCache(o => o.AddBasePolicy(b => b.Expire(TimeSpan.FromSeconds(60))));
  app.UseOutputCache();
  app.MapGet("/api/v1/segments", Handler).CacheOutput();
  ```
- **ETag / Cache-Control** — dəyişməz GET cavablarında; `304 Not Modified` (bandwidth qənaəti).
- ⚠️ **Scope/tenant:** istifadəçiyə/filiala xas cavab **public keşlənmir** (sızma — bax [03](03-security.md) §11, [02](02-architecture.md) §8). Keş açarında/policy-də scope, yoxsa `private`/`no-store`.
- **Data keşi** (referans data, permission tree) fərqlidir → HybridCache/Redis (bax [02](02-architecture.md) §8). Bu bölmə **HTTP cavab** keşidir.

## 8. HTTP/2 və HTTP/3 (QUIC)
- **HTTP/2** default (Kestrel HTTP/1.1+HTTP/2). Multiplexing → çoxlu paralel sorğu tək bağlantıda. gRPC HTTP/2 **tələb edir** (bax [08](08-grpc.md)).
- **HTTP/3 (QUIC)** — aşağı latentlik, head-of-line blocking yox; mobil/zəif şəbəkədə faydalı. `CreateSlimBuilder` (AOT) default daxil etmir → `builder.WebHost.UseQuic()` + `Alt-Svc` başlığı ilə açılır. Edge/CDN HTTP/3-ü çox vaxt terminate edir.
- TLS termination proxy arxasında backend HTTP/1.1/HTTP/2 qala bilər; kanar (edge) müasir protokolları verir.

## 9. Payload / Latentlik Prinsipləri
- Böyük siyahılar **sıxılma ilə deyil, streaming/pagination ilə** həll olunur (bax [02](02-architecture.md) §7, [04](04-api-i18n-privacy.md) §1.5) — sıxılma tamamlayıcıdır, əvəz deyil.
- Payload ölçü limiti + request timeout (bax [03](03-security.md) §10).
- Şəkil: müasir format (WebP/AVIF), responsive `srcset`, lazy-load (bax [07-ui-ux.md](07-ui-ux.md)).

## Yoxlama Siyahısı
- [ ] Sıxılma **edge (Nginx) VƏ YA** backend — ikisi birdən yox; Brotli+Gzip; `Vary: Accept-Encoding`
- [ ] Yalnız mətn/JSON/SVG sıxılır; artıq-sıxılmış (jpg/png/mp4/woff2) təkrar sıxılmır
- [ ] **CRIME/BREACH:** `EnableForHttps` şüurlu qərar; sirr + reflected input eyni sıxılmış cavabda yox; CSRF token; həssas cavab sıxılmır
- [ ] `UseResponseCompression()` sıxan middleware-dən əvvəl; level dinamikdə `Fastest`
- [ ] Request decompression zip-bomb qorunması (ölçü limiti + `MaxRequestBodySize`)
- [ ] Statik asset **pre-compressed** (`.br`/`.gz`, `gzip_static`/`brotli_static`); hash-li asset `immutable`, `index.html` `no-cache`
- [ ] Output/response caching (ETag/Cache-Control/304); **scope/tenant cavabı public keşlənmir**
- [ ] HTTP/2 aktiv (gRPC üçün məcburi); HTTP/3 lazımda; TLS termination düzgün
- [ ] Böyük data streaming/pagination (sıxılma əvəz deyil); payload limiti
