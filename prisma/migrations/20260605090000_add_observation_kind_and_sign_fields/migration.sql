-- Add balanced observation type and optional observation-only detail fields.
CREATE TYPE "ObservationKind" AS ENUM ('INCIDENT', 'NEUTRAL', 'POSITIVE');

ALTER TABLE "observation_notes"
ADD COLUMN "kind" "ObservationKind" NOT NULL DEFAULT 'INCIDENT';

ALTER TABLE "observation_details"
ADD COLUMN "antecedent_text" TEXT,
ADD COLUMN "early_sign_text" TEXT,
ADD COLUMN "self_regulation_text" TEXT;

DROP VIEW IF EXISTS cue_key_summary;

CREATE VIEW cue_key_summary AS
SELECT
  ck.id AS cue_key_id,
  ck.family_id,
  ck.situation_kind_id,
  ck.display_text,
  ck.normalized_text,
  count(od.id) AS observation_count,
  count(*) FILTER (WHERE note.kind = 'INCIDENT') AS incident_count,
  count(*) FILTER (WHERE note.kind = 'INCIDENT' AND od.help_level = 'RED') AS red_count,
  count(*) FILTER (WHERE note.kind = 'INCIDENT' AND od.help_level = 'YELLOW') AS yellow_count,
  count(*) FILTER (WHERE note.kind = 'INCIDENT' AND od.help_level = 'GREEN') AS green_count,
  count(*) FILTER (WHERE od.ask_expert = true) AS ask_expert_count,
  count(*) FILTER (
    WHERE note.kind = 'INCIDENT'
      AND od.early_sign_text IS NOT NULL
      AND btrim(od.early_sign_text) <> ''
  ) AS early_sign_count,
  CASE
    WHEN count(*) FILTER (WHERE note.kind = 'INCIDENT') = 0 THEN 0
    ELSE (
      (
        count(*) FILTER (WHERE note.kind = 'INCIDENT' AND od.help_level = 'RED') * 2
      ) + count(*) FILTER (WHERE note.kind = 'INCIDENT' AND od.help_level = 'YELLOW')
    )::double precision / count(*) FILTER (WHERE note.kind = 'INCIDENT')
  END AS stress_score,
  min(note.observed_at) AS first_seen_at,
  max(note.observed_at) AS last_seen_at
FROM cue_keys ck
JOIN observation_details od ON od.cue_key_id = ck.id
JOIN observation_notes note ON note.id = od.note_id
GROUP BY ck.id;
