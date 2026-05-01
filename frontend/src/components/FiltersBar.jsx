import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

export default function FiltersBar({ 
  searchQuery, setSearchQuery, 
  departments, selectedDept, setSelectedDept,
  categories, selectedCat, setSelectedCat,
  dateRange, setDateRange
}) {
  return (
    <div className="events-filters animate-fade-in">
      <div className="events-filter-head">
        <SlidersHorizontal size={16} />
        <span>Refine Results</span>
      </div>

      <div className="events-search-wrap">
        <Search size={18} className="events-search-icon" />
        <input 
          type="text" 
          className="form-control events-search-input" 
          placeholder="Search by event name or venue..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="events-filter-grid">
        <div className="events-select-wrap">
          <select 
            className="form-control events-select"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
            ))}
          </select>
        </div>

        <div className="events-select-wrap">
          <select 
            className="form-control events-select"
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
            ))}
          </select>
        </div>

        <div className="events-select-wrap">
          <select 
            className="form-control events-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="all">All Dates</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Completed</option>
            <option value="this_month">This Month</option>
          </select>
        </div>
      </div>
    </div>
  );
}
