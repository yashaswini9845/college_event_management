import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Activity, Users, Trophy, BookOpen, Calendar, Award, CheckCircle, Download } from 'lucide-react';
import RegistrationModal from '../components/RegistrationModal';
import { buildApiUrl } from '../api';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalParticipants: 0,
    activeClubs: 0,
    totalCompetitions: 0
  });
  const [loading, setLoading] = useState(true);
  const [chartTimestamp, setChartTimestamp] = useState(Date.now());

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const refreshCharts = () => {
    setChartTimestamp(Date.now());
  };

  const timelineChartUrl = buildApiUrl(`/api/charts/dashboard_timeline?t=${chartTimestamp}`);
  const registrationChartUrl = buildApiUrl(`/api/charts/dynamic?x_feature=event_month&y_feature=total_participants&chart_type=line&t=${chartTimestamp}`);
  const categoriesChartUrl = buildApiUrl(`/api/charts/dashboard_categories?t=${chartTimestamp}`);
  const timelineExportUrl = buildApiUrl('/api/export/dynamic?x_feature=event_month&y_feature=total_events');
  const registrationExportUrl = buildApiUrl('/api/export/dynamic?x_feature=event_month&y_feature=total_participants');
  const categoryExportUrl = buildApiUrl('/api/export/dynamic?x_feature=category_name&y_feature=total_events');

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const { count: totalEvents, error: e1 } = await supabase.from('events').select('*', { count: 'exact', head: true });
      const { count: totalParticipants, error: e2 } = await supabase.from('participants').select('*', { count: 'exact', head: true });
      const { count: activeClubs, error: e3 } = await supabase.from('clubs').select('*', { count: 'exact', head: true });
      const { count: totalCompetitions, error: e4 } = await supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_competition', true);

      if (e1 || e2 || e3 || e4) throw (e1 || e2 || e3 || e4);

      setStats({ 
        totalEvents: totalEvents || 0, 
        totalParticipants: totalParticipants || 0, 
        activeClubs: activeClubs || 0, 
        totalCompetitions: totalCompetitions || 0 
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="animate-fade-in" style={{ textAlign: 'center', marginTop: '100px' }}><h3>Loading insights...</h3></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Python-generated insights based on your event and participation data.</p>
        </div>
        <button className="btn btn-primary" onClick={refreshCharts} style={{ borderRadius: '20px', padding: '10px 16px' }}>
          Refresh Visuals
        </button>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card panel" style={{ borderTop: '4px solid #14b8a6' }}>
          <div className="stat-header">
            <span style={{ color: 'var(--text-secondary)' }}>Total Events</span>
            <div className="stat-icon" style={{ background: 'rgba(20, 184, 166, 0.1)', color: '#14b8a6' }}><Activity size={24} /></div>
          </div>
          <div className="stat-value" style={{ color: 'white' }}>{stats.totalEvents}</div>
        </div>

        <div className="stat-card panel" style={{ borderTop: '4px solid #8b5cf6' }}>
          <div className="stat-header">
            <span style={{ color: 'var(--text-secondary)' }}>Participants</span>
            <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}><Users size={24} /></div>
          </div>
          <div className="stat-value" style={{ color: 'white' }}>{stats.totalParticipants}</div>
        </div>

        <div className="stat-card panel" style={{ borderTop: '4px solid #f43f5e' }}>
          <div className="stat-header">
            <span style={{ color: 'var(--text-secondary)' }}>Competitions</span>
            <div className="stat-icon" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' }}><Trophy size={24} /></div>
          </div>
          <div className="stat-value" style={{ color: 'white' }}>{stats.totalCompetitions}</div>
        </div>

        <div className="stat-card panel" style={{ borderTop: '4px solid #f59e0b' }}>
          <div className="stat-header">
            <span style={{ color: 'var(--text-secondary)' }}>Active Clubs</span>
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><BookOpen size={24} /></div>
          </div>
          <div className="stat-value" style={{ color: 'white' }}>{stats.activeClubs}</div>
        </div>

        <div className="chart-card wide panel">
          <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>Event Timeline</h3>
              <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Shows when event activity peaked across the academic year.
              </p>
            </div>
            <a href={timelineExportUrl} target="_blank" rel="noreferrer" className="btn" style={{ padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none' }}>
              <Download size={14} style={{ marginRight: '6px' }} /> Export CSV
            </a>
          </div>
          <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f172a', borderRadius: '8px' }}>
             <img src={timelineChartUrl} alt="Timeline Chart" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={(e) => {
               e.currentTarget.style.display = 'none';
               e.currentTarget.parentElement.innerHTML = '<div style="color:#f87171;text-align:center;"><p>Python visualization service unavailable.</p><p style="font-size:0.9rem;color:#94a3b8;">Set <code>VITE_API_BASE_URL</code> for deployment and keep the Flask chart service running.</p></div>';
             }} />
          </div>
        </div>

        <div className="chart-card wide panel">
          <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>Monthly Registration Velocity</h3>
              <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Tracks which months drew the strongest participant response.
              </p>
            </div>
            <a href={registrationExportUrl} target="_blank" rel="noreferrer" className="btn" style={{ padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none' }}>
              <Download size={14} style={{ marginRight: '6px' }} /> Export CSV
            </a>
          </div>
          <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f172a', borderRadius: '8px' }}>
             <img src={registrationChartUrl} alt="Registration Velocity" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={(e) => {
               e.currentTarget.style.display = 'none';
               e.currentTarget.parentElement.innerHTML = '<div style="color:#f87171;text-align:center;"><p>Python visualization service unavailable.</p><p style="font-size:0.9rem;color:#94a3b8;">Set <code>VITE_API_BASE_URL</code> for deployment and keep the Flask chart service running.</p></div>';
             }} />
          </div>
        </div>

        <div className="chart-card narrow panel">
          <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>Event Categories</h3>
              <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Highlights the dominant types of events your campus actually runs.
              </p>
            </div>
            <a href={categoryExportUrl} target="_blank" rel="noreferrer" className="btn" style={{ padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none' }}>
              <Download size={14} style={{ marginRight: '6px' }} /> Export CSV
            </a>
          </div>
          <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f172a', borderRadius: '8px' }}>
             <img src={categoriesChartUrl} alt="Categories Chart" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={(e) => {
               e.currentTarget.style.display = 'none';
               e.currentTarget.parentElement.innerHTML = '<div style="color:#f87171;text-align:center;"><p>Python visualization service unavailable.</p><p style="font-size:0.9rem;color:#94a3b8;">Set <code>VITE_API_BASE_URL</code> for deployment and keep the Flask chart service running.</p></div>';
             }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const [showRegModal, setShowRegModal] = useState(false);
  const [eventToRegister, setEventToRegister] = useState(null);

  useEffect(() => {
    fetchStudentData();
  }, [user]);

  async function fetchStudentData() {
    setLoading(true);
    try {
      // 1. Get all upcoming published events
      const { data: allUpcoming } = await supabase
        .from('events')
        .select('*')
        .eq('event_status', 'Published')
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true });

      // 2. Find if user is a participant
      const { data: participantData } = await supabase
        .from('participants')
        .select('participant_id')
        .eq('participant_name', user.full_name)
        .single();

      let registeredEventIds = [];
      
      if (participantData) {
        // 3. Get events user is registered for
        const { data: myRegistrations } = await supabase
          .from('event_participants')
          .select('event_id, events(*)')
          .eq('participant_id', participantData.participant_id);
          
        if (myRegistrations) {
          setMyEvents(myRegistrations.map(r => r.events));
          registeredEventIds = myRegistrations.map(r => r.event_id);
        }

        // 4. Get results
        const { data: results } = await supabase
          .from('event_results')
          .select('*, events(*)')
          .eq('participant_id', participantData.participant_id)
          .eq('result_status', 'Published');
          
        if (results) {
          setMyResults(results);
        }
      } else {
        setMyEvents([]);
        setMyResults([]);
      }

      // Filter upcoming to exclude ones already registered for
      const availableUpcoming = (allUpcoming || []).filter(e => !registeredEventIds.includes(e.event_id));
      setUpcomingEvents(availableUpcoming);

    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event) {
    setEventToRegister(event);
    setShowRegModal(true);
  }

  if (loading) {
    return <div className="animate-fade-in" style={{ textAlign: 'center', marginTop: '100px' }}><h3>Loading your dashboard...</h3></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Welcome, {user.full_name}</h1>
          <p>Your personal student dashboard for all campus activities.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* My Registered Events */}
        <div className="chart-card wide panel" style={{ gridColumn: 'span 12' }}>
          <div className="chart-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={20} color="#f59e0b" />
              My Registered Events
            </h3>
          </div>
          <div style={{ padding: '0 24px 24px' }}>
            {myEvents.length === 0 ? (
              <p style={{ color: '#64748b', fontStyle: 'italic' }}>You haven't registered for any events yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Event Code</th>
                      <th>Event Name</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myEvents.map(event => (
                      <tr key={event.event_id}>
                        <td>{event.event_code}</td>
                        <td style={{ fontWeight: 500 }}>{event.event_name}</td>
                        <td>{new Date(event.event_date).toLocaleDateString()}</td>
                        <td><span className="badge" style={{ background: '#d1fae5', color: '#10b981', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>Registered</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Available Upcoming Events */}
        <div className="chart-card wide panel" style={{ gridColumn: 'span 8' }}>
          <div className="chart-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} color="#3b82f6" />
              Upcoming Events (Available to Register)
            </h3>
          </div>
          <div style={{ padding: '0 24px 24px', maxHeight: '400px', overflowY: 'auto' }}>
            {upcomingEvents.length === 0 ? (
              <p style={{ color: '#64748b' }}>No upcoming events available at the moment.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {upcomingEvents.map(event => (
                  <div key={event.event_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', color: '#0f172a' }}>{event.event_name}</h4>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', display: 'flex', gap: '16px' }}>
                        <span>📅 {new Date(event.event_date).toLocaleDateString()}</span>
                        {event.venue && <span>📍 {event.venue}</span>}
                      </p>
                    </div>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleRegister(event)}
                      style={{ padding: '8px 16px', borderRadius: '20px' }}
                    >
                      Register Now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* My Achievements */}
        <div className="chart-card narrow panel" style={{ gridColumn: 'span 4' }}>
          <div className="chart-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={20} color="#ec4899" />
              My Achievements
            </h3>
          </div>
          <div style={{ padding: '0 24px 24px' }}>
            {myResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                <Award size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                <p>Participate in competitions to earn achievements!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myResults.map(result => (
                  <div key={result.result_id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#fffbeb', borderLeft: '4px solid #f59e0b', borderRadius: '4px' }}>
                    <Trophy size={24} color="#f59e0b" />
                    <div>
                      <div style={{ fontWeight: 600, color: '#92400e' }}>{result.position} Place</div>
                      <div style={{ fontSize: '0.85rem', color: '#b45309' }}>{result.events?.event_name}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showRegModal && eventToRegister && (
        <RegistrationModal 
          event={eventToRegister} 
          onClose={() => setShowRegModal(false)}
          onSuccess={() => {
            setShowRegModal(false);
            fetchStudentData(); // Refresh the dashboard tables
          }}
        />
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  
  if (!user) return null;

  if (user.role_id === 1) {
    return <StudentDashboard />;
  }
  
  return <AdminDashboard />;
}
