import React from 'react';
import { Calendar, CalendarCheck, CheckCircle2, Sparkles } from 'lucide-react';

export default function StatsCards({ stats }) {
  const cards = [
    { label: 'Total Events', value: stats.total || 0, icon: Calendar, tone: 'copper' },
    { label: 'Upcoming', value: stats.upcoming || 0, icon: CalendarCheck, tone: 'emerald' },
    { label: 'Completed', value: stats.completed || 0, icon: CheckCircle2, tone: 'slate' },
    { label: 'Most Active Dept', value: stats.activeDept || 'N/A', icon: Sparkles, tone: 'rose' },
  ];

  return (
    <div className="events-stats-grid">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className={`events-stat-card tone-${card.tone} animate-fade-in`} style={{ animationDelay: `${idx * 0.1}s` }}>
            <div className="events-stat-header">
              <span>{card.label}</span>
              <div className="events-stat-icon">
                <Icon size={20} />
              </div>
            </div>
            <div className="events-stat-value">{card.value}</div>
          </div>
        );
      })}
    </div>
  );
}
