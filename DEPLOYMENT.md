# Competition deployment checklist

## 1. Recommended path: AI Studio Starter Tier

1. Import the clean submission repository into a new AI Studio web project.
2. Confirm the generated project preserves the Node server and that
   `GEMINI_API_KEY` is available only as a server-side Secret.
3. Run the preview quality gates in this document.
4. Publish with Google Cloud Starter Tier when it is offered on the account.

Starter Tier is the preferred competition path because it can publish up to two
full-stack AI Studio apps without first linking a billing account. Gemini model
usage still follows the selected model's quota/pricing. Do not publish the
legacy client-only AI Studio project.

## 2. Standard Cloud Run fallback

- Select a project with billing enabled.
- Use region `asia-southeast1` for a Vietnam-facing demo unless the project has another required region.
- Enable Cloud Run, Cloud Build, Artifact Registry, Secret Manager, and Web Risk APIs.

## 3. Secrets

Create these secrets in Google Secret Manager:

- `scamsignal-gemini-api-key`
- `scamsignal-web-risk-api-key`

Grant the Cloud Run runtime service account `Secret Manager Secret Accessor`. Restrict each API key to only its required API where possible.

## 4. Deploy from source

Run from the project directory after selecting the correct Google Cloud project:

```bash
gcloud run deploy scamsignal-ai \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_MODEL=gemini-2.5-flash \
  --set-secrets GEMINI_API_KEY=scamsignal-gemini-api-key:latest,WEB_RISK_API_KEY=scamsignal-web-risk-api-key:latest \
  --memory 512Mi \
  --cpu 1 \
  --concurrency 40 \
  --max-instances 3
```

The Docker image runs as a non-root user and listens on Cloud Run's injected `PORT`.

## 5. Verify before updating the competition form

```bash
curl https://YOUR_SERVICE_URL/health
curl https://YOUR_SERVICE_URL/api/status
```

Then test these cases in the public UI:

1. A normal HTTPS link with no strong structural signal.
2. The fictional NovaBank one-character typosquat.
3. A URL with a deceptive subdomain.
4. A text containing a sample OTP value to confirm local redaction.
5. A screenshot to confirm multimodal extraction.

## 6. Submission updates

Before 23:59 on 30/08/2026, edit the completion form with:

- Deployment: identify the verified AI Studio/Cloud Run deployment actually used.
- The single verified public URL.
- Google integrations: AI Studio, Gemini structured output and Cloud Run.
- List Web Risk only when `/api/status` reports it configured and the public smoke test confirms it.
- Real test and interaction numbers only.

Do not update the form until the public service, Web Risk status, and end-to-end Gemini flow have all been verified.
