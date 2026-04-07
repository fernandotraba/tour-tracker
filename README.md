# Tour Tracker

Internal tool for tracking Reach facility tour attendees and managing the onboarding pipeline.

## Who uses it

| Team | Role |
|------|------|
| **Onsite** (Colton & Josh) | Add workers after tours, record DT results and docs |
| **GWOps** (Fernando) | Set start dates, confirm name sent, mark added to shifts |
| **NY WOps** (Elise) | Confirm paid for tour, record BGC results |

## How it works

1. Onsite team searches a worker by name or phone — profile auto-fills from Traba
2. They fill in tour-specific fields (score, DT, doc signed) and submit
3. Submission writes a new row to the existing Google Sheet
4. GWOps and NY WOps see queues of all records and update their columns inline

## Setup

```bash
cp .env.example .env
# Fill in TRABA_API_TOKEN and GOOGLE_SERVICE_ACCOUNT_JSON (see .env.example)
npm install
npm start
```

App runs at http://localhost:3000

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TRABA_API_TOKEN` | Yes | Bearer token for Traba ops API — get from engineering |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Yes | Stringified JSON key for a Google service account with sheet access |
| `TRABA_MCP_URL` | No | Defaults to `https://ops-prod.traba.tech/v1/mcp` |
| `PORT` | No | Defaults to `3000` (Railway sets automatically) |
