-- Derived/Aggregated tables
-- Keeps analytics outputs separate from transactional raw data.

CREATE TABLE IF NOT EXISTS derived_department_metrics (
    department_id INT PRIMARY KEY REFERENCES departments(department_id),
    department_name VARCHAR(150) NOT NULL,
    event_count INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS derived_participation_metrics (
    event_id INT PRIMARY KEY REFERENCES events(event_id),
    event_name VARCHAR(200) NOT NULL,
    event_date DATE NOT NULL,
    total_registrations INT NOT NULL DEFAULT 0,
    internal_registrations INT NOT NULL DEFAULT 0,
    external_registrations INT NOT NULL DEFAULT 0,
    external_participation_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS derived_top_performers (
    participant_id INT PRIMARY KEY REFERENCES participants(participant_id),
    participant_name VARCHAR(150) NOT NULL,
    roll_number VARCHAR(50),
    total_awards INT NOT NULL DEFAULT 0,
    total_prize_money NUMERIC(12,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS derived_monthly_frequency (
    month_key VARCHAR(7) PRIMARY KEY, -- YYYY-MM
    events_in_month INT NOT NULL DEFAULT 0,
    competitions_in_month INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_department_id ON events(department_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_department_id ON participants(department_id);


-- Analytics Views for College Event Management System
-- Run this in your Supabase SQL Editor to create the views needed for the dashboard and reports.

-- 1. View for Top Performing Students
CREATE OR REPLACE VIEW view_top_students AS
SELECT 
    p.participant_id,
    p.participant_name,
    p.roll_number,
    p.participant_type,
    COUNT(er.result_id)::integer AS awards,
    COALESCE(SUM(er.prize_amount), 0)::numeric AS prize
FROM 
    event_results er
JOIN 
    participants p ON er.participant_id = p.participant_id
WHERE 
    er.position IN ('1st', '2nd', '3rd')
GROUP BY 
    p.participant_id, p.participant_name, p.roll_number, p.participant_type;

-- 2. View for Active Clubs
CREATE OR REPLACE VIEW view_active_clubs AS
SELECT 
    cl.club_id,
    cl.club_name AS name,
    COUNT(DISTINCT e.event_id)::integer AS events,
    COUNT(ep.participant_id)::integer AS footfall
FROM 
    clubs cl
JOIN 
    events e ON cl.club_id = e.club_id
LEFT JOIN 
    event_participants ep ON e.event_id = ep.event_id
WHERE 
    e.conducted_by_type = 'Club'
GROUP BY 
    cl.club_id, cl.club_name;

-- 3. View for Monthly Event Frequency
CREATE OR REPLACE VIEW view_monthly_frequency AS
SELECT 
    TO_CHAR(event_date, 'YYYY-MM') AS month_key,
    TO_CHAR(event_date, 'Mon') AS name,
    COUNT(event_id)::integer AS events
FROM 
    events
GROUP BY 
    TO_CHAR(event_date, 'YYYY-MM'),
    TO_CHAR(event_date, 'Mon')
ORDER BY 
    month_key;

-- 4. View for Event Categories Distribution
CREATE OR REPLACE VIEW view_category_distribution AS
SELECT 
    c.category_name AS name,
    COUNT(e.event_id)::integer AS value
FROM 
    categories c
JOIN 
    events e ON c.category_id = e.category_id
GROUP BY 
    c.category_name;

-- 5. View for Department Participation Volume
CREATE OR REPLACE VIEW view_department_participation AS
SELECT 
    d.department_name AS name,
    COUNT(DISTINCT e.event_id)::integer AS events,
    COUNT(ep.participant_id)::integer AS participants
FROM 
    departments d
LEFT JOIN 
    events e ON d.department_id = e.department_id
LEFT JOIN 
    event_participants ep ON e.event_id = ep.event_id
GROUP BY 
    d.department_name;

-- 6. View for Internal vs External Ratio
CREATE OR REPLACE VIEW view_internal_external_ratio AS
SELECT 
    p.participant_type AS name,
    COUNT(p.participant_id)::integer AS value
FROM 
    participants p
JOIN 
    event_participants ep ON p.participant_id = ep.participant_id
GROUP BY 
    p.participant_type;

-- 7. View for Monthly Registration Velocity
CREATE OR REPLACE VIEW view_monthly_registrations AS
SELECT 
    TO_CHAR(e.event_date, 'YYYY-MM') AS month_key,
    TO_CHAR(e.event_date, 'Mon') AS name,
    COUNT(ep.participant_id)::integer AS registrations
FROM 
    events e
JOIN 
    event_participants ep ON e.event_id = ep.event_id
GROUP BY 
    TO_CHAR(e.event_date, 'YYYY-MM'),
    TO_CHAR(e.event_date, 'Mon')
ORDER BY 
    month_key;
