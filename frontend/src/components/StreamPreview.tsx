import React from 'react';
import './StreamPreview.css';

const StreamPreview: React.FC = () => {
  return (
    <div className="stream-preview">
      <div className="stream-container">
        <div className="stream-placeholder">
          <div className="pulse-circle"></div>
          <h3>LIVE STREAM</h3>
          <p>CS2 Competitive Match</p>
        </div>
        <div className="stream-stats">
          <div className="stat-item">
            <span className="stat-value">15</span>
            <span className="stat-label">Kill Streak</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">2v4</span>
            <span className="stat-label">Clutch Moment</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">$4,750</span>
            <span className="stat-label">Economy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamPreview;