# CLERESTORY v16 — HubSpot-Style Property Detail + Notes Timeline

## What's New in v16

### Property Detail — HubSpot-Style Layout
- **Header** — property name, location, vacancy badge, prop type tag, Google Maps + OneDrive links, catalyst tags (now color-coded by urgency), AI score + probability
- **Timeline** — merged activity + notes feed below header. Add notes (Note, Intel, Call Log, Meeting Note, Status Update), set follow-ups with due dates, log activities — all inline. Overdue follow-ups show red banners.
- **Property Details card** — all building specs: record type, prop type, building SF, land acres, year built, clear height, dock doors, grade doors, market, submarket. Inline APN management (add/remove APNs directly)
- **Owner & Tenant card** — separated into two blocks. Owner: name, type, last transfer date, last sale price, $/SF. Tenant: name, vacancy, lease type, in-place rent, market rent, lease expiration
- **Sortable + Filterable tabs** — every tab (Leads, Deals, Contacts, Comps, Tasks) now has column sorting (click headers) and a filter bar

### APN Management
- Add APNs inline from Property Detail (+ APN button)
- Remove APNs with × button
- Full APN editing in Edit Property modal (add/remove rows, synced on save)
- `syncPropertyApns()` — deletes all and re-inserts on save

### Catalyst Tag Colors Fixed
- Tags now show urgency-based colors everywhere (red = immediate, amber/orange = high, blue = medium, ghost = low)
- Fixed broken lookup in PropertyDetail that was treating `CATALYST_URGENCY` as nested when it's flat
- Added shared `catalystTagClass()` helper in constants.js
- Fixed in: PropertyDetail, PropertiesList, LeadGen, LeadDetail

### Notes Timeline (new table)
- Timestamped notes for any record (deals, leads, properties, accounts, contacts)
- Note types: Note, Intel, Call Log, Meeting Note, Status Update
- Pinnable notes
- Merged into timeline feed with activities

### Follow-Ups (new table)
- Lightweight follow-up reminders tied to any record
- Due date + reason
- Overdue follow-ups highlighted in red
- Complete with ✓ Done button

### New Database Tables
- `notes` — polymorphic notes timeline
- `follow_ups` — follow-up reminders with due dates
- `deal_contacts` — junction table linking contacts to deals with roles
- `buyer_outreach` — outreach log per deal with direction, method, outcome
- Properties: added `market`, `lease_type`, `in_place_rent`, `market_rent`, `office_pct` columns

### Also Includes (from prior versions)
- Morning Command Center with AI brief
- 9-stage Deal Pipeline (Tracking → Closed/Dead)
- 2-stage Lead Gen with AI Next Step + Kill Lead
- 67 SoCal industrial buyer accounts with Buyer Matching Engine
- 208 seeded leads (113 IE-West + 95 SGV)
- Contacts, Accounts, Activities, Tasks
- Lease Comps + Sale Comps with detail pages
- Auth / Login / Profile
- Cmd+K global search, CSV import, PWA
- Ice blue theme

---

## Deployment

### FRESH INSTALL

1. **Supabase** → New project → SQL Editor → Paste `supabase/schema.sql` → Run
2. **Supabase** → SQL Editor → Paste `sql/02_accounts_67_buyers.sql` → Run
3. **Supabase** → SQL Editor → Paste `sql/03_contacts_seed.sql` → Run
4. **Supabase** → SQL Editor → Paste `sql/04_leads_seed.sql` → Run
5. **Supabase** → Settings → API → Copy Project URL + anon key
6. **GitHub** → New repo → Upload all files → package.json at root
7. **Vercel** → Import repo → Add env vars `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Deploy

### UPGRADE from v15

1. **Supabase** → SQL Editor → Paste `sql/07_v16_deal_contacts_outreach_notes.sql` → Run
2. **GitHub** → Replace all files → Commit → Vercel auto-redeploys

### UPGRADE from v14 or below

1. Run all SQL migrations in order: `01` → `02` → `03` → `04` → `05` → `06` → `07`
2. Replace all files → Commit → Deploy
