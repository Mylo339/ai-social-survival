# Web Beta Deployment

The repository root is a complete deployable Node web service. It includes a `Dockerfile`, a Render Blueprint, a health endpoint, release tests, security headers, and an offline local-coach fallback.

## Recommended first deployment

Use Render as a Docker web service:

1. Push this directory to a GitHub or GitLab repository.
2. In Render, create a Blueprint from that repository.
3. Render reads `render.yaml`, deploys in Singapore, and checks `/api/status`.
4. Confirm the generated `onrender.com` HTTPS URL passes the release checks below.

The free Render web-service plan is suitable for Web Beta testing, but it can sleep after inactivity and its local filesystem is not persistent. Before meaningful feedback collection, configure persistent storage or replace NDJSON feedback files with a managed database.

## Optional online AI

The site remains fully usable without online AI. To enable more flexible character replies, configure these server-side secrets in the hosting dashboard:

```text
AI_ENDPOINT=https://provider.example/v1/chat/completions
AI_API_KEY=server-side-secret
AI_MODEL=model-name
```

Never place an API key in browser code or commit it to the repository.

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
