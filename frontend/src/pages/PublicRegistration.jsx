import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { GraduationCap, Calendar, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function PublicRegistration() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    college: '',
    department: ''
  });

  useEffect(() => {
    async function fetchEvent() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*, categories(*), departments(*)')
          .eq('event_id', eventId)
          .single();

        if (error) throw error;
        setEvent(data);
        
        if (!data.is_intercollege) {
          setError("This event is not open for public intercollege registration.");
        }
      } catch (err) {
        console.error(err);
        setError("Event not found or an error occurred.");
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // 1. Insert participant
      const { data: partData, error: partError } = await supabase
        .from('participants')
        .insert([{
          participant_name: formData.name,
          participant_type: 'external',
          participant_status: 'Registered',
          email: formData.email,
          contact_number: formData.contact,
          college_name: formData.college,
          external_department: formData.department
        }])
        .select()
        .single();

      if (partError) throw partError;

      // 2. Link to event
      const { error: regError } = await supabase
        .from('event_participants')
        .insert([{
          event_id: eventId,
          participant_id: partData.participant_id
        }]);

      if (regError) throw regError;

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="login-container" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
  }

  if (success) {
    return (
      <div className="login-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
        <div className="login-card animate-fade-in" style={{ textAlign: 'center' }}>
          <CheckCircle2 size={64} color="#10b981" style={{ margin: '0 auto 24px' }} />
          <h2>Registration Successful!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            You are now registered for <strong>{event?.event_name}</strong>. We've recorded your details and will contact you via email shortly.
          </p>
          <Link to="/login" className="btn btn-primary">Go to Main Portal</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-left" style={{ background: 'var(--card-bg)' }}>
        <div className="brand-showcase">
          <div className="brand-logo-large">
            <GraduationCap size={48} color="#10b981" />
          </div>
          <h1 style={{ color: '#10b981' }}>Public Event<br/>Registration</h1>
          <p>Register as an external participant for our intercollege events.</p>
        </div>
        
        {event && !error && (
          <div className="panel" style={{ marginTop: '40px', padding: '32px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <span className="event-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981' }}>
                Intercollege Event
              </span>
              <span className="event-badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                {event.participation_mode}
              </span>
            </div>
            
            <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>{event.event_name}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{event.description}</p>
            
            <div className="event-detail" style={{ marginBottom: '12px' }}>
              <Calendar size={18} color="#10b981" />
              <span style={{ fontSize: '1.1rem' }}>{event.event_date}</span>
            </div>
            <div className="event-detail">
              <MapPin size={18} color="#10b981" />
              <span style={{ fontSize: '1.1rem' }}>{event.venue || 'TBA'}</span>
            </div>
          </div>
        )}
      </div>

      <div className="login-right">
        <div className="login-card" style={{ maxWidth: '500px' }}>
          {error ? (
            <div style={{ textAlign: 'center' }}>
              <AlertCircle size={48} color="#f43f5e" style={{ margin: '0 auto 24px' }} />
              <h2>Registration Unavailable</h2>
              <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
              <Link to="/login" className="btn btn-outline" style={{ marginTop: '24px' }}>Back to Portal</Link>
            </div>
          ) : (
            <>
              <div className="login-header" style={{ marginBottom: '32px' }}>
                <h2>Participant Details</h2>
                <p>Please fill out all fields carefully.</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" />
                </div>
                
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" className="form-control" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="e.g. john@example.com" />
                </div>
                
                <div className="form-group">
                  <label>Contact Number</label>
                  <input type="text" className="form-control" required value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} placeholder="e.g. +91 9876543210" />
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1.5 }}>
                    <label>College Name</label>
                    <input type="text" className="form-control" required value={formData.college} onChange={e => setFormData({...formData, college: e.target.value})} placeholder="e.g. XYZ University" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Department</label>
                    <input type="text" className="form-control" required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="e.g. Computer Science" />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '24px', background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }} disabled={submitting}>
                  {submitting ? 'Registering...' : 'Submit Registration'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
