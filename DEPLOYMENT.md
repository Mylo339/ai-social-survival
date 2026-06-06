# Web Beta Deployment

The repository root is a complete deployable Node web service. It includes a `Dockerfile`, a Render Blueprint, a health endpoint, release tests, security headers, and an offline local-coach fallback.

## Recommended first deployment

Use Render as a Docker web service:

1. Push this directory to a GitHub or GitLab repository.
2. In Render, create a Blueprint from that repository.
3. Render reads `render.yaml`, deploys in Singapore, and checks `/api/status`.
4. Confirm the generated `onrender.com` HTTPS URL passes the release checks below.

The free Render web-service plan is suitable for Web Beta testing, but it can sleep after inactivity and its local filesystem is not persistent. Before meaningful feedback collection, configure persistent storage or replace NDJSON feedback files with a managed database.

## Friend beta analytics

The beta can record opt-in anonymous product events to `data/events.ndjson`. Share source-tagged links so each channel can be measured:

```text
https://ai-social-survival.onrender.com/?src=friend_wechat
https://ai-social-survival.onrender.com/?src=uoa_friend_test
```

Set `ADMIN_TOKEN` in the hosting dashboard to enable the protected report endpoint:

```text
GET /api/admin/report
Authorization: Bearer YOUR_ADMIN_TOKEN
```

The report includes unique anonymous visitors, starts, completions, completion rate, average score, average duration, source breakdown and recent feedback. It does not include dialogue text or recordings.

## Optional online AI

The site remains fully usable without online AI. To enable more flexible character replies, configure these server-side secrets in the hosting dashboard:

```text
AI_ENDPOINT=https://provider.example/v1/chat/completions
AI_API_KEY=server-side-secret
AI_MODEL=model-name
```

Never place an API key in browser code or commit it to the repository.

For DeepSeek, use the OpenAI-compatible chat endpoint:

```text
AI_ENDPOINT=https://api.deepseek.com/chat/completions
AI_API_KEY=your-deepseek-api-key
AI_MODEL=deepseek-v4-flash
AI_THINKING=disabled
AI_TURN_RATE_LIMIT_PER_MINUTE=18
FEEDBACK_RATE_LIMIT_PER_MINUTE=20
EVENT_RATE_LIMIT_PER_MINUTE=140
```

Keep the key in Render environment variables only. After enabling it, verify `/api/status` shows `online-ai`, then complete at least one practice and one challenge scene before sharing the build.

`AI_API_KEY` and `ADMIN_TOKEN` are declared as unsynced placeholders in `render.yaml`; populate their values in the Render Dashboard, not in Git. If you use Render's `Add from .env` flow, remove any real key from the file immediately after the dashboard import.

## Data retention

Render's default service filesystem is ephemeral. For a real beta, either:

- attach a persistent disk and set `DATA_DIRECTORY` to that mounted path, such as `/var/data`; or
- replace the NDJSON files with a managed database before inviting a larger tester group.

The `/api/status` response includes a non-secret storage hint so deployment checks can catch an unconfigured data directory before testing starts.

## Release verification

```powershell
node --check app.js
node --check local-server.mjs
npm test
```

After deployment, verify:

- `/api/status` returns `200`;
- the homepage and all release assets load over HTTPS;
- microphone permission works on real iPhone Safari and Android Chrome;
- practice and challenge sessions both complete;
- privacy and terms pages match the configured AI and data storage;
- submitted feedback is retained after a service restart.
