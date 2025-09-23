-- Basic seed data for D&D 2024 Character Sheet Generator
-- This includes essential classes, races, backgrounds for initial setup

-- Insert basic D&D 2024 classes
INSERT INTO classes (name, hit_die, primary_ability, proficiencies, class_features, spell_casting, content_version) VALUES
('Fighter', 10, '{"Strength", "Dexterity"}', 
 '{"armor": ["light", "medium", "heavy", "shields"], "weapons": ["simple", "martial"], "saving_throws": ["Strength", "Constitution"]}',
 '{"1": {"Second Wind": "Regain 1d10 + fighter level hit points"}, "2": {"Action Surge": "Take an additional action on your turn"}}',
 NULL, '1.0.0'),

('Wizard', 6, '{"Intelligence"}',
 '{"weapons": ["daggers", "darts", "slings", "quarterstaffs", "light crossbows"], "saving_throws": ["Intelligence", "Wisdom"]}',
 '{"1": {"Arcane Recovery": "Recover spell slots on short rest"}, "2": {"Ritual Casting": "Cast spells as rituals"}}',
 '{"type": "full", "ability": "Intelligence", "ritual_casting": true}', '1.0.0'),

('Rogue', 8, '{"Dexterity"}',
 '{"armor": ["light"], "weapons": ["simple", "hand crossbows", "longswords", "rapiers", "shortswords"], "saving_throws": ["Dexterity", "Intelligence"]}',
 '{"1": {"Expertise": "Double proficiency bonus on two skills", "Sneak Attack": "1d6 extra damage"}, "2": {"Cunning Action": "Dash, Disengage, or Hide as bonus action"}}',
 NULL, '1.0.0'),

('Cleric', 8, '{"Wisdom"}',
 '{"armor": ["light", "medium", "shields"], "weapons": ["simple"], "saving_throws": ["Wisdom", "Charisma"]}',
 '{"1": {"Divine Domain": "Choose your deity'\''s domain"}, "2": {"Channel Divinity": "Use divine energy"}}',
 '{"type": "full", "ability": "Wisdom", "ritual_casting": true}', '1.0.0')
ON CONFLICT (name) DO NOTHING;

-- Insert basic D&D 2024 races (now called species)
INSERT INTO races (name, size, speed, traits, ability_score_increase, languages, proficiencies, content_version) VALUES
('Human', 'Medium', 30,
 '{"Extra Language": "Learn one additional language", "Extra Skill": "Gain proficiency in one skill"}',
 '{"choice": "+2 to one ability, +1 to another"}', '{"Common", "choice"}', NULL, '1.0.0'),

('Elf', 'Medium', 30,
 '{"Darkvision": "60 feet", "Fey Ancestry": "Advantage on saves against charm", "Trance": "4 hours of rest instead of 8"}',
 '{"Dexterity": 2}', '{"Common", "Elvish"}', '{"Perception": true}', '1.0.0'),

('Dwarf', 'Medium', 25,
 '{"Darkvision": "60 feet", "Dwarven Resilience": "Advantage on poison saves", "Stonecunning": "Double proficiency with stone-related History checks"}',
 '{"Constitution": 2}', '{"Common", "Dwarvish"}', NULL, '1.0.0'),

('Halfling', 'Small', 25,
 '{"Lucky": "Reroll natural 1s", "Brave": "Advantage on saves against fear", "Halfling Nimbleness": "Move through larger creatures"}',
 '{"Dexterity": 2}', '{"Common", "Halfling"}', NULL, '1.0.0')
ON CONFLICT (name) DO NOTHING;

-- Insert basic D&D 2024 backgrounds with Origin Feats
INSERT INTO backgrounds (name, description, skill_proficiencies, languages, equipment, feature, origin_feat, ability_score_increase, content_version) VALUES
('Acolyte', 'You have spent your life in service to a temple',
 '{"Insight": true, "Religion": true}', '{"choice": 2}',
 '{"holy_symbol": 1, "prayer_book": 1, "incense": 5, "vestments": 1, "common_clothes": 1, "belt_pouch": 1, "gold": 15}',
 '{"Shelter of the Faithful": "Receive aid from temples of your faith"}',
 'Magic Initiate', '{"choice": "+2 to one ability, +1 to another OR +1 to three abilities"}', '1.0.0'),

('Criminal', 'You are an experienced criminal with a history of breaking the law',
 '{"Deception": true, "Stealth": true}', '{"choice": 1}',
 '{"crowbar": 1, "dark_clothes": 1, "belt_pouch": 1, "gold": 15}',
 '{"Criminal Contact": "You have contacts in the criminal underworld"}',
 'Alert', '{"choice": "+2 to one ability, +1 to another OR +1 to three abilities"}', '1.0.0'),

('Folk Hero', 'You come from a humble social rank, but you are destined for much more',
 '{"Animal Handling": true, "Survival": true}', '{"choice": 1}',
 '{"artisan_tools": 1, "shovel": 1, "iron_pot": 1, "common_clothes": 1, "belt_pouch": 1, "gold": 10}',
 '{"Rustic Hospitality": "Common folk provide you with simple accommodations"}',
 'Tough', '{"choice": "+2 to one ability, +1 to another OR +1 to three abilities"}', '1.0.0'),

('Noble', 'You understand wealth, power, and privilege',
 '{"History": true, "Persuasion": true}', '{"choice": 1}',
 '{"signet_ring": 1, "scroll_of_pedigree": 1, "fine_clothes": 1, "belt_pouch": 1, "gold": 25}',
 '{"Position of Privilege": "You are welcome in high society"}',
 'Skilled', '{"choice": "+2 to one ability, +1 to another OR +1 to three abilities"}', '1.0.0')
ON CONFLICT (name) DO NOTHING;

-- Insert some basic spells for testing
INSERT INTO spells (name, level, school, casting_time, range_text, duration, components, description, classes, source_book, content_version) VALUES
('Magic Missile', 1, 'Evocation', '1 action', '120 feet', 'Instantaneous',
 '{"V": true, "S": true}',
 'You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range.',
 '{"Wizard", "Sorcerer"}', 'Player''s Handbook 2024', '1.0.0'),

('Cure Wounds', 1, 'Evocation', '1 action', 'Touch', 'Instantaneous',
 '{"V": true, "S": true}',
 'A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier.',
 '{"Cleric", "Druid", "Paladin", "Ranger"}', 'Player''s Handbook 2024', '1.0.0'),

('Fireball', 3, 'Evocation', '1 action', '150 feet', 'Instantaneous',
 '{"V": true, "S": true, "M": "a tiny ball of bat guano and sulfur"}',
 'A bright streak flashes from your pointing finger to a point you choose within range then blossoms with a low roar into an explosion of flame.',
 '{"Wizard", "Sorcerer"}', 'Player''s Handbook 2024', '1.0.0')
ON CONFLICT (name, level) DO NOTHING;