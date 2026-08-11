# ScamSignal AI — feature truth matrix

> Audit date: 09/08/2026
> Scope: competition web app, shared analysis core, Express backend, and optional Google integrations.
> Status vocabulary: `REAL`, `PARTIAL`, `LOCAL_ONLY`, `DEMO_FIXTURE`, `NOT_CONFIGURED`, `PLANNED`, `BLOCKED`.

This reference prevents the UI, demo video, submission form, and README from describing a feature more strongly than its verified behavior.

## Definition of a real feature

A feature can be marked `REAL` only when all six gates pass:

1. A user action invokes implemented code, not only navigation or a visual state change.
2. Success produces a receipt the user can inspect: an analysis response, source citation, attached file, downloaded report, Drive file link, Calendar event link, or persisted local state.
3. Failure, timeout, denied permission, empty data, and unavailable provider states are visible and recoverable.
4. Sensitive data handling is disclosed before transmission and verified by tests.
5. At least one automated test covers success and one covers the important failure path.
6. The exact public release candidate passes an end-to-end smoke test.

Production UI must not render `checked`, `connected`, `verified`, `saved`, `AI đang hoạt động`, or a callable contact unless the current runtime has evidence for that state.

## Current feature inventory

| Surface | Current status | Evidence | Truthful live claim now | Required receipt for `REAL` |
| --- | --- | --- | --- | --- |
| Text/link intake | `REAL` | Bounded input, client redaction, typed API request. | Accepts Vietnamese text/link for analysis. | Parsed v1 response or typed error. |
| Screenshot/QR intake | `PARTIAL` in the current AI Studio preview; `REAL` on a working server runtime | Browser validates, rotates/resizes/re-encodes, previews and requires consent. Image-only analysis requires the server POST/Gemini path and never receives a fabricated local result. | Accepts PNG/JPEG/WEBP up to 8 MB after explicit preview/consent; analysis availability depends on the server runtime. | Sanitized preview + single image transmission + provider receipt. |
| Sensitive text redaction | `REAL` for text only | Browser redacts common OTP/password/card-like text before API call. | Common sensitive values in text are redacted before server analysis. | Redaction count and no-secret-echo tests. |
| Sensitive image redaction | `PARTIAL` | Re-encoding strips common metadata and bounds dimensions, but visible secrets are not automatically blurred. The disclosure says this before consent. | Metadata is removed; do not claim visible content is automatically redacted. | Local crop/blur tool for content-level redaction. |
| Deterministic URL inspection | `REAL` | URL extraction, punycode/structure findings, false-positive tests. | Inspects URL structure without opening suspicious links. | Structured URL inspection result. |
| Google Web Risk | `NOT_CONFIGURED` by default | `/api/capabilities` reports whether it is configured and loading steps include it only then. | Optional; claim a check only from the per-analysis Web Risk receipt. | Checked timestamp/status in response. |
| Gemini risk synthesis | `BLOCKED` in the current AI Studio dev ingress; `REAL` in verified local production runtime | Server-only key boundary, dynamic confidence and typed errors pass locally. On 10/08/2026 AI Studio returned its `Starting Server…` HTML for every POST, including provider-free `/api/ping`; GET capabilities still worked. | Gemini is the primary engine only when a validated response receipt is returned. | Validated structured response and pipeline receipt from the exact public runtime. |
| Deterministic outage fallback | `REAL` for text/link input | Retryable POST/provider failures load the URL/text engine on demand, preserve verified typosquat and persuasion findings, and show `chưa có điểm AI`. Negation-aware checks prevent protective wording such as `không yêu cầu OTP` from becoming a credential signal. Twenty-three core cases plus adapter failure/short-circuit tests cover it. | Provides a local safety warning without pretending Gemini responded. | Local pipeline receipt, verified evidence, zero hidden AI-score claim. |
| Structured output schema | `REAL` | Extraction and synthesis use provider JSON schemas, then the existing semantic finalizer validates business rules. | Gemini JSON is schema-constrained and semantically validated before rendering. | Schema + semantic validator tests. |
| Evidence groups | `REAL` | Verified / inferred / unknown are separated in the result. | Shows which evidence is verified, inferred, or missing. | Every item has source + verification state. |
| Trust Twin | `PARTIAL` | Compares suspicious domain with a user-provided/reference domain. It does not establish that the reference is truly official. | Compares a tested domain with the supplied reference. | First-party citation or explicit `user supplied` label. |
| Verify journey | `PARTIAL` | Reuses the same analysis pipeline; no live official-source retrieval. | Validates format/evidence against sources the user provides. | Grounded first-party source or clear no-source state. |
| AI availability header | `PARTIAL` until the new local RC is synced | UI starts `/api/capabilities` and provider-free `POST /api/ping` in parallel. A failed POST probe changes the header and input notice to local-only instead of presenting configuration as health. The probe validates ingress, not Gemini provider health. | Shows configuration and POST transport separately without exposing secrets. | Capability response plus a successful POST probe/analysis receipt. |
| Analysis loading steps | `REAL` | Steps derive from Web Risk capability and POST transport state; local-only mode does not display a Gemini synthesis step. | Shows only enabled analysis stages. | Capability/transport-derived step list. |
| Copy warning | `REAL` | Clipboard is awaited and success/failure is shown. | Copies the displayed warning on supported browsers. | Awaited success/error status. |
| Save analysis evidence | `LOCAL_ONLY` | Downloads raw JSON analysis. | Downloads a local JSON analysis file. | Successful browser download + meaningful report preview. |
| Learning loop | `LOCAL_ONLY` | Feedback stored in session storage and not sent. | Stores helpful/unclear feedback in the current browser session. | Session value + accessible status. |
| Result recovery CTA | `REAL` | Label is now `Mở hướng dẫn xử lý` and navigates to the implemented local Rescue flow. | Opens the local recovery guide. | Rescue view rendered. |
| Rescue scenario selector | `LOCAL_ONLY` | Scenario is versioned and persisted in IndexedDB. | Selects and stores a local rescue scenario. | Persisted case state. |
| Rescue completion circles | `LOCAL_ONLY` | Every task starts pending; user action stores a real completion timestamp. | Local checklist with user-confirmed timestamps. | Reloaded completion timestamp. |
| Official bank contact | `PLANNED` | The app does not guess a hotline. P0 opens an honest safe-contact guide; no call button is shown. | Provides a local guide for finding an official channel. | First-party citation + confirmation + `tel:` link. |
| Account recovery guide | `LOCAL_ONLY` | Native dialog opens, supports Escape/focus restoration and leaves completion to the user. | Opens a local account-protection guide. | Dialog rendered and user-controlled completion. |
| Evidence attachment | `LOCAL_ONLY` | Files are stored as blobs in IndexedDB with real name/size/time inventory and removal. | Stores up to six local image/PDF/TXT evidence files. | Persisted blob metadata + add/remove receipt. |
| Emergency report | `LOCAL_ONLY` | Preview reflects actual scenario, amount, steps and evidence; JSON and readable TXT downloads work locally. | Creates and downloads a local incident-support report. | Preview and browser download. |
| Rescue autosave | `LOCAL_ONLY` | Versioned case survives reload; saved/error/deleted receipts are visible. | Saves the active Rescue case on this device. | IndexedDB reload receipt. |
| Rescue privacy | `LOCAL_ONLY` | Privacy dialog states location/transmission truth and confirmed deletion clears case + evidence stores. | Lets the user inspect and delete local Rescue data. | Empty state after confirmed deletion. |
| Google Drive | `PLANNED` | Officially labelled product row says `Chưa kết nối`; no switch or OAuth claim. | Do not claim integration. | OAuth success + returned Drive file ID/link. |
| Google Calendar | `PLANNED` | Officially labelled product row says `Chưa kết nối`; no switch or event claim. | Do not claim integration. | OAuth success + returned Calendar event ID/link. |
| Mobile Verify tab | `REAL` | The tab is labelled `Xác minh` and opens Verify. | Opens the Verify journey. | Correct route and label. |
| Voice intake | `PLANNED` | Disabled button is labelled upcoming. | Not implemented. | Permission, recording, transcript preview, delete and consent flow. |
| Runtime/backend label | `REAL` | Server resolves `local | ai_studio | cloud_run`; pipeline and UI render that value. | Shows the current runtime without claiming Cloud Run by default. | Runtime capability + analysis receipt. |

## Browser audit evidence

- Local health endpoint: available.
- Local `/api/capabilities`: runtime `local`, Gemini/Web Risk not configured; UI rendered `AI chưa cấu hình` and disabled analysis without a mock result.
- Playwright confirmed contact/account guides open as correctly named native dialogs and Escape restores focus.
- A 185-byte TXT fixture, amount and user-completed steps survived a full reload from IndexedDB.
- Report preview reflected 3/4 completed steps and one real evidence file; JSON/TXT actions were present.
- Confirmed privacy deletion returned the case to 0/4 steps, blank amount and zero evidence files.
- At 390×844, timeline actions retained visible labels and Workspace rows rendered `Chưa kết nối`.
- Image intake re-encoded a PNG to a 390×844 51 KB JPEG preview and required explicit consent; analysis remained disabled because local Gemini was not configured.
- AI Studio Preview: `POST /api/ping` and `POST /api/analyze` both returned the platform `Starting Server…` HTML, isolating the issue from Gemini/provider code.
- AI Studio Preview fallback: the NovaBank fixture produced a scoreless local `Rủi ro cao` result, highlighted the extra `r` in `novabarnk.vn`, and rendered five verified URL/text signals.

## P0 audit findings resolved locally

- Capability status, runtime and loading steps now derive from the server contract.
- A provider-free POST probe detects AI Studio's HTML `Starting Server…` failure before analysis; text then short-circuits directly to local checks instead of waiting for the 60-second API deadline.
- Local content signals understand common Vietnamese negation/protective phrasing and require more than one isolated neutral warning before escalating to `Đáng ngờ`.
- Image preview/consent, names, honest disclosure and reduced-motion scroll are implemented.
- Clipboard and Trust Twin copy no longer overstate success or source authority.
- Rescue was extracted from `App.tsx`; no action starts complete and no data count/time is hard-coded.
- Drive/Calendar switches were removed; responsive action labels remain visible.
- Five untracked stale `shared/* 2.ts` copies were moved outside the repository to sibling backup folder `../ai-studio-app-stale-backup-20260810`; the canonical compatibility entrypoints remain unchanged.
- Current local verification: 16 test files / 118 tests pass; web, server and mobile typechecks plus production build pass.

## Release claim rule

The submission form and video may describe only rows marked `REAL`, plus `LOCAL_ONLY` when the local limitation is said explicitly. `PARTIAL`, `NOT_CONFIGURED`, `PLANNED`, `MOCK`, and `MOCK_LABEL` rows cannot be presented as completed integrations.
