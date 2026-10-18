-- إيماء (Imaa) — core schema
-- Design rule: every safety promise is a constraint here, not a paragraph in a doc.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE signs (
    code            TEXT PRIMARY KEY,
    class           TEXT NOT NULL CHECK (class IN
                      ('symptom','condition','person','place','request',
                       'admin','document','action','answer','courtesy','data','emergency')),
    reliability     TEXT NOT NULL DEFAULT 'candidate'
                      CHECK (reliability IN ('candidate','reliable','retired')),
    verified_by     TEXT,
    verified_on     DATE,
    is_enabled      BOOLEAN NOT NULL DEFAULT FALSE,
    -- Ishara-AI allowed reliability='reliable' with no reviewer. We do not.
    CONSTRAINT reliable_needs_reviewer CHECK (
        reliability <> 'reliable' OR (verified_by IS NOT NULL AND verified_on IS NOT NULL)
    ),
    -- Nothing can be enabled unless a human signed off on it.
    CONSTRAINT enabled_must_be_reliable CHECK (
        NOT is_enabled OR reliability = 'reliable'
    )
);

CREATE TABLE sign_i18n (
    code    TEXT NOT NULL REFERENCES signs(code) ON DELETE CASCADE,
    lang    TEXT NOT NULL CHECK (lang IN ('ar','en','ur')),
    label   TEXT NOT NULL,
    PRIMARY KEY (code, lang)
);

-- Sentence templates: the only text Imaa can ever emit. No generation.
CREATE TABLE sentence_templates (
    sign_code   TEXT NOT NULL REFERENCES signs(code) ON DELETE CASCADE,
    lang        TEXT NOT NULL CHECK (lang IN ('ar','en','ur')),
    urgency     TEXT NOT NULL DEFAULT 'routine'
                  CHECK (urgency IN ('routine','urgent','emergency')),
    template    TEXT NOT NULL,
    reviewed_by TEXT NOT NULL,
    reviewed_on DATE NOT NULL,
    PRIMARY KEY (sign_code, lang, urgency)
);

-- Calibration is versioned data. A decision is reproducible only if the
-- exact gate it used is recorded.
CREATE TABLE calibration_releases (
    id              SERIAL PRIMARY KEY,
    model_hash      TEXT NOT NULL,
    alpha           REAL NOT NULL CHECK (alpha > 0 AND alpha < 1),
    qhat            REAL NOT NULL,
    n_calibration   INTEGER NOT NULL CHECK (n_calibration > 0),
    n_signers       INTEGER NOT NULL CHECK (n_signers >= 5),
    frozen_on       TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_active       BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE UNIQUE INDEX one_active_calibration
    ON calibration_releases (is_active) WHERE is_active;

CREATE TABLE decisions (
    id              BIGSERIAL PRIMARY KEY,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    dialect         TEXT NOT NULL CHECK (dialect IN ('psl','arsl')),
    target_lang     TEXT NOT NULL CHECK (target_lang IN ('ar','en','ur')),
    sign_code       TEXT REFERENCES signs(code),
    outcome         TEXT NOT NULL CHECK (outcome IN ('accepted','abstained')),
    confidence      REAL NOT NULL,
    calibration_id  INTEGER NOT NULL REFERENCES calibration_releases(id),
    -- Deliberately absent: landmarks, frames, video, face data, patient identity.
    CONSTRAINT abstain_has_no_sign CHECK (outcome <> 'abstained' OR sign_code IS NULL)
);

CREATE INDEX decisions_calibration ON decisions (calibration_id, created_at DESC);

-- Audit trail with before/after, append-only.
CREATE TABLE audit_log (
    id          BIGSERIAL PRIMARY KEY,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor       TEXT NOT NULL,
    action      TEXT NOT NULL,
    subject     TEXT NOT NULL,
    before      JSONB,
    after       JSONB
);

CREATE OR REPLACE FUNCTION audit_sign_changes() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (actor, action, subject, before, after)
    VALUES (current_user, TG_OP, NEW.code, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER signs_audit
    AFTER UPDATE ON signs
    FOR EACH ROW EXECUTE FUNCTION audit_sign_changes();

-- Operational views
CREATE VIEW v_production_vocabulary AS
    SELECT s.code, s.class, s.reliability
    FROM signs s
    WHERE s.is_enabled AND s.reliability = 'reliable';

CREATE VIEW v_release_readiness AS
    SELECT (SELECT count(*) FROM v_production_vocabulary)                       AS enabled_signs,
           (SELECT count(*) FROM sentence_templates)                            AS templates,
           (SELECT count(*) FROM calibration_releases WHERE is_active)          AS active_calibration,
           CASE WHEN (SELECT count(*) FROM v_production_vocabulary) >= 50
                 AND (SELECT count(*) FROM sentence_templates) >= 150
                 AND (SELECT count(*) FROM calibration_releases WHERE is_active) = 1
                THEN 'READY' ELSE 'BLOCKED' END                                 AS status;
