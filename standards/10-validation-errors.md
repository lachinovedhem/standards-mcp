# 10 — Validasiya və Error Handling (geniş)

> Gələn datanın validasiyası və xətaların vahid idarəsi. RFC 7807 kontraktı üçün bax [04](04-api-i18n-privacy.md) §1.3;
> təhlükəsizlik (SQL injection, detal sızması) [03](03-security.md) §10, §14.

## 1. Validasiya Qatları (harada nə)
| Qat | Nə yoxlanır |
|---|---|
| **Sərhəd (WebApi)** | Forma/tip/uzunluq/aralıq/format/allowlist — gələn DTO. Səhv → **400 + ProblemDetails**. |
| **Application** | Biznes qaydaları (invariantlar, icazə önşərtləri). Səhv → domain xəta → 409/422. |
| **Domain (Core)** | Modelin **özü** etibarsız hala düşə bilməz (constructor/factory invariant). |
| **DB** | Son müdafiə (constraint, unique) — validasiyanı əvəz etmir. |

Prinsip: **sərhəddə erkən rədd et** (fail fast), domendə invariant qoru. Validasiyaya **etibar etmə → parametrli SQL** yenə məcburidir ([03](03-security.md) §10).

## 2. Sərhəd Validasiyası — .NET (AOT-uyğun)

**Tövsiyə: `Microsoft.Extensions.Validation` source-generator** (reflection yox → AOT-safe):
```csharp
builder.Services.AddValidation();   // Minimal API üçün endpoint filter + source-gen
```
- Minimal API handler-lərində/baza tiplərində **validatable tipləri avtomatik kəşf edir**; hər endpoint-ə validasiya filtri qoşulur.
- **Çox-assembly:** `AddValidation` çağırılan assembly-dən kənar tiplər üçün ayrıca qeydiyyat lazımdır.
- `[ValidatableType]` (.NET 10-da experimental — `ASP0029` xəbərdarlığı; .NET 11-də stabil).
- DataAnnotations (`[Required]`, `[Range]`, `[StringLength]`, `[RegularExpression]`) işlədilə bilər — source-gen onları AOT-safe variantlara (`__SourceGen__RangeAttribute`) çevirir.

**FluentValidation** — güclü, amma **reflection əsaslıdır** → **AOT-da trim xəbərdarlıqları**. AOT məqsədli servisdə source-gen validasiyaya üstünlük ver; FluentValidation lazımdırsa AOT uyğunluğunu yoxla (non-AOT servisdə problem yox).

**Custom data annotation yazarkən reflection işlətmə** — güclü-tipli kod (AOT-uyğunluq).

## 3. Vahid Xəta İdarəsi — `IExceptionHandler` + ProblemDetails

**Qurulum (.NET 8+):**
```csharp
builder.Services.AddProblemDetails();                    // RFC 7807 avtomatik
builder.Services.AddExceptionHandler<DomainExceptionHandler>();
builder.Services.AddExceptionHandler<UnhandledExceptionHandler>();  // sonuncu = fallback

var app = builder.Build();
app.UseExceptionHandler();     // AddProblemDetails ilə arqumentsiz işləyir
app.UseStatusCodePages();      // body-siz 4xx/5xx-ə də ProblemDetails
```

**`IExceptionHandler` zənciri:** hər handler `TryHandleAsync` → `true` (idarə etdim, dayan) / `false` (növbətiyə ötür). Domain xətalarını konkret handler `Status`-a map edir, qalanı fallback `500`.
```csharp
public sealed class DomainExceptionHandler(IProblemDetailsService pd) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext ctx, Exception ex, CancellationToken ct)
    {
        var (status, title) = ex switch {
            ValidationException => (StatusCodes.Status400BadRequest, "Validasiya xətası"),
            NotFoundException   => (StatusCodes.Status404NotFound,   "Tapılmadı"),
            ConflictException   => (StatusCodes.Status409Conflict,   "Konflikt"),
            ForbiddenException  => (StatusCodes.Status403Forbidden,  "İcazə yoxdur"),
            _ => (0, "")
        };
        if (status == 0) return false;   // bu handler-ə aid deyil → növbətiyə
        ctx.Response.StatusCode = status;
        return await pd.TryWriteAsync(new() {
            HttpContext = ctx,
            ProblemDetails = { Status = status, Title = title, Type = $"{cfg["PROBLEM_TYPE_BASE_URI"]}/{status}" }
        });
    }
}
```

**⚠️ Qaydalar:**
- `TryHandleAsync` **`true` qaytarırsa tam cavab yazmalıdır** (status + body); əks halda cavab **404** olur (SDK xəbərdarlığı).
- `UseExceptionHandler()` arqumentsiz çağırmaq üçün ya `AddProblemDetails()`, ya error path, ya fallback lazımdır.
- **Detal sızması yox** ([03](03-security.md) §14): prod-da stack trace/daxili detal client-ə getmir; `EnableDetailedErrors` yalnız dev. Auth xətaları **ümumi** (user enumeration).
- `traceId` daxil et (`CustomizeProblemDetails` ilə) — texniki logla körpü ([05](05-devops-test-observability.md) §3).
- **Media type:** `DefaultProblemDetailsWriter` yalnız `application/json`, `application/problem+json`, wildcard dəstəkləyir (xml/html yox → fallback).

## 4. Validasiya Xətasının Formatı (RFC 7807)
Validasiya səhvi → `400` + `errors` sözlüyü (sahə → mesaj siyahısı):
```json
{ "type":"https://errors.<domen>/validation", "title":"Validasiya xətası", "status":400,
  "traceId":"00-abc...", "errors": { "storeId": ["tələb olunur"], "total": ["0-dan böyük olmalı"] } }
```
Mesajlar **lokallaşdırılır** (`Accept-Language` — [04](04-api-i18n-privacy.md) §2); açar-əsaslı, hardcode yox.

## 5. Result vs Exception
- **Gözlənilən** biznes nəticələri (tapılmadı, konflikt) üçün **Result/typed outcome** üstünlükdür (exception axını yox) — performans + aydınlıq. Minimal API-də `Results.NotFound()`/`Results.Problem()`.
- **Exception** yalnız həqiqi **istisna** hallar üçün (proqramçı səhvi, infrastruktur). Hər ikisi eyni ProblemDetails formatına düşür.

## 6. `CustomizeProblemDetails` (qlobal zənginləşdirmə)
```csharp
builder.Services.AddProblemDetails(o => o.CustomizeProblemDetails = ctx => {
    ctx.ProblemDetails.Extensions["traceId"] = ctx.HttpContext.TraceIdentifier;
    // ctx.ProblemDetails.Extensions["nodeId"] = Environment.MachineName;  // istəyə görə
});
```

## Yoxlama Siyahısı
- [ ] Sərhəd validasiyası (source-gen `AddValidation` — AOT-safe); domendə invariant; DB constraint son müdafiə
- [ ] FluentValidation işlədilirsə AOT uyğunluğu yoxlanıb (reflection); custom attribute reflection-suz
- [ ] `IExceptionHandler` zənciri + `AddProblemDetails` + `UseExceptionHandler` + `UseStatusCodePages`
- [ ] Handler `true` qaytaranda tam cavab yazır (status+body); domain xəta düzgün status-a map
- [ ] Validasiya səhvi 400 + `errors` sözlüyü; mesajlar lokallaşır; `traceId` daxil
- [ ] Prod-da detal/stack sızması yox; auth xətaları ümumi; media type json/problem+json
- [ ] Gözlənilən nəticə Result ilə (exception axını yox); parametrli SQL (validasiyaya güvənmə)
