import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar, X, Info, LayoutGrid, List, PlusCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import RegistrationModal from '../components/RegistrationModal';
import EventCard from '../components/EventCard';
import FiltersBar from '../components/FiltersBar';
import StatsCards from '../components/StatsCards';

const CATEGORY_IMAGES = {
  1: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000',
  2: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=1000',
  3: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1000',
  4: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1000',
  default: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=1000'
};

export default function EventList() {
  const [events, setEvents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Registration Modal State
  const [showRegModal, setShowRegModal] = useState(false);
  const [eventToRegister, setEventToRegister] = useState(null);
  
  // View & Filter State
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [dateRange, setDateRange] = useState('all'); // all, upcoming, past, this_month
  
  // Event Detail Modal State
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [eventsRes, deptsRes, catsRes] = await Promise.all([
        supabase.from('events').select(`*, categories(*), departments(*)`).order('event_date', { ascending: true }),
        supabase.from('departments').select('*'),
        supabase.from('categories').select('*')
      ]);

      if (eventsRes.error) throw eventsRes.error;
      setEvents(eventsRes.data || []);
      setDepartments(deptsRes.data || []);
      setCategories(catsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchParticipants(eventId) {
    setLoadingParticipants(true);
    try {
      const { data, error } = await supabase
        .from('event_participants')
        .select(`*, participants (*)`)
        .eq('event_id', eventId);
      if (error) throw error;
      setParticipants(data || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoadingParticipants(false);
    }
  }

  // Handle Event Actions
  const handleRegisterClick = (event) => {
    if (!user) { alert("Please log in to register."); return; }
    setEventToRegister(event);
    setShowRegModal(true);
  };

  const handleDeleteEvent = async (event) => {
    if (!window.confirm(`Are you sure you want to delete "${event.event_name}"?`)) return;
    try {
      const { error } = await supabase.from('events').delete().eq('event_id', event.event_id);
      if (error) throw error;
      setEvents(events.filter(e => e.event_id !== event.event_id));
    } catch (err) {
      alert("Failed to delete. It might have registered participants.");
    }
  };

  const handleEditEvent = (event) => {
    // For now, redirect to Data Entry or show an alert since we haven't built an edit modal
    navigate('/data-entry');
  };

  // Compute Filtered Events
  const filteredEvents = useMemo(() => {
    const now = new Date();
    return events.filter(e => {
      // Search
      const matchesSearch = e.event_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (e.venue && e.venue.toLowerCase().includes(searchQuery.toLowerCase()));
      // Department
      const matchesDept = selectedDept ? e.department_id?.toString() === selectedDept : true;
      // Category
      const matchesCat = selectedCat ? e.category_id?.toString() === selectedCat : true;
      
      // Date Range
      let matchesDate = true;
      const eventDate = new Date(e.event_date);
      if (dateRange === 'upcoming') matchesDate = eventDate >= now;
      if (dateRange === 'past') matchesDate = eventDate < now;
      if (dateRange === 'this_month') {
        matchesDate = eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
      }

      return matchesSearch && matchesDept && matchesCat && matchesDate;
    });
  }, [events, searchQuery, selectedDept, selectedCat, dateRange]);

  // Compute Stats
  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = events.filter(e => new Date(e.event_date) >= now).length;
    const completed = events.filter(e => new Date(e.event_date) < now).length;
    
    // Find most active dept
    const deptCounts = {};
    events.forEach(e => {
      if (e.departments?.department_name) {
        deptCounts[e.departments.department_name] = (deptCounts[e.departments.department_name] || 0) + 1;
      }
    });
    let activeDept = 'N/A';
    let max = 0;
    for (const [dept, count] of Object.entries(deptCounts)) {
      if (count > max) { max = count; activeDept = dept; }
    }

    return { total: events.length, upcoming, completed, activeDept };
  }, [events]);

  const isOrganizer = user?.role_id === 2 || user?.role_id === 3;

  return (
    <div className="events-page-shell">
      <section className="events-hero animate-fade-in">
        <div className="events-hero-glow"></div>
        <div className="events-hero-content">
          <p className="events-hero-kicker"><Sparkles size={14} /> Curated Campus Experiences</p>
          <h1>Events that feel unforgettable.</h1>
          <p>
            Explore premium campus experiences with real-time filters, immersive previews,
            and beautifully crafted event journeys.
          </p>
        </div>
        <div className="events-hero-actions">
          <div className="events-view-toggle">
            <button 
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            ><LayoutGrid size={18} /></button>
            <button 
              className={viewMode === 'table' ? 'active' : ''}
              onClick={() => setViewMode('table')}
            ><List size={18} /></button>
          </div>
          {isOrganizer && (
            <button className="btn btn-primary events-create-btn" onClick={() => navigate('/data-entry')}>
              <PlusCircle size={18} /> Create Event
            </button>
          )}
        </div>
      </section>

      <StatsCards stats={stats} />

      <FiltersBar 
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        departments={departments} selectedDept={selectedDept} setSelectedDept={setSelectedDept}
        categories={categories} selectedCat={selectedCat} setSelectedCat={setSelectedCat}
        dateRange={dateRange} setDateRange={setDateRange}
      />

      {loading ? (
        <div className="event-grid premium-event-grid">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="event-skeleton-card skeleton"></div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="panel events-empty-state">
          <Calendar size={48} color="var(--text-secondary)" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ color: 'var(--text-secondary)' }}>No events found</h3>
          <p style={{ color: 'var(--text-secondary)', opacity: 0.7 }}>Try adjusting your filters or search term.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="event-grid premium-event-grid">
          {filteredEvents.map(event => (
            <EventCard 
              key={event.event_id}
              event={event}
              user={user}
              bgImage={CATEGORY_IMAGES[event.category_id] || CATEGORY_IMAGES.default}
              onViewDetails={(e) => { setSelectedEvent(e); fetchParticipants(e.event_id); }}
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
              onRegister={handleRegisterClick}
            />
          ))}
        </div>
      ) : (
        <div className="panel events-table-wrap">
          <table className="events-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Date</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map(event => (
                <tr key={event.event_id}>
                  <td>{event.event_name}</td>
                  <td>{event.event_date}</td>
                  <td>{event.departments?.department_name || 'General'}</td>
                  <td>
                    <span className="event-badge" style={{ background: 'rgba(20, 184, 166, 0.1)', color: 'var(--primary-navy-light)' }}>
                      {event.event_status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-outline" style={{ padding: '6px 14px', fontSize: '0.85rem' }} onClick={() => { setSelectedEvent(event); fetchParticipants(event.event_id); }}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Event Detail Modal */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={(e) => { if(e.target.className === 'modal-overlay') setSelectedEvent(null); }}>
          <div className="modal-content event-premium-modal animate-fade-in" style={{ padding: 0, overflow: 'hidden', background: 'var(--bg-color)' }}>
            <div 
              className="event-premium-modal-hero"
              style={{ 
                height: '200px', 
                backgroundImage: `url(${CATEGORY_IMAGES[selectedEvent.category_id] || CATEGORY_IMAGES.default})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
              }}
            >
              <div className="event-premium-modal-veil"></div>
              <button 
                className="modal-close" 
                onClick={() => setSelectedEvent(null)}
                style={{ top: '16px', right: '16px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white' }}
              >
                <X size={24} />
              </button>
              <div style={{ position: 'absolute', bottom: '24px', left: '32px', right: '32px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <span className="event-badge" style={{ background: 'rgba(20, 184, 166, 0.2)', color: 'var(--primary-navy-light)', border: '1px solid var(--primary-navy-light)' }}>
                    {selectedEvent.categories?.category_name}
                  </span>
                  <span className="event-badge" style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white' }}>
                    {selectedEvent.event_status}
                  </span>
                </div>
                <h2 style={{ color: 'white', margin: 0, fontSize: '2rem', textShadow: '0 8px 18px rgba(0,0,0,0.55)' }}>{selectedEvent.event_name}</h2>
              </div>
            </div>

            <div className="event-premium-modal-body" style={{ padding: '32px' }}>
              {selectedEvent.description && (
                <div className="event-premium-modal-description" style={{ marginBottom: '24px', padding: '16px', borderRadius: '12px' }}>
                  <p style={{ margin: 0, display: 'flex', gap: '12px', color: 'var(--text-primary)' }}>
                    <Info size={20} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              <div className="event-premium-modal-meta" style={{ marginBottom: '32px' }}>
                <div className="panel event-premium-modal-meta-card" style={{ padding: '16px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 4px 0' }}>Date</p>
                  <div style={{ fontWeight: 600 }}>{selectedEvent.event_date}</div>
                </div>
                <div className="panel event-premium-modal-meta-card" style={{ padding: '16px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 4px 0' }}>Venue</p>
                  <div style={{ fontWeight: 600 }}>{selectedEvent.venue || 'TBA'}</div>
                </div>
                <div className="panel event-premium-modal-meta-card" style={{ padding: '16px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 4px 0' }}>Organizer</p>
                  <div style={{ fontWeight: 600 }}>{selectedEvent.organizer_name}</div>
                </div>
              </div>

              {user?.role_id === 1 && selectedEvent.event_status !== 'Completed' && selectedEvent.event_status !== 'Cancelled' && (
                <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleRegisterClick(selectedEvent)}
                    style={{ padding: '12px 32px', fontSize: '1.1rem', borderRadius: '30px' }}
                  >
                    Register for Event
                  </button>
                </div>
              )}

              <h3 style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                Registered Participants ({participants.length})
              </h3>
              
              {loadingParticipants ? (
                <p style={{ color: 'var(--text-secondary)' }}>Loading participants...</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {participants.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No participants registered yet.</p>}
                  {participants.map(p => {
                    const part = p.participants;
                    const initials = part?.participant_name?.substring(0, 2).toUpperCase() || '??';
                    return (
                      <li key={p.event_participant_id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-navy), var(--accent-gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'white' }}>
                          {initials}
                        </div>
                        <div>
                          <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem' }}>{part?.participant_name || 'Unknown'}</h4>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{part?.participant_type === 'internal' ? `Roll No: ${part?.roll_number}` : 'External Participant'}</p>
                        </div>
                        <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--primary-navy-light)', fontWeight: 600, background: 'rgba(20, 184, 166, 0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                          {part?.participant_status}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Registration Form Modal */}
      {showRegModal && eventToRegister && (
        <RegistrationModal 
          event={eventToRegister} 
          onClose={() => setShowRegModal(false)}
          onSuccess={() => {
            setShowRegModal(false);
            if (selectedEvent) fetchParticipants(selectedEvent.event_id);
          }}
        />
      )}
    </div>
  );
}
