import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Users, MapPin, Mail, Phone } from 'lucide-react';

export default function Participants() {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchParticipants() {
      try {
        const { data, error } = await supabase
          .from('participants')
          .select('*, departments(department_name)')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setParticipants(data || []);
      } catch (err) {
        console.error('Error fetching participants:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchParticipants();
  }, []);

  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      const search = searchQuery.toLowerCase();
      const matchName = p.participant_name?.toLowerCase().includes(search);
      const matchRoll = p.roll_number?.toLowerCase().includes(search);
      const matchEmail = p.email?.toLowerCase().includes(search);
      const matchCollege = p.college_name?.toLowerCase().includes(search);
      return matchName || matchRoll || matchEmail || matchCollege;
    });
  }, [participants, searchQuery]);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>Global Participants</h1>
          <p>Directory of all internal and external students registered in the system.</p>
        </div>
      </div>

      <div className="panel" style={{ padding: '20px', marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search by name, roll number, email, or college..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '44px' }}
          />
        </div>
        <div className="stat-card" style={{ padding: '12px 24px', gridColumn: 'auto', background: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.2)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Registered</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-navy-light)' }}>{participants.length}</div>
          </div>
          <Users size={32} color="var(--primary-navy)" style={{ opacity: 0.5 }} />
        </div>
      </div>

      {loading ? (
        <div className="panel skeleton" style={{ height: '400px' }}></div>
      ) : (
        <div className="panel" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Participant</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Contact Info</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Affiliation</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No participants found matching your search.</td>
                </tr>
              ) : filteredParticipants.map(p => (
                <tr key={p.participant_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="hover-row">
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600, color: 'white', marginBottom: '4px' }}>{p.participant_name}</div>
                    {p.roll_number && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Roll: {p.roll_number}</div>}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {p.email && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><Mail size={12}/> {p.email}</div>}
                    {p.contact_number && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={12}/> {p.contact_number}</div>}
                    {!p.email && !p.contact_number && <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.85rem' }}>Not provided</span>}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--primary-navy-light)', fontWeight: 500 }}>
                      {p.participant_type === 'internal' ? 'Internal Student' : (p.college_name || 'External College')}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {p.participant_type === 'internal' ? p.departments?.department_name : p.external_department}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span className="event-badge" style={{ 
                      background: p.participant_type === 'internal' ? 'rgba(20, 184, 166, 0.1)' : 'rgba(244, 63, 94, 0.1)', 
                      color: p.participant_type === 'internal' ? '#2dd4bf' : '#fb7185',
                      border: `1px solid ${p.participant_type === 'internal' ? 'rgba(20, 184, 166, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
                    }}>
                      {p.participant_type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ fontSize: '0.9rem', color: 'white' }}>{p.participant_status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <style>{`
        .hover-row:hover {
          background: rgba(255, 255, 255, 0.03);
        }
      `}</style>
    </div>
  );
}
