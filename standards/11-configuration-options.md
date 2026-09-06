# 11 — Konfiqurasiya və Options Pattern (geniş)

> Konfiqurasiyanın necə oxunması, validasiyası və koda çatdırılması. **Sıfır hardcoded kimlik**
> ([01](01-golden-rules.md) §5) və secrets qaydası ([03](03-security.md) §1) bu sənədin əsasıdır.

## 1. Konfiqurasiya Mənbələri və Prioritet
Prioritet (sonuncu qalib): `appsettings.json` → `appsettings.{Environment}.json` → **environment variables** → (dev) user-secrets → komanda sətri.
- **Secrets `appsettings`-də YOX** — yalnız env / secret store (Vault/Key Vault). Repo/log/frontend-də heç vaxt.
- Mühit: `ASPNETCORE_ENVIRONMENT` (`Development`/`Staging`/`Production`).
- Konfiq açarları **koddan gəlmir** — hamısı reyestrdə ([00](00-index.md), config açarları hər faylın sonunda).

## 2. Options Pattern (typed, validated)

**Ham `IConfiguration` string-lərini kodun içində oxuma** → güclü-tipli **options class** + validasiya.

```csharp
public sealed class AuthOptions
{
    public const string Section = "Auth";
    [Required, Url]           public string IssuerUrl { get; set; } = "";
    [Range(1, 60)]            public int    AccessTtlMinutes { get; set; } = 15;
}

builder.Services.AddOptions<AuthOptions>()
    .Bind(builder.Configuration.GetSection(AuthOptions.Section))
    .ValidateDataAnnotations()      // (AOT üçün source-gen ilə əvəz — §4)
    .Validate(o => o.AccessTtlMinutes > 0, "AccessTtl > 0 olmalı")
    .ValidateOnStart();             // ⚠️ səhv konfiq → startda dərhal partlasın (runtime yox)
```
- **`ValidateOnStart()` MƏCBURİ** — yanlış/əskik konfiqli servis **işə düşməməlidir** (gecikmiş runtime xətası yox).
- İstehlak: `IOptions<T>` (singleton, dəyişməz), `IOptionsSnapshot<T>` (scoped, per-request reload), `IOptionsMonitor<T>` (singleton + canlı reload + `OnChange`).

## 3. IOptions vs Snapshot vs Monitor
| İnterfeys | Ömür | Nə vaxt |
|---|---|---|
| `IOptions<T>` | Singleton, bir dəfə | Startda sabit dəyər (əksər hal) |
| `IOptionsSnapshot<T>` | Scoped | Per-request; reload olunan dəyər |
| `IOptionsMonitor<T>` | Singleton | Canlı reload + `OnChange` (background service, uzunömürlü) |

## 4. AOT — Source-Generated Validation & Binding (MƏCBURİ AOT-da)

`ValidateDataAnnotations()` **reflection** işlədir → AOT-da IL2025/IL3050. Həll — **source generator-lar:**

**a) Options validation source generator** (reflection-suz, AOT-safe):
```csharp
[OptionsValidator]
public sealed partial class ValidateAuthOptions : IValidateOptions<AuthOptions> { }

builder.Services.AddSingleton<IValidateOptions<AuthOptions>, ValidateAuthOptions>();
// Bununla ValidateDataAnnotations() çağırmaq LAZIM DEYİL — DataAnnotations attributes source-gen olunur.
```
> `Microsoft.Extensions.Options` v8+ ilə **avtomatik aktivdir**; boş `partial` class + `[OptionsValidator]` kifayətdir.

**b) Configuration binding source generator** (AOT-safe bind):
```xml
<PropertyGroup>
  <EnableConfigurationBindingGenerator>true</EnableConfigurationBindingGenerator>
</PropertyGroup>
```

## 5. Named Options
Eyni tipin bir neçə adlı konfiqurasiyası (məs. çoxlu HTTP client / provayder):
```csharp
builder.Services.Configure<EndpointOptions>("orders", cfg.GetSection("Endpoints:Orders"));
builder.Services.Configure<EndpointOptions>("billing", cfg.GetSection("Endpoints:Billing"));
// İstehlak: monitor.Get("orders")
```

## 6. Secrets İnteqrasiyası
- **Dev:** `dotnet user-secrets` (repo-dan kənar, developer maşınında). **Prod:** secret store provider (Azure Key Vault / Vault) `IConfiguration`-a bağlanır.
- Options class-da secret sahələr də olur, amma **dəyər env/store-dan** gəlir. Log/ProblemDetails-də secret **maskalanır** ([03](03-security.md) §14).
- Secret açarının **adı** koda düşə bilər, **dəyəri** yox.

## 7. Feature Flags
- Sadə: boolean options (`FeatureOptions.NewCheckoutEnabled`) + `IOptionsMonitor` (canlı toggle).
- Genişlənmiş: `Microsoft.FeatureManagement` (`IFeatureManager`, `[FeatureGate]`, filtrlər — faiz, pəncərə, hədəf audiensiya). Mühit-əsaslı; dəyər konfiqdən.
- **Dev bypass / rejim** feature flag ilə ([06](06-optional-sso-audit.md) §1): `AUTH_DEV_BYPASS_ENABLED` prod build-də `false`.

## 8. Anti-pattern-lər
- ❌ `IConfiguration`-ı servisə birbaşa inject edib `cfg["X:Y"]` oxumaq (güclü-tip yox, validasiya yox).
- ❌ `Bind` edib `ValidateOnStart` etməmək (səhv konfiq runtime-da gizli qalır).
- ❌ Secret-i `appsettings.json`-a yazmaq.
- ❌ AOT servisdə `ValidateDataAnnotations()` (source-gen əvəzinə) — trim xəbərdarlıqları.
- ❌ Konfiq açarını koda hardcode etmək.

## Yoxlama Siyahısı
- [ ] Secrets yalnız env/secret store (appsettings/repo/log-da yox); dev user-secrets, prod store provider
- [ ] Typed **options class** + `Bind` + validasiya + **`ValidateOnStart()`** (səhv konfiq startda partlayır)
- [ ] Düzgün interfeys: `IOptions`/`IOptionsSnapshot`/`IOptionsMonitor` ehtiyaca görə
- [ ] (AOT) `[OptionsValidator]` source-gen + `EnableConfigurationBindingGenerator`; `ValidateDataAnnotations` reflection işlədilmir
- [ ] `IConfiguration["x:y"]` birbaşa oxuma yox; konfiq açarları koda hardcode yox
- [ ] Feature flag-lar konfiqdən (canlı toggle üçün monitor); dev bypass prod-da söndürülü
