# ScamSignal AI

Vietnamese-first scam-risk analysis built for AI Riser Vietnam 2026. ScamSignal separates deterministic URL findings, Google Web Risk results, and Gemini inferences so users can see what was verified and what still needs confirmation.

Google AI Studio project:
https://ai.studio/apps/34bd7287-de9b-4aee-9295-6f95d492706f?fullscreenApplet=true

The competition release uses the full-stack web source in this repository. The
AI Studio project is configured for public fullscreen sharing. Independent-link
verification remains a release gate; billed Cloud Run publishing is intentionally
deferred.

> The current release includes capability status, sanitized image consent,
> functional local Rescue Mode, and a transparent deterministic safety fallback.
> Before media freeze, rerun the synthetic image picker gate and verify the
> Share URL with a second signed-in Google account. The 390 px mobile gate passed.

## Evidence pipeline

1. Redact OTP, password values, and card-like numbers from text in the browser.
2. Re-encode uploaded images locally to strip metadata, show a preview, and require consent.
3. Extract and inspect URLs without opening them.
4. Check each URL with Google Web Risk when configured.
5. Send an image once for schema-constrained extraction, then synthesize from structured evidence.
6. Render verified findings, AI inferences, unknowns, and safe next actions separately.
7. If the server transport/provider is temporarily unavailable, run the URL/text safety engine locally, label the result as local-only, and never display a fabricated AI score.

The AI-generated score remains dynamic when Gemini responds. Deterministic checks do not hard-code a replacement score; the fallback explicitly displays `chưa có điểm AI`.

## Decision-safety experience

- **Check** accepts suspicious text, links, screenshots, and QR images.
- **Verify** separates the claimed identity from independently supplied reference data.
- **Trust Twin** highlights the exact domain-character mismatch instead of relying on a large numeric score.
- **Rescue Mode** stores a local IndexedDB case, evidence blobs and user-confirmed timestamps, then previews/downloads a JSON or readable TXT report. It does not call a bank or sync Google Workspace yet.
- A 20-second micro-lesson helps users recognize the same persuasion or domain trick next time.
- Demo feedback is stored only in the current browser session. Firestore submission remains intentionally disabled until consent, App Check, and a real project are configured.

The interface follows an original, Apple-HIG-informed continuous-canvas direction with restrained materials, progressive disclosure, visible focus states, and mobile touch targets. It does not copy Apple application layouts or assets.

## Run locally

Prerequisites: Node.js 22 or later.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add `GEMINI_API_KEY` to `.env.local`. `WEB_RISK_API_KEY` is optional during UI
development. `npm run dev` starts one Express process on port 3000 and mounts
Vite as development middleware, matching the AI Studio full-stack runtime.

The repository is being migrated incrementally to npm workspaces. Reusable evidence
logic is in `packages/core`; the typed browser/mobile API client is in
`packages/api-client`. Compatibility entrypoints remain in `shared/` for the
already-synced Google AI Studio package.

## Quality checks

```bash
npm run lint
npm test
npm run build
npm start
```

The deterministic evaluation suite contains 50 balanced URL cases: 20 critical
identity-deception cases, 20 suspicious structural cases, and 10 benign/
false-positive guards. The broader test run currently contains 119 tests,
including API contract, inconclusive-state normalization, typed-client,
browser-redaction, rescue-flow, iframe-compatibility, and mobile local-analysis
coverage.

Production endpoints:

- `GET /health`
- `GET /api/capabilities` — runtime/provider states without secrets.
- `GET /api/status`
- `POST /api/ping` — provider-free routing/runtime probe.
- `POST /api/v1/analyses` — versioned contract for new clients.
- `POST /v1/analyses` — versioned contract for new clients.
- `POST /api/analyze` — AI Studio-compatible v1 contract endpoint.

The server applies security headers, request-size validation, rate limiting, and does not persist submitted content.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the Cloud Run and Secret Manager checklist. Do not put API keys in the Docker image, Git, or `VITE_*` environment variables in production.

## AI Studio full-stack import

The browser never reads a Gemini key and never calls the Gemini SDK. The web
adapter in `src/gemini.ts` redacts input and calls the same-origin versioned API;
`server/` owns `process.env.GEMINI_API_KEY`, validation, URL inspection and the
Gemini provider call. Provider requests are bounded to 25 seconds with no
automatic retry, and failures return a typed error rather than a mock score.
The web client then performs a real, scoreless local URL/text safety pass for
retryable transport/provider failures. Image-only requests still require the
server-side Gemini extraction path and never receive a fabricated fallback.

Import the repository root into a new AI Studio web project and preserve the
existing Node/Express server. Do not import the historical `ai-studio/` runtime
or any `scamsignal-ai-studio-sync*.zip` archive; those are local evidence from
the retired client-only project and are excluded from the submission repository.
