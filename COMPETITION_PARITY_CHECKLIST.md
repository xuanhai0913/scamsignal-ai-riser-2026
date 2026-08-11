# ScamSignal AI — competition parity checklist

> Audit date: 10/08/2026<br>
> Release-candidate project: <https://ai.studio/apps/34bd7287-de9b-4aee-9295-6f95d492706f?fullscreenApplet=true><br>
> App source baseline: verified release revision `dbd7707` on `main`<br>
> Current public demo: <https://youtu.be/smURKqcLXMw><br>
> Frozen video source: `scamsignal-ai-riser-release-candidate.mp4` (69.056 s)

This document is the release record for the competition web submission. The
GitHub revision above is the source of truth. The linked Google AI Studio
project is its public, full-stack release candidate; the demo video, social post
and completion form must all describe this same revision.

## Release decision

**Status: P0 owner preview passes, but the current AI Studio Share deployment is
not yet judge-ready.** A second full-stack sync into the previously working
historical app reproduced the same managed Share failure while its owner Preview
and direct frontend runtime remained healthy. This rules out app permissions and
confirms that changing the completion-form link now would not improve judge access.
The server-only Gemini architecture, public AI Studio share and core evidence
states were aligned before P0. A 09/08 browser/source audit found no-op Rescue
actions, visual-only Workspace toggles, static service status and inaccurate
image privacy copy. The canonical revision replaces them with a runtime
capability contract, sanitized image preview/consent, IndexedDB Rescue
case/evidence, real report preview/download and confirmed deletion. App source
revision `86cfaef` is synced into the full-stack AI Studio project and its owner
Preview passed live text, Rescue and image checks. The previous public RC
completed two consecutive NovaBank typosquat runs in 14.279 s and 15.107 s;
both identified `novabarnk.vn`, the OTP request and a safe next action (dynamic
confidence was 95% then 90%). On 10/08 the exact current Share URL also accepted
the versioned 1200×800 PNG fixture through the native macOS picker. The app
re-encoded it from 90 KB to 78 KB, kept analysis disabled until preview consent,
then returned a dynamic 98% high-risk result with visible domain, OTP, urgency
and amount evidence. A 10/08 independent-account audit then exposed a release
blocker: the current app opens the public-project interstitial but its iframe
returns `Error: Page not found`. The owner still receives an `ais-dev-*` runtime;
AI Studio never produced the `ais-pre-*` shared runtime that a working historical
app produces. Do not treat the current Share URL as public-ready until this
second-account check passes.

Remaining release tasks before final freeze:

1. Upload/sync the web-only Docker runtime fix, trigger sharing again and confirm
   that the current app receives a working `ais-pre-*` runtime.
2. Recheck the Share URL from the second signed-in Google account, then
   retain the latest Google Forms receipt before the 30/08 deadline.
3. If AI Studio Share is still unavailable near freeze, choose a separately
   hosted, independently tested full-stack URL; do not substitute the frontend-only
   `ais-pre-*` endpoint because its same-origin analysis API is not deployed.

Do not revert the current UI to match the old video. The current result flow is
clearer and contains stronger explainability. Freeze the app first, then update
the video once.

## Audited parity matrix

| Surface | Audit result | Status | Release action |
| --- | --- | --- | --- |
| AI Studio identity | P0 RC app is named `ScamSignal AI — AI Riser 2026` with an accurate Vietnamese description. | Pass | Use app ID `34bd7287-de9b-4aee-9295-6f95d492706f`; keep `07263ea4-9904-4d14-8f73-7fa277f053f9` only as the previous full-stack backup. |
| AI Studio access | General Access displays `Public: Anyone with the link can view`, but a second signed-in account currently reaches a 404 inside the app iframe. Historical app `9b8…` works from the same account, proving the failure is specific to the current/backup deployments. | **Blocker** | Rebuild/resync the current app and require a passing second-account smoke before form freeze. |
| Share privacy | `Default to fullscreen` is on. `Include your Gemini chat history` is off, so judges land in the app and assistant history stays private. | Pass | Do not enable chat-history sharing. |
| Local ↔ AI Studio home | Runtime transport status and sanitized image preview/consent are live in the owner Preview. It reports `Kênh phân tích sẵn sàng` after the ingress probe succeeds and falls back honestly when analysis is unavailable. | Owner Preview pass | Preserve this surface while fixing the shared runtime. |
| Sample behavior | `Nạp tình huống mẫu` only fills the fictional `novabarnk.vn` scenario; it does not inject a result. | Pass | Keep all sample data explicitly fictional. |
| Score and evidence | Canonical Gemini produced a dynamic 95% confidence result, detected the inserted `r`, OTP request and urgency, and separated URL Engine evidence from Gemini inference. Video shows 92; this numeric variation is correct because the score is model-generated. | Pass for semantics | Never hard-code a final score to make surfaces numerically identical. |
| Screenshot evidence | Exact-RC owner-preview native-picker E2E passed with `evaluation/fixtures/novabarnk-scam-message.png`: 1200×800, 90 KB source → 78 KB sanitized preview, explicit consent, dynamic 98% high-risk result and correct domain/OTP/urgency/amount evidence. Local tests verify single transmission. | Owner Preview pass | Repeat a short smoke after shared deployment is repaired; never upload real victim data. |
| Runtime architecture and latency | AI Studio imported the Express + Vite full-stack revision. `src/gemini.ts` only calls the typed same-origin client; `server/analyze.ts` owns `GEMINI_API_KEY`, Gemini and Web Risk. Two consecutive NovaBank runs completed correctly in 14.279 s and 15.107 s. | Pass | Keep the server-only boundary; scores remain dynamic. |
| AI Studio Gemini secret | AI Studio injects Gemini server-side automatically. Optional `VITE_API_BASE_URL` and `WEB_RISK_API_KEY` were intentionally left blank; no secret value was copied into source or browser storage. | Pass | Do not add a browser key or claim live Web Risk. |
| Local runtime | The local web client now redacts then calls the same-origin API only; its production bundle contains no Gemini key/SDK reference. With no server key, `/v1/analyses` returns typed `MODEL_UNAVAILABLE` and never displays a mock score. | Pass for failure safety | Add a real server-side key only through `.env.local`/Secret Manager. |
| YouTube metadata | Public 1:09 video `smURKqcLXMw` uses the correct project name, AI Riser context, app link, fictional-data disclaimer and required hashtags. It is public, not made for children, has its custom thumbnail and HD processing completed. | Pass | Keep this exact video URL in the form and social comment. |
| YouTube visuals | The public 69.056-second release candidate matches the focused result, Trust Twin and Rescue flow. The H.264 1920×1080/30 fps file has AAC 48 kHz stereo audio and burned-in Vietnamese subtitles. | Pass | Do not upload another duplicate unless the frozen app changes materially. |
| Public deployment | The project permission is public and defaults to fullscreen, but its shared runtime is missing (`ais-dev-*` works for owner; external account receives 404). Publish step 1 requires a Cloud Project/billing for this account, so no billed deployment was started. | **Share blocked; billed publish deferred** | First sync the web-only runtime fix and retry free Share. Do not start Standard Cloud Run Publish without owner approval. |
| Rescue actions | Every task starts pending; guides open, evidence blobs persist, amount/steps survive reload, report preview reflects real state, and privacy deletion clears local data. In owner Preview, a step timestamp, 18.500.000 VND and report preview were verified. Workspace remains explicitly unavailable. | Owner Preview pass | Do not claim hotline lookup, bank calling or cloud sync. |
| Mobile web layout | At 390 px, landing, result and Rescue all reported 375 px client/scroll width with no horizontal overflow. The owner-preview mobile result returned a dynamic 98% high-risk score and bottom navigation stayed available. | Owner Preview pass | Use this viewport for the final video only when showing responsive behavior. |
| Workspace/mobile claims | Drive, Calendar, Gmail, Sheets and Google Play are roadmap items, not live competition features. | Pass | Do not list them as implemented integrations in the final form. |

## Frozen competition feature scope

Only these capabilities may appear as live claims before the deadline:

- Check and evidence-based result journeys on the web.
- Rescue may be claimed as a local-device recovery checklist with persisted case/evidence, report download and delete controls. Do not claim a bank call, report submission or cloud sync.
- Text/link input plus PNG/JPEG/WEBP screenshot or QR intake up to 8 MB.
- Local redaction of common sensitive values before analysis.
- Deterministic URL/domain inspection without opening suspicious links.
- Gemini structured analysis with dynamic confidence, explanation and safe next
  actions.
- Verified, AI-inferred and unknown evidence states.
- Trust Twin domain comparison and the 20-second anti-scam lesson.
- Session-only helpful/not-helpful feedback.

Explicitly excluded from current live claims:

- A released Google Play application.
- Live Drive, Calendar, Gmail or Sheets integration.
- Live Google Web Risk unless the deployed backend reports it as configured.
- User accounts, persistent case storage or production impact metrics.
- A legal conclusion that a person or organization is definitively fraudulent.

## Changes made during this audit

- Fixed the external AI Studio app name and description without changing its ID.
- Confirmed public link access and disabled chat-history sharing.
- Hardened the historical AI Studio client runtime to avoid a 60-second spinner,
  but marked it non-release because it still calls Gemini from the browser.
- Added a 25-second SDK abort/no-retry policy and a 30-second UI deadline with a
  recoverable Vietnamese error.
- Migrated the local source of truth to a server-only Gemini path with a 30-second
  client API deadline; UI/copy were unchanged.
- Re-ran local quality gates: lint passed, 118/118 tests passed and client/server
  production builds passed. A local no-key smoke returned typed
  `MODEL_UNAVAILABLE`, with no fabricated score.
- Added an explicit `Chưa đủ dữ kiện` state, capped confidence only when evidence
  is insufficient, rejected non-domain Trust Twin comparisons and added three
  focused contract tests. The suite now passes 78/78 tests.
- Implemented local P0 capability truth, image preview/consent, single image
  transmission, schema-constrained provider output and functional IndexedDB
  Rescue case/evidence/report/delete flows. The suite now passes 90/90 tests;
  lint and client/server/mobile typechecks pass.
- Synced app source revision `86cfaef` into AI Studio app
  `34bd7287-de9b-4aee-9295-6f95d492706f`, set General Access to Public,
  enabled default fullscreen and kept Gemini chat history private.
- Exact P0 public text smoke passed with `Kênh phân tích sẵn sàng`, a dynamic high-risk
  NovaBank result and visible Trust Twin/domain evidence. Rescue smoke persisted
  a completed step and amount, then generated a local report preview.
- Public mobile verification on 10/08 passed at 390 px with no horizontal
  overflow. A fresh NovaBank analysis returned 98% (expected dynamic variation),
  and the Rescue case retained `1/4`, its timestamp and 18.500.000 VND across a
  new day/tab.
- Imported GitHub revision `b9eb810` into a fresh full-stack AI Studio project,
  verified the server file tree and public share, and kept Gemini chat history
  private.
- Live RC checks passed: inconclusive plain text returned 30% with unknown
  evidence; benign official-link text stayed calm and rendered no invalid Trust
  Twin; NovaBank returned high-risk results with the inserted `r` visible. Its
  two latest measured consecutive runs completed in 14.279 s (95%) and 15.107 s
  (90%). The synthetic screenshot fixture then completed live at 95%, exposing
  its OCR-derived typosquat, OTP and urgency signals.
- Re-ran the image flow after the final `App.tsx` sync using the versioned
  fictional fixture. The exact Share URL produced a sanitized preview, required
  explicit consent and returned a dynamic 98% high-risk result. Local lint,
  118/118 tests and client/server production builds also passed on 10/08.
- Audited public video `smURKqcLXMw`: visibility is Public, HD processing and
  custom thumbnail are complete, metadata links to the current AI Studio app,
  and the description includes the fictional-data/privacy disclaimer.
- Audited Facebook Reel `1568345378353520`: Public, required hashtags present,
  58 reactions and one comment at audit time. Replaced the stale backup-app URL
  in the author comment with the current app and public YouTube links.
- Read the latest Google Forms receipt dated 10/08. It already contains the
  current AI Studio app, YouTube video and Facebook Reel links, so no duplicate
  form submission was made.
- Ran the required second-account audit. The public interstitial opens, but both
  current app `34bd…` and previous full-stack app `0726…` return an iframe 404;
  historical app `9b8…` loads successfully and uses an `ais-pre-*` endpoint.
  This isolates the release blocker to the newer shared deployments rather than
  Google sign-in or the account itself.
- Reproduced the Docker runtime install outside AI Studio. The previous
  `npm prune --omit=dev` traversed the whole monorepo, added more than 500 mobile
  packages and expanded `node_modules` to about 674 MB. The replacement
  production-dependency stage installs only root web/server + core/api-client
  dependencies (about 149 MB), passes 118/118 tests, lint and production build,
  and serves `/health`, `/` and the production JS asset successfully.

The existing `scamsignal-ai-studio-sync-v3.zip` and v4 overlay are client-only
artifacts. Do not re-import either over the canonical app. A future sync archive
will be created only after an AI Studio-generated full-stack server runtime has
been built and verified.

## Exit checklist for `NEXT-03`

- [x] AI Studio has an audited server-side Gemini route; the client bundle contains no secret/SDK reference.
- [x] NovaBank text case succeeds twice consecutively in under 30 seconds (14.279 s; 15.107 s).
- [x] Benign text returns a non-alarmist result.
- [x] Typosquat text identifies the changed character and safe next action.
- [x] Screenshot/QR case completes on the exact P0 RC with sanitized preview,
  explicit consent and dynamic Gemini evidence from the fictional PNG fixture.
- [x] Uncertain case uses an unknown/inconclusive state rather than inventing certainty.
- [x] Historical AI Studio client-only source is captured in a reproducible v4 sync package.
- [x] Local server-only source passes build and secret-exposure audit.
- [ ] Shared deployment has no build/runtime error. Owner Preview has no spinner,
  mock result or hard-coded final score, but the second-account iframe still 404s.

## Next release sequence

1. Sync the web-only Docker runtime stage into the current AI Studio app, retry
   Share and require a passing second-account iframe smoke; do not start billed
   Publish without owner approval.
2. Reopen the latest Google Forms edit receipt only if the verified app link or claim
   changes; do not create a duplicate response.
3. Run the final independent link audit and save the last receipt/timestamp
   before 23:59 on 30/08/2026.
