# Supabase Edge Functions for 100 Minds Mobile

This directory contains Supabase Edge Functions for proxying Tavus API requests.

## Setup

1. Install Supabase CLI:

```bash
brew install supabase/tap/supabase
```

2. Link to your Supabase project:

```bash
supabase link --project-ref your-project-ref
```

3. Set secrets for Tavus API key:

```bash
supabase secrets set TAVUS_API_KEY=your_tavus_api_key_here
```

## Functions

### tavus-proxy

Proxies requests to the Tavus API to keep API keys secure server-side.

**Endpoints:**

- `POST /tavus-proxy/personas` - Create a new persona
- `GET /tavus-proxy/personas/:personaId` - Get persona status
- `GET /tavus-proxy/documents` - List indexed documents
- `GET /tavus-proxy/replicas` - List available video avatars

## Deploy

Deploy all functions:

```bash
supabase functions deploy
```

Deploy specific function:

```bash
supabase functions deploy tavus-proxy
```

## Local Development

Run functions locally:

```bash
supabase functions serve
```

Then test with:

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/tavus-proxy/personas' \
  --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"personaInput": {...}}'
```
