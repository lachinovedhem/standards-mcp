# 04 — API Dizayn, Lokalizasiya və Data Privacy

## 1. API Dizayn (REST — frontend↔backend)

- **URL:** resurslar isim + cəm (`/api/v1/orders`, `/api/v1/orders/{id}/lines`). Fel URL-ə yox (HTTP metodu daşıyır). Yol `kebab-case`, JSON sahələr `camelCase`.
- **Status:** `200/201/204`, `400/401/403/404/409/422/429/500`. `201`-də `Location`. Uğursuzluqda gövdə həmişə ProblemDetails.
- **Error = RFC 7807** (`application/problem+json`):
```json
{ "type":"https://errors.<domen>/validation", "title":"Validasiya xətası", "status":400,
  "detail":"storeId tələb olunur", "traceId":"00-abc...", "errors":{"storeId":["tələb olunur"]} }
```
  `type` prefiksi `PROBLEM_TYPE_BASE_URI`; `traceId` daxil; daxili detal/stack yox; `title` lokallaşır.
- **Versiyalama:** URL (`/api/v1`). Breaking → yeni major (köhnə paralel, deprecation). Versiyasız breaking qadağan.
- **Pagination — cursor (keyset):** `?limit=1000&cursor=<opaque>` → `{ items, nextCursor, hasMore }`. `OFFSET` yox. `limit` server tərəfdə tavana sıxılır (`API_MAX_PAGE_SIZE`).
- **Idempotency-Key** kritik/maliyyə POST-larında.
- OpenAPI güncəl; tarix **ISO 8601 UTC**; filter/sort **allowlist-li** (ixtiyari sahə qadağan).

## 2. Lokalizasiya, Vaxt, Valyuta
> Default dil/zona/valyuta **konfiqdən** (`APP_DEFAULT_LOCALE`/`APP_TIMEZONE`/`APP_CURRENCY`) — hardcode yox. Nümunə `az-AZ`/`Asia/Baku`/`AZN` illüstrativdir.

**Dillər:**
- **Məcburi:** default dil + **`en`** (hər zaman tam). **Opsional:** əlavə dillər (məs. `ru`) ehtiyac olanda, aktivdirsə **tam**.
- UI mətnləri **hardcode yox** — açar-əsaslı (`react-i18next`) + `dayjs` locale. Backend mesajları `Accept-Language`-ə görə.
- **Dil seçici** app shell-də hər səhifədə; dəyişmə **anında** (reload yox), davamlı (localStorage/profil). Tapılmayan açar → default dil fallback (tofu yox).
- **CI qapısı:** hardcode mətn qadağan (`eslint-plugin-i18next`); **açar paritetı** (fərq → CI qırılır); untranslated hesabatı; tip-təhlükəsiz açar. Tək mənbə `src/locales/{az,en[,ru]}/<ns>.json`, açar `ns.feature.element`.

**Vaxt:** DB/API **həmişə UTC** (ISO 8601 `...Z`); yerli **yalnız təqdimatda** (`Intl.DateTimeFormat`/`dayjs`). "Bu gün" `APP_TIMEZONE`-a görə.

**Valyuta:** `APP_CURRENCY` (ISO 4217). Pul **`decimal`/minor-unit** (`float`/`double` QADAĞAN). .NET `decimal`, Java `BigDecimal`, DB `NUMERIC(18,2+)`. Format: `Intl.NumberFormat(locale,{style:'currency',currency})`. Yuvarlaqlaşma saxlama anında bir dəfə.

**Rəqəm/tarix:** `Intl` API (manual string yox). Default dilin əlifbası **UTF-8/`NVARCHAR`**; collation dilə uyğun.

## 3. Excel Export / Import (məcburi)
> Kök səbəb: CSV/string Excel-də yenidən şərh olunur (tarix pozulur, barcode `4.69E+12`, aparıcı sıfır itir). Həll: real **`.xlsx`** + hər hüceyrənin tipi + number format açıq.

1. **`.xlsx` yaz, CSV yox.**
2. **Tarix:** real `DateTime` dəyəri + yerli format `dd.MM.yyyy` (string yox). UTC → `APP_TIMEZONE`.
3. **Barcode/kod:** **mətn formatı (`@`)** — elmi qeyd və sıfır itkisi olmaz.
4. **Decimal:** real `decimal` (float yox) + `#,##0.00`; valyuta `#,##0.00 "<simvol>"`.
5. **Böyük export (100k+):** server streaming (workbook-u yaddaşa yığma).
```csharp
ws.Cell(r,1).Value = order.CreatedAtUtc.ToAppLocal();  ws.Cell(r,1).Style.DateFormat.Format = "dd.MM.yyyy HH:mm";
ws.Cell(r,2).SetValue(product.Barcode);                ws.Cell(r,2).Style.NumberFormat.Format = "@";   // mətn
ws.Cell(r,3).Value = line.Price;                       ws.Cell(r,3).Style.NumberFormat.Format = "#,##0.00";
```
Import: barcode/kod **mətn** oxunur; decimal locale-aware parse; tarix **UTC-yə** normallaşır.
> ⚠️ AOT qeydi: Excel kitabxanaları (ClosedXML/EPPlus/NPOI) reflection istifadə edə bilər → AOT uyğunluğunu yoxla, ya export-u ayrı iş/servisdə, ya yüngül streaming writer.

## 4. Data Privacy / PII
- **Təsnifat:** PII (ad/telefon/email/badge/ünvan), həssas (sağlamlıq/maliyyə → minimuma). Hər sahə təsnif olunur.
- **Minimallıq:** yalnız lazım olan toplanır. Test/analitik mühitə **maskalanmış/anonim** (real PII yox).
- **Şifrələmə:** in-transit TLS; at-rest həssas PII (DB TDE / sahə-səviyyə **AES-256-GCM**, [03](03-security.md) §5). Açar secret store (`PII_ENCRYPTION_KEY_REF`).
- **Giriş:** boolean permission + obyekt-scope (IDOR); audit trail (kim/nə/nə vaxt) — log-un özündə PII maskalı.
- **Retention:** hər kateqoriya üçün müddət (`PII_RETENTION_DAYS`); bitəndə təhlükəsiz silmə/anonimləşdirmə; **silmə hüququ**; backup-da da nəzərə al.
- **Log/maskalanma:** token/parol/kart/tam badge/telefon log-a düşmür; lazımdırsa maskala. Xəta mesajında PII yox.

## Yoxlama Siyahısı
- [ ] Resurs URL + `/api/v1`; düzgün status; RFC 7807 (traceId, sızma yox)
- [ ] Cursor pagination (server-sıxılı limit; OFFSET yox); Idempotency-Key kritik POST; OpenAPI; tarix ISO UTC
- [ ] i18n: default+`en` məcburi (parity, CI); dil seçici anında; hardcode yox
- [ ] Vaxt UTC saxla/yerli göstər; pul decimal (float yox); `Intl` format
- [ ] Excel `.xlsx` (tarix DateTime, barcode `@`, decimal + number format); import locale-aware
- [ ] PII təsnif; minimallıq; at-rest şifrələmə; scope+audit; retention+silmə; log maskalanma
