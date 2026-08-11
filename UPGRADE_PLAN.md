# ScamSignal AI — competition upgrade plan

> **Quyết định phạm vi 09/08/2026:** ScamSignal AI được nộp như **một dự án**
> với **một Google AI Studio Project Link** làm bản gốc bắt buộc. Bản web là
> sản phẩm dự thi chính. Mobile được giữ lại như hướng mở rộng sau cuộc thi;
> không tiếp tục Google Play trong đường găng trước hạn 30/08/2026.

The longer-term product strategy, Google integration matrix, professional UX direction, and scale architecture are documented in [PRODUCT_VISION.md](./PRODUCT_VISION.md).

The implementation audit, Google Workspace integration architecture, Android
application plan, and Google Play release gates are documented in
[WORKSPACE_MOBILE_ROADMAP.md](./WORKSPACE_MOBILE_ROADMAP.md).

The canonical execution backlog, feature-by-feature checklist, dependencies,
acceptance criteria, OAuth scope matrix, and release gates are maintained in
[MASTER_IMPLEMENTATION_PLAN.md](./MASTER_IMPLEMENTATION_PLAN.md).

## Phase 1: Evidence-backed core — implemented

- Cloud Run-ready same-origin backend.
- Server-side Gemini key and rate limiting.
- Text privacy redaction before transmission.
- Deterministic URL/domain inspection without visiting suspicious links.
- Optional Google Web Risk lookup with explicit `not_listed` semantics.
- Gemini structured output and dynamic scoring.
- Verified, inferred, and unknown evidence states in the UI.
- Apple-HIG-informed continuous-canvas UI for Check, Verify, Result, and Rescue.
- Trust Twin domain comparison and a 20-second anti-scam learning loop.
- Keyboard skip navigation, error focus recovery, visible focus states, and an axe audit with zero Home-page violations.
- Desktop and mobile browser verification.
- Balanced 50-case URL-engine evaluation set, including 10 benign false-positive guards.

## Phase 2: Competition web release — current P0

- Freeze the competition scope around Check → Verify → Rescue; do not add large
  integrations before the public flow is stable.
- Run a final parity audit between the local web app, the AI Studio project and
  the UI shown in the current demo video.
- Keep the existing public AI Studio project as the single canonical submission.
- Publish the web app through AI Studio Publish/Google Cloud Run and obtain one
  public deployment URL for the optional deployment bonus.
- Verify the AI Studio project link and deployed URL from a signed-out browser,
  mobile viewport and an independent network.
- Run benign, typosquat, screenshot and uncertain cases on the exact public build.
- Do not enable Web Risk or another billable integration merely for a claim;
  enable it only with a verified endpoint, quota and budget guardrail.

**Exit:** a judge can open the AI Studio project and public app without account
access, missing secrets or setup instructions.

## Phase 3: Demo and submission synchronization — current P0

- Compare the current YouTube demo against the release candidate.
- Re-record only if the public UI, claims or core flow materially differ.
- Present web as the product being judged; mention mobile only as a working
  prototype/future companion, not as a released Google Play app.
- Update the completion form with current features, 72-test evidence, actual
  Google integrations and the single public deployment URL.
- Keep the deployment answer as “not deployed” until the public URL passes the
  independent access check.
- Choose one public social post (LinkedIn or Facebook) with the strongest real
  engagement and required hashtags.
- Save the email copy after the final form update and audit every link before
  23:59 30/08/2026.

**Exit:** AI Studio, deployed app, video, social post and form all describe the
same product and make only verifiable claims.

## Phase 4: Measured impact — optional before deadline

- Add anonymous helpful/not-helpful feedback with Firestore.
- Add a privacy-safe event counter for completed analyses.
- Recruit 10–20 testers and record only real results.
- Connect the existing session-only helpful/not-helpful control after consent and App Check are configured.

This phase must not delay Phase 2 or Phase 3. If Firebase consent/rules cannot be
completed safely, collect structured feedback manually and report only real
counts.

## Phase 5: Post-competition expansion — parked

- Refactor the shared TypeScript evidence engine into reusable packages.
- Resume the existing API-36 Expo/React Native app with native share intake.
- Protect the shared Cloud Run API with Firebase App Check and Play Integrity.
- Add consent-based Firestore cases, Drive evidence export, and Calendar reminders.
- Build a least-privilege Gmail Workspace add-on and private Sheets moderation view.
- Complete Google Play Data safety, privacy, closed testing, signing, and release gates.

Resume this phase only after the competition web release and final form update
are complete, or after the submission deadline.

## Out of scope until the core is validated

- User accounts and a large dashboard.
- Google Play publishing before the competition submission is finalized.
- Automatically opening suspicious links.
- Claiming that a person or organization is definitively fraudulent.
- Hard-coded final risk scores.
