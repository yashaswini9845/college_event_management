-- 5 Meaningful Analytical SQL Queries for the College Event Intelligence Portal

-- Query 1: Department-wise Event Count and Participation Volume
-- Useful for HODs & Management to see which departments are most active
SELECT 
    d.department_name,
    COUNT(DISTINCT e.event_id) AS total_events_conducted,
    COUNT(ep.participant_id) AS total_participants_engaged
FROM 
    departments d
LEFT JOIN 
    events e ON d.department_id = e.department_id
LEFT JOIN 
    event_participants ep ON e.event_id = ep.event_id
GROUP BY 
    d.department_name
ORDER BY 
    total_participants_engaged DESC;


-- Query 2: Internal vs External Participation Ratio
-- Useful for Student Affairs to understand external reach of college events
SELECT 
    e.event_name,
    c.category_name,
    COUNT(CASE WHEN p.participant_type = 'internal' THEN 1 END) AS internal_participants,
    COUNT(CASE WHEN p.participant_type = 'external' THEN 1 END) AS external_participants,
    COUNT(p.participant_id) AS total_participants,
    ROUND(
        COUNT(CASE WHEN p.participant_type = 'external' THEN 1 END) * 100.0 / NULLIF(COUNT(p.participant_id), 0), 2
    ) AS external_participation_percentage
FROM 
    events e
JOIN 
    categories c ON e.category_id = c.category_id
JOIN 
    event_participants ep ON e.event_id = ep.event_id
JOIN 
    participants p ON ep.participant_id = p.participant_id
GROUP BY 
    e.event_id, e.event_name, c.category_name
ORDER BY 
    external_participation_percentage DESC;


-- Query 3: Event Frequency by Month (Semester Trends)
-- Useful for identifying peak event seasons and avoiding overlaps
SELECT 
    TO_CHAR(event_date, 'YYYY-MM') AS event_month,
    COUNT(event_id) AS total_events,
    SUM(CASE WHEN is_competition = TRUE THEN 1 ELSE 0 END) AS total_competitions,
    SUM(CASE WHEN is_competition = FALSE THEN 1 ELSE 0 END) AS total_workshops_or_seminars
FROM 
    events
GROUP BY 
    TO_CHAR(event_date, 'YYYY-MM')
ORDER BY 
    event_month;


-- Query 4: Top Performing Students (Most Prizes Won)
-- Useful for Students and Faculty to identify top talent
SELECT 
    p.participant_name,
    p.roll_number,
    COUNT(er.result_id) AS total_awards,
    SUM(er.prize_amount) AS total_prize_money
FROM 
    event_results er
JOIN 
    participants p ON er.participant_id = p.participant_id
WHERE 
    er.position IN ('1st', '2nd', '3rd')
GROUP BY 
    p.participant_id, p.participant_name, p.roll_number
ORDER BY 
    total_awards DESC, total_prize_money DESC
LIMIT 10;


-- Query 5: Active Organizers / Club Performance
-- Identifies which clubs are conducting the most events and attracting the most participants
SELECT 
    cl.club_name,
    COUNT(DISTINCT e.event_id) AS events_organized,
    COUNT(ep.participant_id) AS total_footfall
FROM 
    clubs cl
JOIN 
    events e ON cl.club_id = e.club_id
LEFT JOIN 
    event_participants ep ON e.event_id = ep.event_id
WHERE 
    e.conducted_by_type = 'Club'
GROUP BY 
    cl.club_name
ORDER BY 
    events_organized DESC, total_footfall DESC;
