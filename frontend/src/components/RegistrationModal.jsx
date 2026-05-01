import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function RegistrationModal({ event, onClose, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  
  // Is this a group event?
  const isGroup = event.participation_mode === 'Group';

  // Solo State
  const [soloData, setSoloData] = useState({
    name: user?.full_name || '',
    roll_number: '',
    department_id: '',
    contact_number: ''
  });

  // Group State
  const [groupData, setGroupData] = useState({
    team_name: '',
    participant_count: 2
  });
  const [teamMembers, setTeamMembers] = useState([
    { name: user?.full_name || '', roll_number: '' }, // Member 1 (User)
    { name: '', roll_number: '' } // Member 2
  ]);

  useEffect(() => {
    async function fetchDepts() {
      const { data } = await supabase.from('departments').select('*');
      if (data) setDepartments(data);
    }
    fetchDepts();
  }, []);

  const handleParticipantCountChange = (e) => {
    const count = parseInt(e.target.value);
    setGroupData({ ...groupData, participant_count: count });
    
    // Adjust team members array
    const newMembers = [...teamMembers];
    if (count > newMembers.length) {
      for (let i = newMembers.length; i < count; i++) {
        newMembers.push({ name: '', roll_number: '' });
      }
    } else {
      newMembers.length = count;
    }
    setTeamMembers(newMembers);
  };

  const handleMemberChange = (index, field, value) => {
    const newMembers = [...teamMembers];
    newMembers[index][field] = value;
    setTeamMembers(newMembers);
  };

  const registerParticipant = async (name, roll_number, dept_id, contact) => {
    // Check if participant exists
    let { data: existingPart } = await supabase
      .from('participants')
      .select('participant_id')
      .eq('participant_name', name)
      .single();

    if (existingPart) {
      // Update missing fields
      await supabase.from('participants')
        .update({ 
          roll_number: roll_number || null,
          department_id: dept_id || null,
          contact_number: contact || null
        })
        .eq('participant_id', existingPart.participant_id);
      
      return existingPart.participant_id;
    }

    // Insert new participant
    const { data: newPart, error } = await supabase
      .from('participants')
      .insert([{ 
        participant_name: name,
        participant_type: 'internal',
        participant_status: 'Registered',
        roll_number: roll_number || null,
        department_id: dept_id || null,
        contact_number: contact || null
      }])
      .select()
      .single();

    if (error) throw error;
    return newPart.participant_id;
  };

  const handleSoloSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Create/Update Participant
      const partId = await registerParticipant(
        soloData.name, 
        soloData.roll_number, 
        soloData.department_id ? parseInt(soloData.department_id) : null, 
        soloData.contact_number
      );

      // 2. Register for Event
      const { data: existingReg } = await supabase
        .from('event_participants')
        .select('*')
        .eq('event_id', event.event_id)
        .eq('participant_id', partId)
        .single();

      if (existingReg) {
        alert("You are already registered for this event!");
        setLoading(false);
        return;
      }

      await supabase.from('event_participants').insert([{ event_id: event.event_id, participant_id: partId }]);

      alert('Successfully registered!');
      onSuccess();
    } catch (error) {
      console.error(error);
      alert('Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Create Team
      const { data: team, error: teamErr } = await supabase
        .from('teams')
        .insert([{ event_id: event.event_id, team_name: groupData.team_name }])
        .select()
        .single();
        
      if (teamErr) throw teamErr;

      // 2. Process all members
      for (const member of teamMembers) {
        if (!member.name) continue;
        
        const partId = await registerParticipant(member.name, member.roll_number, null, null);

        // Add to team_members
        await supabase.from('team_members').insert([{ team_id: team.team_id, participant_id: partId }]);

        // Also add to event_participants so they show up individually (optional based on schema, but good for tracking)
        const { data: existingReg } = await supabase
          .from('event_participants')
          .select('event_participant_id')
          .eq('event_id', event.event_id)
          .eq('participant_id', partId)
          .single();

        if (!existingReg) {
          await supabase.from('event_participants').insert([{ event_id: event.event_id, participant_id: partId }]);
        }
      }

      alert('Team successfully registered!');
      onSuccess();
    } catch (error) {
      console.error(error);
      alert('Team Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') onClose(); }}>
      <div className="modal-content animate-fade-in" style={{ maxWidth: '600px', padding: '32px' }}>
        <button className="modal-close" onClick={onClose} style={{ top: '24px', right: '24px' }}><X size={24} /></button>
        
        <h2 style={{ marginTop: 0, marginBottom: '8px', color: '#0f172a' }}>Register for Event</h2>
        <p style={{ color: '#64748b', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
          {event.event_name} • <span style={{ color: '#f59e0b', fontWeight: 600 }}>{event.participation_mode} Registration</span>
        </p>

        {!isGroup ? (
          <form onSubmit={handleSoloSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" className="form-control" value={soloData.name} onChange={e => setSoloData({...soloData, name: e.target.value})} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Register / Roll Number</label>
                <input type="text" className="form-control" value={soloData.roll_number} onChange={e => setSoloData({...soloData, roll_number: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Contact Number</label>
                <input type="text" className="form-control" value={soloData.contact_number} onChange={e => setSoloData({...soloData, contact_number: e.target.value})} required />
              </div>
            </div>
            <div className="form-group">
              <label>Department</label>
              <select className="form-control" value={soloData.department_id} onChange={e => setSoloData({...soloData, department_id: e.target.value})} required>
                <option value="">Select Department...</option>
                {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
              </select>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px', padding: '12px' }} disabled={loading}>
              {loading ? 'Registering...' : 'Complete Registration'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleGroupSubmit}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label>Team Name</label>
                <input type="text" className="form-control" value={groupData.team_name} onChange={e => setGroupData({...groupData, team_name: e.target.value})} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Team Size</label>
                <select className="form-control" value={groupData.participant_count} onChange={handleParticipantCountChange}>
                  {[2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} Members</option>)}
                </select>
              </div>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
              {teamMembers.map((member, idx) => (
                <div key={idx} style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#334155' }}>{idx === 0 ? 'Team Leader' : `Member ${idx + 1}`}</h4>
                  <div className="form-row" style={{ marginBottom: 0 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Name</label>
                      <input type="text" className="form-control" value={member.name} onChange={e => handleMemberChange(idx, 'name', e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Register Number</label>
                      <input type="text" className="form-control" value={member.roll_number} onChange={e => handleMemberChange(idx, 'roll_number', e.target.value)} required />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '24px', padding: '12px' }} disabled={loading}>
              {loading ? 'Registering Team...' : 'Register Full Team'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
