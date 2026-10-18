CREATE TABLE discovered_catalog (
 id TEXT PRIMARY KEY,
 identity_key TEXT NOT NULL UNIQUE,
 source_url TEXT NOT NULL UNIQUE,
 record TEXT NOT NULL,
 discovered_at TEXT NOT NULL
);
