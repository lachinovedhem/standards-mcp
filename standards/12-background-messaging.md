# 12 — Background Jobs və Messaging (geniş)

> Uzun/asinxron/planlı işlər və servislərarası asinxron mesajlaşma. Sinxron çağırış üçün gRPC
> ([08](08-grpc.md)); audit non-blocking queue nümunəsi [06](06-optional-sso-audit.md) §2.1.

## 1. Background İşlər — `BackgroundService` / `IHostedService`
- Davamlı/fon işi üçün **`BackgroundService`** (`ExecuteAsync(CancellationToken)`), qeydiyyat `AddHostedService<T>()`. AOT-uyğun.
- **`stoppingToken`-a hörmət** (graceful shutdown); iş dövründə `try/catch` — bir iterasiyanın xətası servisi öldürməsin.
- **Uzun iş request thread-ini bloklamır** — iş queue/channel-a atılır, fon işçisi emal edir (sorğu yolu sərbəst — [06](06-optional-sso-audit.md) §2.1 pattern).
- **In-process queue:** `System.Threading.Channels` (bounded, `DropOldest`/backpressure metrik). Scoped servis lazımdırsa fon işçisində `IServiceScopeFactory.CreateScope()`.
```csharp
public sealed class OrderWorker(Channel<OrderJob> ch, IServiceScopeFactory scopes, ILogger<OrderWorker> log)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        await foreach (var job in ch.Reader.ReadAllAsync(ct))
        {
            try {
                using var scope = scopes.CreateScope();
                await scope.ServiceProvider.GetRequiredService<IOrderProcessor>().RunAsync(job, ct);
            } catch (Exception ex) { log.LogError(ex, "order job failed {Id}", job.Id); /* retry/DLQ */ }
        }
    }
}
```

## 2. Planlı İşlər (Cron)
- Sadə: `PeriodicTimer` (`BackgroundService` içində) — interval iş.
- Cron/persistent: **Quartz.NET** / **Hangfire** (persistence + dashboard). AOT uyğunluğunu yoxla (reflection). Konteyner mühitində **tək instansiyada** işləsin (leader election / distributed lock) — hər replikada təkrar işləməsin.

## 3. Messaging — Nə vaxt və Broker
- **Nə vaxt:** asinxron, decoupled, event-driven; təkrar cəhd/dayanıqlılıq; yük tənzimləmə (spike buffer). Dərhal cavab lazımdırsa → gRPC.
- **Broker:** RabbitMQ / Azure Service Bus / Kafka (event stream). Abstraksiya: **MassTransit** və ya birbaşa client. AOT: broker client-lərinin reflection/AOT uyğunluğunu yoxla (bəziləri hələ tam AOT deyil → bu servisi non-AOT saxla və ya birbaşa yüngül client).

## 4. Etibarlılıq Nümunələri (MƏCBURİ)

### 4.1 Outbox Pattern (dual-write problemi)
DB yazısı **və** mesaj göndərişi **atomik olmalıdır**. İkisini ayrı etmək (yaz + sonra publish) → biri uğursuz olsa uyğunsuzluq. Həll: **outbox**.
1. Biznes dəyişikliyi + mesaj **eyni DB tranzaksiyasında** `outbox` cədvəlinə yazılır.
2. Ayrıca **relay** (background service) outbox-u oxuyub broker-ə göndərir, uğurda işarələyir.
→ "ən azı bir dəfə" (at-least-once) çatdırılma zəmanəti; dual-write itkisi yox.

### 4.2 Idempotent Consumer (dublikat qoruması)
At-least-once → **mesaj təkrar gələ bilər**. Consumer **idempotent** olmalıdır:
- Hər mesajda **`MessageId`**; emal olunmuş id-lər `processed_messages` cədvəlində (unique). Təkrar id → **skip**.
- Və ya biznes əməliyyatı təbii idempotent (upsert, `WHERE status = 'pending'`).
- **Inbox pattern:** gələn mesaj id-si + nəticə saxlanır → təkrar sorğu eyni nəticə.

### 4.3 Retry / Backoff / DLQ
- **Retry** (eksponensial backoff + jitter) keçici xətalarda; **max attempt**-dən sonra **Dead Letter Queue (DLQ)**.
- DLQ **monitorinq + alert** ([05](05-devops-test-observability.md) §3.6) — səssiz itki yox; manual/avtomatik reprocess.
- **Poison message** (həmişə uğursuz) DLQ-ya keçir, əsas axını bloklamır.

### 4.4 Ordering & Partitioning
- Sıra vacibdirsə: eyni açar (məs. `orderId`) eyni partition/queue-ya (Kafka partition key / SB session). Qlobal sıra bahalıdır — yalnız lazım olduqda.

## 5. Mesaj Kontraktı
- **Versiyalanır** (schema evolution — geriyə uyğun; sahə əlavə OK, silmə/dəyişmə breaking). Konvensiya gRPC proto ([08](08-grpc.md) §2) ilə uyğun.
- **Envelope:** `messageId`, `type`, `occurredAt` (UTC), `traceparent` (trace context — [05](05-devops-test-observability.md) §3.2), `payload`. **Secret/PII payload-a düşmür** (maskalanır — [03](03-security.md) §14).
- Serializasiya AOT-safe (source-gen `System.Text.Json` / Protobuf).

## 6. Müşahidə və Graceful Shutdown
- **OpenTelemetry:** publish/consume span-ları; `traceparent` broker mesajında ötürülür → uçtan-uca trace.
- **Metriklər:** queue dərinliyi, emal gecikməsi, retry/DLQ sayı, dropped (RED/USE — [05](05-devops-test-observability.md) §3.4).
- **Graceful shutdown:** `IHostApplicationLifetime` / `stoppingToken` — dayanmadan əvvəl işlənən mesajı bitir (in-flight itməsin); channel `Complete()` + qalan flush.

## 7. Anti-pattern-lər
- ❌ DB yaz + sonra publish (outbox yox) → dual-write itkisi.
- ❌ Consumer idempotent deyil → dublikat mesaj ikiqat effekt.
- ❌ Retry limitsiz / DLQ yox → poison message əsas axını bloklayır, sonsuz retry.
- ❌ `BackgroundService`-də `stoppingToken` iqnor / `try/catch` yox → shutdown-da itki / servis ölümü.
- ❌ Sorğu yolunda uzun iş (queue yerinə) → latentlik + thread starvation.
- ❌ Secret/PII mesaj payload-unda.

## Yoxlama Siyahısı
- [ ] Uzun iş `BackgroundService`/queue (sorğu yolu bloklanmır); `stoppingToken` + `try/catch`; scoped üçün `CreateScope`
- [ ] Planlı iş tək instansiyada (distributed lock/leader); AOT uyğunluğu yoxlanıb
- [ ] **Outbox** (DB+mesaj atomik); **idempotent consumer** (`MessageId`/inbox); dual-write yox
- [ ] Retry (backoff+jitter) + max attempt + **DLQ** (monitor/alert); poison message izolyasiya
- [ ] Sıra lazımdırsa partition/session key; mesaj kontraktı versiyalı; envelope (messageId/occurredAt UTC/traceparent)
- [ ] Secret/PII payload-da yox; serializasiya AOT-safe
- [ ] OTel publish/consume span + traceparent; queue metrikləri; graceful shutdown (in-flight bitir)
