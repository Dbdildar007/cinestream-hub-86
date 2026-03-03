
-- Create series table
CREATE TABLE public.series (
  id text NOT NULL PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  genre text[] NOT NULL DEFAULT '{}',
  poster_url text NOT NULL DEFAULT '',
  banner_url text,
  rating numeric NOT NULL DEFAULT 0,
  release_year integer NOT NULL,
  is_featured boolean NOT NULL DEFAULT false,
  language text NOT NULL DEFAULT 'English',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Series are publicly readable" ON public.series
  FOR SELECT USING (true);

-- Create seasons table
CREATE TABLE public.seasons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  series_id text NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  season_number integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(series_id, season_number)
);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seasons are publicly readable" ON public.seasons
  FOR SELECT USING (true);

-- Create episodes table
CREATE TABLE public.episodes (
  id text NOT NULL PRIMARY KEY,
  season_id uuid NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  episode_number integer NOT NULL,
  title text NOT NULL DEFAULT '',
  duration text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  video_url text,
  thumbnail_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Episodes are publicly readable" ON public.episodes
  FOR SELECT USING (true);

-- Seed series data from movies that are series
INSERT INTO public.series (id, title, description, genre, poster_url, banner_url, rating, release_year, is_featured, language) VALUES
  ('f1', 'Inferno Protocol', 'A rogue agent must stop a global catastrophe before time runs out. Explosive action meets heart-pounding suspense.', ARRAY['Action','Thriller'], '/assets/poster-1.jpg', '/assets/hero-1.jpg', 8.7, 2024, true, 'English'),
  ('f2', 'Neon Horizons', 'In a cyberpunk metropolis, a hacker uncovers a conspiracy that could reshape humanity''s future forever.', ARRAY['Sci-Fi','Drama'], '/assets/poster-6.jpg', '/assets/hero-2.jpg', 9.1, 2025, true, 'English'),
  ('m1', 'Shadow Network', 'A cyber-security expert is dragged into a web of international espionage.', ARRAY['Action','Thriller'], '/assets/poster-1.jpg', NULL, 8.2, 2024, false, 'English'),
  ('m5', 'Rang De Basanti 2', 'A new generation of students fights for justice and awakening in modern India.', ARRAY['Drama','Action'], '/assets/poster-5.jpg', NULL, 8.6, 2024, false, 'Hindi'),
  ('m7', 'Veera: The Warrior', 'An ancient warrior rises to protect his kingdom from invaders.', ARRAY['Action','Historical'], '/assets/poster-7.jpg', NULL, 8.3, 2024, false, 'Tamil'),
  ('m10', 'Kaalratri', 'A dark night in a remote village unleashes ancient terrors.', ARRAY['Horror','Thriller'], '/assets/poster-4.jpg', NULL, 8.1, 2023, false, 'Hindi'),
  ('m11', 'Mahabali', 'A mythical hero must confront demons to save the world.', ARRAY['Action','Fantasy'], '/assets/poster-7.jpg', NULL, 8.8, 2024, false, 'Telugu');

-- Seed seasons
-- f1 seasons
INSERT INTO public.seasons (id, series_id, season_number) VALUES
  ('a1000001-0000-0000-0000-000000000001', 'f1', 1),
  ('a1000001-0000-0000-0000-000000000002', 'f1', 2);

-- f2 seasons
INSERT INTO public.seasons (id, series_id, season_number) VALUES
  ('a2000001-0000-0000-0000-000000000001', 'f2', 1),
  ('a2000001-0000-0000-0000-000000000002', 'f2', 2);

-- m1 season
INSERT INTO public.seasons (id, series_id, season_number) VALUES
  ('b1000001-0000-0000-0000-000000000001', 'm1', 1);

-- m5 seasons
INSERT INTO public.seasons (id, series_id, season_number) VALUES
  ('b5000001-0000-0000-0000-000000000001', 'm5', 1),
  ('b5000001-0000-0000-0000-000000000002', 'm5', 2);

-- m7 seasons
INSERT INTO public.seasons (id, series_id, season_number) VALUES
  ('b7000001-0000-0000-0000-000000000001', 'm7', 1),
  ('b7000001-0000-0000-0000-000000000002', 'm7', 2);

-- m10 season
INSERT INTO public.seasons (id, series_id, season_number) VALUES
  ('c1000001-0000-0000-0000-000000000001', 'm10', 1);

-- m11 seasons
INSERT INTO public.seasons (id, series_id, season_number) VALUES
  ('c2000001-0000-0000-0000-000000000001', 'm11', 1),
  ('c2000001-0000-0000-0000-000000000002', 'm11', 2),
  ('c2000001-0000-0000-0000-000000000003', 'm11', 3);

-- Seed episodes
-- f1 s1
INSERT INTO public.episodes (id, season_id, episode_number, title, duration, description) VALUES
  ('f1-s1e1', 'a1000001-0000-0000-0000-000000000001', 1, 'The Beginning', '52m', 'Agent Kane discovers the Inferno Protocol for the first time.'),
  ('f1-s1e2', 'a1000001-0000-0000-0000-000000000001', 2, 'Undercover', '48m', 'Kane infiltrates the enemy organization under a new identity.'),
  ('f1-s1e3', 'a1000001-0000-0000-0000-000000000001', 3, 'Betrayal', '55m', 'A trusted ally reveals their true allegiance.'),
  ('f1-s1e4', 'a1000001-0000-0000-0000-000000000001', 4, 'Countdown', '50m', 'With hours remaining, the team races to defuse the threat.'),
  ('f1-s1e5', 'a1000001-0000-0000-0000-000000000001', 5, 'Endgame', '58m', 'The final confrontation with the mastermind.');
-- f1 s2
INSERT INTO public.episodes (id, season_id, episode_number, title, duration, description) VALUES
  ('f1-s2e1', 'a1000001-0000-0000-0000-000000000002', 1, 'Aftermath', '51m', 'Kane deals with the consequences of the first mission.'),
  ('f1-s2e2', 'a1000001-0000-0000-0000-000000000002', 2, 'New Threat', '47m', 'A deadlier version of the protocol surfaces.'),
  ('f1-s2e3', 'a1000001-0000-0000-0000-000000000002', 3, 'Ghost Network', '53m', 'Kane uncovers a hidden network of operatives.');
-- f2 s1
INSERT INTO public.episodes (id, season_id, episode_number, title, duration, description) VALUES
  ('f2-s1e1', 'a2000001-0000-0000-0000-000000000001', 1, 'Neon City', '60m', 'Introduction to the cyberpunk world and its inhabitants.'),
  ('f2-s1e2', 'a2000001-0000-0000-0000-000000000001', 2, 'The Hack', '55m', 'Maya discovers the first clue to the conspiracy.'),
  ('f2-s1e3', 'a2000001-0000-0000-0000-000000000001', 3, 'Digital Ghost', '52m', 'A mysterious figure contacts Maya from inside the network.'),
  ('f2-s1e4', 'a2000001-0000-0000-0000-000000000001', 4, 'System Crash', '58m', 'The entire grid goes dark as Maya gets closer to the truth.'),
  ('f2-s1e5', 'a2000001-0000-0000-0000-000000000001', 5, 'Reboot', '62m', 'Maya must rebuild everything from scratch.'),
  ('f2-s1e6', 'a2000001-0000-0000-0000-000000000001', 6, 'Horizons', '65m', 'The shocking truth behind the conspiracy is revealed.');
-- f2 s2
INSERT INTO public.episodes (id, season_id, episode_number, title, duration, description) VALUES
  ('f2-s2e1', 'a2000001-0000-0000-0000-000000000002', 1, 'New Dawn', '58m', 'Maya returns to a changed world after the revelations.'),
  ('f2-s2e2', 'a2000001-0000-0000-0000-000000000002', 2, 'Underground', '52m', 'The resistance movement grows in the shadows.'),
  ('f2-s2e3', 'a2000001-0000-0000-0000-000000000002', 3, 'Firewall', '55m', 'A massive digital barrier threatens to divide the city.'),
  ('f2-s2e4', 'a2000001-0000-0000-0000-000000000002', 4, 'Convergence', '60m', 'All paths lead to the final showdown.');
-- m1 s1
INSERT INTO public.episodes (id, season_id, episode_number, title, duration, description) VALUES
  ('m1-s1e1', 'b1000001-0000-0000-0000-000000000001', 1, 'First Contact', '45m', 'A security breach leads to a mysterious message.'),
  ('m1-s1e2', 'b1000001-0000-0000-0000-000000000001', 2, 'Deep Web', '48m', 'The investigation goes deeper into the dark web.'),
  ('m1-s1e3', 'b1000001-0000-0000-0000-000000000001', 3, 'Firewalls', '46m', 'Every defense is tested as the attack escalates.'),
  ('m1-s1e4', 'b1000001-0000-0000-0000-000000000001', 4, 'Zero Day', '50m', 'The final battle for control of the network.');
-- m5 s1
INSERT INTO public.episodes (id, season_id, episode_number, title, duration, description) VALUES
  ('m5-s1e1', 'b5000001-0000-0000-0000-000000000001', 1, 'Jagriti', '55m', 'A group of university students discover a corruption scandal.'),
  ('m5-s1e2', 'b5000001-0000-0000-0000-000000000001', 2, 'Aandolan', '50m', 'The movement begins as students take to the streets.'),
  ('m5-s1e3', 'b5000001-0000-0000-0000-000000000001', 3, 'Sangharsh', '52m', 'The struggle intensifies with opposition from powerful forces.'),
  ('m5-s1e4', 'b5000001-0000-0000-0000-000000000001', 4, 'Balidan', '58m', 'Sacrifices are made as the truth comes to light.'),
  ('m5-s1e5', 'b5000001-0000-0000-0000-000000000001', 5, 'Vijay', '60m', 'Victory comes at a heavy price.');
-- m5 s2
INSERT INTO public.episodes (id, season_id, episode_number, title, duration, description) VALUES
  ('m5-s2e1', 'b5000001-0000-0000-0000-000000000002', 1, 'Naya Savera', '48m', 'A new dawn brings fresh challenges for the next generation.'),
  ('m5-s2e2', 'b5000001-0000-0000-0000-000000000002', 2, 'Digital Kranti', '52m', 'The revolution goes digital in the age of social media.'),
  ('m5-s2e3', 'b5000001-0000-0000-0000-000000000002', 3, 'Sach Ka Samna', '50m', 'Facing the truth becomes the hardest battle.');
-- m7 s1
INSERT INTO public.episodes (id, season_id, episode_number, title, duration, description) VALUES
  ('m7-s1e1', 'b7000001-0000-0000-0000-000000000001', 1, 'The Prophecy', '58m', 'An ancient prophecy foretells the rise of a great warrior.'),
  ('m7-s1e2', 'b7000001-0000-0000-0000-000000000001', 2, 'Training Grounds', '52m', 'Veera trains under the legendary master of combat.'),
  ('m7-s1e3', 'b7000001-0000-0000-0000-000000000001', 3, 'First Battle', '55m', 'The invaders attack and Veera must prove his worth.'),
  ('m7-s1e4', 'b7000001-0000-0000-0000-000000000001', 4, 'The Betrayer', '50m', 'A close ally turns traitor, threatening the kingdom.'),
  ('m7-s1e5', 'b7000001-0000-0000-0000-000000000001', 5, 'Rise of Veera', '62m', 'The ultimate battle to save the kingdom begins.');
-- m7 s2
INSERT INTO public.episodes (id, season_id, episode_number, title, duration, description) VALUES
  ('m7-s2e1', 'b7000001-0000-0000-0000-000000000002', 1, 'New Enemies', '55m', 'A larger threat emerges from across the seas.'),
  ('m7-s2e2', 'b7000001-0000-0000-0000-000000000002', 2, 'Alliance', '48m', 'Veera must forge alliances with former enemies.'),
  ('m7-s2e3', 'b7000001-0000-0000-0000-000000000002', 3, 'The Siege', '58m', 'The kingdom faces its darkest hour under siege.'),
  ('m7-s2e4', 'b7000001-0000-0000-0000-000000000002', 4, 'Legacy', '65m', 'Veera''s legacy is cemented in an epic finale.');
-- m10 s1
INSERT INTO public.episodes (id, season_id, episode_number, title, duration, description) VALUES
  ('m10-s1e1', 'c1000001-0000-0000-0000-000000000001', 1, 'The Village', '45m', 'A journalist arrives in a remote village to investigate disappearances.'),
  ('m10-s1e2', 'c1000001-0000-0000-0000-000000000001', 2, 'Whispers', '48m', 'Strange whispers in the night lead to chilling discoveries.'),
  ('m10-s1e3', 'c1000001-0000-0000-0000-000000000001', 3, 'The Ritual', '52m', 'An ancient ritual holds the key to the village''s dark secret.'),
  ('m10-s1e4', 'c1000001-0000-0000-0000-000000000001', 4, 'Unleashed', '55m', 'The terror is unleashed on the darkest night of the year.');
-- m11 s1
INSERT INTO public.episodes (id, season_id, episode_number, title, duration, description) VALUES
  ('m11-s1e1', 'c2000001-0000-0000-0000-000000000001', 1, 'Awakening', '60m', 'The mythical hero awakens from centuries of slumber.'),
  ('m11-s1e2', 'c2000001-0000-0000-0000-000000000001', 2, 'The Demon King', '55m', 'The Demon King''s army marches across the land.'),
  ('m11-s1e3', 'c2000001-0000-0000-0000-000000000001', 3, 'Sacred Weapons', '52m', 'Mahabali seeks the divine weapons hidden in temples.'),
  ('m11-s1e4', 'c2000001-0000-0000-0000-000000000001', 4, 'Army of Light', '58m', 'An army of warriors is assembled for the final battle.'),
  ('m11-s1e5', 'c2000001-0000-0000-0000-000000000001', 5, 'The War', '65m', 'The epic war between good and evil reaches its climax.'),
  ('m11-s1e6', 'c2000001-0000-0000-0000-000000000001', 6, 'Restoration', '62m', 'Peace is restored but at a great cost.');
-- m11 s2
INSERT INTO public.episodes (id, season_id, episode_number, title, duration, description) VALUES
  ('m11-s2e1', 'c2000001-0000-0000-0000-000000000002', 1, 'Return', '58m', 'A new threat forces Mahabali to return from exile.'),
  ('m11-s2e2', 'c2000001-0000-0000-0000-000000000002', 2, 'Dark Prophecy', '52m', 'An ancient prophecy speaks of a greater evil.'),
  ('m11-s2e3', 'c2000001-0000-0000-0000-000000000002', 3, 'The Underworld', '55m', 'Mahabali descends into the underworld to find answers.'),
  ('m11-s2e4', 'c2000001-0000-0000-0000-000000000002', 4, 'Final Stand', '68m', 'The ultimate battle for the fate of all worlds.');
-- m11 s3
INSERT INTO public.episodes (id, season_id, episode_number, title, duration, description) VALUES
  ('m11-s3e1', 'c2000001-0000-0000-0000-000000000003', 1, 'Echoes', '55m', 'Echoes of the past reveal hidden truths about Mahabali''s origin.'),
  ('m11-s3e2', 'c2000001-0000-0000-0000-000000000003', 2, 'The Celestials', '60m', 'The gods themselves intervene in the mortal world.'),
  ('m11-s3e3', 'c2000001-0000-0000-0000-000000000003', 3, 'Eternal', '70m', 'Mahabali faces his ultimate destiny.');
