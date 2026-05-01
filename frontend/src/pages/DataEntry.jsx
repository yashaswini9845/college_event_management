import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Save } from 'lucide-react';

export default function DataEntry() {
  const [activeTab, setActiveTab] = useState('events');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [schools, setSchools] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [eventParticipants, setEventParticipants] = useState([]);
  
  const generateEventCode = () => `EVT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const [eventCode, setEventCode] = useState(generateEventCode());
  
  // Dynamic form state
  const [selectedSchoolId, setSelectedSchoolId] = useState('');

  useEffect(() => {
    fetchMetadata();
  }, []);

  async function fetchMetadata() {
    const { data: s } = await supabase.from('schools').select('*');
    const { data: c } = await supabase.from('categories').select('*');
    const { data: cl } = await supabase.from('clubs').select('*');
    const { data: evts } = await supabase.from('events').select('*').order('event_date', { ascending: false });
    if (s) setSchools(s);
    if (c) setCategories(c);
    if (cl) setClubs(cl);
    if (evts) setEventsList(evts);
  }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.target);
    
    const selectedSchool = schools.find(s => s.school_id.toString() === selectedSchoolId);
    const isStudentAffairs = selectedSchool && selectedSchool.school_name === 'Office of Student Affairs';

    const payload = {
      event_code: fd.get('event_code'),
      event_name: fd.get('event_name'),
      category_id: parseInt(fd.get('category_id')),
      event_date: fd.get('event_date'),
      conducted_by_type: isStudentAffairs ? 'Club' : 'Department',
      organizer_name: fd.get('organizer_name'),
      participation_mode: fd.get('participation_mode'),
      is_competition: fd.get('is_competition') === 'true',
      event_status: 'Published',
      venue: fd.get('venue'),
      description: fd.get('description'),
      is_intercollege: fd.get('is_intercollege') === 'true'
    };

    if (isStudentAffairs) {
      payload.school_id = null; // Clubs don't need a school
      payload.club_id = parseInt(fd.get('club_id'));
    } else {
      payload.school_id = parseInt(selectedSchoolId);
    }

    try {
      const { error } = await supabase.from('events').insert([payload]);
      if (error) throw error;
      showMessage('Event successfully created! It is now live on the portal.');
      e.target.reset();
      setEventCode(generateEventCode()); // Generate new code
    } catch (error) {
      console.error(error);
      showMessage(error.message || 'Failed to create event', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleParticipantSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.target);
    const eventId = fd.get('event_id');
    const participantName = fd.get('participant_name');
    const participantType = fd.get('participant_type');

    try {
      // 1. Create participant
      const { data: newPart, error: pError } = await supabase
        .from('participants')
        .insert([{ 
          participant_name: participantName, 
          participant_type: participantType,
          participant_status: 'Registered'
        }])
        .select()
        .single();
      
      if (pError) throw pError;

      // 2. Link to event
      const { error: regError } = await supabase
        .from('event_participants')
        .insert([{
          event_id: eventId,
          participant_id: newPart.participant_id
        }]);

      if (regError) throw regError;

      showMessage('Participant successfully registered!');
      e.target.reset();
    } catch (error) {
      console.error(error);
      showMessage(error.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResultSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.target);
    
    try {
      const { error } = await supabase.from('event_results').insert([{
        event_id: fd.get('event_id'),
        participant_id: fd.get('participant_id'),
        position: fd.get('position'),
        prize_amount: fd.get('prize_amount') || 0,
        result_status: 'Published'
      }]);
      
      if (error) throw error;
      showMessage('Result successfully logged!');
      e.target.reset();
    } catch (error) {
      console.error(error);
      showMessage(error.message || 'Failed to log result', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadEventParticipants = async (eventId) => {
    if (!eventId) {
      setEventParticipants([]);
      return;
    }
    const { data } = await supabase
      .from('event_participants')
      .select('participant_id, participants(*)')
      .eq('event_id', eventId);
    
    if (data) {
      setEventParticipants(data.map(d => d.participants));
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Data Entry Portal</h1>
          <p>Submit new events, register participants, and log results.</p>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Create Event
        </button>
        <button 
          className={`tab-btn ${activeTab === 'participants' ? 'active' : ''}`}
          onClick={() => setActiveTab('participants')}
        >
          Register Participant
        </button>
        <button 
          className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          Log Results
        </button>
      </div>

      {message.text && (
        <div style={{
          padding: '16px',
          marginBottom: '24px',
          borderRadius: '8px',
          background: message.type === 'error' ? '#fee2e2' : '#d1fae5',
          color: message.type === 'error' ? '#991b1b' : '#065f46',
          border: `1px solid ${message.type === 'error' ? '#f87171' : '#34d399'}`
        }}>
          {message.text}
        </div>
      )}

      {activeTab === 'events' && (
        <div className="panel" style={{ padding: '32px' }}>
          <form className="form-container" onSubmit={handleEventSubmit}>
            
            <div className="form-row">
              <div className="form-group">
                <label>Event Code (Auto-generated)</label>
                <input type="text" name="event_code" className="form-control" value={eventCode} readOnly style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }} />
              </div>
              <div className="form-group">
                <label>Event Name</label>
                <input type="text" name="event_name" className="form-control" placeholder="e.g. Annual Tech Symposium" required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date</label>
                <input type="date" name="event_date" className="form-control" required />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select name="category_id" className="form-control" required>
                  <option value="">Select Category...</option>
                  {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Venue / Location</label>
                <input type="text" name="venue" className="form-control" placeholder="e.g. Main Auditorium" required />
              </div>
              <div className="form-group">
                <label>Organizing Entity (School / Office)</label>
                <select 
                  className="form-control" 
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  required
                >
                  <option value="">Select Entity...</option>
                  {schools.map(s => <option key={s.school_id} value={s.school_id}>{s.school_name}</option>)}
                </select>
              </div>
            </div>

            {/* Dynamic Rendering Based on Organizer Type */}
            {(() => {
              const selectedSchool = schools.find(s => s.school_id.toString() === selectedSchoolId);
              const isStudentAffairs = selectedSchool && selectedSchool.school_name === 'Office of Student Affairs';
              
              if (isStudentAffairs) {
                return (
                  <div className="form-row" style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                    <div className="form-group" style={{ marginBottom: 0, width: '100%' }}>
                      <label>Which Club is Organizing?</label>
                      <select name="club_id" className="form-control" required>
                        <option value="">Select Club...</option>
                        {clubs.map(c => <option key={c.club_id} value={c.club_id}>{c.club_name}</option>)}
                      </select>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="form-row">
              <div className="form-group">
                <label>Specific Organizer Name</label>
                {(() => {
                  const selectedSchool = schools.find(s => s.school_id.toString() === selectedSchoolId);
                  const isStudentAffairs = selectedSchool && selectedSchool.school_name === 'Office of Student Affairs';
                  return (
                    <input type="text" name="organizer_name" className="form-control" placeholder={isStudentAffairs ? "e.g. Coding Club Core Team" : "e.g. Dept of Computer Science"} required />
                  );
                })()}
              </div>
              <div className="form-group">
                <label>Participation Mode</label>
                <select name="participation_mode" className="form-control" required>
                  <option value="Solo">Solo</option>
                  <option value="Group">Group</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Event Scope</label>
                <select name="is_intercollege" className="form-control" required>
                  <option value="false">Intracollege (Only College Students)</option>
                  <option value="true">Intercollege (Open to Other Colleges)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Event Description</label>
              <textarea name="description" className="form-control" rows="3" placeholder="Write a catchy description for the event..." required></textarea>
            </div>

            <div className="form-group">
              <label>Is Competition?</label>
              <select name="is_competition" className="form-control">
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Save size={18} />
                {loading ? 'Saving...' : 'Publish Event'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'participants' && (
        <div className="panel" style={{ padding: '32px' }}>
          <form className="form-container" onSubmit={handleParticipantSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Select Event</label>
                <select name="event_id" className="form-control" required>
                  <option value="">Select Event...</option>
                  {eventsList.map(e => <option key={e.event_id} value={e.event_id}>{e.event_name}</option>)}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Participant Name</label>
                <input type="text" name="participant_name" className="form-control" placeholder="Full Name" required />
              </div>
              <div className="form-group">
                <label>Participant Type</label>
                <select name="participant_type" className="form-control" required>
                  <option value="internal">Internal Student</option>
                  <option value="external">External Guest</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Save size={18} />
                {loading ? 'Registering...' : 'Register Participant'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'results' && (
        <div className="panel" style={{ padding: '32px' }}>
          <form className="form-container" onSubmit={handleResultSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Select Competition Event</label>
                <select 
                  name="event_id" 
                  className="form-control" 
                  required
                  onChange={(e) => loadEventParticipants(e.target.value)}
                >
                  <option value="">Select Competition...</option>
                  {eventsList.filter(e => e.is_competition).map(e => <option key={e.event_id} value={e.event_id}>{e.event_name}</option>)}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Select Participant / Winner</label>
                <select name="participant_id" className="form-control" required>
                  <option value="">Select Participant...</option>
                  {eventParticipants.map(p => <option key={p.participant_id} value={p.participant_id}>{p.participant_name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Position</label>
                <select name="position" className="form-control" required>
                  <option value="1st">1st Place</option>
                  <option value="2nd">2nd Place</option>
                  <option value="3rd">3rd Place</option>
                  <option value="Special Mention">Special Mention</option>
                </select>
              </div>
              <div className="form-group">
                <label>Prize Amount (₹)</label>
                <input type="number" name="prize_amount" className="form-control" placeholder="e.g. 5000" />
              </div>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Save size={18} />
                {loading ? 'Logging...' : 'Log Result'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
