import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Trophy, Star, Activity, Medal, Settings2, RefreshCw, Download, Building2, Users2, CalendarRange } from 'lucide-react';
import { buildApiUrl } from '../api';

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('custom'); // leaderboard, custom
  
  const [topStudents, setTopStudents] = useState([]);
  const [activeClubs, setActiveClubs] = useState([]);
  const [insightCards, setInsightCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Custom Chart Settings
  const [xFeature, setXFeature] = useState('organizer_unit');
  const [yFeature, setYFeature] = useState('total_events');
  const [chartType, setChartType] = useState('bar');
  const [chartTimestamp, setChartTimestamp] = useState(Date.now());

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      try {
        // Leaderboard Data
        const { data: topStudentsData } = await supabase.from('view_top_students').select('*').order('awards', { ascending: false }).order('prize', { ascending: false }).limit(10);
        if (topStudentsData) setTopStudents(topStudentsData);

        const { data: activeClubsData } = await supabase.from('view_active_clubs').select('*').order('events', { ascending: false }).order('footfall', { ascending: false }).limit(10);
        if (activeClubsData) setActiveClubs(activeClubsData);

        const { data: eventsData } = await supabase
          .from('events')
          .select('event_id, event_status, conducted_by_type, is_competition, clubs(club_name), departments(department_name)');

        if (eventsData) {
          const completedEvents = eventsData.filter((event) => event.event_status === 'Completed');
          const clubEvents = completedEvents.filter((event) => event.conducted_by_type === 'Club');
          const departmentEvents = completedEvents.filter((event) => event.conducted_by_type === 'Department');

          const organizerCounts = completedEvents.reduce((acc, event) => {
            const label =
              event.conducted_by_type === 'Club'
                ? event.clubs?.club_name || 'Unknown club'
                : event.departments?.department_name || 'Unknown department';

            acc[label] = (acc[label] || 0) + 1;
            return acc;
          }, {});

          const topOrganizer = Object.entries(organizerCounts).sort((a, b) => b[1] - a[1])[0];

          setInsightCards([
            {
              title: 'Completed Events',
              value: completedEvents.length,
              note: `${clubEvents.length} club-led and ${departmentEvents.length} department-led`,
              icon: CalendarRange,
              accent: '#60a5fa',
            },
            {
              title: 'Top Organizer',
              value: topOrganizer ? topOrganizer[0] : 'No data',
              note: topOrganizer ? `${topOrganizer[1]} completed events` : 'No organizer activity yet',
              icon: Building2,
              accent: '#f59e0b',
            },
            {
              title: 'Most Active Club',
              value: activeClubsData?.[0]?.name || 'No data',
              note: activeClubsData?.[0] ? `${activeClubsData[0].events} events, ${activeClubsData[0].footfall} attendees` : 'No club data available',
              icon: Users2,
              accent: '#34d399',
            }
          ]);
        }

      } catch (err) {
        console.error("Error loading reports", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadReports();
  }, []);

  const refreshChart = () => {
    setChartTimestamp(Date.now());
  };

  const getChartUrl = () => {
    return buildApiUrl(`/api/charts/dynamic?x_feature=${xFeature}&y_feature=${yFeature}&chart_type=${chartType}&t=${chartTimestamp}`);
  };

  const exportUrl = buildApiUrl(`/api/export/dynamic?x_feature=${xFeature}&y_feature=${yFeature}`);

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>Intelligence Center</h1>
          <p>Historical analytics based on completed events and published results.</p>
        </div>
        <div className="tabs" style={{ background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            className={`btn ${selectedReport === 'custom' ? 'btn-primary' : ''}`} 
            onClick={() => setSelectedReport('custom')}
            style={{ 
              padding: '8px 16px', 
              borderRadius: '8px',
              background: selectedReport !== 'custom' ? 'transparent' : '', 
              color: selectedReport !== 'custom' ? 'var(--text-secondary)' : 'white',
              boxShadow: selectedReport !== 'custom' ? 'none' : ''
            }}
          >
            <Settings2 size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/> Custom Visualizer
          </button>
          <button 
            className={`btn ${selectedReport === 'leaderboard' ? 'btn-primary' : ''}`} 
            onClick={() => setSelectedReport('leaderboard')}
            style={{ 
              padding: '8px 16px', 
              borderRadius: '8px',
              background: selectedReport !== 'leaderboard' ? 'transparent' : '', 
              color: selectedReport !== 'leaderboard' ? 'var(--text-secondary)' : 'white',
              boxShadow: selectedReport !== 'leaderboard' ? 'none' : ''
            }}
          >
            <Trophy size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }}/> Leaderboards
          </button>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-grid">
          <div className="chart-card wide panel skeleton" style={{ height: '400px' }}></div>
          <div className="chart-card narrow panel skeleton" style={{ height: '400px' }}></div>
        </div>
      ) : (
        <div className="dashboard-grid">
          {selectedReport === 'custom' && insightCards.length > 0 && (
            <>
              {insightCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="stat-card panel" style={{ borderTop: `4px solid ${card.accent}` }}>
                    <div className="stat-header">
                      <span style={{ color: 'var(--text-secondary)' }}>{card.title}</span>
                      <div className="stat-icon" style={{ background: `${card.accent}1a`, color: card.accent }}>
                        <Icon size={22} />
                      </div>
                    </div>
                    <div className="stat-value" style={{ color: 'white', fontSize: typeof card.value === 'number' ? undefined : '1.35rem', lineHeight: 1.2 }}>
                      {card.value}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>
                      {card.note}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          
          {selectedReport === 'custom' && (
            <div className="chart-card wide panel" style={{ gridColumn: 'span 12', background: 'var(--card-bg)' }}>
              <div className="chart-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3>Python Visualization Builder</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>All charts on this page are scoped to completed events so the insights stay consistent and presentation-safe.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={refreshChart} className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '20px' }}>
                    <RefreshCw size={16} style={{ marginRight: '8px' }} /> Refresh Data
                  </button>
                  <a href={exportUrl} target="_blank" rel="noreferrer" className="btn" style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--border-color)', color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)' }}>
                    <Download size={16} style={{ marginRight: '8px' }} /> Export CSV
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Categorical Feature (X-Axis)</label>
                  <select className="form-control" value={xFeature} onChange={(e) => setXFeature(e.target.value)}>
                    <option value="organizer_unit">Organizer Unit</option>
                    <option value="department_host_name">Department-Organized Events</option>
                    <option value="category_name">Event Category</option>
                    <option value="club_host_name">Club-Organized Events</option>
                    <option value="participant_type">Participant Demographics</option>
                    <option value="event_month">Month (Timeline)</option>
                  </select>
                </div>

                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Measurement Metric (Y-Axis)</label>
                  <select className="form-control" value={yFeature} onChange={(e) => setYFeature(e.target.value)} disabled={xFeature === 'participant_type'}>
                    <option value="total_events">Total Events Conducted</option>
                    <option value="total_participants">Total Participant Footfall</option>
                    <option value="total_prize_money">Total Prize Money ($)</option>
                  </select>
                </div>

                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Visualization Type</label>
                  <select className="form-control" value={chartType} onChange={(e) => setChartType(e.target.value)}>
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="pie">Pie Chart</option>
                  </select>
                </div>
              </div>

              <div style={{ 
                height: '450px', 
                width: '100%', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                background: '#0f172a', 
                borderRadius: '8px',
                border: '1px solid #334155',
                overflow: 'hidden'
              }}>
                <img 
                  src={getChartUrl()} 
                  alt="Dynamic Python Chart" 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div style="color: #f87171; text-align: center;"><p>Could not connect to Python analytics service.</p><p style="font-size: 0.9rem; color: #94a3b8;">For deployment, set <code>VITE_API_BASE_URL</code> to the Flask service URL.</p></div>';
                  }}
                />
              </div>
              <div style={{ marginTop: '14px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Insight note: organizer views show only the unit that actually conducted the event, so club and department ownership are not mixed.
              </div>
            </div>
          )}

          {selectedReport === 'leaderboard' && (
            <>
              {/* Top Students Leaderboard */}
              <div className="chart-card wide panel" style={{ background: 'var(--card-bg)' }}>
                <div className="chart-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '12px', color: '#f59e0b' }}>
                    <Trophy size={24} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'white' }}>Top Performing Students</h3>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px', fontWeight: 600 }}>Rank</th>
                      <th style={{ padding: '12px', fontWeight: 600 }}>Student Name</th>
                      <th style={{ padding: '12px', fontWeight: 600 }}>Type</th>
                      <th style={{ padding: '12px', fontWeight: 600, textAlign: 'center' }}>Total Awards</th>
                      <th style={{ padding: '12px', fontWeight: 600, textAlign: 'right' }}>Total Prize Money</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topStudents.length === 0 ? (
                      <tr><td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No award data available yet.</td></tr>
                    ) : topStudents.map((s, idx) => (
                      <tr key={s.participant_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '16px' }}>
                          {idx === 0 ? <Medal size={24} color="#f59e0b" /> : 
                           idx === 1 ? <Medal size={24} color="#94a3b8" /> : 
                           idx === 2 ? <Medal size={24} color="#b45309" /> : 
                           <span style={{ color: 'var(--text-secondary)', fontWeight: 600, marginLeft: '8px' }}>#{idx + 1}</span>}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: 600, color: 'white' }}>{s.participant_name}</div>
                          {s.roll_number && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.roll_number}</div>}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span className="event-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                            {s.participant_type}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(20, 184, 166, 0.1)', color: '#2dd4bf', padding: '4px 12px', borderRadius: '20px', fontWeight: 600 }}>
                            <Star size={14} /> {s.awards}
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>
                          ${s.prize.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Active Clubs Leaderboard */}
              <div className="chart-card narrow panel" style={{ background: 'var(--card-bg)' }}>
                <div className="chart-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '10px', borderRadius: '12px', color: '#ec4899' }}>
                    <Activity size={24} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'white' }}>Most Active Clubs</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {activeClubs.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>No club data available.</div>
                  ) : activeClubs.map((c, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'white', marginBottom: '4px' }}>{idx + 1}. {c.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--primary-navy-light)' }}>{c.events} Events Organized</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>{c.footfall}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Attendees</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
}
