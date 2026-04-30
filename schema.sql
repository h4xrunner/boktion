-- ============================================================
-- SAGA — PostgreSQL Veritabanı Şeması
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- full-text search için

-- ─── WORKSPACES ──────────────────────────────────────────────
CREATE TABLE workspaces (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  logo_url      text,
  plan          text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','plus','business','enterprise')),
  custom_domain text UNIQUE,
  settings      jsonb NOT NULL DEFAULT '{}',
  -- SSO & Security
  saml_enabled  boolean NOT NULL DEFAULT false,
  saml_config   jsonb,
  ip_whitelist  text[],
  session_timeout_hours int NOT NULL DEFAULT 24,
  mfa_required  boolean NOT NULL DEFAULT false,
  scim_token    text UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

-- ─── USERS ───────────────────────────────────────────────────
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  name          text NOT NULL,
  avatar_url    text,
  password_hash text,
  email_verified boolean NOT NULL DEFAULT false,
  totp_secret   text,
  totp_enabled  boolean NOT NULL DEFAULT false,
  last_active   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

-- ─── WORKSPACE MEMBERS ───────────────────────────────────────
CREATE TABLE workspace_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member','guest')),
  invited_by   uuid REFERENCES users(id),
  joined_at    timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

-- ─── INVITATIONS ─────────────────────────────────────────────
CREATE TABLE invitations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email        text NOT NULL,
  role         text NOT NULL DEFAULT 'member',
  token        text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by   uuid NOT NULL REFERENCES users(id),
  accepted_at  timestamptz,
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── SESSIONS ────────────────────────────────────────────────
CREATE TABLE sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token        text NOT NULL UNIQUE,
  ip_address   inet,
  user_agent   text,
  expires_at   timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now()
);

-- ─── PAGES ───────────────────────────────────────────────────
CREATE TABLE pages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_id    uuid REFERENCES pages(id) ON DELETE CASCADE,
  created_by   uuid NOT NULL REFERENCES users(id),
  title        text NOT NULL DEFAULT 'Başlıksız',
  icon         text DEFAULT '📄',
  cover_url    text,
  is_pinned    boolean NOT NULL DEFAULT false,
  is_public    boolean NOT NULL DEFAULT false,
  public_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  sort_order   float NOT NULL DEFAULT 0,
  -- Full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('turkish', coalesce(title, ''))
  ) STORED,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

CREATE INDEX idx_pages_workspace ON pages(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_parent ON pages(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pages_search ON pages USING GIN(search_vector);

-- ─── BLOCKS ──────────────────────────────────────────────────
CREATE TABLE blocks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id      uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  parent_id    uuid REFERENCES blocks(id) ON DELETE CASCADE,
  type         text NOT NULL,  -- paragraph, heading_1, to_do, code, etc.
  content      jsonb NOT NULL DEFAULT '{}',
  sort_order   float NOT NULL DEFAULT 0,
  created_by   uuid REFERENCES users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_blocks_page ON blocks(page_id);
CREATE INDEX idx_blocks_parent ON blocks(parent_id);

-- Block version history (Business+ plan)
CREATE TABLE block_versions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id   uuid NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  content    jsonb NOT NULL,
  changed_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── DATABASES ───────────────────────────────────────────────
CREATE TABLE databases (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  page_id      uuid REFERENCES pages(id) ON DELETE SET NULL,
  title        text NOT NULL DEFAULT 'Yeni Veritabanı',
  icon         text DEFAULT '🗄️',
  created_by   uuid NOT NULL REFERENCES users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

-- ─── DB PROPERTIES ───────────────────────────────────────────
CREATE TABLE db_properties (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id uuid NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
  name        text NOT NULL,
  type        text NOT NULL, -- title, text, number, select, multi_select, date, checkbox, url, email, phone, person, file, relation, rollup, formula, created_at, updated_at, created_by
  config      jsonb NOT NULL DEFAULT '{}', -- options for select, formula expr, relation db_id, etc.
  sort_order  float NOT NULL DEFAULT 0,
  is_hidden   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── DB RECORDS ──────────────────────────────────────────────
CREATE TABLE db_records (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id uuid NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
  created_by  uuid REFERENCES users(id),
  sort_order  float NOT NULL DEFAULT 0,
  -- Full-text search on title
  title_text  text,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('turkish', coalesce(title_text, ''))
  ) STORED,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);

CREATE INDEX idx_records_database ON db_records(database_id) WHERE deleted_at IS NULL;

-- ─── DB RECORD VALUES ────────────────────────────────────────
CREATE TABLE db_record_values (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id   uuid NOT NULL REFERENCES db_records(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES db_properties(id) ON DELETE CASCADE,
  value       jsonb NOT NULL DEFAULT 'null',
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (record_id, property_id)
);

-- ─── DB VIEWS ────────────────────────────────────────────────
CREATE TABLE db_views (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id uuid NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
  name        text NOT NULL DEFAULT 'Varsayılan',
  type        text NOT NULL DEFAULT 'table' CHECK (type IN ('table','kanban','calendar','gallery','list','timeline')),
  config      jsonb NOT NULL DEFAULT '{}', -- group_by, sort, filter, hidden_properties
  sort_order  float NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── FORMS ───────────────────────────────────────────────────
CREATE TABLE forms (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  database_id  uuid REFERENCES databases(id) ON DELETE SET NULL,
  title        text NOT NULL DEFAULT 'Yeni Form',
  icon         text DEFAULT '📋',
  description  text,
  success_msg  text DEFAULT 'Yanıtınız alındı, teşekkürler!',
  is_published boolean NOT NULL DEFAULT false,
  password     text,
  closes_at    timestamptz,
  max_responses int,
  config       jsonb NOT NULL DEFAULT '{}',
  created_by   uuid NOT NULL REFERENCES users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

CREATE TABLE form_fields (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id    uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  property_id uuid REFERENCES db_properties(id) ON DELETE SET NULL,
  type       text NOT NULL, -- text, email, number, select, multi_select, date, file, checkbox, textarea, rating
  label      text NOT NULL,
  placeholder text,
  required   boolean NOT NULL DEFAULT false,
  options    jsonb DEFAULT '[]',
  sort_order float NOT NULL DEFAULT 0
);

CREATE TABLE form_responses (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id    uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  record_id  uuid REFERENCES db_records(id) ON DELETE SET NULL,
  data       jsonb NOT NULL DEFAULT '{}',
  ip_address inet,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

-- ─── AUTOMATIONS ─────────────────────────────────────────────
CREATE TABLE automations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  database_id  uuid REFERENCES databases(id) ON DELETE CASCADE,
  name         text NOT NULL,
  is_enabled   boolean NOT NULL DEFAULT true,
  trigger_type text NOT NULL, -- property_changed, record_added, date_reached, form_submitted, manual
  trigger_config jsonb NOT NULL DEFAULT '{}',
  conditions   jsonb NOT NULL DEFAULT '[]', -- AND/OR rules
  actions      jsonb NOT NULL DEFAULT '[]', -- [{type, config}]
  run_count    int NOT NULL DEFAULT 0,
  last_run_at  timestamptz,
  created_by   uuid NOT NULL REFERENCES users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE automation_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  status        text NOT NULL CHECK (status IN ('success','failed','skipped')),
  trigger_data  jsonb,
  error_message text,
  ran_at        timestamptz NOT NULL DEFAULT now()
);

-- ─── SITES ───────────────────────────────────────────────────
CREATE TABLE sites (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  page_id      uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  subdomain    text UNIQUE, -- {subdomain}.saga.app
  custom_domain text UNIQUE,
  password     text,
  meta_title   text,
  meta_desc    text,
  og_image_url text,
  is_published boolean NOT NULL DEFAULT false,
  view_count   bigint NOT NULL DEFAULT 0,
  created_by   uuid NOT NULL REFERENCES users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── INTEGRATIONS ────────────────────────────────────────────
CREATE TABLE integrations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type         text NOT NULL, -- slack, github, google_drive, zapier, webhook
  name         text NOT NULL,
  config       jsonb NOT NULL DEFAULT '{}', -- webhook_url, token vb.
  is_active    boolean NOT NULL DEFAULT true,
  created_by   uuid NOT NULL REFERENCES users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────
CREATE TABLE notifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         text NOT NULL, -- mention, assign, comment, deadline, automation
  title        text NOT NULL,
  body         text,
  link         text,
  is_read      boolean NOT NULL DEFAULT false,
  created_by   uuid REFERENCES users(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifs_user ON notifications(user_id, is_read, created_at DESC);

-- ─── COMMENTS ────────────────────────────────────────────────
CREATE TABLE comments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  page_id      uuid REFERENCES pages(id) ON DELETE CASCADE,
  record_id    uuid REFERENCES db_records(id) ON DELETE CASCADE,
  parent_id    uuid REFERENCES comments(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES users(id),
  content      jsonb NOT NULL, -- blok formatında
  is_resolved  boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

-- ─── AUDIT LOGS ──────────────────────────────────────────────
CREATE TABLE audit_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      uuid REFERENCES users(id),
  action       text NOT NULL, -- page.create, page.delete, member.invite, permission.change, ...
  resource_type text,         -- page, database, member, automation, ...
  resource_id  text,
  metadata     jsonb DEFAULT '{}',
  ip_address   inet,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_workspace ON audit_logs(workspace_id, created_at DESC);

-- ─── TEMPLATES ───────────────────────────────────────────────
CREATE TABLE templates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE, -- NULL = global
  title        text NOT NULL,
  description  text,
  icon         text DEFAULT '📄',
  category     text, -- meeting, planning, crm, sprint, etc.
  content      jsonb NOT NULL DEFAULT '{}', -- serialized page + blocks
  is_public    boolean NOT NULL DEFAULT false,
  use_count    int NOT NULL DEFAULT 0,
  created_by   uuid REFERENCES users(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── SEARCH INDEX (materialized view) ───────────────────────
CREATE MATERIALIZED VIEW search_index AS
  SELECT
    'page'::text as type,
    p.id,
    p.workspace_id,
    p.title,
    p.icon,
    p.updated_at,
    to_tsvector('turkish', coalesce(p.title, '')) as tsv
  FROM pages p
  WHERE p.deleted_at IS NULL
UNION ALL
  SELECT
    'record'::text,
    r.id,
    d.workspace_id,
    r.title_text,
    db.icon,
    r.updated_at,
    to_tsvector('turkish', coalesce(r.title_text, ''))
  FROM db_records r
  JOIN databases db ON db.id = r.database_id
  JOIN workspaces d ON d.id = db.workspace_id
  WHERE r.deleted_at IS NULL;

CREATE INDEX idx_search_workspace ON search_index(workspace_id);
CREATE INDEX idx_search_tsv ON search_index USING GIN(tsv);

-- ─── FUNCTIONS ───────────────────────────────────────────────

-- updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tüm tablolara trigger ekle
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['workspaces','users','workspace_members','pages','blocks','databases','db_properties','db_records','db_views','forms','automations','sites','integrations','comments']
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END $$;

-- Sayfa silme: alt sayfaları ve blokları da sil (soft)
CREATE OR REPLACE FUNCTION soft_delete_page(p_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE pages SET deleted_at = now() WHERE id = p_id OR parent_id = p_id;
END;
$$ LANGUAGE plpgsql;
