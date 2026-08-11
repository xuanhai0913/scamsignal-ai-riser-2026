# Đồng bộ ScamSignal AI với Google AI Studio

> Cập nhật 10/08/2026: phần hướng dẫn client-only bên dưới được giữ làm lịch sử.
> Release candidate hiện tại là app full-stack
> <https://ai.studio/apps/34bd7287-de9b-4aee-9295-6f95d492706f?fullscreenApplet=true>.
> Docker runtime web-only đã được sync, nhưng cả RC và app lịch sử sau khi nhận
> full-stack source đều không tạo được một Share deployment mới dùng được từ tài
> khoản độc lập. Owner Preview vẫn hoạt động; form chưa được đổi sang app lịch sử.

Mục tiêu hiện tại là giữ GitHub revision đã audit làm source of truth và dùng app
AI Studio mới làm release candidate. Browser chỉ gửi request đã redact đến API
cùng origin; Gemini chỉ chạy ở server-side.

Release candidate: https://ai.studio/apps/34bd7287-de9b-4aee-9295-6f95d492706f?fullscreenApplet=true

Previous full-stack RC: https://aistudio.google.com/apps/07263ea4-9904-4d14-8f73-7fa277f053f9

App lịch sử/backup: https://ai.studio/apps/9b8fb469-b983-476c-888b-df9628734400

## Trạng thái release candidate hiện tại

> **Blocker 10/08:** owner Preview hoạt động, nhưng tài khoản Google thứ hai mở
> app hiện tại thì iframe trả `Error: Page not found`. App lịch sử `9b8…` vẫn mở
> được từ đúng tài khoản đó. Vì vậy permission Public là đúng, còn shared runtime
> của RC hiện tại chưa deploy thành công và chưa thể coi là judge-ready.

### Audit Share bổ sung tối 10/08

- Đã nhập exact revision `2746a5a` vào app lịch sử `9b8…`; checkpoint 110 file
  lưu thành công, Preview chạy thật và NovaBank trả rủi ro cao 95% với Trust Twin,
  OTP, áp lực thời gian và hành động an toàn.
- Shared `ais-pre-r4…` mở trực tiếp được frontend mới, nhưng AI Studio wrapper
  vẫn phủ `Failed to load app`; API same-origin trên endpoint này không được deploy
  và trả SPA fallback, nên không thể dùng direct endpoint làm link dự phòng.
- Production header đã được harden để cho phép duy nhất `aistudio.google.com`
  nhúng app mà không bật `X-Frame-Options: SAMEORIGIN`. Test local xác nhận CSP
  `frame-ancestors 'self' https://aistudio.google.com`, `/health` 200.
- Shim do AI Studio chèn tải `html2canvas-pro` như classic script và phát sinh
  `Unexpected token 'export'`. Client guard chỉ bỏ qua đúng lỗi thư viện screenshot
  do host chèn, không che lỗi ứng dụng; 119/119 test, lint và build đều đạt.
- Đã thử managed runtime không có root Dockerfile và manifest chỉ giữ workspace
  `packages/*`; dependency giảm từ khoảng 724 MB xuống 181 MB, `npm ci` và build
  client/server mô phỏng đều đạt. AI Studio vẫn báo `There was an issue while
  sharing your applet`, kể cả sau khi chuyển Restricted → Public để buộc redeploy.
- Kết luận hiện tại: blocker nằm ở managed Share/deployment của AI Studio, không
  còn bằng chứng cho thấy client build, server start, iframe policy hay dependency
  size là nguyên nhân. Không thay form/social sang app `9b8…` cho đến khi smoke từ
  tài khoản thứ hai không còn overlay lỗi.

- Lint/typecheck web, server, mobile, 118/118 test, client/server build và quét
  client secret đều đạt ở revision `86cfaef`.
- AI Studio giữ đầy đủ `server/`, `packages/`, `src/`; client không chứa Gemini
  SDK hay API key, server mới đọc `GEMINI_API_KEY`.
- General access là Public, mặc định fullscreen, Gemini chat history không được
  chia sẻ.
- Exact P0 owner Preview hiển thị `Kênh phân tích sẵn sàng` khi
  ingress probe thành công. NovaBank text case
  trả `Rủi ro cao`, confidence 95%, nhận đúng `novabarnk.vn`, OTP, áp lực thời
  gian, Trust Twin và hành động an toàn; không có điểm hoặc kết quả hard-code.
- Lượt owner-preview mobile ngày 10/08 trả confidence 98% cho cùng fixture, xác nhận
  score vẫn động. Landing, result và Rescue tại 390 px đều có `scrollWidth`
  bằng `clientWidth` 375 px, không tràn ngang và có bottom navigation phù hợp.
- Rescue trên exact P0 owner Preview đã đổi checklist thật, lưu timestamp xác nhận
  và số tiền 18.500.000 VND, rồi tạo preview hồ sơ có ID. Drive/Calendar dùng
  đúng logo/nhãn và hiển thị `Chưa kết nối`; không còn switch mô phỏng.
- Case Rescue `1/4`, timestamp và số tiền 18.500.000 VND còn nguyên qua ngày mới
  và tab mới, xác nhận IndexedDB persistence trong owner Preview.
- Public image flow hiển thị đúng giới hạn định dạng/kích thước, cảnh báo ảnh
  được re-encode và checkbox consent bị khóa trước khi có preview. Ngày 10/08,
  native picker đã upload fixture hư cấu 1200×800 trong exact owner Preview; app làm
  sạch từ 90 KB xuống 78 KB, yêu cầu consent rồi trả `Rủi ro cao · AI 98%`, nhận
  đúng `novabarnk.vn`, OTP, áp lực thời gian và số tiền.
- Publish bằng Cloud Run của tài khoản hiện tại yêu cầu chọn Cloud Project và
  xác nhận billing; chưa thực hiện. Share URL chỉ được dùng cho bài thi sau khi
  smoke bằng tài khoản thứ hai không còn 404.
- App source baseline `86cfaef` đã được sync lên AI Studio; Docker hotfix đang
  chờ upload thủ công. Video release
  candidate 69 giây đã public tại <https://youtu.be/smURKqcLXMw>; form mới nhất
  đã chứa đúng app, video và Facebook Reel. Account độc lập đã audit và phát hiện
  blocker shared-runtime nêu trên; chưa edit lại form vì URL chưa thay đổi.

## Hotfix shared runtime ngày 10/08

- Mô phỏng đúng các bước Docker cho thấy `npm prune --omit=dev` ở build stage
  duyệt toàn bộ workspaces, kéo thêm hơn 500 package Expo/React Native và làm
  `node_modules` tăng lên khoảng 674 MB dù runtime chỉ phục vụ web.
- Dockerfile mới tách stage `production-dependencies` và chạy `npm ci --omit=dev`
  chỉ cho workspace root, `@scamsignal/core` và `@scamsignal/api-client`.
  Dependency runtime còn khoảng 149 MB.
- Runtime mô phỏng đã start production thành công và trả 200 cho `/health`, `/`
  cùng JS asset. Toàn bộ 118/118 test, lint web/server/mobile và client/server
  build đều đạt sau hotfix.
- AI Studio assistant vẫn trả `An internal error occurred`, nên hotfix phải được
  upload/sync thủ công vào app hiện tại. Sau đó cần bật lại Share và kiểm tra
  bằng tài khoản thứ hai trước khi đóng băng form.

## Lịch sử client-only (không dùng để release)

- `scamsignal-ai-studio-sync-v3.zip` và `scamsignal-ai-studio-sync-v4.zip` là
  artifact lịch sử của kiến trúc client-only. **Không import lại** các archive
  này lên canonical app.
- Canonical app chưa được chuyển sang full-stack vì AI Studio Chat trả
  `An internal error occurred` khi thử migration bằng cả Gemini 3.6 Flash và
  Gemini 3.5 Flash ngày 09/08/2026, kể cả sau khi secret được gắn. Lần thử sạch
  gần nhất với Gemini 3.6 Flash cũng bị `Canceled` sau khoảng 30 giây; không có
  file hay UI nào của canonical app bị thay đổi bởi các lần thử đó.
- Các retry sau đó không tạo server route: một lần Chat tự báo đã sửa fallback,
  nhưng Action history chỉ ghi đọc `metadata.json` và `.env.example`, không có
  source edit; `src/gemini.ts` vẫn chứa `getClientFallbackApiKey` và client
  fallback. Prompt hiệu chỉnh cùng một fresh chat đều bị `Canceled` / internal
  error. Chỉ chấp nhận một migration khi Action history có server file mới và
  thay đổi `src/gemini.ts` đã audit.
- Ngày 09/08/2026, owner đã duyệt gắn một Gemini API key có sẵn và AI Studio báo
  `Secrets saved`. Direct Preview hiện “AI đang hoạt động”, nhưng NovaBank smoke
  dừng với `Backend API is unavailable` sau khoảng 33 giây, không trả điểm hay
  kết quả giả. Điều này xác nhận key đã nằm server-side còn canonical app thiếu
  server route, không phải lý do để khôi phục client fallback.
- Source local đã sẵn sàng cho kiến trúc đích: `src/gemini.ts` không còn đọc key
  hay gọi `@google/genai`; nó redact trước khi gọi API cùng origin với deadline
  30 giây. `server/` giữ toàn bộ Gemini logic và `GEMINI_API_KEY` server-side.

## Files historical in the client-only archive

- `package.json`
- `vite.config.ts`
- `index.html`
- `public/favicon.svg`
- `src/App.tsx`
- `src/data.ts`
- `src/gemini.ts`
- `src/index.css`
- `shared/analysis-contract.ts`
- `shared/gemini-analysis.ts`
- `shared/privacy.ts`
- `shared/types.ts`
- `shared/url-analysis.ts`

Gói v3 dùng manifest client-only tại `ai-studio/package.json`, được đặt thành
`package.json` ở thư mục gốc của archive. Manifest này giữ `tldts` cho URL
engine nhưng không mang Express hoặc dependency Cloud Run vào AI Studio.
`package-lock.json` chỉ phục vụ cài đặt local và không nằm trong archive.

## Cách đồng bộ khi AI Studio Chat hoạt động trở lại

1. Mở app hiện tại trong Google AI Studio.
2. Vào trình chỉnh sửa mã nguồn/File explorer của app.
3. Trong Chat, yêu cầu agent upgrade app thành full-stack, tạo đúng server
   entrypoint/routing convention do AI Studio quản lý, và chuyển Gemini calls
   sang server. Không tự đoán hoặc tự tạo entrypoint từ browser editor khi chưa
   có convention được agent xác nhận.
4. Chỉ sao chép các module logic đã audit (`shared/*`, contract, URL engine,
   privacy) vào server route. Giữ nguyên `src/App.tsx` và `src/index.css`.
5. Kiểm tra Secrets vẫn có `GEMINI_API_KEY` nhưng chỉ được tham chiếu trong
   server-side code. Không ghi API key trực tiếp vào source.
6. Build preview, chạy NovaBank hai lần liên tiếp dưới 30 giây, sau đó chạy bốn
   case evidence trước khi publish/update.
7. Chỉ publish/update sau khi preview không còn lỗi build, lỗi console hoặc
   client-side secret reference.

## Prompt có thể dùng với AI Studio assistant

> Upgrade app hiện tại sang full-stack bằng server runtime được AI Studio hỗ trợ. Giữ nguyên app ID, link chia sẻ, Secrets, toàn bộ React UI, CSS, Vietnamese copy và dữ liệu NovaBank hư cấu. Xóa mọi client-side Gemini/key fallback: không để `GEMINI_API_KEY` hoặc `@google/genai` xuất hiện trong client bundle. Tạo API cùng origin cho phân tích, chạy redaction, URL/domain inspection và Gemini structured output tại server-side bằng Secret `GEMINI_API_KEY`, timeout provider 25 giây và không auto-retry. Không tạo `localResult`, mock result hay điểm cố định. Sau khi thay file, build, audit secret exposure, chạy NovaBank hai lần liên tiếp dưới 30 giây và báo chính xác các file đã thay đổi.

## Tiêu chí kiểm tra nhanh

- Giao diện sáng, phong cách fintech và khớp với release candidate đã freeze; nếu
  video cũ khác đáng kể thì quay lại video thay vì hạ cấp UI để khớp video.
- Nút **Nạp tình huống mẫu** chỉ điền dữ liệu, không tự tạo kết quả.
- Nếu thiếu Gemini key, app báo lỗi rõ ràng và không hiện điểm giả.
- Điểm, mức rủi ro, bằng chứng và khuyến nghị thay đổi theo dữ liệu đầu vào.
- Ảnh chỉ chấp nhận PNG/JPEG/WEBP tối đa 8 MB.
- Không yêu cầu người dùng cung cấp mật khẩu, OTP hay thông tin đăng nhập ngân hàng.

## Kiểm tra local đã hoàn tất

- `npm run lint`: đạt.
- `npm test`: đạt 90/90 test, gồm bộ đánh giá URL 50 tình huống, capability
  truth, image privacy và Rescue case/report policy.
- `npm run build`: đạt, Vite xử lý 1.678 module sau khi loại Gemini SDK khỏi client bundle.
- Static audit sau build: client bundle không chứa `GEMINI_API_KEY`, `@google/genai`
  hoặc API key marker; server bundle mới giữ reference tới Secret.
- Đã kiểm tra bằng Playwright ở desktop và mobile 390×844.
- Đã kiểm tra trạng thái thiếu API key: báo lỗi, không dùng mock.
- Đã kiểm tra local và public tải ảnh: preview/consent hoạt động, nút phân tích
  chỉ bật sau khi người dùng xác nhận, exact Share URL trả kết quả Gemini động.

## Trạng thái đồng bộ v3 ngày 09/08/2026

- Đã import trực tiếp `scamsignal-ai-studio-sync-v3.zip` qua File explorer vào
  đúng app ID hiện tại và lưu các checkpoint mới; không tạo app khác.
- Workspace AI Studio đã có đủ năm module trong `shared/` và toàn bộ UI
  continuous-canvas, Trust Twin, Rescue Mode cùng bài học 20 giây.
- Preview dựng thành công và hiển thị đúng trang “Dừng lại trước khi chuyển tiền”.
- Historical note: v3 gọi Gemini qua browser runtime đã inject key. Dù không sao
  chép giá trị key ra ngoài, pattern này không còn đạt yêu cầu server-side hiện
  tại và không được dùng cho release candidate.
- Kiểm thử end-to-end NovaBank hư cấu bằng Gemini thật trả về rủi ro 95%, nhận
  diện đúng `novabarnk.vn` chèn chữ `r`, yêu cầu OTP và thủ thuật thúc ép.
- Kết quả online tách rõ một bằng chứng URL Engine đã kiểm chứng và bốn suy luận
  Gemini, đồng thời hiển thị Trust Twin và bài học chống scam 20 giây.
- Chưa Publish/deploy nên chưa phát sinh Cloud Run hoặc billing. Source và Preview
  trong link app hiện tại đã được cập nhật.

## Gói v3 đã đồng bộ

- `scamsignal-ai-studio-sync-v3.zip`
- Bao gồm UI continuous-canvas mới, Trust Twin, Rescue Mode, bài học 20 giây,
  accessibility fixes và URL engine dùng chung.
- Archive không chứa `.env`, API key, `node_modules`, server Cloud Run, file test
  hoặc build artifact.

## Tương thích sau khi tách workspace core

Từ increment contract v1 ngày 09/08/2026, source of truth của evidence engine nằm
trong `packages/core`, còn `shared/*` là compatibility entrypoint. Web client mới
dùng `packages/api-client` và endpoint `/v1/analyses`.

- Backend vẫn giữ `/api/analyze` để bản AI Studio v3 đã import tiếp tục hoạt động.
- Không xóa các compatibility entrypoint trong `shared/` trước khi tạo gói AI
  Studio kế tiếp.
- Gói full-stack mới phải mang được server entrypoint do AI Studio tạo/quản lý,
  cùng các `shared/*` module cần thiết. Không tạo v5 hoặc import lại v4 trước khi
  convention runtime đó được xác nhận trong app.
- Trước khi tạo archive kế tiếp, phải chạy `npm run lint`, `npm test`,
  `npm run build`, audit client bundle không lộ secret và four-case smoke trên
  AI Studio Preview.

## Audit parity và runtime ngày 09/08/2026

Chi tiết bằng chứng và quyết định release nằm trong
[COMPETITION_PARITY_CHECKLIST.md](./COMPETITION_PARITY_CHECKLIST.md).

- Đã sửa metadata cấp app từ tên chung `AI Studio App` thành `ScamSignal AI` mà
  không đổi app ID hoặc link.
- Đã xác nhận General Access là public và Gemini chat history không được chia sẻ.
- Local web và AI Studio khớp ở Home, ba journey, input, privacy copy và dữ liệu
  NovaBank hư cấu.
- Đã phát hiện adapter AI Studio chờ endpoint `/api/analyze` không tồn tại đến 60
  giây trước khi fallback. Canonical source vẫn là client-only, vì vậy không đạt
  chuẩn release. Local source đã bỏ fallback này và chỉ dùng API server-side.
- Shared Gemini runtime hiện dùng HTTP timeout 25 giây, một attempt và
  `AbortSignal`; timeout được hiển thị thành lỗi tiếng Việt có thể thử lại.
- Một smoke test trước hardening đã trả kết quả động 95%. Smoke test cuối sau
  hardening đi vào provider timeout nhưng đã thoát loading đúng cách; vì vậy app
  **chưa đạt release candidate** cho đến khi có hai lần thành công liên tiếp dưới
  30 giây và four-case smoke pass.
- Video YouTube hiện tại đúng tên/claim nhưng dùng layout kết quả cũ; quyết định là
  giữ UI canonical mới và quay lại video sau khi public build được freeze.
- `scamsignal-ai-studio-sync-v3.zip` và `scamsignal-ai-studio-sync-v4.zip` không
  chứa full-stack runtime. Không import đè chúng lên canonical app. v4 vẫn được
  giữ làm evidence của hardening client-only trước đây, không phải release input.
