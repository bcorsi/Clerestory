# CLERESTORY v13 — Complete Build with Buyer Matching Engine

## What's New in v13

### Buyer Matching Engine
- **67 SoCal industrial buyer accounts** with full acquisition criteria
- **Buyer Matches tab** on every property page — scores all buyers 0–100
- **Match formula:** Market (+20) · Deal Type (+20) · SF Fit (+15) · Price/SF Fit (+15) · SLB Bonus (+10) · Clear Height (+5) · Power (+5) · Buyer Timing (+10)
- **Tier badges:** A (80+), B (60+), C (40+) with color-coded match reason tags
- **Upgraded Accounts page:** market color pills, $/SF ranges, timing badges, filter by buyer type/market/timing

### 208 Leads Seeded
- **113 IE-West** properties (scored, tiered, with decision makers, seller signals, research)
- **95 SGV** owner-user prospects (enriched from 4 source files with contacts, research notes)

### 10 Key Contacts Seeded
- Jerry Kohl (Brighton/Leegin), Snak King (Axelrod + Levin), Acromil (Niznick + Konheim), Hitex, Ultimate Paperbox, PRL Aluminum, Bridge Industrial, Rodriguez Produce

### Also Includes (from prior versions)
- Dashboard, Properties (table + detail + APNs + edit + photos + OneDrive + Google Maps)
- Deal Pipeline (10-stage kanban + drag-drop + expandable)
- Lead Gen (table + detail + convert to deal)
- Contacts (expandable + detail page)
- Lease Comps (table + full detail page w/ expenses + gross equivalent)
- Sale Comps page
- Tasks + Activities
- Auth / Login / Profile
- Cmd+K global search, CSV import, PWA
- Ice blue theme

---

## Deployment

### FRESH INSTALL (never deployed before)

1. **Supabase** -> Sign up -> New project -> SQL Editor -> Paste `supabase/schema.sql` -> Run
2. **Supabase** -> SQL Editor -> New query -> Paste `sql/02_accounts_67_buyers.sql` -> Run
3. **Supabase** -> SQL Editor -> New query -> Paste `sql/03_contacts_seed.sql` -> Run
4. **Supabase** -> SQL Editor -> New query -> Paste `sql/04_leads_seed.sql` -> Run
5. **Supabase** -> Settings -> API -> Copy Project URL + anon key
6. **GitHub** -> New repo -> Upload all files from this zip (contents at root, package.json at top level)
7. **Vercel** -> Import repo -> Add env vars NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY -> Deploy

### UPGRADE from existing Clerestory

1. **Supabase** -> SQL Editor -> Paste `sql/01_accounts_upgrade.sql` -> Run
2. **Supabase** -> SQL Editor -> New query -> Paste `sql/02_accounts_67_buyers.sql` -> Run
3. **Supabase** -> SQL Editor -> New query -> Paste `sql/03_contacts_seed.sql` -> Run
4. **Supabase** -> SQL Editor -> New query -> Paste `sql/04_leads_seed.sql` -> Run
5. **GitHub** -> Replace all files from this zip -> Commit -> Vercel auto-redeploys
