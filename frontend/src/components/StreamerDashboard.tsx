import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './StreamerDashboard.css';

const socket = io('http://localhost:3001');

const StreamerDashboard: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [categories] = useState(['weapons', 'movement', 'vision', 'chaos']);
  const [activeEffects, setActiveEffects] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalVotes: 0,
    totalEffects: 0,
    viewerCount: 0,
    revenue: 0
  });

useEffect(() => {
  socket.on('connect', () => setIsConnected(true));
  socket.on('disconnect', () => setIsConnected(false));
  
  socket.on('viewerCount', (count: number) => {
    setStats(prev => ({ ...prev, viewerCount: count }));
  });
  
  socket.on('statsUpdate', (newStats: any) => {
    setStats(prev => ({
      ...prev,
      totalVotes: newStats.totalVotes || prev.totalVotes,
      totalEffects: newStats.totalEffects || prev.totalEffects,
      revenue: newStats.sessionRevenue || prev.revenue,
      viewerCount: newStats.viewerCount || prev.viewerCount
    }));
  });
  
  socket.on('effectQueued', (effect: any) => {
    setActiveEffects(prev => [...prev, { ...effect, timeLeft: effect.duration }]);
    setTimeout(() => {
      setActiveEffects(prev => prev.filter(e => e.timestamp !== effect.timestamp));
    }, effect.duration * 1000);
  });

  return () => {
    socket.off('connect');
    socket.off('disconnect');
    socket.off('viewerCount');
    socket.off('statsUpdate');
    socket.off('effectQueued');
  };
}, []);

  const startVote = (category: string) => {
  console.log('Starting vote for category:', category);
  socket.emit('startVote', category);
  };

  return (
    <div className="streamer-dashboard">
      <h1>FCE Control Panel</h1>
      
      <div className="connection-status">
        <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
        <span>{stats.viewerCount} viewers</span>
      </div>

      <div className="vote-controls">
        <h2>Start Vote</h2>
        <div className="category-buttons">
          {categories.map(cat => (
            <button 
              key={cat}
              className="category-btn"
              onClick={() => startVote(cat)}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="active-effects">
        <h2>Active Effects</h2>
        {activeEffects.length === 0 ? (
          <p>No active effects</p>
        ) : (
          activeEffects.map((effect: any) => (
            <div key={effect.timestamp} className="effect-item">
              <span>{effect.name}</span>
              <span className="timer">{effect.timeLeft}s</span>
            </div>
          ))
        )}
      </div>

      <div className="stats-panel">
        <div className="stat">
          <h3>{stats.totalVotes}</h3>
          <p>Total Votes</p>
        </div>
        <div className="stat">
          <h3>{stats.totalEffects}</h3>
          <p>Effects Triggered</p>
        </div>
        <div className="stat">
          <h3>${stats.revenue.toFixed(2)}</h3>
          <p>Session Revenue</p>
        </div>
      </div>
    </div>
  );
};

export default StreamerDashboard;