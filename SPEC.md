# Tour Tracker — Spec

## Business rules

- Workers attend a mandatory facility tour at the Reach site before their first shift
- Colton/Josh confirm attendance onsite; they initiate the record for each worker who shows up
- A candidate score below 5 is ineligible — Colton marks them ineligible in Notes and sets Added to Shifts = N
- DT = drug test performed onsite; THC Positive = Y is a red flag
- BGC results are tracked by Elise (NY WOps) until officially rolled out to another process
- The existing Google Sheet remains the source of truth; this app writes to it, not around it

## Data model

All data lives in Google Sheet `1UwV4aSCWyKDLbKdQj31aT1EJ6BtPcEjCQ4UfS_MaLS4`, tab gid `2073822165`.

Column headers (read dynamically from row 1 at startup):

| Column | Owner | Type | Source |
|--------|-------|------|--------|
| Schedule | Onsite | Text (Front Half / Back Half / Night Shift) | Form |
| Worker name | Onsite | Text | Auto-fill from Traba |
| Tour Date | Onsite | Date | Form |
| Worker Picture | Onsite | URL | Auto-fill from Traba |
| Candidate Score (1-10) | Onsite | Number | Form |
| DT Performed | Onsite | Y/N | Form |
| DT Results Clear | Onsite | Y/N | Form |
| THC Positive | Onsite | Y/N | Form |
| Doc Signed | Onsite | Y/N | Form |
| Notes | Onsite | Text | Form |
| Email | GWOps | Text | Auto-fill from Traba |
| Phone Number | GWOps | Text | Auto-fill from Traba |
| Console Link | GWOps | URL | Auto-fill from Traba |
| Start Date | GWOps | Date | Form |
| Name sent on list | GWOps | Y/N | Form |
| Added to Shifts | GWOps | Y/N | Form |
| Paid for tour? | NY WOps | Y/N | Form |
| BG Results Clear? | NY WOps | Y/N / Text | Form |

## Key workflows

### Onsite entry
1. Colton or Josh opens the app → Onsite Entry tab
2. Types worker name or phone number into the search box
3. App calls `/api/workers/search` → backend calls Traba MCP `get_worker` or `raw_worker_search`
4. Worker card renders with auto-filled: name, photo, email, phone, console link, BGC status
5. They fill in: Schedule, Tour Date, Candidate Score, DT fields, Doc Signed, Notes
6. Submit → POST `/api/tour-records` → backend appends a new row to the sheet

### GWOps queue
1. Fernando opens GWOps Queue tab → app loads all records from sheet
2. Table shows all workers with editable: Start Date, Name Sent on List, Added to Shifts
3. Fernando fills in fields per worker → clicks Save → PATCH `/api/tour-records/:rowIndex`
4. Backend updates only the specific cells for that row (never overwrites other columns)

### NY WOps queue
1. Elise opens NY WOps Queue tab → same load pattern
2. Table shows: worker name, tour date, score, DT status
3. Editable: Paid for Tour, BGC Results Clear
4. Save → PATCH `/api/tour-records/:rowIndex`

## Integrations

### Traba Ops API
- Base URL: `https://ops-prod.traba.tech/v1/mcp`
- Protocol: MCP HTTP (JSON-RPC over POST)
- Auth: `Authorization: Bearer {TRABA_API_TOKEN}`
- Tools used: `raw_worker_search` (name search → returns IDs), `get_worker` (ID or phone → full profile)
- Worker profile fields used: uid, firstName, lastName, email, phoneNumber, photoUrl, backgroundCheck.assessment
- Console link constructed as: `https://console.traba.work/workers/{uid}`

### Google Sheets API
- Auth: Google service account (GOOGLE_SERVICE_ACCOUNT_JSON env var)
- Sheet ID: `1UwV4aSCWyKDLbKdQj31aT1EJ6BtPcEjCQ4UfS_MaLS4`
- Column positions read dynamically from row 1 at server startup — no hardcoded column letters
- New rows appended with `values.append` (INSERT_ROWS)
- Updates use `values.batchUpdate` targeting specific cells by row index + column letter

## Known limitations

- Column names in the app must match the sheet headers exactly (case-sensitive)
- If the sheet tab is renamed, update the gid reference in server.js or the app will fall back to the first tab
- The Traba API token is a session-based OAuth token managed by the MCP infrastructure — engineering needs to provide a stable service account token for the deployed app
- Photo URLs are Firebase Storage URLs; they are publicly accessible but may expire if the token in the URL changes
- No authentication on the web app itself — must be protected by Cloudflare Access before deployment
