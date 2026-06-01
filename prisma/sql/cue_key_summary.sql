create or replace view cue_key_summary as
select
  ck.id as cue_key_id,
  ck.family_id,
  ck.situation_kind_id,
  ck.display_text,
  ck.normalized_text,
  count(od.id) as observation_count,
  count(*) filter (where od.help_level = 'RED') as red_count,
  count(*) filter (where od.help_level = 'YELLOW') as yellow_count,
  count(*) filter (where od.help_level = 'GREEN') as green_count,
  count(*) filter (where od.ask_expert = true) as ask_expert_count,
  min(note.observed_at) as first_seen_at,
  max(note.observed_at) as last_seen_at
from cue_keys ck
join observation_details od on od.cue_key_id = ck.id
join observation_notes note on note.id = od.note_id
group by ck.id;
