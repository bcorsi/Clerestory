-- ══════════════════════════════════════════════════════════════
-- CLERESTORY — Database Schema v11
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ─── PROPERTIES ─────────────────────────────────────────────
create table properties (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  address text,
  city text,
  zip text,
  submarket text,
  market text,
  record_type text,
  prop_type text,
  building_sf integer,
  land_acres numeric(10,2),
  year_built integer,
  clear_height integer,
  dock_doors integer,
  grade_doors integer,
  market text,
  owner text,
  owner_type text,
  last_transfer_date date,
  last_sale_price numeric(15,2),
  price_psf numeric(10,2),
  tenant text,
  vacancy_status text,
  lease_type text,
  lease_expiration date,
  in_place_rent numeric(8,2),
  market_rent numeric(8,2),
  office_pct integer,
  catalyst_tags text[],
  ai_score integer,
  probability integer,
  notes text,
  onedrive_url text,
  owner_account_id uuid references accounts(id) on delete set null
);

create table property_apns (
  id uuid default uuid_generate_v4() primary key,
  property_id uuid references properties(id) on delete cascade,
  apn text not null,
  acres numeric(10,2),
  created_at timestamptz default now()
);
create index idx_apns_property on property_apns(property_id);
create index idx_apns_apn on property_apns(apn);

-- ─── LEADS ──────────────────────────────────────────────────
create table leads (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  lead_name text not null,
  stage text default 'Lead',
  property_id uuid references properties(id) on delete set null,
  address text,
  submarket text,
  market text,
  owner text,
  owner_type text,
  company text,
  decision_maker text,
  phone text,
  email text,
  catalyst_tags text[],
  tier text,
  score integer,
  priority text default 'Medium',
  next_action text,
  next_action_date date,
  last_contact_date date,
  est_value numeric(15,2),
  building_sf integer,
  city text,
  zip text,
  prop_type text,
  record_type text,
  land_acres numeric(10,2),
  year_built integer,
  clear_height integer,
  dock_doors integer,
  grade_doors integer,
  vacancy_status text,
  lease_type text,
  lease_expiration date,
  in_place_rent numeric(8,2),
  notes text,
  converted_deal_id uuid,
  kill_reason text,
  killed_at timestamptz
);

-- ─── DEALS ──────────────────────────────────────────────────
create table deals (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deal_name text,
  stage text default 'Tracking',
  deal_type text,
  strategy text,
  marketing_type text default 'Off-Market',
  property_id uuid references properties(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  address text,
  submarket text,
  market text,
  buyer text,
  seller text,
  tenant_name text,
  deal_value numeric(15,2),
  commission_rate numeric(5,2),
  commission_est numeric(15,2),
  probability integer,
  priority text default 'Medium',
  close_date date,
  onedrive_url text,
  buyer_account_id uuid references accounts(id) on delete set null,
  seller_account_id uuid references accounts(id) on delete set null,
  notes text
);

-- ─── CONTACTS ───────────────────────────────────────────────
create table contacts (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text,
  company text,
  title text,
  contact_type text,
  phone text,
  email text,
  linkedin text,
  property_id uuid references properties(id) on delete set null,
  deal_id uuid references deals(id) on delete set null,
  account_id uuid references accounts(id) on delete set null,
  notes text
);

-- ─── ACCOUNTS ───────────────────────────────────────────────
create table accounts (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Identity
  name text not null,
  account_type text,
  entity_type text,
  buyer_type text,
  market text,
  city text,
  hq_state text,
  phone text,
  email text,
  website text,

  -- Buyer Criteria (Powers Matching Engine)
  preferred_markets text[],
  deal_type_preference text[],
  product_preference text[],
  min_sf integer,
  max_sf integer,
  min_price numeric(15,2),
  max_price numeric(15,2),
  min_price_psf numeric(10,2),
  max_price_psf numeric(10,2),
  yield_target numeric(5,2),
  irr_target numeric(5,2),
  risk_profile text,
  acquisition_timing text,
  min_clear_height integer,
  power_requirement text,
  geographic_focus text,
  last_criteria_update date,

  -- Activity & Intelligence
  buyer_activity_score integer default 0,
  buyer_velocity_score integer default 0,
  total_deals_closed integer default 0,
  total_deal_value numeric(15,2) default 0,
  last_deal_close_date date,
  known_acquisitions text,
  ai_account_summary text,
  est_capital_deployed text,
  deal_count text,

  -- Owner-Side
  slb_candidate boolean default false,
  portfolio_size integer,
  source text,
  notes text
);

create index idx_accounts_buyer_type on accounts(buyer_type);
create index idx_accounts_timing on accounts(acquisition_timing);
create index idx_accounts_name on accounts(name);

-- ─── TASKS ──────────────────────────────────────────────────
create table tasks (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  title text not null,
  description text,
  due_date date,
  priority text default 'Medium',   -- High | Medium | Low
  completed boolean default false,
  completed_at timestamptz,

  -- Link to any record (optional)
  lead_id uuid references leads(id) on delete set null,
  deal_id uuid references deals(id) on delete set null,
  property_id uuid references properties(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  account_id uuid references accounts(id) on delete set null
);

create trigger trg_tasks_updated before update on tasks
  for each row execute function update_updated_at();

-- ─── ACTIVITIES ─────────────────────────────────────────────
create table activities (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now(),
  activity_type text not null,
  subject text,
  notes text,
  activity_date date default current_date,
  due_date date,
  completed boolean default false,
  outcome text,
  property_id uuid references properties(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  deal_id uuid references deals(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null
);

-- ─── LEASE COMPS ────────────────────────────────────────────
create table lease_comps (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now(),
  address text, city text, submarket text, tenant text,
  rsf integer, rate numeric(8,2), lease_type text,
  term_months integer, start_date date,
  free_rent_months integer, ti_psf numeric(8,2),
  property_id uuid references properties(id) on delete set null,
  notes text
);

-- ─── SALE COMPS ─────────────────────────────────────────────
create table sale_comps (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now(),
  address text, city text, submarket text,
  building_sf integer, land_acres numeric(10,2),
  year_built integer, clear_height integer,
  sale_price numeric(15,2), price_psf numeric(10,2),
  cap_rate numeric(5,2), sale_date date,
  buyer text, seller text,
  sale_type text,
  property_id uuid references properties(id) on delete set null,
  notes text
);

-- ─── DEAL CONTACTS (junction) ───────────────────────────────
create table deal_contacts (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now(),
  deal_id uuid not null references deals(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  role text default 'Participant',
  unique(deal_id, contact_id)
);
create index idx_deal_contacts_deal on deal_contacts(deal_id);
create index idx_deal_contacts_contact on deal_contacts(contact_id);

-- ─── BUYER OUTREACH LOG ────────────────────────────────────
create table buyer_outreach (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now(),
  deal_id uuid not null references deals(id) on delete cascade,
  account_id uuid references accounts(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  direction text default 'Outbound',
  method text default 'Email',
  outcome text,
  notes text,
  outreach_date date default current_date,
  follow_up_date date
);
create index idx_outreach_deal on buyer_outreach(deal_id);
create index idx_outreach_account on buyer_outreach(account_id);

-- ─── NOTES TIMELINE ────────────────────────────────────────
create table notes (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now(),
  content text not null,
  note_type text default 'Note',
  deal_id uuid references deals(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  property_id uuid references properties(id) on delete cascade,
  account_id uuid references accounts(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  pinned boolean default false
);
create index idx_notes_deal on notes(deal_id);
create index idx_notes_lead on notes(lead_id);
create index idx_notes_property on notes(property_id);
create index idx_notes_account on notes(account_id);

-- ─── FOLLOW-UPS ────────────────────────────────────────────
create table follow_ups (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now(),
  due_date date not null,
  reason text not null,
  completed boolean default false,
  completed_at timestamptz,
  deal_id uuid references deals(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  property_id uuid references properties(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  account_id uuid references accounts(id) on delete cascade
);
create index idx_followups_due on follow_ups(due_date) where not completed;
create index idx_followups_deal on follow_ups(deal_id);
create index idx_followups_lead on follow_ups(lead_id);

-- ─── TIMESTAMPS ─────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger trg_properties_updated before update on properties for each row execute function update_updated_at();
create trigger trg_leads_updated before update on leads for each row execute function update_updated_at();
create trigger trg_deals_updated before update on deals for each row execute function update_updated_at();
create trigger trg_contacts_updated before update on contacts for each row execute function update_updated_at();
create trigger trg_accounts_updated before update on accounts for each row execute function update_updated_at();

-- ─── VIEW: Properties with APNs ─────────────────────────────
create or replace view properties_with_apns as
select p.*, coalesce(json_agg(json_build_object('apn', a.apn, 'acres', a.acres)) filter (where a.id is not null), '[]'::json) as apns
from properties p left join property_apns a on a.property_id = p.id group by p.id;

-- ─── DAILY BRIEFS (AI morning brief persistence) ────────────
create table daily_briefs (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamptz default now(),
  brief_date date default current_date,
  content text not null,
  context jsonb
);
create index idx_briefs_date on daily_briefs(brief_date);
