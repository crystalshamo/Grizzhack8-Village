USE village_app;

INSERT INTO Questions (question_text, question_type, category, options_json, required) VALUES
-- Basic Info
('What type of parent/guardian are you?', 'single_choice', 'basic_info',
 '["Mom","Dad","Guardian","Other"]', 1),

('What is your zip code?', 'text', 'basic_info', NULL, 1),

-- Children Info
('How many children do you have?', 'single_choice', 'children_info',
 '["1","2","3","4+"]', 1),

-- Parenting Preferences
('Are you interested in being a mentor, finding a mentor, or both?', 'single_choice', 'preferences',
 '["Be a mentor","Find a mentor","Both"]', 1),

('Which of the following best describes your child(ren)''s ages or stages?', 'multi_choice', 'preferences',
 '["Newborn (0–3 months)","Infant (3–12 months)","Toddler (1–3 years)","Preschooler (3–5 years)","Early Elementary (5–8 years)","Preteen (9–12 years)","Teen (13–18 years)","Adult (18+)"]', 1),

('Topics you are interested in', 'multi_choice', 'preferences',
 '["Sleep","Feeding","Education","Activities","Health","Mental Health","Work-Life Balance","Special Needs","Other"]', 1),

-- Personal Preferences
('Do you have hobbies or interests outside of parenting?', 'text', 'personal', NULL, 0),

('Do you prefer connecting with parents at a similar parenting stage?', 'single_choice', 'personal',
 '["Yes","No","No Preference"]', 1);
