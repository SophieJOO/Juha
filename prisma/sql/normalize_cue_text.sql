-- Safety/backfill helper only. App code normalizeCueText is the source of truth.
create or replace function normalize_cue_text(input text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    lower(coalesce(input, '')),
    '[[:space:][:punct:]]+',
    '',
    'g'
  );
$$;
