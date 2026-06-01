-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "FamilyRole" AS ENUM ('OWNER', 'PARENT');

-- CreateEnum
CREATE TYPE "NoteStatus" AS ENUM ('QUICK_ONLY', 'NEEDS_DETAILS', 'DETAILED');

-- CreateEnum
CREATE TYPE "HelpLevel" AS ENUM ('RED', 'YELLOW', 'GREEN');

-- CreateEnum
CREATE TYPE "ExpertDecision" AS ENUM ('UNREVIEWED', 'NEEDS_MORE_OBSERVATION', 'APPROVED', 'DO_NOT_TRAIN');

-- CreateEnum
CREATE TYPE "PriorAgreement" AS ENUM ('HEARD', 'NOT_HEARD', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "CueKind" AS ENUM ('SPEECH', 'FACE_BODY', 'DISTANCE_POSITION', 'RULE_STATEMENT', 'PRIOR_AGREEMENT', 'TURN_ORDER', 'GROUP_REACTION', 'OTHER_OBSERVABLE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("provider","provider_account_id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "families" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_members" (
    "id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "FamilyRole" NOT NULL DEFAULT 'PARENT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_invites" (
    "id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "children" (
    "id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "school_year" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "children_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "situation_kinds" (
    "id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "user_facing_label" TEXT NOT NULL,
    "expert_check_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "situation_kinds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cue_keys" (
    "id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "situation_kind_id" TEXT NOT NULL,
    "normalized_text" TEXT NOT NULL,
    "display_text" TEXT NOT NULL,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cue_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cue_aliases" (
    "id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "situation_kind_id" TEXT NOT NULL,
    "alias_text" TEXT NOT NULL,
    "alias_normalized_text" TEXT NOT NULL,
    "canonical_cue_key_id" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cue_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observation_notes" (
    "id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "created_by_member_id" TEXT,
    "observed_at" TIMESTAMP(3) NOT NULL,
    "location_label" TEXT,
    "situation_kind_id" TEXT,
    "other_situation_label" TEXT,
    "quick_text" TEXT NOT NULL,
    "status" "NoteStatus" NOT NULL DEFAULT 'QUICK_ONLY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "observation_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observation_details" (
    "id" TEXT NOT NULL,
    "note_id" TEXT NOT NULL,
    "cue_key_id" TEXT NOT NULL,
    "prior_agreement" "PriorAgreement" NOT NULL DEFAULT 'UNKNOWN',
    "prior_agreement_quote" TEXT,
    "cue_raw_text" TEXT NOT NULL,
    "cue_kind" "CueKind",
    "cue_observed_text" TEXT,
    "child_action_text" TEXT,
    "peer_speech_text" TEXT,
    "peer_body_text" TEXT,
    "ending_text" TEXT,
    "help_level" "HelpLevel",
    "ask_expert" BOOLEAN NOT NULL DEFAULT false,
    "parent_thoughts" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "observation_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expert_reviews" (
    "id" TEXT NOT NULL,
    "cue_key_id" TEXT NOT NULL,
    "decision" "ExpertDecision" NOT NULL DEFAULT 'UNREVIEWED',
    "expert_note" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expert_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "family_members_user_id_idx" ON "family_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "family_members_family_id_user_id_key" ON "family_members"("family_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "family_invites_token_hash_key" ON "family_invites"("token_hash");

-- CreateIndex
CREATE INDEX "family_invites_family_id_idx" ON "family_invites"("family_id");

-- CreateIndex
CREATE INDEX "family_invites_email_idx" ON "family_invites"("email");

-- CreateIndex
CREATE INDEX "situation_kinds_family_id_sort_order_idx" ON "situation_kinds"("family_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "situation_kinds_family_id_code_key" ON "situation_kinds"("family_id", "code");

-- CreateIndex
CREATE INDEX "cue_keys_family_id_situation_kind_id_idx" ON "cue_keys"("family_id", "situation_kind_id");

-- CreateIndex
CREATE UNIQUE INDEX "cue_keys_family_id_situation_kind_id_normalized_text_key" ON "cue_keys"("family_id", "situation_kind_id", "normalized_text");

-- CreateIndex
CREATE INDEX "cue_aliases_canonical_cue_key_id_idx" ON "cue_aliases"("canonical_cue_key_id");

-- CreateIndex
CREATE UNIQUE INDEX "cue_aliases_family_id_situation_kind_id_alias_normalized_te_key" ON "cue_aliases"("family_id", "situation_kind_id", "alias_normalized_text");

-- CreateIndex
CREATE INDEX "observation_notes_family_id_observed_at_idx" ON "observation_notes"("family_id", "observed_at");

-- CreateIndex
CREATE INDEX "observation_notes_family_id_situation_kind_id_idx" ON "observation_notes"("family_id", "situation_kind_id");

-- CreateIndex
CREATE UNIQUE INDEX "observation_details_note_id_key" ON "observation_details"("note_id");

-- CreateIndex
CREATE INDEX "observation_details_cue_key_id_idx" ON "observation_details"("cue_key_id");

-- CreateIndex
CREATE UNIQUE INDEX "expert_reviews_cue_key_id_key" ON "expert_reviews"("cue_key_id");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_invites" ADD CONSTRAINT "family_invites_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "children" ADD CONSTRAINT "children_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "situation_kinds" ADD CONSTRAINT "situation_kinds_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cue_keys" ADD CONSTRAINT "cue_keys_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cue_keys" ADD CONSTRAINT "cue_keys_situation_kind_id_fkey" FOREIGN KEY ("situation_kind_id") REFERENCES "situation_kinds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cue_aliases" ADD CONSTRAINT "cue_aliases_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cue_aliases" ADD CONSTRAINT "cue_aliases_situation_kind_id_fkey" FOREIGN KEY ("situation_kind_id") REFERENCES "situation_kinds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cue_aliases" ADD CONSTRAINT "cue_aliases_canonical_cue_key_id_fkey" FOREIGN KEY ("canonical_cue_key_id") REFERENCES "cue_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observation_notes" ADD CONSTRAINT "observation_notes_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observation_notes" ADD CONSTRAINT "observation_notes_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observation_notes" ADD CONSTRAINT "observation_notes_created_by_member_id_fkey" FOREIGN KEY ("created_by_member_id") REFERENCES "family_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observation_notes" ADD CONSTRAINT "observation_notes_situation_kind_id_fkey" FOREIGN KEY ("situation_kind_id") REFERENCES "situation_kinds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observation_details" ADD CONSTRAINT "observation_details_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "observation_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observation_details" ADD CONSTRAINT "observation_details_cue_key_id_fkey" FOREIGN KEY ("cue_key_id") REFERENCES "cue_keys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_reviews" ADD CONSTRAINT "expert_reviews_cue_key_id_fkey" FOREIGN KEY ("cue_key_id") REFERENCES "cue_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Safety/backfill helper only. App code normalizeCueText is the source of truth.
CREATE OR REPLACE FUNCTION normalize_cue_text(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(
    lower(coalesce(input, '')),
    '[[:space:][:punct:]]+',
    '',
    'g'
  );
$$;

CREATE OR REPLACE VIEW cue_key_summary AS
SELECT
  ck.id AS cue_key_id,
  ck.family_id,
  ck.situation_kind_id,
  ck.display_text,
  ck.normalized_text,
  count(od.id) AS observation_count,
  count(*) FILTER (WHERE od.help_level = 'RED') AS red_count,
  count(*) FILTER (WHERE od.help_level = 'YELLOW') AS yellow_count,
  count(*) FILTER (WHERE od.help_level = 'GREEN') AS green_count,
  count(*) FILTER (WHERE od.ask_expert = true) AS ask_expert_count,
  min(note.observed_at) AS first_seen_at,
  max(note.observed_at) AS last_seen_at
FROM cue_keys ck
JOIN observation_details od ON od.cue_key_id = ck.id
JOIN observation_notes note ON note.id = od.note_id
GROUP BY ck.id;
