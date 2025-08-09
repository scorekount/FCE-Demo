import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './StreamerDashboard.css';

const socket = io('http://localhost:3001');

interface Effect {
  name: string;
  duration: number;
  timestamp: number;
  category: string;
}

const StreamerDashboard: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [activeEffects, setActiveEffects] = useState<Effect[]>([]);
  const [stats, setStats] = useState({
    totalVotes: 0,
    totalEffects: 0,
    viewerCount: 0,
    revenue: 0
  });
  const [activeVote, setActiveVote] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const categories = [
    { 
      id: 'weapons', 
      name: 'Weapons', 
      icon: '⚔️', 
      color: '#EF4444',
      description: 'Control available weapons and ammo'
    },
    { 
      id: 'movement', 
      name: 'Movement', 
      icon: '🏃', 
      color: '#3B82F6',
      description: 'Modify player speed and physics'
    },
    { 
      id: 'vision', 
      name: 'Vision', 
      icon: '👁️', 
      color: '#10B981',
      description: 'Change visibility and environment'
    },
    { 
      id: 'chaos', 
      name: 'Chaos', 
      icon: '💥', 
      color: '#F59E0B',
      description: 'Unleash game-changing mayhem'
    }
  ];

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
    
    socket.on('voteStarted', () => {
      setActiveVote(true);
      // Simulate vote counting
      const voteInterval = setInterval(() => {
        setStats(prev => ({
          ...prev,
          totalVotes: prev.totalVotes + Math.floor(Math.random() * 10) + 1
        }));
      }, 1000);
      
      setTimeout(() => {
        clearInterval(voteInterval);
        setActiveVote(false);
        // Increment effects and revenue
        setStats(prev => ({
          ...prev,
          totalEffects: prev.totalEffects + 1,
          revenue: prev.revenue + (Math.random() * 5 + 1)
        }));
      }, 30000);
    });
    
    socket.on('voteEnded', () => {
      setActiveVote(false);
    });
    
    socket.on('effectQueued', (effect: Effect) => {
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
      socket.off('voteStarted');
      socket.off('voteEnded');
      socket.off('effectQueued');
    };
  }, []);

  const startVote = (category: string) => {
    if (activeVote) return;
    console.log('Starting vote for category:', category);
    setSelectedCategory(category);
    setActiveVote(true);
    socket.emit('startVote', category);
    
    // Simulate vote ending after 30 seconds
    setTimeout(() => {
      setActiveVote(false);
      setSelectedCategory('');
    }, 30000);
  };

  return (
    <div className="streamer-dashboard-v2">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>FCE Control Center</h1>
          <div className="connection-indicator">
            <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <div className="dashboard-content">
        {/* Stats Overview */}
        <div className="stats-overview">
          <div className="stat-card viewers">
            <div className="stat-icon">👁️</div>
            <div className="stat-content">
              <h3>{stats.viewerCount}</h3>
              <p>Live Viewers</p>
            </div>
          </div>
          
          <div className="stat-card votes">
            <div className="stat-icon">🗳️</div>
            <div className="stat-content">
              <h3>{stats.totalVotes.toLocaleString()}</h3>
              <p>Total Votes</p>
            </div>
          </div>
          
          <div className="stat-card effects">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <h3>{stats.totalEffects}</h3>
              <p>Effects Triggered</p>
            </div>
          </div>
          
          <div className="stat-card revenue">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>${stats.revenue.toFixed(2)}</h3>
              <p>Session Revenue</p>
            </div>
          </div>
        </div>

        {/* Vote Control Panel */}
        <div className="vote-control-section">
          <div className="section-header">
            <h2>Vote Control</h2>
            {activeVote && (
              <div className="vote-active-badge">
                <span className="pulse"></span>
                Vote Active
              </div>
            )}
          </div>
          
          <div className="category-grid">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`category-button ${selectedCategory === cat.id ? 'selected' : ''} ${activeVote ? 'disabled' : ''}`}
                onClick={() => startVote(cat.id)}
                disabled={activeVote}
                style={{ '--category-color': cat.color } as React.CSSProperties}
              >
                <div className="category-icon">{cat.icon}</div>
                <div className="category-name">{cat.name}</div>
                <div className="category-description">{cat.description}</div>
                <div className="category-action">
                  {activeVote && selectedCategory === cat.id ? 'Voting...' : 'Start Vote'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Active Effects */}
        <div className="effects-section">
          <div className="section-header">
            <h2>Active Effects</h2>
            <span className="effect-count">{activeEffects.length} Active</span>
          </div>
          
          <div className="effects-list">
            {activeEffects.length === 0 ? (
              <div className="no-effects">
                <p>No active effects</p>
                <span>Effects will appear here when triggered</span>
              </div>
            ) : (
              activeEffects.map((effect) => (
                <div key={effect.timestamp} className="effect-card">
                  <div className="effect-info">
                    <h4>{effect.name}</h4>
                    <span className="effect-category">{effect.category}</span>
                  </div>
                  <div className="effect-timer">
                    <div className="timer-bar">
                      <div 
                        className="timer-fill"
                        style={{ 
                          animation: `timerCountdown ${effect.duration}s linear` 
                        }}
                      />
                    </div>
                    <span className="duration">{effect.duration}s</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button className="action-btn pause">
              <span>⏸️</span>
              Pause Voting
            </button>
            <button className="action-btn reset">
              <span>🔄</span>
              Reset Effects
            </button>
            <button className="action-btn settings">
              <span>⚙️</span>
              Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamerDashboard;