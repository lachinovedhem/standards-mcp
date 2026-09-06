# 08 — gRPC Standartı (geniş)

> Servislərarası (backend↔backend) kommunikasiya üçün **gRPC məcburidir**; REST/JSON yalnız
> frontend↔backend sərhəddində. Bu sənəd proto dizaynı, versiyalama, xəta idarəsi, deadline,
> streaming, təhlükəsizlik, .NET + Native AOT və müşahidəni əhatə edir. Qısa xülasə: [02-architecture.md](02-architecture.md) §6.

## 1. Nə vaxt gRPC (vs REST)
- **gRPC:** sinxron mikroservis↔mikroservis, aşağı latentlik/yüksək throughput, real-time bidirectional streaming, polyglot mühit, binar (JSON-dan kiçik) mesajlar.
- **REST qalır:** brauzerə baxan API (brauzer HTTP/2 nəzarəti verə bilmir → birbaşa gRPC yox). Brauzer üçün **gRPC-Web** və ya REST gateway.

## 2. Proto Faylları — Təşkilat və Versiyalama

- **Kontrakt mənbəyi = `.proto`** (tək həqiqət mənbəyi). Ayrıca repo/qovluqda (`protos/`), versiyalanır.
- **Paket adı versiyalı:** `package acme.orders.v1;`. Major dəyişiklikdə `v2` paketi (paralel).
- **Sahə nömrələri dəyişməzdir:** silinən sahə nömrəsi/adı **təkrar istifadə edilmir** → `reserved`:
  ```protobuf
  message Order {
    reserved 3, 5 to 7;
    reserved "old_field";
    int64 id = 1;
    string reference = 2;
  }
  ```
- **Geriyə uyğunluq qaydaları (breaking olmayan):** yeni sahə əlavə et (yeni nömrə), sahəni `reserved`-ə çevir. **Breaking:** sahə nömrəsini/tipini dəyiş, `required` semantikasını dəyiş, paketi/servisi/RPC-ni adlandır.
- **Stil:** `snake_case` sahələr, `PascalCase` mesaj/servis, `SCREAMING_SNAKE` enum dəyərləri. Kod generasiyası `Grpc.Tools` ilə build-time.

## 3. Mesaj Dizaynı
- **Enum-lar `0 = UNSPECIFIED` ilə başlayır** (proto3 default 0-dır; naməlum/default halı ayırd etmək üçün):
  ```protobuf
  enum OrderStatus { ORDER_STATUS_UNSPECIFIED = 0; ORDER_STATUS_OPEN = 1; ORDER_STATUS_DONE = 2; }
  ```
- **Well-known types** işlət: `google.protobuf.Timestamp` (UTC — bax [04](04-api-i18n-privacy.md)), `Duration`, `FieldMask` (partial update), `StringValue`/`Int32Value` (nullable), `Struct`/`Any` (dinamik — ehtiyatla).
- **Pul:** `float`/`double` **qadağan** (bax [04](04-api-i18n-privacy.md)) → `string` decimal (`"1250.00"`) və ya `{ currency_code, units, nanos }` (google.type.Money paterni).
- **ID-lər `string`/`int64`** (JS `number` 2^53 limitini nəzərə al). `oneof` bir-birini istisna edən sahələr üçün.
- **Boş cavab:** `google.protobuf.Empty` yerinə **öz boş response mesajını** yarat (gələcəkdə sahə əlavə etmək üçün).

## 4. Servis Dizaynı və Metod Növləri
| Növ | İstifadə |
|---|---|
| **Unary** | Sadə sorğu/cavab (default) |
| **Server streaming** | Böyük nəticə axını (bax [02](02-architecture.md) §7) — backpressure |
| **Client streaming** | Toplu upload / metrik axını |
| **Bidirectional** | Real-time (chat, canlı yeniləmə) |

- Metod adları fel + resurs (`GetOrder`, `ListOrders`, `StreamOrders`). Böyük siyahılar üçün **server streaming** və ya cursor `page_token` (unary).
- **İdempotentlik:** kritik/maliyyə yazılarında `idempotency_key` sahəsi (bax [02](02-architecture.md) §9).

## 5. Deadline / Timeout (MƏCBURİ)
- Client **hər çağırışda deadline** təyin edir — **sonsuz gözləmə qadağan**. Server deadline-ı yoxlayır və keçəndə işi dayandırır.
- **Cancellation propagation:** gələn `ServerCallContext.CancellationToken` bütün DB/downstream çağırışlara ötürülür (client kəsiləndə iş dayanır).
- .NET client:
  ```csharp
  var reply = await client.GetOrderAsync(request, deadline: DateTime.UtcNow.AddSeconds(5), cancellationToken: ct);
  ```
- Downstream çağırışlarda deadline **propagation**: `.EnableCallContextPropagation()` (aşağı bax) — parent deadline/cancellation avtomatik ötürülsün.

## 6. Xəta İdarəetməsi
- **`StatusCode` düzgün seç:** `INVALID_ARGUMENT` (validasiya), `NOT_FOUND`, `ALREADY_EXISTS`, `PERMISSION_DENIED`, `UNAUTHENTICATED`, `FAILED_PRECONDITION`, `ABORTED`, `RESOURCE_EXHAUSTED` (rate limit), `DEADLINE_EXCEEDED`, `UNAVAILABLE` (retryable), `INTERNAL`. `UNKNOWN`-dan qaç.
- **Zəngin xəta detalı:** `google.rpc.Status` + detallar (`BadRequest.FieldViolation`, `ErrorInfo`) — `Grpc.StatusProto`.
- **`EnableDetailedErrors = false`** (prod) — exception mesajı client-ə **sızmır** (həssas məlumat). Yalnız dev-də `true`.
  ```csharp
  builder.Services.AddGrpc(o => o.EnableDetailedErrors = builder.Environment.IsDevelopment());
  ```
- **Retryable vs deyil:** yalnız idempotent + `UNAVAILABLE`/`DEADLINE_EXCEEDED`/`RESOURCE_EXHAUSTED` retry olunur (service config, §11).

## 7. Interceptor-lar (cross-cutting)
Server və client interceptor-ları ilə: **structured logging, auth doğrulama, exception→Status map, OpenTelemetry tracing, metriklər**. Hər interceptor tək məsuliyyət; sıra vacibdir (exception ən xarici).
```csharp
builder.Services.AddGrpc(o => {
    o.Interceptors.Add<ExceptionInterceptor>();   // Status-a map + PII maskalı log
    o.Interceptors.Add<AuthInterceptor>();        // boolean permission (bax 03 §4)
});
```

## 8. Təhlükəsizlik
- **HTTP/2 + TLS məcburi** (Kestrel gRPC endpoint HTTP/2 tələb edir, TLS ilə qorunur).
- **Daxili mTLS** (servis identifikasiyası) — sertifikat güzəşti yalnız `INTERNAL_DOMAIN_SUFFIX`-ə scoped (bax [03](03-security.md) §13; qlobal söndürmə qadağan).
- **Auth token propagation:** istifadəçi kontekstində çağırışda daxili JWT metadata-da (`authorization` başlıq) ötürülür; server doğrulayır; **avtorizasiya boolean icazə** ilə (bax [03](03-security.md) §4).
- **Mesaj ölçü limiti:** `MaxReceiveMessageSize` (default 4 MB) — DoS qoruması; böyük data üçün streaming (limiti şüursuz artırma).
- **Metadata həssas data daşımır** (log-a düşə bilər); `EnableDetailedErrors=false`.

## 9. Health Checking və Reflection
- **gRPC Health Checking Protocol** (`grpc.health.v1.Health`) — load balancer/orkestrator üçün: `Grpc.AspNetCore.HealthChecks` + `MapGrpcHealthChecksService()`. REST `/health/live+ready` ilə paralel (bax [05](05-devops-test-observability.md)).
- **Server reflection** (`Grpc.AspNetCore.Server.Reflection`) yalnız **dev/staging** — prod-da **söndürülür** (endpoint kəşfini açır).

## 10. Bağlantı İdarəsi
- **Channel təkrar istifadə edilir** (`GrpcChannel` bahalıdır — subchannel/HTTP/2 multiplexing). Hər çağırışda yeni channel **qadağan** → DI-da `AddGrpcClient` (channel pooling + `SocketsHttpHandler`).
- **Keepalive** uzunömürlü/streaming bağlantılarda (`SocketsHttpHandler.KeepAlivePingDelay`) — ölü bağlantı aşkarlansın.
- **`EnableCallContextPropagation()`** — gələn deadline/cancellation/trace downstream çağırışlara ötürülsün:
  ```csharp
  builder.Services.AddGrpcClient<OrderService.OrderServiceClient>(o => o.Address = new Uri(cfg["ORDERS_GRPC_URL"]!))
      .AddCallCredentials(...)          // token
      .EnableCallContextPropagation();  // parent deadline/cancellation/trace
  ```

## 11. Retry / Hedging və Load Balancing
- **Service config ilə retry** (yalnız idempotent): `MethodConfig.RetryPolicy` (max attempts, backoff, `RetryableStatusCodes = [UNAVAILABLE]`). **Hedging** (paralel cəhd) — yalnız təhlükəsiz idempotent metodlarda.
- **Client-side load balancing:** `dns:///` resolver + `round_robin` policy (çoxlu backend instansı).
- Konfiq host **koddan yox, ENV-dən** (`*_GRPC_URL`).

## 12. Compression (gRPC)
- gRPC daxili mesaj sıxılması: default provayder **gzip**. Server: `ResponseCompressionAlgorithm = "gzip"` + `ResponseCompressionLevel`. Client `grpc-accept-encoding` göndərməlidir.
  ```csharp
  builder.Services.AddGrpc(o => {
      o.ResponseCompressionAlgorithm = "gzip";
      o.ResponseCompressionLevel = System.IO.Compression.CompressionLevel.Optimal;
  });
  ```
- Kiçik/artıq-sıxılmış mesajlarda faydası az (CPU vs bandwidth balansı). Detal: [09-compression-caching.md](09-compression-caching.md) §4.

## 13. .NET + Native AOT
- **gRPC Native AOT dəstəklidir** (.NET 8+): `<PublishAot>true</PublishAot>` + `Grpc.AspNetCore` + `Google.Protobuf`. Template: `dotnet new grpc --aot`. Publish: `dotnet publish -r <RID>` (native linker — bax [02](02-architecture.md)).
- **`CreateSlimBuilder`** (AOT host) default olaraq **HTTPS/HTTP/3 daxil etmir** — gRPC üçün Kestrel HTTP/2 (+ TLS lazımdırsa `UseKestrelHttpsConfiguration`) açıq konfiqurasiya olunur:
  ```csharp
  builder.WebHost.ConfigureKestrel(o => o.ListenAnyIP(5001, l => { l.Protocols = HttpProtocols.Http2; /* l.UseHttps(...) */ }));
  builder.Services.AddGrpc();
  ...
  app.MapGrpcService<OrderGrpcService>();
  ```
- **Contract-first** (`.proto` + `Grpc.Tools`) tövsiyə. Code-first (`protobuf-net.Grpc`) — reflection istifadə edə bilər, AOT uyğunluğunu yoxla.
- **`Grpc.Tools`** protobuf kodu **build-time** generasiya edir (reflection yox) → AOT-safe.

## 14. Böyük Data Streaming (gRPC)
- `stream` cavab + **backpressure** (client öz tempi ilə oxuyur). Server tərəfdə `IAsyncEnumerable` + `CancellationToken`; sətirlər **buffer edilmədən** axır (bax [02](02-architecture.md) §7).
- `WriteAsync` arasında böyük yaddaş yığma yox; ~1000-lik keyset paketləri.

## 15. Test və Müşahidə
- **Test:** in-process gRPC test client (real kanal) — [05](05-devops-test-observability.md) §2.
- **Observability:** OpenTelemetry gRPC instrumentasiyası (server + client span-ları avtomatik); trace context (`traceparent`) metadata ilə ötürülür (bax [05](05-devops-test-observability.md) §3).

## Yoxlama Siyahısı
- [ ] Servislərarası çağırış gRPC (REST yalnız frontend); `.proto` versiyalı paket (`v1`), sahə nömrələri `reserved` (təkrar yox)
- [ ] Enum `0=UNSPECIFIED`; well-known types; pul float yox; Timestamp UTC
- [ ] Metod növü düzgün (unary/stream); böyük data server-streaming (buffer yox); idempotency açar kritik yazıda
- [ ] **Hər client çağırışında deadline**; cancellation propagation; `EnableCallContextPropagation`
- [ ] Düzgün `StatusCode` + `google.rpc.Status` detalı; **`EnableDetailedErrors=false` (prod)**
- [ ] Interceptor-lar: exception→Status, auth (boolean icazə), OTel tracing, PII-maskalı log
- [ ] HTTP/2 + TLS; daxili mTLS scoped (`INTERNAL_DOMAIN_SUFFIX`); token metadata propagation; `MaxReceiveMessageSize` limiti
- [ ] gRPC health checking; reflection **prod-da söndürülü**
- [ ] Channel təkrar istifadə (`AddGrpcClient`), keepalive; retry yalnız idempotent+`UNAVAILABLE` (service config)
- [ ] Compression (gzip) böyük mesajlarda; host ENV-dən
- [ ] (.NET) `Grpc.Tools` build-time codegen; AOT publish doğrulanıb; `AddGrpc`/`MapGrpcService`; in-process test; OTel gRPC
