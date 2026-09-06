# 02 — Memarlıq və Texnoloji Standartlar

## 1. Backend Platforması — .NET və ya Java (vahid)

**Ümumi (hər iki platforma):**
- **Clean Architecture**: Core → Application → Infrastructure → WebAPI. Asılılıqlar içəriyə (Core-a). Biznes məntiqi Core/Application; xarici inteqrasiyalar Infrastructure.
- Hər API-da **OpenAPI/Swagger** məcburi. **Structured log** məcburi. Standart `/health` endpoint. Sirlər env/secret store-da.

### .NET (C#)
- **.NET 10+**, **Native AOT** tam dəstəklənir. **Minimal API**.
- ORM: **Dapper.AOT** (interceptor əsaslı, build-time kod generasiyası). ⛔ **Klassik `Dapper` QADAĞAN** (runtime reflection/IL-emit → AOT-da uğursuz). EF Core kimi heavy-reflection ORM AOT servislərində qaçılır.
- Loglama: **Serilog**. Konfiq: `appsettings.{Environment}.json` + env override.

### Java
- Müasir LTS JDK (17/21) + Spring Boot və s. Eyni Clean Architecture qatları. Structured (JSON) log (SLF4J+Logback). springdoc-openapi.

## 2. Dapper.AOT — Məcburi Konfiqurasiya (.NET)

```xml
<ItemGroup><PackageReference Include="Dapper.AOT" /></ItemGroup>
<PropertyGroup>
  <PublishAot>true</PublishAot>
  <InterceptorsNamespaces>$(InterceptorsNamespaces);Dapper.AOT</InterceptorsNamespaces>
</PropertyGroup>
```
```csharp
[module: DapperAot]   // qlobal aktivləşdirmə (istisna: [DapperAot(false)])
```

**AOT-safe SQL & mapping qaydaları** (interceptor yalnız bunları generasiya edə bilir):
- **SQL literal/`const` string** — runtime-da dinamik qurulan SQL intercept OLUNMUR → reflection fallback → AOT-da qırılır. Şərti sorğu: ayrı `const` sorğular + statik branch.
- **Generic API:** `Query<Foo>()`/`QueryFirst<Foo>()` ✅; non-generic `Query(typeof(Foo))` ❌.
- **`dynamic` qaytarma yox** → konkret `record`/`class`.
- **Parametrlər həmişə parametrli** (`@param`); string konkatenasiya qadağan.
- **`DAP###` analizatorları → `warning-as-error`** (qeyri-AOT kod prod-a düşməsin).
- Oracle: `[CommandProperty<OracleCommand>(nameof(OracleCommand.FetchSize), 1024)]` (AOT-safe).

## 3. ODP.NET + Native AOT (doğrulanmış — yeni Oracle+AOT layihəsi üçün resept)

> **`Oracle.ManagedDataAccess.Core` Native AOT ilə İŞLƏYİR** — `dotnet publish -p:PublishAot=true -r win-x64` ilə real native `.exe` yaradıla bilir. JIT fallback **lazım deyil**. `Npgsql`, `Microsoft.Data.Sqlite` də AOT dəstəkli.

**1. csproj** — ODP.NET trim/AOT xəbərdarlıqlarını sus (zərərsiz):
```xml
<PropertyGroup>
  <PublishAot>true</PublishAot>
  <NoWarn>$(NoWarn);IL2104;IL3053;IL3000</NoWarn>
</PropertyGroup>
```

**2. TƏLƏ — Dapper.AOT `RETURNING ... INTO`-nu intercept ETMİR** (`DAP018`). Identity-qaytaran insert-lər (`RETURNING id INTO :OutId`, output param) intercept olunmur → AOT-da crash. ✅ **Həll:** identity insert-ləri **raw `OracleCommand` + `OracleParameter`** (output) ilə yaz (Dapper-siz):
```csharp
var cmd = ((OracleConnection)conn).CreateCommand();
cmd.BindByName = true;                                  // ada görə bağla
if (tx is not null) cmd.Transaction = (OracleTransaction)tx;
cmd.CommandText = sql;                                  // ... RETURNING id INTO :OutId
var outId = new OracleParameter("OutId", OracleDbType.Int64) { Direction = ParameterDirection.Output };
cmd.Parameters.Add(outId);
await cmd.ExecuteNonQueryAsync(ct);
long id = ((OracleDecimal)outId.Value).ToInt64();
```
Qalan adi sorğular Dapper.AOT-da qalır.

**3. TƏLƏ — Oracle bind `:` , `@` YOX** (`@` db-link operatorudur → ORA-00936/01036). Raw command-də `BindByName=true` + `:Param`. `:` prefiksi hər üç sürücüdə universaldır (SQLite dev + Oracle prod eyni SQL).

**4. TƏLƏ — native link üçün build alətləri:** Windows → **VC++ Build Tools + `vswhere.exe` PATH-də**; Linux → `clang` + `zlib`. Yoxdursa `'vswhere.exe' is not recognized` — **mühit** problemi, kod yox.

**5. Zərərsiz ILC qeydləri:** ODP.NET opsional auth provayderləri (Azure/Oci/Kerberos) "will always throw" işarələnir — adi user/parol bağlantısında çağırılmır, zərərsiz.

## 4. Frontend — Decoupled (React + Vite)
- Frontend və backend **ayrı layihələr**. **Blazor yox**. Rəng/şrift/loqo **hardcode yox** — yalnız design token referansları (bax [07-ui-ux.md](07-ui-ux.md)).

## 5. Verilənlər Bazası
- Oracle / PostgreSQL / SQLite. Yüksək yüklü bazalarda **indeksləşdirmə**. `DISTINCT` → `GROUP BY`/`ROW_NUMBER()`.
- SQL **DBA-clean** (təmiz, optimallaşdırılmış); doğrulama üçün DB MCP (Oracle → `oracle-sqlcl`, PG → `postgres`).
- **Migrasiya:** versiyalı alət (**Flyway**/**Liquibase** və ya .NET **DbUp**; EF Migrations AOT-da qaçılır). Forward-only, ardıcıl (`V001__...sql`); tətbiq olunmuş migrasiya dəyişdirilmir. İdempotent + rollback planı. CI-da deploy-dan əvvəl avtomatik. Böyük cədvəldə online/non-blocking DDL.

## 6. Servislərarası — gRPC (məcburi)
Backend↔backend **gRPC**; REST yalnız frontend↔backend.
- Kontrakt `.proto` **versiyalanır** (sahə nömrəsi silinmir → `reserved`). .NET: `Grpc.AspNetCore` (AOT-uyğun).
- **Daxili mTLS**; sertifikat güzəşti yalnız `INTERNAL_DOMAIN_SUFFIX`-ə scoped. Hər çağırışda **deadline**. Böyük data → **server streaming**. **OpenTelemetry** trace context ötürülür.
```protobuf
service OrderService {
  rpc GetOrder(OrderRequest) returns (OrderReply);
  rpc StreamOrders(OrderFilter) returns (stream OrderReply);   // böyük data
}
```

## 7. Böyük Data — Streaming / Batching
100k+ sətir **heç vaxt** tam yaddaşa. Paketlərlə (~1000) axın:
1. **gRPC server streaming** (backpressure).
2. **REST + `IAsyncEnumerable<T>`** (artımlı serializasiya; UI infinite scroll).
3. **Keyset (cursor) pagination** — `WHERE id > @lastId ORDER BY id FETCH FIRST 1000 ROWS ONLY` (`OFFSET` yox).
```csharp
public async IAsyncEnumerable<Order> StreamOrdersAsync(long afterId, [EnumeratorCancellation] CancellationToken ct) {
    const string sql = "SELECT id, total FROM orders WHERE id > @afterId ORDER BY id";
    await foreach (var o in conn.QueryUnbufferedAsync<Order>(sql, new { afterId }).WithCancellation(ct))
        yield return o;   // buffer etmədən axır
}
```
`CancellationToken` bütün zəncirdə; **sync-over-async qadağan** (`.Result`/`.Wait()` yox). Batch ölçüsü `STREAM_BATCH_SIZE` (~1000).

## 8. Keşləmə
Referans data (filiallar, seqmentlər, kateqoriyalar, permission tree, valyuta kursu) keşlənir.
- L1 in-memory (`IMemoryCache`), L2 distributed (`Redis`, `CACHE_REDIS_URL`). **.NET 9 `HybridCache`** (stampede qoruması daxil).
- **Cache-aside** + **TTL (5–60 dəq) + yazıda explicit invalidation**.
- ⚠️ **Scope açarda** (`segments:{storeId}`) → tenant izolyasiyası (əks halda başqa tenant datası sızar — bax IDOR).
```csharp
cache.GetOrCreateAsync($"segments:{storeId}",
    async t => await repo.LoadSegmentsAsync(storeId, t),
    new HybridCacheEntryOptions { Expiration = TimeSpan.FromMinutes(30) }, cancellationToken: ct);
```

## 9. Resilience və Performans
- **Timeout + retry (backoff) + circuit breaker** (`Microsoft.Extensions.Http.Resilience`/Polly, resilience4j).
- **Idempotency-Key** kritik/maliyyə yazılarında (təkrar sorğu ikiqat effekt yaratmır).
- **Bulk** əməliyyatlar (`COPY`/array-bind); connection pooling; async hər yerdə; response compression.

## 10. Tələb olunan konfiq
`DB_CONNECTION_STRING`, `INTERNAL_DOMAIN_SUFFIX`, `CACHE_REDIS_URL`, `STREAM_BATCH_SIZE`, `OTEL_EXPORTER_OTLP_ENDPOINT`. (SSO/audit konfiqi opsional — [06](06-optional-sso-audit.md)).

## Yoxlama Siyahısı
- [ ] Platforma vahid; Clean Architecture qatları
- [ ] (.NET) Native AOT + Dapper.AOT (`[module: DapperAot]`); literal/`const` SQL; generic `Query<T>`; `DAP###` təmiz (warning-as-error)
- [ ] (.NET) AOT publish doğrulanıb; **ODP.NET işləyir**; identity insert raw `OracleCommand`; Oracle bind `:`; native link alətləri
- [ ] OpenAPI + structured log + `/health`
- [ ] SQL optimallaşdırılıb; migrasiya versiyalı (forward-only, deploy öncəsi)
- [ ] Servislərarası gRPC (versiyalı proto, mTLS, deadline); böyük data streaming (keyset ~1000); keşləmə (scope açar); resilience
- [ ] Org-spesifik dəyərlər konfiqdən — kodda hardcode yox
