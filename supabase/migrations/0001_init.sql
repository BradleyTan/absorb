create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);
alter table topics enable row level security;
drop policy if exists "topics_v1_read" on topics;
create policy "topics_v1_read" on topics for select using (true);
drop policy if exists "topics_v1_write" on topics;
create policy "topics_v1_write" on topics for all using (true) with check (true);

create table if not exists journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  topic_id uuid references topics(id) on delete cascade,
  title text not null,
  status text default 'active',
  understanding_score numeric default 0,
  completion_pct numeric default 0,
  created_at timestamptz not null default now()
);
alter table journeys enable row level security;
drop policy if exists "journeys_v1_read" on journeys;
create policy "journeys_v1_read" on journeys for select using (true);
drop policy if exists "journeys_v1_write" on journeys;
create policy "journeys_v1_write" on journeys for all using (true) with check (true);

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  journey_id uuid references journeys(id) on delete cascade,
  title text not null,
  content text not null,
  key_concept text,
  "order" int not null default 0,
  created_at timestamptz not null default now()
);
alter table lessons enable row level security;
drop policy if exists "lessons_v1_read" on lessons;
create policy "lessons_v1_read" on lessons for select using (true);
drop policy if exists "lessons_v1_write" on lessons;
create policy "lessons_v1_write" on lessons for all using (true) with check (true);

create table if not exists practice_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  lesson_id uuid references lessons(id) on delete cascade,
  type text not null check (type in ('flashcard','mcq','fill_blank','test')),
  question text not null,
  answer text not null,
  options text[],
  created_at timestamptz not null default now()
);
alter table practice_items enable row level security;
drop policy if exists "practice_items_v1_read" on practice_items;
create policy "practice_items_v1_read" on practice_items for select using (true);
drop policy if exists "practice_items_v1_write" on practice_items;
create policy "practice_items_v1_write" on practice_items for all using (true) with check (true);

create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  journey_id uuid references journeys(id) on delete cascade,
  title text not null,
  description text not null,
  status text default 'not_started',
  created_at timestamptz not null default now()
);
alter table challenges enable row level security;
drop policy if exists "challenges_v1_read" on challenges;
create policy "challenges_v1_read" on challenges for select using (true);
drop policy if exists "challenges_v1_write" on challenges;
create policy "challenges_v1_write" on challenges for all using (true) with check (true);

create table if not exists progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  journey_id uuid references journeys(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete cascade,
  practice_item_id uuid references practice_items(id) on delete set null,
  is_completed boolean default false,
  practice_score numeric default 0,
  retention_score numeric default 0,
  strength_tags text[],
  weakness_tags text[],
  created_at timestamptz not null default now()
);
alter table progress enable row level security;
drop policy if exists "progress_v1_read" on progress;
create policy "progress_v1_read" on progress for select using (true);
drop policy if exists "progress_v1_write" on progress;
create policy "progress_v1_write" on progress for all using (true) with check (true);

insert into topics (title, description)
select 'Basics of Negotiation', 'Learn the core principles of effective negotiation and practice them in daily life.'
where not exists (select 1 from topics where title = 'Basics of Negotiation');

insert into journeys (topic_id, title, status, understanding_score, completion_pct)
select t.id, 'Negotiation Foundations', 'active', 40, 33
from topics t where t.title = 'Basics of Negotiation'
and not exists (select 1 from journeys where title = 'Negotiation Foundations');

insert into lessons (journey_id, title, content, key_concept, "order")
select j.id, 'Understanding Interests vs Positions', 'In any negotiation, people state positions but act on interests. A position is what they say they want; an interest is why they want it. Uncovering interests unlocks creative solutions that satisfy both sides.', 'Separate interests from positions', 1
from journeys j where j.title = 'Negotiation Foundations'
and not exists (select 1 from lessons where title = 'Understanding Interests vs Positions');

insert into lessons (journey_id, title, content, key_concept, "order")
select j.id, 'The Power of BATNA', 'Your BATNA (Best Alternative to a Negotiated Agreement) is your fallback if talks fail. A strong BATNA gives you confidence and leverage. Always know yours and estimate theirs.', 'Know your BATNA before negotiating', 2
from journeys j where j.title = 'Negotiation Foundations'
and not exists (select 1 from lessons where title = 'The Power of BATNA');

insert into lessons (journey_id, title, content, key_concept, "order")
select j.id, 'Anchoring and First Offers', 'The first number on the table shapes the entire conversation. Making a confident anchor shifts the final outcome in your favour. But be careful — an extreme anchor can kill trust.', 'Anchoring sets the reference point', 3
from journeys j where j.title = 'Negotiation Foundations'
and not exists (select 1 from lessons where title = 'Anchoring and First Offers');

insert into practice_items (lesson_id, type, question, answer, options)
select l.id, 'flashcard', 'What is the difference between a position and an interest?', 'A position is what someone says they want; an interest is the underlying reason they want it.', null
from lessons l where l.title = 'Understanding Interests vs Positions'
and not exists (select 1 from practice_items where question = 'What is the difference between a position and an interest?');

insert into practice_items (lesson_id, type, question, answer, options)
select l.id, 'mcq', 'What does BATNA stand for?', 'Best Alternative to a Negotiated Agreement', ARRAY['Best Alternative to a Negotiated Agreement','Better Agreement Through New Analysis','Basic Agreement Term Number A','Buyer And Trader Negotiation Agreement']
from lessons l where l.title = 'The Power of BATNA'
and not exists (select 1 from practice_items where question = 'What does BATNA stand for?');

insert into practice_items (lesson_id, type, question, answer, options)
select l.id, 'fill_blank', 'The first number stated in a negotiation is called the ____.', 'anchor', null
from lessons l where l.title = 'Anchoring and First Offers'
and not exists (select 1 from practice_items where question = 'The first number stated in a negotiation is called the ____.');

insert into practice_items (lesson_id, type, question, answer, options)
select l.id, 'mcq', 'An extreme anchor can damage what?', 'Trust between parties', ARRAY['Trust between parties','The legal framework','The BATNA','The timeline']
from lessons l where l.title = 'Anchoring and First Offers'
and not exists (select 1 from practice_items where question = 'An extreme anchor can damage what?');

insert into challenges (journey_id, title, description, status)
select j.id, 'Negotiate a Better Deal This Week', 'Find one everyday negotiation (a purchase, a deadline, a favour). Before the conversation, write down your interests, their likely interests, and your BATNA. Afterward, reflect on what worked.', 'not_started'
from journeys j where j.title = 'Negotiation Foundations'
and not exists (select 1 from challenges where title = 'Negotiate a Better Deal This Week');

insert into progress (journey_id, lesson_id, is_completed, practice_score, strength_tags, weakness_tags)
select j.id, l.id, true, 80, ARRAY['core concepts'], ARRAY['application']
from journeys j join lessons l on l.journey_id = j.id where j.title = 'Negotiation Foundations' and l.title = 'Understanding Interests vs Positions'
and not exists (select 1 from progress p where p.lesson_id = l.id);