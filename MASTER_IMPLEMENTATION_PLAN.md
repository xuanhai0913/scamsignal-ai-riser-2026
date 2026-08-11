# ScamSignal AI — Master Implementation Plan & Feature Checklist

> **Cập nhật:** 09/08/2026  
> **Vai trò tài liệu:** backlog thực thi và checklist nguồn sự thật của dự án  
> **Đối tượng:** product owner, developer, tester và người chuẩn bị bản thi/Google Play  
> **Mục tiêu hiện tại:** hoàn thiện một bản web AI Studio công khai, nhất quán và có bằng chứng để nộp cuộc thi trước 30/08/2026; Android và Google Workspace tiếp tục sau cuộc thi.

## 1. Cách sử dụng tài liệu

Đây là tài liệu điều phối công việc. Chi tiết về tầm nhìn, kiến trúc và lý do chọn
công nghệ nằm trong:

- [PRODUCT_VISION.md](./PRODUCT_VISION.md) — tầm nhìn sản phẩm và hướng scale.
- [WORKSPACE_MOBILE_ROADMAP.md](./WORKSPACE_MOBILE_ROADMAP.md) — kiến trúc Google Workspace, Firebase và Android.
- [UPGRADE_PLAN.md](./UPGRADE_PLAN.md) — trạng thái nâng cấp cho cuộc thi.
- [DEPLOYMENT.md](./DEPLOYMENT.md) — checklist triển khai Cloud Run.
- [AI_STUDIO_SYNC.md](./AI_STUDIO_SYNC.md) — quy trình đồng bộ Google AI Studio.

Quy ước:

- `[x]` — đã triển khai và đã có bằng chứng kiểm tra.
- `[ ]` — chưa triển khai hoặc chưa kiểm tra đầy đủ.
- `PARTIAL` — đã có vertical slice nhưng chưa đủ điều kiện production.
- `BLOCKED` — cần một điều kiện bên ngoài như Cloud Billing, OAuth consent hoặc tài khoản Play.
- `P0` — bắt buộc cho release gần nhất; `P1` — giá trị cao; `P2` — mở rộng sau khi P0/P1 ổn định.

Ước lượng trong tài liệu là **developer-day**, không phải cam kết ngày phát hành.

## 2. Product definition of done

ScamSignal AI chỉ được coi là hoàn thiện ở mức production khi:

- [ ] Người dùng có thể kiểm tra text, URL và ảnh chụp mà không phải mở link đáng ngờ.
- [ ] Kết quả tách rõ dữ kiện đã xác minh, suy luận và điều chưa biết; không tuyên bố vô căn cứ rằng một cá nhân là kẻ lừa đảo.
- [ ] Điểm rủi ro do evidence engine/AI tính động; UI không hard-code kết quả cuối.
- [ ] Dữ liệu nhạy cảm được che trước khi rời thiết bị; lưu trữ luôn cần consent.
- [ ] Web và Android dùng chung contract, URL engine, redaction và evidence schema.
- [ ] API production có authentication phù hợp, App Check, rate limit, log an toàn và cảnh báo chi phí.
- [ ] Drive, Calendar và Gmail vẫn có fallback khi người dùng từ chối OAuth.
- [ ] Quyền Google và Android tuân theo least privilege.
- [ ] Có unit, contract, integration và end-to-end test cho bốn case: benign, typosquat, screenshot/QR và uncertain.
- [ ] Privacy Policy, Data safety và mô tả Google Play khớp với hành vi thật của app.
- [ ] Có quy trình xóa case/tài khoản/dữ liệu và có thể chứng minh hoạt động.
- [ ] Bản demo, bản public và bản store cùng một luồng sản phẩm, không dùng mock để trình bày như tính năng live.

### 2.1 Quyết định phạm vi bản thi — 09/08/2026

- [x] Nộp **một dự án ScamSignal AI** bằng **một AI Studio Project Link**.
- [x] Bản web AI Studio là sản phẩm dự thi và luồng demo chính.
- [x] Giữ code mobile hiện có nhưng chuyển toàn bộ Android/Google Play sang
  `PARKED / POST-COMPETITION`.
- [x] Không nộp APK/AAB và không tuyên bố mobile đã phát hành.
- [ ] Ưu tiên một public deployment URL từ AI Studio Publish/Cloud Run để lấy
  deployment bonus; form chỉ cập nhật sau khi URL mở được độc lập.
- [ ] Video, social post và form phải mô tả cùng một release candidate.
- [ ] Firebase, Maps, Workspace, Web Risk hoặc Play chỉ được ghi là “đã tích hợp”
  khi có luồng live và bằng chứng kiểm tra.

**Điều kiện mở lại mobile:** bản web đã publish, demo/form cuối đã cập nhật, hoặc
đã qua hạn nộp 23:59 ngày 30/08/2026.

## 3. Baseline hiện tại — 09/08/2026

### 3.1 Đã hoàn thành và giữ nguyên hành vi

- [x] `BASE-001` Phân tích text bằng Gemini structured output.
- [x] `BASE-002` Phân tích screenshot qua Gemini trong vertical slice hiện tại.
- [x] `BASE-003` Che OTP, mật khẩu và số thẻ trước khi gửi dữ liệu.
- [x] `BASE-004` URL/domain engine chạy deterministic và không truy cập link đáng ngờ.
- [x] `BASE-005` UI Check → Verify → Rescue và Trust Twin.
- [x] `BASE-006` Xuất report/evidence package dạng JSON ở client.
- [x] `BASE-007` Điểm helpful/unclear lưu theo phiên bằng `sessionStorage`.
- [x] `BASE-008` Google AI Studio v3 đã đồng bộ và Gemini chạy end-to-end.
- [x] `BASE-009` 56/56 automated tests baseline pass; full suite hiện là 75/75.
- [x] `BASE-010` Bộ đánh giá URL có 50 case, gồm 10 benign false-positive guards.
- [x] `BASE-011` UI responsive desktop/mobile web, keyboard navigation và focus state cơ bản.

### 3.2 Đã có nhưng chưa production-ready

- [ ] `BASE-012` **PARTIAL:** Web Risk có code phía server nhưng chưa xác nhận endpoint production live.
- [ ] `BASE-013` **PARTIAL:** Trust Twin so sánh domain do người dùng nhập, chưa có official entity registry và Places resolver.
- [ ] `BASE-014` **PARTIAL:** Screenshot hiểu bằng multimodal AI và mobile đã có QR decoder deterministic; chưa có vùng evidence annotation.
- [ ] `BASE-015` **PARTIAL:** Report/emergency export mới là JSON local, chưa có PDF/Drive/Docs.
- [ ] `BASE-016` **PARTIAL:** Feedback chỉ ở phiên hiện tại, chưa có Firestore, consent và moderation.
- [ ] `BASE-017` **PARTIAL:** Backend sẵn sàng đóng container nhưng chưa xác nhận public Cloud Run release.
- [ ] `BASE-020` **PARTIAL/PARKED:** Native Android offline vertical slice đã có;
  chưa qua real-device E2E và chưa có Google Play track.

### 3.3 Chưa triển khai

- [ ] `BASE-018` Firebase Auth, Firestore, App Check, Storage và FCM.
- [ ] `BASE-019` Google Drive/Docs, Calendar, Gmail add-on, Places và Sheets live.
- [ ] `BASE-021` Campaign clustering, reviewer workflow và dashboard vận hành.
- [ ] `BASE-022` Production observability, SLO, cost budget và incident runbook.

## 4. Release map và quality gates

| Release | Mục tiêu | Điều kiện qua gate |
| --- | --- | --- |
| R0 — Stable web baseline | Đóng băng bản demo đang hoạt động | 56 tests, build, 4 demo cases, không regression |
| R1 — Competition web RC | AI Studio parity, public web, demo/form đồng bộ | link mở độc lập, 4 case pass, claims có bằng chứng |
| R2 — Protected cloud beta | Firebase + Cloud Run production contract | Auth/App Check/rules tests, consent, deletion, cost guardrails |
| R3 — Android offline alpha | Check URL/text từ Share Sheet sau cuộc thi | chạy trên thiết bị thật, offline typosquat, không broad permissions |
| R4 — Workspace beta | Drive, Calendar, Gmail, Places, Sheets | least privilege, fallback local, không lộ raw evidence |
| R5 — Play/production | Bản phát hành có thể scale và rollback | Play gates, monitoring, moderation, SLO và incident response |

Không bắt đầu release sau nếu acceptance criteria của release trước chưa đạt, trừ
những task độc lập được đánh dấu rõ.

## 5. Dependency map

```text
Core contracts ──> AI Studio parity ──> Public web ──> Demo + form final
       │                                  │
       ├────────> Cloud Run v1 API <── Firebase Auth/App Check
       │                                  ├──> Drive/Calendar/Workspace
       │                                  └──> Firestore moderation
       │
       └────────> Android prototype (parked) ──> Post-competition Play track
```

## 6. Epic 0 — Foundation, contracts và monorepo

**Mục tiêu:** tách phần có thể tái sử dụng nhưng không làm hỏng bản web/AI Studio.  
**Ưu tiên:** P0 · **Ước lượng:** 3–5 ngày · **Phụ thuộc:** không.

### Checklist triển khai

- [ ] `FND-001` Ghi lại snapshot R0: commit/tag logic, ảnh UI, test result và demo fixtures.
- [ ] `FND-002` Chuyển repo sang workspace/monorepo có cấu trúc:
  - `apps/web`
  - `apps/mobile`
  - `apps/workspace-addon`
  - `services/api`
  - `packages/core`
  - `packages/api-client`
  - `packages/evidence`
  - `packages/config`
  - `firebase/`
- [x] `FND-003` Di chuyển `shared/url-analysis.ts`, `privacy.ts`, types và contract vào package dùng chung mà không thay đổi output.
- [x] `FND-004` Version API thành `/v1/analyses`; giữ adapter tương thích `/api/analyze` cho web hiện tại.
- [ ] `FND-005` Định nghĩa schema version cho `AnalysisRequest`, `AnalysisResult`, `Evidence`, `RiskSignal`, `UserAction` và `ErrorResponse`.
- [x] `FND-006` Validate payload runtime ở cả client và server; reject MIME/size/field lạ.
- [x] `FND-007` Tạo API client dùng `API_BASE_URL`, timeout, abort và typed retry metadata; không tự retry lời gọi model tính phí.
- [ ] `FND-008` Tách config `development`, `staging`, `production`; không bundle secret vào web/mobile.
- [x] `FND-009` Bổ sung scripts root: lint, typecheck, unit, contract, build web, build server và test mobile.
- [ ] `FND-010` CI chạy changed packages nhưng full contract/evaluation suite trước release.
- [ ] `FND-011` Tạo fixture chung cho benign, typosquat, homograph, shortened link, screenshot/QR và uncertain.
- [ ] `FND-012` Ghi Architecture Decision Records cho Expo prebuild, Firebase anonymous auth và least-privilege OAuth.

### Acceptance criteria

- [x] `FND-A01` 56 tests baseline vẫn pass sau khi di chuyển; tổng suite hiện là 75 tests.
- [ ] `FND-A02` Web build và AI Studio package không thay đổi hành vi người dùng.
- [ ] `FND-A03` Web và mobile cùng giải mã được một contract fixture.
- [ ] `FND-A04` Không có API key/service account trong browser bundle, Android bundle hoặc Git history mới.

## 7. Epic 1 — Evidence engine và privacy core

**Mục tiêu:** tạo lõi chống scam có thể chạy offline trước, AI enrich sau.  
**Ưu tiên:** P0 · **Ước lượng:** 5–8 ngày · **Phụ thuộc:** FND-003, FND-005.

### URL và entity inspection

- [x] `CORE-001` Parse domain bằng Public Suffix List/tldts.
- [x] `CORE-002` Phát hiện lookalike/typosquat cơ bản và giải thích bằng evidence.
- [ ] `CORE-003` Chuẩn hóa Unicode IDN/Punycode và hiển thị cả dạng Unicode lẫn ASCII.
- [ ] `CORE-004` Phát hiện zero-width, mixed scripts, confusable characters và excessive subdomain.
- [ ] `CORE-005` Phân tích redirect/shortener chỉ bằng metadata an toàn từ backend; không cho client mở URL.
- [ ] `CORE-006` Tách email/phone/bank account/domain thành entity có confidence và provenance.
- [ ] `CORE-007` Xây curated official registry có nguồn, phiên bản, ngày kiểm tra và quy trình cập nhật.
- [ ] `CORE-008` Không dùng một heuristic duy nhất để kết luận scam; luôn có `unknown` khi thiếu bằng chứng.

### Image và QR

- [x] `CORE-009` Hỗ trợ screenshot multimodal.
- [x] `CORE-010` Decode QR deterministic từ ảnh cục bộ trên thiết bị trước khi gọi AI.
- [x] `CORE-011` Không tự điều hướng tới nội dung QR; chỉ hiển thị URL/text đã decode và yêu cầu xác nhận riêng.
- [ ] `CORE-012` OCR local/controlled fallback cho ảnh không đủ chất lượng.
- [ ] `CORE-013` Trả evidence regions/bounding boxes để UI highlight đúng vùng khả nghi.
- [ ] `CORE-014` Xóa EXIF và metadata ảnh trước upload.
- [ ] `CORE-015` Giới hạn loại file, kích thước, pixel count và xử lý ảnh lỗi/decompression bomb.

### Privacy và explainability

- [x] `CORE-016` Redact OTP/password/card cơ bản.
- [ ] `CORE-017` Redact email, phone, account number, national ID và địa chỉ theo policy có thể cấu hình.
- [ ] `CORE-018` Cho người dùng preview phần đã che trước khi upload/lưu case.
- [ ] `CORE-019` Mọi signal có `source`, `status`, `confidence`, `observedAt` và `explanation`.
- [ ] `CORE-020` Phân biệt `not_checked`, `not_listed`, `listed`, `inconclusive`; không biến “không thấy” thành “an toàn”.
- [ ] `CORE-021` Calibration test cho risk bands và false-positive budget.

### Acceptance criteria

- [ ] `CORE-A01` URL typosquat giải thích được khi offline trong ≤150 ms trên thiết bị mục tiêu.
- [ ] `CORE-A02` 100% fixture chứa OTP/card/password được che trước network boundary.
- [ ] `CORE-A03` App không mở, render hoặc fetch trực tiếp suspicious URL ở client.
- [ ] `CORE-A04` Bộ URL evaluation ≥100 case, trong đó ≥30% benign guards.
- [ ] `CORE-A05` QR malicious fixture được decode, giải thích và chặn auto-open.

## 8. Epic 2 — Cloud Run production API và Web Risk

**Mục tiêu:** một backend chung cho web, Android và Workspace.  
**Ưu tiên:** P0 · **Ước lượng:** 4–6 ngày · **Phụ thuộc:** Epic 0.  
**Cờ:** `BLOCKED` cho deployment nếu chưa bật Cloud Billing.

### Google Cloud setup

- [ ] `API-001` **BLOCKED/BILLING:** Chọn hoặc tạo Google Cloud project production riêng.
- [ ] `API-002` **BLOCKED/BILLING:** Link billing account và đặt budget alerts 50%/80%/100%.
- [ ] `API-003` Bật Cloud Run, Artifact Registry, Secret Manager, Cloud Logging và Web Risk API.
- [ ] `API-004` Tạo service account riêng cho runtime; không dùng Owner/Editor.
- [ ] `API-005` Gán IAM tối thiểu theo từng API/secret.
- [ ] `API-006` Lưu Gemini/API credentials trong Secret Manager; thiết lập rotation owner/date.
- [ ] `API-007` Tạo staging và production service/config riêng.

### API hardening

- [x] `API-008` Container-ready Express backend, Helmet và rate limit cơ bản.
- [ ] `API-009` Request ID, structured logs và redaction trong log.
- [ ] `API-010` CORS allowlist chính xác; Workspace/mobile dùng token, không dùng wildcard tùy tiện.
- [ ] `API-011` Giới hạn payload/timeouts/concurrency/max instances để chống abuse và kiểm soát chi phí.
- [ ] `API-012` Health/readiness endpoint không tiết lộ secret hoặc provider details.
- [ ] `API-013` Verify Firebase ID token và App Check token theo route policy.
- [ ] `API-014` Idempotency key cho case/report/calendar actions.
- [ ] `API-015` Chuẩn hóa lỗi: invalid input, unauthorized, quota, timeout, provider unavailable và inconclusive.
- [ ] `API-016` Circuit breaker/fallback: URL engine local vẫn trả kết quả khi Gemini/Web Risk lỗi.

### Web Risk

- [x] `API-017` Có adapter Web Risk phía server.
- [ ] `API-018` Xác nhận API live bằng một benign case và safe test fixtures.
- [ ] `API-019` Mapping trạng thái đúng: empty threat list = `not_listed`, không phải `safe`.
- [ ] `API-020` Cache hash/result theo TTL phù hợp; không log full sensitive URL nếu không cần.
- [ ] `API-021` Quota/error monitoring và graceful degradation.

### Acceptance criteria

- [ ] `API-A01` Public HTTPS endpoint pass benign, typosquat, screenshot và provider-error flows.
- [ ] `API-A02` Secret scan không tìm thấy credentials trong image/source/bundle/log.
- [ ] `API-A03` Request không hợp lệ và token giả bị từ chối trước khi gọi model tính phí.
- [ ] `API-A04` Có rollback revision và runbook xử lý quota/provider outage.
- [ ] `API-A05` Dashboard thể hiện request count, error rate, p95 latency và estimated cost.

## 9. Epic 3 — Firebase foundation

**Mục tiêu:** identity nhẹ, persistence có consent và bảo vệ backend.  
**Ưu tiên:** P0 · **Ước lượng:** 5–7 ngày · **Phụ thuộc:** API-013, FND-005.

### Project và environments

- [ ] `FB-001` Tạo Firebase project/app cho web, Android staging và Android production.
- [ ] `FB-002` Cấu hình Emulator Suite cho Auth, Firestore, Storage và Functions nếu dùng.
- [ ] `FB-003` Lưu public Firebase config theo environment; secret server vẫn ở Secret Manager.
- [ ] `FB-004` Chọn region gần người dùng và đồng bộ với Cloud Run khi có thể.

### Auth và user lifecycle

- [ ] `FB-005` Chỉ tạo anonymous user khi người dùng lưu case, gửi report hoặc bật alert.
- [ ] `FB-006` Core check vẫn dùng được không đăng nhập.
- [ ] `FB-007` Thiết kế upgrade/link account sau này mà không mất case.
- [ ] `FB-008` Có UI xóa dữ liệu/case; nếu thêm account chính thức thì thêm account deletion flow và web URL theo Play policy.

### Firestore và Storage

- [ ] `FB-009` Tạo collections tối thiểu: `users`, `cases`, `feedback`, `reports`, `campaigns`, `officialEntities`, `auditEvents`.
- [ ] `FB-010` Case mặc định chỉ lưu redacted structured data, không lưu ảnh/raw message.
- [ ] `FB-011` Raw evidence chỉ được lưu sau explicit consent, có purpose và expiry.
- [ ] `FB-012` Firestore Rules: user chỉ đọc/xóa case của chính họ; moderator claim kiểm soát riêng.
- [ ] `FB-013` Storage Rules khóa theo UID/case và MIME/size.
- [ ] `FB-014` Tạo indexes có chủ đích; tránh query/collection scan ngoài dự kiến.
- [ ] `FB-015` TTL/delete job cho raw artifacts và stale anonymous users.
- [ ] `FB-016` Audit event không chứa raw sensitive content.

### App Check

- [ ] `FB-017` Web App Check cho production origin.
- [ ] `FB-018` Android App Check với Play Integrity cho Play build.
- [ ] `FB-019` Debug provider chỉ hoạt động ở local/staging và không vào release config.
- [ ] `FB-020` Rollout monitor → enforce theo route, không khóa tester trước khi đo valid token rate.

### Acceptance criteria

- [ ] `FB-A01` Emulator rules tests chứng minh cross-user read/write bị chặn.
- [ ] `FB-A02` Invalid ID/App Check token không thể gọi endpoint tốn phí.
- [ ] `FB-A03` Người dùng xóa case và raw artifact biến mất theo SLA đã công bố.
- [ ] `FB-A04` Từ chối consent vẫn phân tích được và không tạo record nhạy cảm.

## 10. Epic 4 — Android mobile application

**Mục tiêu:** kiểm tra scam nhanh từ nơi người dùng nhận nội dung.  
**Ưu tiên:** `PARKED / P2 sau cuộc thi` · **Ước lượng còn lại:** 7–12 ngày + Play review · **Phụ thuộc:** Competition R1 đã đóng.

> Code mobile, tests và native prebuild hiện được bảo toàn. Không tiếp tục feature,
> EAS/Play hoặc device testing trước khi public web, demo và form cuối hoàn tất.

### Scaffold và platform

- [x] `MOB-001` Scaffold React Native + Expo SDK 57 prebuild/development build trong `apps/mobile`.
- [ ] `MOB-002` Cấu hình package ID cố định, app schemes, adaptive icon và API level 36.
- [x] `MOB-003` Tạo build profiles development, preview/internal và production.
- [ ] `MOB-004` Cấu hình deep link/universal/app link an toàn; không tự mở suspicious target.
- [ ] `MOB-005` Secure storage cho token; không lưu secret trong AsyncStorage/log.

### Information architecture

- [x] `MOB-006` Home — nhập/paste nội dung và vertical slice kiểm tra URL cục bộ.
- [x] `MOB-007` Share Intake — preview/edit text hoặc preview ảnh và xác nhận trước phân tích; chưa sign-off E2E trên máy thật.
- [ ] `MOB-008` **PARTIAL:** system Photo Picker và QR-from-image đã có; camera capture cố ý chưa xin quyền trong MVP.
- [ ] `MOB-009` Result — risk summary, evidence ladder, unknowns và next best action.
- [ ] `MOB-010` Trust Twin — official domain/contact/map comparison.
- [ ] `MOB-011` Rescue — checklist hành động theo thời gian, export và reminder.
- [ ] `MOB-012` Cases — chỉ xuất hiện khi người dùng chọn lưu; hỗ trợ delete.
- [ ] `MOB-013` Settings/Privacy — consent, retention, data deletion, notification và connected Google services.

### Native capabilities

- [x] `MOB-014` Đăng ký Android `ACTION_SEND` cho `text/plain`; manifest/prebuild pass, còn device E2E.
- [ ] `MOB-015` **PARTIAL:** nhận và preview content URI, clear share payload sau xử lý; chưa có managed temp-copy lifecycle cho mọi provider.
- [x] `MOB-016` Dùng system Photo Picker; không xin broad storage permission.
- [x] `MOB-017` Không xin SMS, call log, camera, microphone, overlay, accessibility service hoặc all-files access trong MVP.
- [ ] `MOB-018` Local notification cho rescue reminder trước khi xin Google Calendar OAuth.
- [ ] `MOB-019` Share/export redacted PDF/JSON qua Android Sharesheet.
- [ ] `MOB-020` Offline queue chỉ giữ redacted payload; cho phép hủy trước sync.

### UX, reliability và performance

- [ ] `MOB-021` Loading có step/progress có thật; không tạo cảm giác AI đã xác minh khi còn pending.
- [ ] `MOB-022` Network loss, timeout, retry và provider error có fallback rõ ràng.
- [ ] `MOB-023` Dynamic font, TalkBack label, contrast, 48dp targets và keyboard behavior.
- [ ] `MOB-024` Crash-safe restoration nhưng không lưu raw content ngoài policy.
- [ ] `MOB-025` Cold start, JS bundle, image memory và p95 analysis latency có budget.
- [ ] `MOB-026` Crash reporting/analytics chỉ bật sau consent phù hợp và scrub sensitive values.

### Acceptance criteria

- [ ] `MOB-A01` Share URL từ Chrome/Gmail vào ScamSignal trong tối đa hai thao tác sau Share.
- [ ] `MOB-A02` **PARTIAL:** code path bắt buộc preview/edit/confirm và không gọi network; cần xác nhận lại qua Share Sheet trên máy thật.
- [ ] `MOB-A03` Typosquat explanation chạy offline trên thiết bị Android thật.
- [ ] `MOB-A04` Deny camera/photo/notification không làm crash hoặc khóa core check.
- [x] `MOB-A05` Android manifest prebuild dùng `tools:remove` cho broad/high-risk permission ngoài scope đã duyệt.
- [ ] `MOB-A06` Bốn E2E scenarios pass trên ít nhất một máy low/mid-range và một API mới.

## 11. Epic 5 — Google Workspace và Google ecosystem

**Mục tiêu:** đưa ScamSignal vào đúng nơi người dùng làm việc, nhưng mỗi integration đều tùy chọn và có fallback.  
**Ưu tiên:** P1 · **Phụ thuộc chung:** protected API, OAuth consent screen, privacy policy.

### 11.1 OAuth foundation

- [ ] `GWS-OAUTH-001` Tạo OAuth consent screen với tên/brand/domain/support email khớp sản phẩm.
- [ ] `GWS-OAUTH-002` Đăng ký web, Android và Workspace clients riêng; redirect URI allowlist chính xác.
- [ ] `GWS-OAUTH-003` Xin scope theo thời điểm người dùng bấm tính năng, không xin toàn bộ lúc onboarding.
- [ ] `GWS-OAUTH-004` Lưu token server-side hoặc secure storage theo platform; refresh/revoke/error flow đầy đủ.
- [ ] `GWS-OAUTH-005` Token và authorization code không xuất hiện trong analytics/log.
- [ ] `GWS-OAUTH-006` Chuẩn bị scope justification, demo video và test account cho Google verification khi cần.

### 11.2 Google Drive / Docs — Rescue evidence package

**Ước lượng:** 3–4 ngày sau OAuth foundation.

- [ ] `GWS-DRV-001` Generate redacted report locally trước, gồm summary, timeline, evidence và actions.
- [ ] `GWS-DRV-002` Hỗ trợ JSON machine-readable và PDF human-readable.
- [ ] `GWS-DRV-003` Xin `drive.file` incremental scope chỉ khi người dùng chọn “Lưu vào Drive”.
- [ ] `GWS-DRV-004` Upload app-created file; lưu `fileId`, checksum và schema version.
- [ ] `GWS-DRV-005` Idempotency bảo đảm retry không tạo file trùng.
- [ ] `GWS-DRV-006` Cho người dùng mở/chia sẻ file sau khi tạo; không tự share public.
- [ ] `GWS-DRV-007` Revoke/expired/quota/offline có thông báo và local export fallback.
- [ ] `GWS-DRV-008` Không xin toàn bộ Drive hoặc đọc file không do app tạo.

**Acceptance:**

- [ ] `GWS-DRV-A01` Một lần consent tạo đúng một redacted file trong Drive.
- [ ] `GWS-DRV-A02` Deny OAuth vẫn tải/chia sẻ local PDF/JSON được.
- [ ] `GWS-DRV-A03` Report không chứa field đã bị privacy policy loại bỏ.

### 11.3 Google Calendar — recovery reminders

**Ước lượng:** 2–3 ngày sau OAuth foundation.

- [ ] `GWS-CAL-001` Local notification/reminder là lựa chọn mặc định.
- [ ] `GWS-CAL-002` Chỉ xin Calendar scope khi người dùng chọn đồng bộ Google Calendar.
- [ ] `GWS-CAL-003` Tạo event có title trung tính, checklist hành động và link an toàn tới case/app.
- [ ] `GWS-CAL-004` Không đưa raw scam content/OTP/account number vào event.
- [ ] `GWS-CAL-005` Dùng stable event ID/idempotency key để retry không duplicate.
- [ ] `GWS-CAL-006` Update/delete event khi người dùng đổi/hủy rescue plan.
- [ ] `GWS-CAL-007` Xử lý timezone, all-day vs timed event và revoked access.

**Acceptance:**

- [ ] `GWS-CAL-A01` Retry ba lần vẫn chỉ có một event.
- [ ] `GWS-CAL-A02` Calendar bị từ chối/revoke không làm mất local reminder.

### 11.4 Gmail Workspace add-on — Check without copy/paste

**Ước lượng:** 6–9 ngày; có thể cần review/verification lâu hơn thời gian code.

- [ ] `GWS-GMAIL-001` Tạo `apps/workspace-addon` với manifest và HTTP runtime trên Cloud Run.
- [ ] `GWS-GMAIL-002` Contextual trigger chỉ hoạt động khi người dùng mở message và gọi add-on.
- [ ] `GWS-GMAIL-003` Dùng current-message/least-privilege scope; không xin whole-mailbox access.
- [ ] `GWS-GMAIL-004` Card UI hiển thị summary, suspicious entities, unknowns và “Open in ScamSignal”.
- [ ] `GWS-GMAIL-005` Adapter chuyển Gmail event/token thành redacted `AnalysisRequest`.
- [ ] `GWS-GMAIL-006` Add-on không sửa, xóa, chuyển tiếp hoặc đánh dấu email.
- [ ] `GWS-GMAIL-007` Không tải remote image/tracking pixel ngoài nhu cầu.
- [ ] `GWS-GMAIL-008` State/token ngắn hạn có TTL và không bị ghi log.
- [ ] `GWS-GMAIL-009` Test unpublished deployment với test users/domain trước listing.
- [ ] `GWS-GMAIL-010` Chuẩn bị OAuth verification/Workspace Marketplace assets nếu phát hành public.

**Acceptance:**

- [ ] `GWS-GMAIL-A01` Người dùng kiểm tra message đang mở mà không copy/paste.
- [ ] `GWS-GMAIL-A02` Permission review xác nhận không có whole-mailbox hoặc write scope.
- [ ] `GWS-GMAIL-A03` Email benign/typosquat/uncertain đều thể hiện đúng evidence state.

### 11.5 Google Places / Maps — independent official-channel resolver

**Ước lượng:** 3–5 ngày; `BLOCKED/BILLING` nếu Places API chưa bật billing.

- [ ] `GWS-MAPS-001` Xây curated official entity registry trước; Places chỉ là nguồn bổ sung.
- [ ] `GWS-MAPS-002` Bật Places API với quota và budget guardrail.
- [ ] `GWS-MAPS-003` Query server-side, dùng field mask tối thiểu và cache theo policy.
- [ ] `GWS-MAPS-004` Resolve official website, phone, address, map link và provenance.
- [ ] `GWS-MAPS-005` So sánh channel trong scam content với official registry/Places bằng rule giải thích được.
- [ ] `GWS-MAPS-006` Hiển thị attribution đúng và không tuyên bố Places đã chứng minh scam.
- [ ] `GWS-MAPS-007` Conflict/không tìm thấy trả `unknown`, không tự chọn kết quả gần giống.

**Acceptance:**

- [ ] `GWS-MAPS-A01` Domain fake lệch một ký tự được so với official domain có nguồn.
- [ ] `GWS-MAPS-A02` Places unavailable vẫn dùng curated registry/fallback được.

### 11.6 Google Sheets — moderation operations only

**Ước lượng:** 2–4 ngày.

- [ ] `GWS-SHEET-001` Tạo private moderation Sheet trong Workspace account của đội.
- [ ] `GWS-SHEET-002` Backend/service identity append redacted structured rows; client không giữ Sheets credential.
- [ ] `GWS-SHEET-003` Columns: report ID, entity hashes, signal types, risk band, consent, review status, timestamps và reviewer note.
- [ ] `GWS-SHEET-004` Không export raw screenshot/message/OTP/account/phone nếu chưa có policy đặc biệt.
- [ ] `GWS-SHEET-005` Firestore là source of truth; Sheet là operational view, không phải database chính.
- [ ] `GWS-SHEET-006` Idempotent export và reconciliation job cho row lỗi/thiếu.
- [ ] `GWS-SHEET-007` Access audit, protected ranges và retention/archive workflow.

**Acceptance:**

- [ ] `GWS-SHEET-A01` Moderator chỉ thấy dữ liệu cần review và không thấy raw secret.
- [ ] `GWS-SHEET-A02` Sửa/xóa row trong Sheet không phá Firestore source of truth.

### 11.7 Firebase Cloud Messaging — moderated campaign alerts

- [ ] `GWS-FCM-001` Notification opt-in riêng, giải thích loại cảnh báo và tần suất.
- [ ] `GWS-FCM-002` Topic/segment không được suy ra dữ liệu nhạy cảm ngoài consent.
- [ ] `GWS-FCM-003` Chỉ gửi campaign đã qua human moderation; không alert từ một report đơn lẻ.
- [ ] `GWS-FCM-004` Deep link về app case/campaign an toàn, không về suspicious URL.
- [ ] `GWS-FCM-005` Unsubscribe, token cleanup, rate/frequency cap và delivery metrics.

## 12. Epic 6 — Data model, privacy và security

**Ưu tiên:** P0 trước public beta · **Ước lượng:** 4–6 ngày xuyên suốt.

### Data classification và retention

- [ ] `SEC-001` Phân loại: public, operational, personal, sensitive evidence và secret.
- [ ] `SEC-002` Lập data-flow diagram cho web, Android, Cloud Run, Gemini, Firebase và Workspace.
- [ ] `SEC-003` Mỗi field có purpose, lawful/consent basis, storage location, retention và deletion owner.
- [ ] `SEC-004` Mặc định không lưu raw message/image; retention ngắn nhất có thể cho processing temp files.
- [ ] `SEC-005` Document vendor/subprocessor data path và region limitation.

### Threat model

- [ ] `SEC-006` Threat model cho malicious URL, image bomb, prompt injection trong screenshot/email và poisoned report.
- [ ] `SEC-007` Chống SSRF: backend không fetch arbitrary URL từ user input.
- [ ] `SEC-008` Prompt injection content luôn là untrusted data, không thể thay system/tool policy.
- [ ] `SEC-009` Abuse controls cho bot/quota exhaustion/report brigading.
- [ ] `SEC-010` Moderator roles dùng custom claims và audit trail.
- [ ] `SEC-011` Secret/IAM review và rotation định kỳ.
- [ ] `SEC-012` Dependency/container scan và patch policy.

### User rights và transparency

- [ ] `SEC-013` Privacy Policy tiếng Việt/Anh mô tả chính xác dữ liệu, AI và Google integrations.
- [ ] `SEC-014` Consent copy riêng cho analysis, save, community report, analytics và notification.
- [ ] `SEC-015` Download/delete case flow và account deletion nếu có account.
- [ ] `SEC-016` AI disclosure: kết quả hỗ trợ quyết định, không thay thế ngân hàng/cơ quan chức năng.
- [ ] `SEC-017` Appeal/correction flow cho official entity hoặc campaign bị gắn nhầm.

### Acceptance criteria

- [ ] `SEC-A01` Không có raw sensitive value trong application log, crash report, analytics hoặc Sheet.
- [ ] `SEC-A02` Data deletion test xác nhận Firestore, Storage và derived exports được xử lý theo policy.
- [ ] `SEC-A03` Security checklist được review trước mỗi external beta.

## 13. Epic 7 — Feedback, moderation và campaign intelligence

**Mục tiêu:** học từ cộng đồng mà không biến app thành nơi tố cáo công khai.  
**Ưu tiên:** P1/P2 · **Ước lượng:** 5–10 ngày.

- [x] `OPS-001` Helpful/unclear control tồn tại ở UI theo phiên.
- [ ] `OPS-002` Lưu feedback ẩn danh/redacted vào Firestore sau consent.
- [ ] `OPS-003` Case report states: `submitted → triaged → corroborating → verified/rejected → notified/closed`.
- [ ] `OPS-004` Moderator bắt buộc ghi reason/provenance khi đổi status.
- [ ] `OPS-005` Deduplicate bằng normalized entity hashes và thời gian, không chỉ dựa vào AI similarity.
- [ ] `OPS-006` Campaign chỉ hình thành khi đạt threshold đa nguồn và qua human review.
- [ ] `OPS-007` Không hiển thị công khai danh tính người bị tố cáo từ unverified reports.
- [ ] `OPS-008` Sheets view phục vụ triage; Firestore giữ canonical state/audit.
- [ ] `OPS-009` FCM chỉ phát cảnh báo campaign đã verified/moderated.
- [ ] `OPS-010` `P2`: BigQuery/embedding clustering khi đủ dữ liệu thật và privacy review.
- [ ] `OPS-011` Metrics: helpful rate, unclear rate, false-positive corrections, rescue completion và review SLA.

### Acceptance criteria

- [ ] `OPS-A01` Một user/report không thể tự tạo public campaign alert.
- [ ] `OPS-A02` Mọi moderation decision truy ngược được actor, time, reason và evidence version.
- [ ] `OPS-A03` Có correction/retraction flow khi evidence thay đổi.

## 14. Epic 8 — Quality engineering và evaluation

**Ưu tiên:** P0 cho mọi release; chạy song song với implementation.

### Automated tests

- [x] `QA-001` 56 unit/evaluation tests baseline.
- [x] `QA-002` 50-case URL evaluation baseline.
- [x] `QA-003` Core unit tests trên shared package cho web và mobile.
- [x] `QA-004` Contract tests cho `/v1/analyses` success/error/version compatibility.
- [ ] `QA-005` Firestore/Storage Rules tests trong Emulator Suite.
- [ ] `QA-006` Cloud Run integration tests với Gemini/Web Risk adapters mock và live smoke riêng.
- [ ] `QA-007` Web Playwright E2E cho four-case demo, keyboard, mobile viewport và error state.
- [ ] `QA-008` Android E2E cho paste, Share Sheet, Photo Picker/QR, offline và rescue.
- [ ] `QA-009` Workspace add-on tests cho current message token, expired token, benign và suspicious message.
- [ ] `QA-010` Drive/Calendar idempotency và OAuth denial/revocation tests.

### Evaluation và non-functional gates

- [ ] `QA-011` Dataset ≥100 URL cases, cân bằng scam/benign và edge cases tiếng Việt.
- [ ] `QA-012` Screenshot/QR evaluation set có quyền sử dụng và đã loại thông tin cá nhân.
- [ ] `QA-013` Theo dõi precision/recall theo signal, false-positive rate và inconclusive rate; không chỉ đo accuracy tổng.
- [ ] `QA-014` Latency budgets cho local engine, API p50/p95 và end-to-end mobile.
- [ ] `QA-015` Accessibility audit Web WCAG 2.2 AA và Android TalkBack/dynamic font.
- [ ] `QA-016` Device matrix: low/mid-range, API tối thiểu, API 36 và network chậm/offline.
- [ ] `QA-017` Load/abuse test ở mức quota an toàn; xác nhận max instances/cost cap.
- [ ] `QA-018` Release candidate có zero blocker crash/ANR và không có P0/P1 privacy bug.

## 15. Epic 9 — Google Play release

**Mục tiêu:** phát hành Android hợp lệ, có thể rollback và đúng privacy.  
**Ưu tiên:** `PARKED / POST-COMPETITION` · **Thời gian:** code 3–5 ngày + testing/review tối thiểu 14–21 ngày nếu account thuộc diện closed-test.

Google Play không thuộc đường găng nộp AI Riser hiện tại. Không dùng APK/AAB
ngoài Play làm bằng chứng deployment và không để Epic này trì hoãn web release.

### Account, signing và build

- [ ] `PLAY-001` Hoàn tất Play Console developer identity/contact và payment profile.
- [ ] `PLAY-002` Chốt package ID vĩnh viễn trước upload đầu tiên.
- [ ] `PLAY-003` Bật Play App Signing; backup upload key và recovery owner.
- [ ] `PLAY-004` Build signed Android App Bundle (`.aab`) production, target API 36.
- [ ] `PLAY-005` Version code/name policy và release notes tiếng Việt/Anh.
- [ ] `PLAY-006` Không ship debug endpoints, debug App Check token hoặc verbose sensitive logs.

### Store listing và policy

- [ ] `PLAY-007` App name, short/full description không phóng đại khả năng “xác minh tuyệt đối”.
- [ ] `PLAY-008` App icon, feature graphic, phone screenshots và demo video đồng bộ UI production.
- [ ] `PLAY-009` Privacy Policy public URL và support email hoạt động.
- [ ] `PLAY-010` Data safety khai đúng data collected/shared, purpose, encryption và deletion.
- [ ] `PLAY-011` Content rating, ads declaration, target audience và app access instructions.
- [ ] `PLAY-012` Account/data deletion URL nếu app cho tạo account.
- [ ] `PLAY-013` Permission declarations khớp Android manifest và core functionality.

### Testing tracks

- [ ] `PLAY-014` Internal testing: install/update/rollback và Play Integrity/App Check smoke.
- [ ] `PLAY-015` Recruit tester có device/network profile khác nhau và gửi scenario checklist.
- [ ] `PLAY-016` Nếu personal account mới thuộc diện áp dụng: ≥12 tester opt-in liên tục ≥14 ngày trước khi xin production access.
- [ ] `PLAY-017` Thu feedback/crash/ANR, triage và đóng blocker trước production application.
- [ ] `PLAY-018` Staged rollout production, monitoring và halt/rollback criteria.

### Acceptance criteria

- [ ] `PLAY-A01` Store listing, Data safety, privacy policy và network behavior nhất quán.
- [ ] `PLAY-A02` Internal/closed build gọi đúng production/staging backend và App Check pass.
- [ ] `PLAY-A03` 4 end-to-end cases pass từ Play-delivered build, không phải local APK.

## 16. Epic 10 — Competition, demo và public communication

**Mục tiêu:** chứng minh giá trị thật, không chỉ trình bày nhiều tính năng.  
**Ưu tiên:** P0 cho bản thi.

- [ ] `DEMO-001` Có public web URL ổn định và kiểm tra từ incognito/mobile network.
- [ ] `DEMO-002` Quay lại video trên đúng build public với kịch bản: benign → typosquat → screenshot/QR → uncertain → Rescue.
- [ ] `DEMO-003` Hiển thị local deterministic checks, Gemini enrichment và unknown state rõ ràng.
- [ ] `DEMO-004` Nếu integration chưa live, ghi “prototype/roadmap”, không trình bày như đã vận hành.
- [ ] `DEMO-005` Cập nhật form cuộc thi với public URL, demo, integration thực tế và test evidence.
- [ ] `DEMO-006` Cập nhật Facebook/YouTube bằng thông tin và visual đồng bộ production.
- [ ] `DEMO-007` Chuẩn bị số liệu xác thực: test count, case count, latency, tester feedback; không dùng số ước đoán như kết quả thật.
- [ ] `DEMO-008` Backup demo video/screenshots/JSON fixtures khi mạng hoặc model provider lỗi.
- [ ] `DEMO-009` Final submission audit trước hạn: link permissions, email copy, form response và timestamp.

## 17. API endpoint checklist đề xuất

| Endpoint | Client | Auth/App Check | Dữ liệu lưu mặc định | Idempotency |
| --- | --- | --- | --- | --- |
| `POST /v1/analyses` | Web, Android, Gmail | App Check; auth tùy save | không lưu raw request | request ID |
| `POST /v1/cases` | Web, Android | ID token + App Check | redacted case | bắt buộc |
| `GET /v1/cases/:id` | Web, Android | owner/moderator | không | không |
| `DELETE /v1/cases/:id` | Web, Android | owner/moderator | audit tối thiểu | bắt buộc |
| `POST /v1/cases/:id/reports` | Web, Android | ID token + consent | redacted report | bắt buộc |
| `POST /v1/cases/:id/drive-export` | Web, Android | ID token + Google OAuth | file ID/checksum | bắt buộc |
| `POST /v1/cases/:id/calendar-event` | Web, Android | ID token + Google OAuth | event ID | bắt buộc |
| `POST /v1/workspace/gmail/analyze` | Gmail add-on | Workspace event token | không lưu raw | request ID |
| `GET /v1/entities/resolve` | Web, Android | App Check | cache official data | query hash |
| `POST /v1/feedback` | Web, Android | App Check; consent | redacted feedback | session/case key |

Checklist chung cho từng endpoint:

- [ ] `CONTRACT-001` Runtime validation và schema version.
- [ ] `CONTRACT-002` Max body/MIME/timeout/rate policy.
- [ ] `CONTRACT-003` Authentication/authorization trước provider call.
- [ ] `CONTRACT-004` Log redaction và request correlation.
- [ ] `CONTRACT-005` Typed errors, retry policy và abuse test.
- [ ] `CONTRACT-006` API documentation + success/error examples.

## 18. OAuth scope matrix và fallback

| Tính năng | Scope/quyền dự kiến | Thời điểm xin | Fallback khi từ chối |
| --- | --- | --- | --- |
| Core analysis | Không cần Google OAuth | không xin | local engine + protected API |
| Save Drive report | `drive.file` | khi bấm “Lưu vào Drive” | local PDF/JSON share |
| Calendar reminder | event/calendar scope tối thiểu phù hợp implementation | khi bật sync Calendar | local notification/ICS |
| Gmail add-on | current-message contextual access | khi add-on được gọi | copy/share vào web/mobile |
| Places lookup | server credential, không phải end-user OAuth | khi resolver chạy | curated official registry |
| Sheets moderation | backend/service identity | server export | Firestore console/admin UI |
| Push alerts | Android notification permission + FCM token | sau giải thích/opt-in | in-app campaign feed |

Trước khi đóng scope:

- [ ] `SCOPE-001` Kiểm tra scope chính xác theo API implementation hiện tại.
- [ ] `SCOPE-002` Loại mọi scope không được dùng trong code.
- [ ] `SCOPE-003` Consent copy giải thích lợi ích và dữ liệu được truy cập.
- [ ] `SCOPE-004` Deny/revoke được test như first-class flow.

## 19. Environment, secrets và external blockers

| Hạng mục | Local | Staging | Production | Owner/ghi chú |
| --- | --- | --- | --- | --- |
| Gemini credential | `.env`, không commit | Secret Manager | Secret Manager | rotate định kỳ |
| Web Risk | mock/optional live | quota thấp | quota + alert | cần billing/API |
| Firebase | Emulator | staging project | production project | rules trước data |
| App Check | debug provider | monitor | Play Integrity enforce | không ship debug token |
| OAuth | test clients/users | test consent | verified brand/client | có thể cần Google review |
| Drive/Calendar | mock/test account | test users | incremental OAuth | fallback local |
| Gmail add-on | unpublished | test deployment | Marketplace/domain install | có thể cần verification |
| Places | fixture | quota thấp | quota/cache/budget | cần billing |
| Sheets | local adapter | private test sheet | private ops sheet | không phải database |
| Play | local dev build | internal/closed | staged production | account/policy/review |

External blockers cần người sở hữu giải quyết:

- [ ] `EXT-001` Google Cloud Billing được bật và budget alerts được cấu hình.
- [ ] `EXT-002` Production domain, privacy policy URL và support email sẵn sàng.
- [ ] `EXT-003` OAuth brand/consent/test users và verification artifacts.
- [ ] `EXT-004` Play Console account/identity/signing owner.
- [ ] `EXT-005` Danh sách tester cho closed testing nếu account thuộc diện áp dụng.
- [ ] `EXT-006` Moderator Workspace account và private Sheet ownership.

## 20. Kế hoạch sprint theo phạm vi mới

### Sprint C0 — Competition scope freeze và parity audit (1–2 ngày)

- [x] Chốt danh sách feature xuất hiện trong bản thi; mọi feature mới ngoài danh
  sách chuyển backlog sau hạn nộp.
- [x] So sánh local web, AI Studio project và video hiện tại theo từng màn hình,
  copy, demo case và claim.
- [x] Chỉnh tên/description AI Studio và xác nhận General Access là public.
- [x] Chạy regression suite 75 tests và web/server/mobile builds.

Audit record: [COMPETITION_PARITY_CHECKLIST.md](./COMPETITION_PARITY_CHECKLIST.md).
Hai gap P0 còn mở là migration Gemini canonical sang server-side/độ ổn định
provider và video dùng layout cũ. Source local đã đạt server-only; canonical chỉ
được cập nhật khi AI Studio Chat tạo được đúng full-stack runtime.

**Exit:** có một release candidate web duy nhất và danh sách parity gap bằng 0.

### Sprint C1 — Public web deployment (1–3 ngày)

- [ ] Thử AI Studio Publish/Starter Tier trước; chỉ dùng Cloud Billing khi thật sự
  cần và đã có budget guardrail.
- [ ] Nhận một public deployment URL; không nhập nhiều link vào trường deployment.
- [ ] Test signed-out/incognito, desktop, mobile viewport và independent network.
- [ ] Chạy benign, typosquat, screenshot và uncertain trên đúng public build.
- [ ] Ghi evidence: 75 tests, 50 URL cases, ảnh smoke test và kết quả public link.

**Exit:** giám khảo mở và dùng được public web không cần quyền project hoặc secret.

### Sprint C2 — Demo, social và form final (1–2 ngày)

- [ ] Chỉ quay lại video nếu release candidate khác đáng kể video hiện tại.
- [ ] Chọn LinkedIn hoặc Facebook có tương tác thật tốt hơn; bảo đảm public và đủ hashtag.
- [ ] Cập nhật form: current features, creativity, feasibility, scale, Google tech
  thực sự live, public deployment và số liệu có bằng chứng.
- [ ] Giữ mobile ở mô tả “working prototype/future companion”; không claim Play release.
- [ ] Mở tất cả link từ signed-out browser, lưu email copy và timestamp lần cập nhật cuối.

**Exit:** AI Studio, public web, video, social và form là một câu chuyện thống nhất.

### Sprint P1 — Protected cloud và impact sau khi chốt bản thi (5–7 ngày)

- [ ] Firebase Auth/Firestore Rules/App Check monitor mode.
- [ ] Gemini/Web Risk live enrichment với consent, quota và budget.
- [ ] Thu phản hồi thật; không dùng số liệu ước đoán.

### Sprint P2 — Mobile/Workspace/Play sau cuộc thi

- [ ] Mở lại device E2E cho mobile vertical slice hiện có.
- [ ] Drive/Calendar/Gmail/Sheets theo least privilege và fallback local.
- [ ] Google Play signing, policy, internal/closed testing và production rollout.

## 21. Risk register

| Rủi ro | Xác suất/ảnh hưởng | Phương án giảm thiểu | Trigger dừng release |
| --- | --- | --- | --- |
| Cloud Billing/credit chưa sẵn sàng | Cao/Cao | thử AI Studio Publish Starter Tier trước; chỉ bật billing kèm budget | không claim API/deployment live |
| OAuth/Workspace verification kéo dài | Trung/Cao | incremental scopes, unpublished beta, chuẩn bị video sớm | không public add-on |
| Google Play làm trễ bản thi | Cao/Thấp sau quyết định scope | park toàn bộ Play đến sau web/form final | bất kỳ Play task nào chen vào Sprint C0–C2 |
| AI Studio, video và public web lệch nhau | Trung/Cao | parity audit và freeze một release candidate | claim/video không tái hiện được trên public build |
| Public deployment không mở cho BGK | Trung/Rất cao | signed-out + independent network smoke | cần login, secret hoặc setup thủ công |
| False positive làm mất uy tín | Trung/Cao | evidence states, benign guards, human review, correction | vượt FP budget |
| Lộ dữ liệu scam nhạy cảm | Trung/Rất cao | local redaction, consent, TTL, log scrub, rules tests | bất kỳ P0 privacy bug |
| Model/provider outage | Trung/Trung | offline deterministic engine, typed inconclusive fallback | core flow crash/block |
| API abuse/chi phí tăng | Trung/Cao | App Check, auth, rate, max instances, quotas, budget alert | budget/error spike |
| Share Intent/Expo plugin không ổn định | Trung/Trung | prebuild/dev client, native spike ngay Sprint 1 | không chạy máy thật |
| Official entity data cũ/sai | Trung/Cao | provenance, reviewedAt, correction workflow, Places là bổ sung | không có nguồn/ngày kiểm tra |

## 22. Mười task tiếp theo theo thứ tự

Không bắt đầu task sau nếu task trước còn blocker trực tiếp:

- [x] `NEXT-01` Audit AI Studio canonical project: name, description, public share,
  preview và code hiện tại.
- [x] `NEXT-02` Lập parity checklist local web ↔ AI Studio ↔ YouTube hiện tại;
  freeze competition feature scope.
- [ ] `NEXT-03` Chuyển canonical AI Studio sang server-side Gemini, đồng bộ các
  parity gap cần thiết và chạy lại four-case smoke. *Tạm chờ AI Studio Chat:
  ngày 09/08/2026 cả Gemini 3.6 Flash và 3.5 Flash đều trả internal error; không
  import client-only v3/v4 để né blocker. Owner đã gắn `GEMINI_API_KEY`; direct
  Preview xác nhận key server-side nhưng NovaBank dừng ở `Backend API is
  unavailable`, vì server route chưa tồn tại. Các retry sau đó không tạo source
  edit (một response báo success nhưng Action history chỉ có read operations),
  còn fresh chat tiếp tục internal error.*
- [ ] `NEXT-04` Publish web bằng AI Studio Starter Tier hoặc Cloud Run; lấy đúng một public URL.
- [ ] `NEXT-05` Test AI Studio/project URL và deployment URL từ signed-out browser,
  mobile viewport và independent network.
- [ ] `NEXT-06` Chạy 75 tests, build và bốn demo cases trên release candidate;
  lưu bằng chứng thật.
- [ ] `NEXT-07` Quyết định giữ hay quay lại YouTube video dựa trên parity, không dựa
  vào mong muốn thêm feature.
- [ ] `NEXT-08` Chọn một social post public có tương tác thật tốt hơn và audit hashtag.
- [ ] `NEXT-09` Cập nhật form lần cuối: solution, creativity, future scale,
  Google integrations live, deployment URL và evidence.
- [ ] `NEXT-10` Final signed-out link audit + email copy; sau đó mới mở lại mobile,
  Firebase, Workspace hoặc Google Play.

## 23. Final release checklist

### Competition R1 gate — bắt buộc trước lần cập nhật form cuối

- [ ] Một AI Studio Project Link public, đúng project ScamSignal AI và mở được khi signed out.
- [ ] Một public web deployment URL hoạt động; nếu chưa có thì giữ form ở trạng thái chưa deploy.
- [ ] Benign, typosquat, screenshot và uncertain chạy được trên release candidate.
- [ ] Video, một social post và form dùng cùng tên, UI, feature set và claim.
- [ ] Chỉ liệt kê Google integrations đang live; mobile ghi rõ prototype/roadmap.
- [ ] 75 tests và 50-case URL evaluation vẫn pass; không có số liệu tương tác bịa/ước đoán.
- [ ] Lưu email copy form cuối và timestamp trước 23:59 ngày 30/08/2026.

### Product

- [ ] Core flows Check, Verify, Rescue hoạt động trên web và Android.
- [ ] UI không có placeholder được trình bày như tính năng live.
- [ ] Unknown/inconclusive states có UX và next action rõ ràng.

### Engineering

- [ ] CI green: lint, typecheck, unit, contract, integration, E2E và build.
- [ ] Production secrets, IAM, quotas, budget, logs và rollback đã kiểm tra.
- [ ] Web/mobile/Workspace cùng API/schema version được hỗ trợ.

### Privacy/security

- [ ] Consent, redaction, retention, delete và revoke flows pass.
- [ ] Security scan/rules tests không có blocker.
- [ ] Privacy Policy/Data safety khớp code và SDK thực tế.

### Google ecosystem

- [ ] Drive/Calendar least privilege và local fallback pass.
- [ ] Gmail chỉ current-message, read-only theo chức năng.
- [ ] Places có provenance/attribution; Sheets chỉ redacted operations data.
- [ ] FCM chỉ gửi campaign đã moderation và có opt-out.

### Release và communication

- [ ] Play-delivered build pass four-case E2E.
- [ ] Store assets/demo/social/form dùng cùng UI và claim có bằng chứng.
- [ ] Monitoring, on-call owner, rollback và incident runbook sẵn sàng.

## 24. Những phần cố ý chưa làm trong P0/P1

- Dashboard tài khoản lớn và social profile.
- Tự động truy cập hoặc render suspicious websites.
- Đọc toàn bộ Gmail mailbox, SMS, call log hoặc Accessibility Service.
- Công khai danh tính người/công ty là scam chỉ dựa trên một report hoặc model output.
- Hard-code risk score để demo trông đẹp hơn.
- BigQuery/ML campaign clustering trước khi có dataset thật, consent và moderation pipeline.
- iOS app trước khi Android vertical slice, shared contracts và production API ổn định.
