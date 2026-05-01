DROP TABLE IF EXISTS event_results CASCADE;
DROP TABLE IF EXISTS event_participants CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS schools CASCADE;

CREATE TABLE schools (
    school_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    school_code VARCHAR(20) NOT NULL UNIQUE,
    school_name VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE departments (
    department_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    school_id INT NOT NULL,
    department_code VARCHAR(20) NOT NULL UNIQUE,
    department_name VARCHAR(150) NOT NULL,
    UNIQUE (school_id, department_name),
    FOREIGN KEY (school_id) REFERENCES schools(school_id)
);

CREATE TABLE categories (
    category_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE clubs (
    club_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    club_name VARCHAR(150) NOT NULL UNIQUE,
    parent_unit VARCHAR(150) NOT NULL DEFAULT 'Student Affairs'
);

CREATE TABLE roles (
    role_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE users (
    user_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    school_id INT NULL,
    department_id INT NULL,
    club_id INT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id),
    FOREIGN KEY (school_id) REFERENCES schools(school_id),
    FOREIGN KEY (department_id) REFERENCES departments(department_id),
    FOREIGN KEY (club_id) REFERENCES clubs(club_id)
);

CREATE TABLE events (
    event_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_code VARCHAR(30) NOT NULL UNIQUE,
    event_name VARCHAR(200) NOT NULL,
    school_id INT NULL,
    department_id INT NULL,
    category_id INT NOT NULL,
    event_date DATE NOT NULL,
    conducted_by_type VARCHAR(20) NOT NULL CHECK (conducted_by_type IN ('Department', 'Club')),
    club_id INT NULL,
    organizer_name VARCHAR(150) NOT NULL,
    participation_mode VARCHAR(20) NOT NULL CHECK (participation_mode IN ('Solo', 'Group')),
    is_competition BOOLEAN NOT NULL DEFAULT FALSE,
    event_status VARCHAR(20) NOT NULL DEFAULT 'Draft'
        CHECK (event_status IN ('Draft', 'Published', 'Completed', 'Cancelled')),
    venue VARCHAR(150),
    description TEXT,
    is_intercollege BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(school_id),
    FOREIGN KEY (department_id) REFERENCES departments(department_id),
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    FOREIGN KEY (club_id) REFERENCES clubs(club_id)
);

CREATE TABLE participants (
    participant_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    participant_name VARCHAR(150) NOT NULL,
    roll_number VARCHAR(50) NULL,
    school_id INT NULL,
    department_id INT NULL,
    year_of_study INT NULL,
    participant_type VARCHAR(20) NOT NULL CHECK (participant_type IN ('internal', 'external')),
    participant_status VARCHAR(20) NOT NULL DEFAULT 'Registered'
        CHECK (participant_status IN ('Registered', 'Approved', 'Attended', 'Cancelled')),
    contact_number VARCHAR(15),
    email VARCHAR(150),
    college_name VARCHAR(255),
    external_department VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(school_id),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

CREATE TABLE teams (
    team_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id INT NOT NULL,
    team_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id)
);

CREATE TABLE team_members (
    team_member_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    team_id INT NOT NULL,
    participant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (team_id, participant_id),
    FOREIGN KEY (team_id) REFERENCES teams(team_id),
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id)
);

CREATE TABLE event_participants (
    event_participant_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id INT NOT NULL,
    participant_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, participant_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id),
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id)
);

CREATE TABLE event_results (
    result_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id INT NOT NULL,
    participant_id INT NULL,
    team_id INT NULL,
    position VARCHAR(20) NOT NULL,
    score DECIMAL(8,2) NULL,
    prize_amount DECIMAL(10,2) NULL,
    result_status VARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (result_status IN ('Pending', 'Published')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(event_id),
    FOREIGN KEY (participant_id) REFERENCES participants(participant_id),
    FOREIGN KEY (team_id) REFERENCES teams(team_id),
    CHECK (
        (participant_id IS NOT NULL AND team_id IS NULL)
        OR
        (participant_id IS NULL AND team_id IS NOT NULL)
    )
);

INSERT INTO schools (school_id, school_code, school_name) OVERRIDING SYSTEM VALUE VALUES
(1, 'SOE', 'School of Engineering'),
(2, 'SMNS', 'School of Mathematics and Natural Sciences'),
(3, 'SAH', 'School of Arts and Humanities'),
(4, 'SOL', 'School of Law'),
(5, 'SBS', 'School of Biosciences'),
(6, 'OSA', 'Office of Student Affairs');

INSERT INTO departments (department_id, school_id, department_code, department_name) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 'CSE', 'Computer Science and Engineering'),
(2, 1, 'ECE', 'Electronics and Communication Engineering'),
(3, 1, 'MECH', 'Mechanical Engineering'),
(4, 1, 'CIVIL', 'Civil Engineering'),
(5, 1, 'EEE', 'Electrical and Electronics Engineering'),
(6, 2, 'MATH', 'Mathematics'),
(7, 2, 'PHY', 'Physics'),
(8, 2, 'CHEM', 'Chemistry'),
(9, 3, 'ENG', 'English'),
(10, 3, 'HIST', 'History'),
(11, 3, 'PHIL', 'Philosophy'),
(12, 4, 'LAW', 'Law'),
(13, 5, 'BIOTECH', 'Biotechnology'),
(14, 5, 'MICRO', 'Microbiology');

INSERT INTO categories (category_id, category_name) OVERRIDING SYSTEM VALUE VALUES
(1, 'Technical'),
(2, 'Workshop'),
(3, 'Sports'),
(4, 'Cultural'),
(5, 'Seminar'),
(6, 'Competition');

INSERT INTO clubs (club_id, club_name, parent_unit) OVERRIDING SYSTEM VALUE VALUES
(1, 'Music Club', 'Student Affairs'),
(2, 'Dance Club', 'Student Affairs'),
(3, 'Theater Club', 'Student Affairs'),
(4, 'Coding Club', 'Student Affairs'),
(5, 'Sports Club', 'Student Affairs'),
(6, 'Literary Club', 'Student Affairs'),
(7, 'Debate Club', 'Student Affairs'),
(8, 'Visual Arts Club', 'Student Affairs');

INSERT INTO roles (role_id, role_name) OVERRIDING SYSTEM VALUE VALUES
(1, 'Student'),
(2, 'Organizer'),
(3, 'Admin');

INSERT INTO users (
    user_id, user_code, full_name, email, password_hash, role_id,
    school_id, department_id, club_id, is_active
) OVERRIDING SYSTEM VALUE VALUES
(1, 'CUS001', 'Ananya Nair', 'ananya.nair.stu@campus.edu', 'demo_hash_1', 1, 3, 9, NULL, TRUE),
(2, 'CUS002', 'Joel Mathew', 'joel.mathew.stu@campus.edu', 'demo_hash_2', 1, 1, NULL, NULL, TRUE),
(3, 'CUS003', 'Megha Thomas', 'megha.thomas.stu@campus.edu', 'demo_hash_3', 1, 2, 6, NULL, TRUE),
(4, 'CUO001', 'Nived Joseph', 'nived.joseph.org@campus.edu', 'demo_hash_4', 2, 3, NULL, 1, TRUE),
(5, 'CUO002', 'Arjun Paul', 'arjun.paul.org@campus.edu', 'demo_hash_5', 2, 1, 1, 4, TRUE),
(6, 'CUO003', 'Sara Vincent', 'sara.vincent.org@campus.edu', 'demo_hash_6', 2, 3, NULL, 2, TRUE),
(7, 'CUA001', 'Admin Office', 'admin.office.adm@campus.edu', 'demo_hash_7', 3, NULL, NULL, NULL, TRUE),
(8, 'CUF-2026-9999', 'Dr. Sarah Connor', 'sarah.connor.fac@campus.edu', 'demo_hash_4', 2, NULL, NULL, NULL, TRUE);

INSERT INTO events (
    event_id, event_code, event_name, school_id, department_id, category_id, event_date,
    conducted_by_type, club_id, organizer_name, participation_mode, is_competition, event_status,
    venue, description, is_intercollege
) OVERRIDING SYSTEM VALUE VALUES
(1, 'EVT2026-001', 'Intra-Campus HackSprint', 1, 1, 6, '2026-01-28', 'Club', 4, 'Coding Club', 'Group', TRUE, 'Completed', NULL, NULL, FALSE),
(2, 'EVT2026-002', 'Circuit Design Challenge', 1, 2, 6, '2026-02-04', 'Department', NULL, 'Department of Electronics and Communication Engineering', 'Solo', TRUE, 'Completed', NULL, NULL, FALSE),
(3, 'EVT2026-003', 'Classical Solo Singing', 3, NULL, 6, '2026-02-11', 'Club', 1, 'Music Club', 'Solo', TRUE, 'Completed', NULL, NULL, FALSE),
(4, 'EVT2026-004', 'Duet Singing Evening', 3, NULL, 6, '2026-02-13', 'Club', 1, 'Music Club', 'Group', TRUE, 'Completed', NULL, NULL, FALSE),
(5, 'EVT2026-005', 'Street Play Showcase', 3, NULL, 4, '2026-02-20', 'Club', 3, 'Theater Club', 'Group', FALSE, 'Completed', NULL, NULL, FALSE),
(6, 'EVT2026-006', 'Inter-Department Football 7s', 1, NULL, 3, '2026-02-24', 'Club', 5, 'Sports Club', 'Group', TRUE, 'Completed', NULL, NULL, FALSE),
(7, 'EVT2026-007', 'Creative Writing Contest', 3, 9, 6, '2026-03-03', 'Club', 6, 'Literary Club', 'Solo', TRUE, 'Completed', NULL, NULL, FALSE),
(8, 'EVT2026-008', 'Bio Poster Presentation', 5, 13, 6, '2026-03-09', 'Department', NULL, 'Department of Biotechnology', 'Solo', TRUE, 'Completed', NULL, NULL, FALSE),
(9, 'EVT2026-009', 'Moot Court Trial Round', 4, 12, 6, '2026-03-15', 'Club', 7, 'Debate Club', 'Group', TRUE, 'Completed', NULL, NULL, FALSE),
(10, 'EVT2026-010', 'Python for Research Workshop', 2, 6, 2, '2026-03-21', 'Department', NULL, 'Department of Mathematics', 'Solo', FALSE, 'Completed', NULL, NULL, FALSE),
(11, 'EVT2026-011', 'Campus Photography Walk', 3, NULL, 2, '2026-04-05', 'Club', 8, 'Visual Arts Club', 'Solo', FALSE, 'Completed', NULL, NULL, FALSE),
(12, 'EVT2026-012', 'Open Mic: Originals Night', 3, NULL, 4, '2026-04-18', 'Club', 1, 'Music Club', 'Solo', FALSE, 'Published', NULL, NULL, FALSE),
(13, 'EVT2026-013', 'Freshers Chess Cup', 2, 6, 6, '2026-05-06', 'Department', NULL, 'Department of Mathematics', 'Solo', TRUE, 'Published', NULL, NULL, FALSE),
(14, 'EVT2026-014', 'Campus Startup Pitch', 1, 1, 6, '2026-05-14', 'Club', 4, 'Coding Club', 'Group', TRUE, 'Published', NULL, NULL, FALSE),
(15, 'EVT2026-015', 'Western Dance Face-Off', 3, NULL, 6, '2026-05-22', 'Club', 2, 'Dance Club', 'Group', TRUE, 'Published', NULL, NULL, FALSE),
(16, 'EVT2026-016', 'Microbiology Research Colloquium', 5, 14, 5, '2026-06-02', 'Department', NULL, 'Department of Microbiology', 'Solo', FALSE, 'Published', NULL, NULL, FALSE),
(17, 'EVT2026-017', 'Monsoon Debate League', 4, 12, 6, '2026-06-11', 'Club', 7, 'Debate Club', 'Group', TRUE, 'Draft', NULL, NULL, FALSE),
(18, 'EVT2026-018', 'Independence Week Choir', 3, NULL, 4, '2026-08-10', 'Club', 1, 'Music Club', 'Group', FALSE, 'Draft', NULL, NULL, FALSE),
(19, 'EVT2026-019', 'Web Development Bootcamp', 1, 1, 2, '2026-02-07', 'Department', NULL, 'Department of Computer Science and Engineering', 'Solo', FALSE, 'Completed', NULL, NULL, FALSE),
(20, 'EVT2026-020', 'Embedded Systems Hands-on Lab', 1, 2, 2, '2026-02-27', 'Department', NULL, 'Department of Electronics and Communication Engineering', 'Solo', FALSE, 'Completed', NULL, NULL, FALSE),
(21, 'EVT2026-021', 'Structural Modelling Workshop', 1, 4, 2, '2026-03-12', 'Department', NULL, 'Department of Civil Engineering', 'Solo', FALSE, 'Completed', NULL, NULL, FALSE),
(22, 'EVT2026-022', 'Data Visualisation with Python', 2, 6, 2, '2026-04-09', 'Department', NULL, 'Department of Mathematics', 'Solo', FALSE, 'Published', NULL, NULL, FALSE),
(23, 'EVT2026-023', 'Research Writing Seminar', 3, 9, 5, '2026-02-16', 'Department', NULL, 'Department of English', 'Solo', FALSE, 'Completed', NULL, NULL, FALSE),
(24, 'EVT2026-024', 'Careers in Public Policy Talk', 4, 12, 5, '2026-03-26', 'Department', NULL, 'Department of Law', 'Solo', FALSE, 'Completed', NULL, NULL, FALSE),
(25, 'EVT2026-025', 'Frontiers in Biotechnology Seminar', 5, 13, 5, '2026-04-11', 'Department', NULL, 'Department of Biotechnology', 'Solo', FALSE, 'Published', NULL, NULL, FALSE),
(26, 'EVT2026-026', 'Inter-School Badminton Meet', 1, NULL, 3, '2026-04-26', 'Club', 5, 'Sports Club', 'Group', TRUE, 'Published', NULL, NULL, FALSE),
(27, 'EVT2026-027', 'Table Tennis Singles', 2, NULL, 3, '2026-03-30', 'Club', 5, 'Sports Club', 'Solo', TRUE, 'Completed', NULL, NULL, FALSE),
(28, 'EVT2026-028', 'Short Film Screening Night', 3, NULL, 4, '2026-04-30', 'Club', 3, 'Theater Club', 'Solo', FALSE, 'Published', NULL, NULL, FALSE),
(29, 'EVT2026-029', 'Poster Making Contest', 3, NULL, 6, '2026-05-10', 'Club', 8, 'Visual Arts Club', 'Solo', TRUE, 'Published', NULL, NULL, FALSE),
(30, 'EVT2026-030', 'Campus Quiz League', 2, 7, 6, '2026-05-18', 'Department', NULL, 'Department of Physics', 'Group', TRUE, 'Published', NULL, NULL, FALSE),
(31, 'EVT2026-031', 'Machine Learning Mini Challenge', 1, 1, 1, '2026-03-05', 'Department', NULL, 'Department of Computer Science and Engineering', 'Solo', TRUE, 'Completed', NULL, NULL, FALSE),
(32, 'EVT2026-032', 'Green Mobility Design Expo', 1, 3, 1, '2026-05-28', 'Department', NULL, 'Department of Mechanical Engineering', 'Group', TRUE, 'Published', NULL, NULL, FALSE),
(33, 'EVT2026-033', 'Chemistry in Everyday Life Talk', 2, 8, 5, '2026-06-05', 'Department', NULL, 'Department of Chemistry', 'Solo', FALSE, 'Draft', NULL, NULL, FALSE),
(34, 'EVT2026-034', 'Acoustic Evening', 3, NULL, 4, '2026-06-14', 'Club', 1, 'Music Club', 'Group', FALSE, 'Draft', NULL, NULL, FALSE),
(35, 'EVT-UP-001', 'AI & Future Tech Summit 2026', 1, 1, 1, '2026-10-15', 'Department', NULL, 'Dept of Computer Science', 'Solo', FALSE, 'Published', 'Main Auditorium', 'A massive summit exploring the future of artificial intelligence, featuring keynote speakers from top tech firms and live demonstrations.', FALSE),
(36, 'EVT-UP-002', 'Inter-College Dance Battle', NULL, NULL, 4, '2026-11-05', 'Club', 2, 'Dance Club', 'Group', TRUE, 'Published', 'Open Air Theater (OAT)', 'The ultimate dance showdown! Colleges from across the state compete for the grand prize. Food stalls and DJ night included.', TRUE),
(37, 'EVT-UP-003', 'Annual Athletic Meet', NULL, NULL, 3, '2026-12-01', 'Club', 5, 'Sports Club', 'Solo', TRUE, 'Published', 'Campus Stadium', 'Three days of intense track and field events. Register now to represent your department and win the overall championship trophy!', FALSE),
(38, 'EVT-UP-004', 'Robotics & Drone Workshop', 1, 2, 2, '2026-09-20', 'Department', NULL, 'Dept of Electronics', 'Group', FALSE, 'Published', 'Robotics Lab, Block B', 'Hands-on workshop on building line-following and autonomous drones. No prior experience required. Kits will be provided.', FALSE),
(39, 'EVT-UP-005', 'Moot Court Finals', 4, 12, 6, '2026-11-20', 'Department', NULL, 'School of Law', 'Group', TRUE, 'Published', 'Law Seminar Hall', 'The final round of the intra-college moot court competition. Open for all students to attend and observe the proceedings.', FALSE);

INSERT INTO participants (
    participant_id, participant_name, roll_number, school_id, department_id, year_of_study, participant_type, participant_status,
    contact_number, email, college_name, external_department
) OVERRIDING SYSTEM VALUE VALUES
(1, 'Ananya Nair', 'CUSSTU001', 3, 9, 2, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(2, 'Joel Mathew', 'CUSSTU002', 1, 1, 3, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(3, 'Megha Thomas', 'CUSSTU003', 2, 6, 1, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(4, 'Ashwin George', 'CUSSTU004', 1, 2, 2, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(5, 'Nihal Varma', 'CUSSTU005', 1, 1, 4, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(6, 'Fathima Shirin', 'CUSSTU006', 3, 9, 3, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(7, 'Aiswarya Pillai', 'CUSSTU007', 3, 10, 2, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(8, 'Joel Francis', 'CUSSTU008', 5, 13, 2, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(9, 'Sandra Jacob', 'CUSSTU009', 5, 14, 4, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(10, 'Aditya Krishnan', 'CUSSTU010', 4, 12, 3, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(11, 'Nimisha Babu', 'CUSSTU011', 2, 7, 1, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(12, 'Ritika Jose', 'CUSSTU012', 1, 4, 3, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(13, 'Arun Suresh', 'CUSSTU013', 1, 3, 2, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(14, 'Midhun Raj', 'CUSSTU014', 1, 2, 4, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(15, 'Keerthana Das', 'CUSSTU015', 3, 11, 1, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(16, 'Naveen Thomas', 'CUSSTU016', 2, 8, 3, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(17, 'Esther Maria', 'CUSSTU017', 5, 13, 1, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(18, 'Gokul Krishna', 'CUSSTU018', 1, 1, 2, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(19, 'Sneha Kurian', 'CUSSTU019', 3, 9, 4, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(20, 'Ameen Farooq', 'CUSSTU020', 4, 12, 2, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(21, 'Rebecca Philip', 'CUSSTU021', 2, 6, 2, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(22, 'Devika Menon', 'CUSSTU022', 3, 10, 3, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(23, 'Yadhu Prakash', 'CUSSTU023', 1, 4, 1, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(24, 'Elsa John', 'CUSSTU024', 5, 14, 2, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(25, 'Harikrishnan P', 'CUSSTU025', 1, 5, 3, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(26, 'Merin George', 'CUSSTU026', 2, 7, 4, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(27, 'Abel Sunny', 'CUSSTU027', 3, 11, 2, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(28, 'Parvathy Nair', 'CUSSTU028', 5, 13, 3, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(29, 'Noel Francis', 'CUSSTU029', 1, 3, 4, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(30, 'Tania Mathew', 'CUSSTU030', 2, 8, 2, 'internal', 'Attended', NULL, NULL, NULL, NULL),
(31, 'Dhanush R', 'CUSSTU031', 1, 1, 1, 'internal', 'Approved', NULL, NULL, NULL, NULL),
(32, 'Lakshmi Varghese', 'CUSSTU032', 3, 9, 1, 'internal', 'Approved', NULL, NULL, NULL, NULL),
(33, 'Alen Varghese', 'CUSSTU033', 1, 2, 2, 'internal', 'Approved', NULL, NULL, NULL, NULL),
(34, 'Sreelakshmi P', 'CUSSTU034', 2, 6, 3, 'internal', 'Approved', NULL, NULL, NULL, NULL),
(35, 'Jerin Paul', 'CUSSTU035', 4, 12, 4, 'internal', 'Approved', NULL, NULL, NULL, NULL),
(36, 'Maya Rose', 'CUSSTU036', 3, 10, 2, 'internal', 'Approved', NULL, NULL, NULL, NULL),
(37, 'Navaneeth K', 'CUSSTU037', 5, 14, 1, 'internal', 'Registered', NULL, NULL, NULL, NULL),
(38, 'Diya Elizabeth', 'CUSSTU038', 1, 4, 2, 'internal', 'Registered', NULL, NULL, NULL, NULL),
(39, 'Akhil Anand', 'CUSSTU039', 1, 1, 3, 'internal', 'Registered', NULL, NULL, NULL, NULL),
(40, 'Grace Mathew', 'CUSSTU040', 3, 11, 4, 'internal', 'Registered', NULL, NULL, NULL, NULL),
(41, 'Vivek Joseph', NULL, NULL, NULL, NULL, 'external', 'Attended', NULL, NULL, NULL, NULL),
(42, 'Hannah Thomas', NULL, NULL, NULL, NULL, 'external', 'Attended', NULL, NULL, NULL, NULL),
(43, 'Rhea Kapoor', NULL, NULL, NULL, NULL, 'external', 'Attended', NULL, NULL, NULL, NULL),
(44, 'Sanjay Iyer', NULL, NULL, NULL, NULL, 'external', 'Attended', NULL, NULL, NULL, NULL),
(45, 'Ishaan Malhotra', NULL, NULL, NULL, NULL, 'external', 'Attended', NULL, NULL, NULL, NULL),
(46, 'Mariam David', NULL, NULL, NULL, NULL, 'external', 'Approved', NULL, NULL, NULL, NULL),
(47, 'Farah Khan', NULL, NULL, NULL, NULL, 'external', 'Approved', NULL, NULL, NULL, NULL),
(48, 'Aravind Narayan', NULL, NULL, NULL, NULL, 'external', 'Registered', NULL, NULL, NULL, NULL);

INSERT INTO teams (team_id, event_id, team_name) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 'Stack Route'), (2, 1, 'Late Commit'), (3, 1, 'Byte Club'),
(4, 4, 'Raag & Rhythm'), (5, 4, 'Moonlight Notes'), (6, 5, 'Backstage Theory'),
(7, 5, 'Open Curtain'), (8, 6, 'Blue Boots'), (9, 6, 'North Block FC'),
(10, 9, 'Ratio Decidendi'), (11, 9, 'Obiter Circle'), (12, 14, 'Pitch Deck'),
(13, 14, 'Second Draft'), (14, 15, 'After Hours'), (15, 15, 'Studio Nine'),
(16, 17, 'Cross Examination'), (17, 18, 'Campus Harmony'), (18, 26, 'Rally Racquets'),
(19, 26, 'Baseline Crew'), (20, 30, 'Photon Four'), (21, 30, 'Prime Minds'),
(22, 32, 'Torque Lab'), (23, 32, 'Eco Drive Collective'), (24, 34, 'The Cedar Notes'),
(25, 34, 'Velvet Strings');

INSERT INTO team_members (team_member_id, team_id, participant_id) OVERRIDING SYSTEM VALUE VALUES
(1, 1, 2), (2, 1, 5), (3, 1, 18), (4, 2, 3), (5, 2, 11), (6, 2, 21),
(7, 3, 31), (8, 3, 39), (9, 3, 41), (10, 4, 1), (11, 4, 6), (12, 5, 19), (13, 5, 42),
(14, 6, 7), (15, 6, 15), (16, 6, 22), (17, 6, 27), (18, 7, 32), (19, 7, 36), (20, 7, 40),
(21, 8, 13), (22, 8, 23), (23, 8, 29), (24, 8, 41), (25, 9, 12), (26, 9, 25), (27, 9, 38), (28, 9, 45),
(29, 10, 10), (30, 10, 20), (31, 10, 35), (32, 11, 43), (33, 11, 46), (34, 11, 47),
(35, 12, 2), (36, 12, 31), (37, 12, 41), (38, 13, 5), (39, 13, 33), (40, 13, 48),
(41, 14, 6), (42, 14, 19), (43, 14, 32), (44, 14, 42), (45, 15, 7), (46, 15, 22), (47, 15, 36), (48, 15, 40),
(49, 16, 10), (50, 16, 20), (51, 16, 35), (52, 17, 1), (53, 17, 6), (54, 17, 19), (55, 17, 32),
(56, 18, 2), (57, 18, 25), (58, 19, 11), (59, 19, 41), (60, 20, 3), (61, 20, 16), (62, 20, 21),
(63, 21, 26), (64, 21, 30), (65, 21, 34), (66, 22, 13), (67, 22, 29), (68, 22, 38),
(69, 23, 23), (70, 23, 37), (71, 23, 48), (72, 24, 6), (73, 24, 19), (74, 24, 42),
(75, 25, 1), (76, 25, 32), (77, 25, 46);

INSERT INTO event_participants (event_participant_id, event_id, participant_id) OVERRIDING SYSTEM VALUE VALUES
(1, 2, 4), (2, 2, 14), (3, 2, 33), (4, 2, 44), (5, 2, 45), (6, 3, 1), (7, 3, 6), (8, 3, 19), (9, 3, 32), (10, 3, 42),
(11, 7, 7), (12, 7, 15), (13, 7, 22), (14, 7, 27), (15, 7, 36), (16, 7, 47), (17, 8, 8), (18, 8, 17), (19, 8, 28), (20, 8, 43),
(21, 10, 3), (22, 10, 11), (23, 10, 16), (24, 10, 21), (25, 10, 26), (26, 10, 30), (27, 11, 1), (28, 11, 7), (29, 11, 22), (30, 11, 32), (31, 11, 36), (32, 11, 46),
(33, 12, 1), (34, 12, 6), (35, 12, 19), (36, 12, 32), (37, 12, 42), (38, 13, 3), (39, 13, 11), (40, 13, 21), (41, 13, 26), (42, 13, 34),
(43, 16, 9), (44, 16, 17), (45, 16, 24), (46, 16, 28), (47, 16, 37), (48, 18, 15), (49, 18, 19), (50, 18, 32), (51, 18, 40),
(52, 19, 2), (53, 19, 5), (54, 19, 18), (55, 19, 31), (56, 19, 39), (57, 20, 4), (58, 20, 14), (59, 20, 33), (60, 20, 44),
(61, 21, 12), (62, 21, 23), (63, 21, 38), (64, 21, 45), (65, 22, 3), (66, 22, 11), (67, 22, 21), (68, 22, 26), (69, 22, 34),
(70, 23, 1), (71, 23, 7), (72, 23, 15), (73, 23, 22), (74, 23, 36), (75, 24, 10), (76, 24, 20), (77, 24, 35), (78, 24, 46),
(79, 25, 8), (80, 25, 17), (81, 25, 28), (82, 25, 37), (83, 27, 3), (84, 27, 11), (85, 27, 21), (86, 27, 26), (87, 27, 34), (88, 27, 47),
(89, 28, 6), (90, 28, 15), (91, 28, 19), (92, 28, 32), (93, 28, 42), (94, 29, 7), (95, 29, 22), (96, 29, 32), (97, 29, 36), (98, 29, 46),
(99, 31, 2), (100, 31, 5), (101, 31, 18), (102, 31, 31), (103, 31, 39), (104, 31, 41), (105, 33, 16), (106, 33, 26), (107, 33, 30), (108, 33, 47);

INSERT INTO event_results (
    result_id, event_id, participant_id, team_id, position, score, prize_amount, result_status
) OVERRIDING SYSTEM VALUE VALUES
(1, 1, NULL, 1, '1st', 94.50, 12000.00, 'Published'),
(2, 1, NULL, 2, '2nd', 90.00, 7000.00, 'Published'),
(3, 1, NULL, 3, '3rd', 85.50, 3000.00, 'Published'),
(4, 2, 14, NULL, '1st', 92.00, 3000.00, 'Published'),
(5, 2, 4, NULL, '2nd', 88.50, 2000.00, 'Published'),
(6, 2, 33, NULL, '3rd', 84.00, 1000.00, 'Published'),
(7, 3, 6, NULL, '1st', 95.00, 2500.00, 'Published'),
(8, 3, 1, NULL, '2nd', 91.00, 1500.00, 'Published'),
(9, 3, 42, NULL, '3rd', 87.50, 800.00, 'Published'),
(10, 4, NULL, 4, '1st', 93.00, 4000.00, 'Published'),
(11, 4, NULL, 5, '2nd', 89.00, 2500.00, 'Published'),
(12, 6, NULL, 8, '1st', 4.00, 6000.00, 'Published'),
(13, 6, NULL, 9, '2nd', 2.00, 3500.00, 'Published'),
(14, 7, 22, NULL, '1st', 90.00, 2000.00, 'Published'),
(15, 7, 15, NULL, '2nd', 86.00, 1200.00, 'Published'),
(16, 7, 47, NULL, '3rd', 81.00, 700.00, 'Published'),
(17, 8, 28, NULL, '1st', 94.00, 2200.00, 'Published'),
(18, 8, 17, NULL, '2nd', 89.00, 1400.00, 'Published'),
(19, 8, 43, NULL, '3rd', 84.00, 900.00, 'Published'),
(20, 9, NULL, 10, '1st', 96.00, 5000.00, 'Published'),
(21, 9, NULL, 11, '2nd', 90.00, 3000.00, 'Published'),
(22, 27, 21, NULL, '1st', 11.00, 1800.00, 'Published'),
(23, 27, 3, NULL, '2nd', 9.00, 1200.00, 'Published'),
(24, 27, 34, NULL, '3rd', 7.00, 700.00, 'Published'),
(25, 31, 18, NULL, '1st', 96.00, 2500.00, 'Published'),
(26, 31, 2, NULL, '2nd', 91.00, 1500.00, 'Published'),
(27, 31, 39, NULL, '3rd', 87.00, 800.00, 'Published');

SELECT setval(pg_get_serial_sequence('schools', 'school_id'), (SELECT MAX(school_id) FROM schools));
SELECT setval(pg_get_serial_sequence('departments', 'department_id'), (SELECT MAX(department_id) FROM departments));
SELECT setval(pg_get_serial_sequence('categories', 'category_id'), (SELECT MAX(category_id) FROM categories));
SELECT setval(pg_get_serial_sequence('clubs', 'club_id'), (SELECT MAX(club_id) FROM clubs));
SELECT setval(pg_get_serial_sequence('roles', 'role_id'), (SELECT MAX(role_id) FROM roles));
SELECT setval(pg_get_serial_sequence('users', 'user_id'), (SELECT MAX(user_id) FROM users));
SELECT setval(pg_get_serial_sequence('events', 'event_id'), (SELECT MAX(event_id) FROM events));
SELECT setval(pg_get_serial_sequence('participants', 'participant_id'), (SELECT MAX(participant_id) FROM participants));
SELECT setval(pg_get_serial_sequence('teams', 'team_id'), (SELECT MAX(team_id) FROM teams));
SELECT setval(pg_get_serial_sequence('team_members', 'team_member_id'), (SELECT MAX(team_member_id) FROM team_members));
SELECT setval(pg_get_serial_sequence('event_participants', 'event_participant_id'), (SELECT MAX(event_participant_id) FROM event_participants));
SELECT setval(pg_get_serial_sequence('event_results', 'result_id'), (SELECT MAX(result_id) FROM event_results));

-- Row Level Security (RLS) Policies (Permissive for development)
CREATE POLICY "Allow all operations events" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations participants" ON participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations event_participants" ON event_participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations event_results" ON event_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations teams" ON teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations team_members" ON team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations clubs" ON clubs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations users" ON users FOR ALL USING (true) WITH CHECK (true);
