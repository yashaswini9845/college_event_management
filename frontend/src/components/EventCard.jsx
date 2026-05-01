import React from 'react';
import { Calendar, MapPin, Users, ArrowUpRight, Edit, Trash2, Link as LinkIcon } from 'lucide-react';

export default function EventCard({ 
  event, 
  user, 
  bgImage, 
  onViewDetails, 
  onEdit, 
  onDelete, 
  onRegister 
}) {
  const isOrganizer = user?.role_id === 2 || user?.role_id === 3;
  const isStudent = user?.role_id === 1;
  const isUpcoming = new Date(event.event_date) >= new Date();

  return (
    <div className="event-premium-card animate-fade-in">
      <div className="event-premium-noise"></div>
      <div 
        className="event-premium-image" 
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="event-premium-shade"></div>
        <div className="event-premium-top">
          <span className={`event-premium-status ${isUpcoming ? 'upcoming' : 'past'}`}>
            {isUpcoming ? 'Upcoming' : 'Completed'}
          </span>
          <span className="event-premium-date">
            <Calendar size={13} />
            {new Date(event.event_date).toLocaleDateString()}
          </span>
        </div>
        <div className="event-premium-tags">
          <span className="event-premium-tag">
            {event.categories?.category_name || 'Event'}
          </span>
          <span className="event-premium-tag muted">
            {event.participation_mode}
          </span>
        </div>
      </div>
      
      <div className="event-premium-content">
        <div className="event-premium-divider"></div>
        <h3 className="event-premium-title">{event.event_name}</h3>
        <p className="event-premium-dept">
          {event.departments?.department_name || 'General'}
        </p>
        
        <div className="event-premium-detail">
          <MapPin size={15} />
          <span>{event.venue || 'TBA'}</span>
        </div>
        <div className="event-premium-detail" style={{ marginBottom: '20px' }}>
          <Users size={15} />
          <span>{event.organizer_name}</span>
        </div>
        
        <div className="event-premium-actions">
          <button 
            className="btn btn-outline event-action-btn view" 
            onClick={() => onViewDetails(event)}
          >
            Details <ArrowUpRight size={14} />
          </button>
          
          {isStudent && isUpcoming && event.event_status === 'Published' && (
            <button 
              className="btn btn-primary event-action-btn" 
              onClick={(e) => { e.stopPropagation(); onRegister(event); }}
            >
              Register
            </button>
          )}

          {event.is_intercollege && (
            <button 
              className="btn btn-outline event-action-icon"
              onClick={(e) => { 
                e.stopPropagation(); 
                navigator.clipboard.writeText(`${window.location.origin}/public/register/${event.event_id}`);
                alert('Public Registration Link Copied to Clipboard!');
              }}
              title="Copy Public Registration Link"
            >
              <LinkIcon size={16} />
            </button>
          )}

          {isOrganizer && (
            <>
              <button 
                className="btn btn-outline event-action-icon"
                onClick={(e) => { e.stopPropagation(); onEdit(event); }}
                title="Edit Event"
              >
                <Edit size={16} />
              </button>
              <button 
                className="btn btn-outline event-action-icon danger"
                onClick={(e) => { e.stopPropagation(); onDelete(event); }}
                title="Delete Event"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
