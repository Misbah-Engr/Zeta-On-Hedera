-- Schema initialization for Zeta agent onboarding
CREATE TABLE IF NOT EXISTS agents (
  id                TEXT PRIMARY KEY,
  wallet_address    TEXT NOT NULL UNIQUE,
  legal_name        TEXT NOT NULL,
  base_location     TEXT,
  compliance_contact TEXT,
  cold_chain_capable INTEGER NOT NULL DEFAULT 0,
  fleet_details     TEXT,
  insurance_provider TEXT,
  operating_regions TEXT,
  certifications    TEXT,
  proof_bundle_url  TEXT,
  proof_bundle_cid  TEXT,
  status            TEXT NOT NULL DEFAULT 'submitted'
                     CHECK (status IN ('draft','submitted','under_review','approved','rejected','suspended')),
  risk_score_bps    INTEGER DEFAULT 10000,
  fee_schedule_cid  TEXT,
  whitelist_tx_hash TEXT,
  reviewer_id       TEXT,
  reviewed_at       TEXT,
  reviewer_notes    TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_wallet ON agents(wallet_address);

CREATE TABLE IF NOT EXISTS agent_documents (
  id              TEXT PRIMARY KEY,
  agent_id        TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  doc_type        TEXT NOT NULL
                   CHECK (doc_type IN ('company_reg','insurance','gdp','iso','cold_chain','permit','id','other')),
  storage_provider TEXT NOT NULL CHECK (storage_provider IN ('ipfs','r2','http')),
  url             TEXT,
  cid             TEXT,
  sha256          TEXT,
  issued_by       TEXT,
  issued_at       TEXT,
  expires_at      TEXT,
  is_valid        INTEGER NOT NULL DEFAULT 0,
  verifier_id     TEXT,
  verified_at     TEXT,
  notes           TEXT
);
CREATE INDEX IF NOT EXISTS idx_docs_agent ON agent_documents(agent_id);
CREATE INDEX IF NOT EXISTS idx_docs_exp ON agent_documents(expires_at);

CREATE TABLE IF NOT EXISTS agent_regions (
  agent_id    TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  region_code TEXT NOT NULL,
  PRIMARY KEY (agent_id, region_code)
);

CREATE TABLE IF NOT EXISTS fleet_assets (
  id           TEXT PRIMARY KEY,
  agent_id     TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  kind         TEXT CHECK (kind IN ('bike','van','truck','cold_truck','other')),
  capacity_kg  INTEGER,
  volume_l     INTEGER,
  special_handling TEXT
);

CREATE TABLE IF NOT EXISTS review_events (
  id          TEXT PRIMARY KEY,
  agent_id    TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  actor_id    TEXT NOT NULL,
  action      TEXT NOT NULL,
  reason_codes TEXT,
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_review_agent ON review_events(agent_id);

CREATE TRIGGER IF NOT EXISTS agents_touch AFTER UPDATE ON agents
BEGIN
  UPDATE agents SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS orders (
  id                TEXT PRIMARY KEY,
  buyer_wallet      TEXT NOT NULL,
  agent_id          TEXT,
  commodity         TEXT NOT NULL,
  origin            TEXT NOT NULL,
  destination       TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'Created'
                     CHECK (status IN ('Created','Matched','InTransit','Delivered','Disputed','Resolved','Cancelled')),
  price_amount      INTEGER,
  price_currency    TEXT,
  weight_kg         INTEGER,
  pickup_at         TEXT,
  delivery_by       TEXT,
  delivery_instructions TEXT,
  manifest_url      TEXT,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_wallet);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_events (
  id           TEXT PRIMARY KEY,
  order_id     TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status       TEXT NOT NULL
                CHECK (status IN ('Created','Matched','InTransit','Delivered','Disputed','Resolved','Cancelled')),
  note         TEXT,
  actor_wallet TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events(order_id);

CREATE TABLE IF NOT EXISTS order_documents (
  id               TEXT PRIMARY KEY,
  order_id         TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  doc_type         TEXT NOT NULL
                     CHECK (doc_type IN ('bill_of_lading','temperature_log','proof_of_delivery','photo','invoice','other')),
  storage_provider TEXT NOT NULL CHECK (storage_provider IN ('ipfs','r2','http')),
  url              TEXT,
  cid              TEXT,
  sha256           TEXT,
  uploaded_by      TEXT,
  uploaded_at      TEXT,
  notes            TEXT
);
CREATE INDEX IF NOT EXISTS idx_order_documents_order ON order_documents(order_id);

CREATE TRIGGER IF NOT EXISTS orders_touch AFTER UPDATE ON orders
BEGIN
  UPDATE orders SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = NEW.id;
END;
