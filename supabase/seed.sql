-- Insert sample users
INSERT INTO users (email, first_name, last_name, role, roll_number, branch, section, organizer_status) VALUES
('john.doe@student.edu', 'John', 'Doe', 'student', 'CS2021001', 'Computer Science', 'A', 'approved'),
('jane.smith@student.edu', 'Jane', 'Smith', 'student', 'CS2021002', 'Computer Science', 'A', 'approved'),
('alice.organizer@club.edu', 'Alice', 'Johnson', 'club_organizer', NULL, NULL, NULL, 'approved'),
('bob.organizer@club.edu', 'Bob', 'Williams', 'club_organizer', NULL, NULL, NULL, 'approved');

-- Insert sample clubs
INSERT INTO clubs (name, description, category, status) VALUES
('Computer Science Club', 'A club for computer science enthusiasts', 'Technology', 'approved'),
('Music Club', 'For music lovers and performers', 'Arts', 'approved'),
('Sports Club', 'Organizing various sports activities', 'Sports', 'approved');

-- Insert sample events
INSERT INTO events (organizer_id, club_name, title, description, date, venue, registration_link, category, time, long_description, is_past) VALUES
((SELECT id FROM users WHERE email = 'alice.organizer@club.edu'), 'Computer Science Club', 'AI Workshop', 'Learn the basics of Artificial Intelligence', '2024-11-15 14:00:00+00', 'Room 101', 'https://forms.google.com/ai-workshop', 'Technology', '14:00', 'This comprehensive workshop will cover machine learning fundamentals, neural networks, and practical AI applications.', false),
((SELECT id FROM users WHERE email = 'bob.organizer@club.edu'), 'Music Club', 'Jazz Night', 'An evening of jazz music performances', '2024-11-20 18:00:00+00', 'Auditorium', 'https://forms.google.com/jazz-night', 'Arts', '18:00', 'Join us for an amazing night of jazz music featuring talented performers from our college.', false),
((SELECT id FROM users WHERE email = 'alice.organizer@club.edu'), 'Computer Science Club', 'Hackathon 2024', '24-hour coding competition', '2024-10-25 09:00:00+00', 'Lab 201', 'https://forms.google.com/hackathon', 'Technology', '09:00', 'A 24-hour coding marathon where teams compete to build innovative solutions.', true);

-- Insert sample tags
INSERT INTO tags (name) VALUES
('Technology'),
('AI'),
('Music'),
('Jazz'),
('Coding'),
('Competition'),
('Workshop');

-- Link events to tags
INSERT INTO event_tags (event_id, tag_id) VALUES
((SELECT id FROM events WHERE title = 'AI Workshop'), (SELECT id FROM tags WHERE name = 'Technology')),
((SELECT id FROM events WHERE title = 'AI Workshop'), (SELECT id FROM tags WHERE name = 'AI')),
((SELECT id FROM events WHERE title = 'AI Workshop'), (SELECT id FROM tags WHERE name = 'Workshop')),
((SELECT id FROM events WHERE title = 'Jazz Night'), (SELECT id FROM tags WHERE name = 'Music')),
((SELECT id FROM events WHERE title = 'Jazz Night'), (SELECT id FROM tags WHERE name = 'Jazz')),
((SELECT id FROM events WHERE title = 'Hackathon 2024'), (SELECT id FROM tags WHERE name = 'Technology')),
((SELECT id FROM events WHERE title = 'Hackathon 2024'), (SELECT id FROM tags WHERE name = 'Coding')),
((SELECT id FROM events WHERE title = 'Hackathon 2024'), (SELECT id FROM tags WHERE name = 'Competition'));

-- Link users to clubs
INSERT INTO user_clubs (user_id, club_id) VALUES
((SELECT id FROM users WHERE email = 'alice.organizer@club.edu'), (SELECT id FROM clubs WHERE name = 'Computer Science Club')),
((SELECT id FROM users WHERE email = 'bob.organizer@club.edu'), (SELECT id FROM clubs WHERE name = 'Music Club'));

-- Insert sample registrations
INSERT INTO registrations (user_id, event_id, full_name, roll_number, branch, section, email, title, date) VALUES
((SELECT id FROM users WHERE email = 'john.doe@student.edu'), (SELECT id FROM events WHERE title = 'AI Workshop'), 'John Doe', 'CS2021001', 'Computer Science', 'A', 'john.doe@student.edu', 'AI Workshop', '2024-11-15 14:00:00+00'),
((SELECT id FROM users WHERE email = 'jane.smith@student.edu'), (SELECT id FROM events WHERE title = 'Jazz Night'), 'Jane Smith', 'CS2021002', 'Computer Science', 'A', 'jane.smith@student.edu', 'Jazz Night', '2024-11-20 18:00:00+00');

-- Insert sample comments
INSERT INTO comments (user_id, event_id, text) VALUES
((SELECT id FROM users WHERE email = 'john.doe@student.edu'), (SELECT id FROM events WHERE title = 'Hackathon 2024'), 'Great event! Learned a lot about competitive coding.'),
((SELECT id FROM users WHERE email = 'jane.smith@student.edu'), (SELECT id FROM events WHERE title = 'Hackathon 2024'), 'Amazing experience! Would love to participate again.');

-- Insert sample reminders
INSERT INTO reminders (user_id, event_title, event_id, event_date) VALUES
((SELECT id FROM users WHERE email = 'john.doe@student.edu'), 'AI Workshop', (SELECT id FROM events WHERE title = 'AI Workshop'), '2024-11-15 14:00:00+00'),
((SELECT id FROM users WHERE email = 'jane.smith@student.edu'), 'Jazz Night', (SELECT id FROM events WHERE title = 'Jazz Night'), '2024-11-20 18:00:00+00');
