# AI Provider Configuration

Vericla selects its backend AI provider with the `VERICLA_AI_PROVIDER` setting. The default is `openai`; the backend never falls back to fake output when real-provider configuration is missing.

## Real provider

Copy `backend/.env.example` to `backend/.env` and set:

```dotenv
VERICLA_AI_PROVIDER=openai
VERICLA_AI_API_KEY=your-provider-key
VERICLA_AI_BASE_URL=https://api.openai.com/v1
VERICLA_AI_MODEL=gpt-4o-mini
VERICLA_AI_TIMEOUT_SECONDS=30
```

The API key is read only by the FastAPI backend. Never put it in frontend variables, Vite configuration, source code, or browser storage. `VERICLA_AI_BASE_URL` can point to an OpenAI-compatible chat-completions endpoint. Keep uploaded documents and provider prompts within an endpoint whose data handling is acceptable for your deployment.

When the provider or key is not configured, analysis, Q&A, and comparison return a safe 503 response instead of canned results. Provider authentication details, response bodies, and network exception text are not returned to the client.

## Fake provider

Set `VERICLA_AI_PROVIDER=fake` only for deterministic local development or tests. Tests select this mode explicitly. Fake output is not genuine document analysis and must not be presented as such in a production deployment.

## Data and limitations

Uploaded documents and generated results remain in the existing ephemeral in-memory stores; this integration adds no database or persistence. The provider receives selected document chunks through the existing bounded context pipeline.

Vericla provides document information and assistance, not professional legal advice. AI output can be incomplete or incorrect and should be checked against the cited source and, where appropriate, reviewed by qualified legal counsel.
