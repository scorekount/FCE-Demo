import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './VotingInterface.css';

const socket = io('http://localhost:3001');

interface VoteOption {
  id: string;
  name: string;
  duration: number;
  cost: number;
  votes?: number;
}

interface ActiveVote {
  category: string;
  options: VoteOption[];
  votes: Record<string, string>;
  endTime: number;
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: string;
}

interface EffectNotification {
  id: string;
  text: string;
}

const VotingInterface: React.FC = () => {
  const [activeVote, setActiveVote] = useState<ActiveVote | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [voteResults, setVoteResults] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(30); // Start with 30 for testing
  const [userPoints, setUserPoints] = useState(250);
  const [viewerCount, setViewerCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'fan-control' | 'team' | 'wager'>('fan-control');
  const [effectNotifications, setEffectNotifications] = useState<EffectNotification[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [currentVotingCategory, setCurrentVotingCategory] = useState<string>('weapons'); // TEMP: default to weapons for testing
  const [isVoting, setIsVoting] = useState(true); // TEMP: default to true for testing
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', username: 'vent_21', message: 'This game is too good😂😁😱', timestamp: '1m' },
    { id: '2', username: 'EsportsLover', message: 'That night mode + Low gravity combo is going to be insane 😂🔥', timestamp: '2m' },
    { id: '3', username: 'ProGamer145', message: 'ShadowBlitz is absolutely dominating. Those headshots 🎯', timestamp: '4m' },
    { id: '4', username: 'Twitchqueen_2', message: 'I voted for Limit Ammo to make it more challenging 😈', timestamp: '6m' },
    { id: '5', username: 'cs2_legendx', message: 'Anyone else betting on NightHawk for a comeback? 🚀', timestamp: '6m' },
    { id: '6', username: 'cs2_legendx', message: 'This fan control feature is revolutionary! ScoreKount ftw! 🔥', timestamp: '7m' }
  ]);

  const categories = {
    weapons: [
      { id: 'pistols_only', name: 'Pistols only', votes: 487 }, // CS2 compatible
      { id: 'no_snipers', name: 'No Snipers', votes: 212 },
      { id: 'limit_ammo', name: 'Limit Ammo', votes: 346 },
      { id: 'awp_only', name: 'AWP Only', votes: 562 } // CS2 compatible
    ],
    environment: [
      { id: 'fog', name: 'Fog', votes: 156 },
      { id: 'low_gravity', name: 'Low Gravity', votes: 623 }, // CS2 compatible
      { id: 'speed_boost', name: 'Speed Boost', votes: 478 }, // CS2 compatible
      { id: 'slow_motion', name: 'Slow Motion', votes: 298 } // CS2 compatible
    ],
    modifiers: [
      { id: 'friendly_fire', name: 'Friendly Fire ON', votes: 387 }, // CS2 compatible
      { id: 'low_health', name: '10 HP Mode', votes: 468 }, // CS2 compatible
      { id: 'no_heal', name: 'No Heal', votes: 152 },
      { id: 'infinite_money', name: 'Max Money', votes: 701 } // CS2 compatible
    ]
  };

  useEffect(() => {
    const userId = localStorage.getItem('userId') || 
                   `viewer_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', userId);
    
    socket.emit('register', userId);
    
    socket.on('points', (points: number) => {
      setUserPoints(points);
    });
    
    socket.on('viewerCount', (count: number) => {
      setViewerCount(count);
    });
    
    // Listen for voting category from streamer
    socket.on('voteStarted', (vote: any) => {
      setCurrentVotingCategory(vote.category);
      setActiveVote(vote);
      setSelectedOption(null);
      setVoteResults({});
      setIsVoting(true);
      setTimeLeft(30);
      
      // Start countdown when vote starts
      const countdown = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdown);
            setIsVoting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });
    
    // Simulate dynamic chat messages
    const chatInterval = setInterval(() => {
      const newMessages = [
        { username: 'xXNoScopeXx', message: 'LETS GOOO! Night mode FTW! 🌙' },
        { username: 'GamerGirl92', message: 'omg this is intense 😱💯' },
        { username: 'TacticalTurtle', message: 'Pistols only would be EPIC right now' },
        { username: 'StreamSniper', message: '💀💀💀 RIP to whoever gets earthquake' },
        { username: 'MLGPro2025', message: 'First time seeing FCE, this is SICK! 🔥' },
        { username: 'CasualAndy', message: 'Imagine low gravity AWP battles 😂' },
        { username: 'EliteForce', message: 'VOTE CHAOS! Make them suffer 😈' },
        { username: 'n00bMaster', message: 'How do I vote??? nvm figured it out' },
        { username: 'ToxicAvenger', message: 'ez clap for ShadowBlitz 💪' },
        { username: 'ChillVibes', message: 'This is better than regular esports ngl' }
      ];
      
      const randomMsg = newMessages[Math.floor(Math.random() * newMessages.length)];
      const newChatMsg: ChatMessage = {
        id: Date.now().toString(),
        username: randomMsg.username,
        message: randomMsg.message,
        timestamp: 'now'
      };
      
      setChatMessages((prev: ChatMessage[]) => [newChatMsg, ...prev].slice(0, 10));
    }, 5000);
    
    return () => {
      clearInterval(chatInterval);
      socket.off('points');
      socket.off('viewerCount');
      socket.off('voteStarted');
    };
  }, []);

  const handleVote = (optionId: string) => {
    setSelectedOption(optionId);
    
    // Update local vote count with random increment
    const voteIncrement = Math.floor(Math.random() * 5) + 1;
    setVoteCounts(prev => ({
      ...prev,
      [optionId]: (prev[optionId] || 0) + voteIncrement
    }));
    
    socket.emit('vote', optionId);
    
    // Trigger effect notification after vote ends
    setTimeout(() => {
      const effects = [
        "😱 CHAOS UNLEASHED! Get ready for some spicy gameplay!",
        "⚡ EFFECT ACTIVATED! This is where things get interesting...",
        "🔥 VIEWERS HAVE SPOKEN! Brace for impact!",
        "💀 RIP NORMAL GAMEPLAY! Welcome to the chaos dimension!",
        "🎮 PLOT TWIST INCOMING! The fans are in control now!",
        "🚀 EFFECT DEPLOYED! Let's see how they handle this one!"
      ];
      const randomEffect = effects[Math.floor(Math.random() * effects.length)];
      const notification: EffectNotification = { id: Date.now().toString(), text: randomEffect };
      setEffectNotifications(prev => [...prev, notification]);
      
      // Remove notification after 5 seconds
      setTimeout(() => {
        setEffectNotifications(prev => prev.filter((n: EffectNotification) => n.id !== notification.id));
      }, 5000);
    }, 30000);
  };

  const renderVotingOptions = () => {
    const options = categories[currentVotingCategory as keyof typeof categories] || [];
    
    return (
      <div className="voting-grid">
        {options.map(option => {
          const currentVotes = voteCounts[option.id] || option.votes;
          const totalVotes = options.reduce((sum, opt) => sum + (voteCounts[opt.id] || opt.votes), 0);
          const votePercentage = totalVotes > 0 ? (currentVotes / totalVotes) * 100 : 0;
          const isWinning = Math.max(...options.map(o => voteCounts[o.id] || o.votes)) === currentVotes;
          
          return (
            <button
              key={option.id}
              className={`vote-option-card ${selectedOption === option.id ? 'selected' : ''} ${isWinning ? 'winning' : ''}`}
              onClick={() => handleVote(option.id)}
            >
              <div className="vote-option-content">
                <h4>{option.name}</h4>
                <div className="vote-progress">
                  <div 
                    className="vote-progress-bar" 
                    style={{ width: `${votePercentage}%` }}
                  />
                </div>
                <div className="vote-stats">
                  <span className="vote-count">{currentVotes} votes</span>
                  {isWinning && <span className="winning-badge">👑</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="voting-interface-v2">
      {/* Header */}
      <header className="main-header">
        <div className="header-left">
          <button className="cs2-selector">
            CS2 <span className="dropdown-arrow">▼</span>
          </button>
        </div>
        
        <nav className="header-nav">
          <a href="#dashboard">Dashboard</a>
          <a href="#daily">Daily Rewards</a>
          <a href="#tasks">Tasks</a>
          <a href="#leaderboard">Leaderboard</a>
          <a href="#fce" className="active">Fan Controlled Esports</a>
          <a href="#payouts">My Payouts</a>
        </nav>
        
        <div className="header-right">
          <div className="points-display">
            <span className="coin-icon">🪙</span> 321
          </div>
          <button className="notifications">🔔</button>
          <div className="user-avatar">
            <img src="/api/placeholder/32/32" alt="User" />
          </div>
        </div>
      </header>

      <div className="main-content">
        {/* Game Stream Section */}
        <div className="stream-section">
          <div className="team-headers">
            <div className="team shadow-blitz">
              <img src="/api/placeholder/40/40" alt="Shadow Blitz" />
              <div>
                <h3>Shadow Blitz</h3>
                <div className="stats">
                  <span>⚔️ 1v1</span>
                  <span>⏱️ 35 mins</span>
                  <span>🗺️ Inferno</span>
                </div>
              </div>
            </div>
            
            <div className="match-info">
              <div className="live-badge">LIVE</div>
              <div className="trophy">🏆</div>
              <div className="prize">250 XYZ</div>
            </div>
            
            <div className="team night-hawk">
              <div>
                <h3>NightHawk</h3>
                <div className="stats">
                  <span>⚔️ 1v1</span>
                  <span>⏱️ 35 mins</span>
                  <span>🗺️ Inferno</span>
                </div>
              </div>
              <img src="/api/placeholder/40/40" alt="NightHawk" />
            </div>
          </div>
          
          <div className="video-container">
            <div className="video-player">
              <img src="/api/placeholder/800/450" alt="Game Stream" className="stream-placeholder" />
              <div className="video-controls">
                <button className="play-pause">▶️</button>
                <div className="progress-bar">
                  <div className="progress" style={{ width: '40%' }}></div>
                </div>
                <span className="time">10:05 / 12:55</span>
                <button className="volume">🔊</button>
                <button className="settings">⚙️</button>
                <button className="fullscreen">⛶</button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="content-tabs">
            <button 
              className={`tab ${activeTab === 'team' ? 'active' : ''}`}
              onClick={() => setActiveTab('team')}
            >
              Team/Player Details
            </button>
            <button 
              className={`tab ${activeTab === 'fan-control' ? 'active' : ''}`}
              onClick={() => setActiveTab('fan-control')}
            >
              Fan Control
            </button>
            <button 
              className={`tab ${activeTab === 'wager' ? 'active' : ''}`}
              onClick={() => setActiveTab('wager')}
            >
              Live Wager
            </button>
          </div>

          {/* Fan Control Panel */}
          {activeTab === 'fan-control' && (
            <div className="fan-control-panel">
              <div className="voting-header">
                <div className="voting-title-section">
                  <h2>Vote to influence this match in real-time!</h2>
                  <div className="voting-subtitle">
                    <span className="lightning">⚡</span>
                    <span>Your vote can change everything!</span>
                    <span className="lightning">⚡</span>
                  </div>
                  <div className="current-category">
                    {currentVotingCategory === 'weapons' && '⚔️ WEAPONS ROUND'}
                    {currentVotingCategory === 'environment' && '🌍 ENVIRONMENT CHAOS'}
                    {currentVotingCategory === 'modifiers' && '👤 PLAYER MODIFIERS'}
                    {!currentVotingCategory && 'WAITING FOR CATEGORY...'}
                  </div>
                </div>
                <div className="countdown-timer">
                  <svg viewBox="0 0 100 100" className="timer-svg">
                    <defs>
                      <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#9333EA', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: '#6B46C1', stopOpacity: 1}} />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="url(#timer-gradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(timeLeft / 30) * 283} 283`}
                      style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: '50% 50%',
                        transition: 'stroke-dasharray 0.3s ease'
                      }}
                    />
                  </svg>
                  <div className="timer-content">
                    <div className="timer-label">Voting ends in</div>
                    <div className="timer-value">00:{timeLeft.toString().padStart(2, '0')}</div>
                    <div className="timer-votes">Votes: {Object.values(voteCounts).reduce((a, b) => a + b, 0) || 0}</div>
                  </div>
                </div>
              </div>

              {currentVotingCategory ? renderVotingOptions() : (
                <div className="waiting-for-vote">
                  <p>Waiting for streamer to select a category...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        <div className="chat-sidebar">
          <div className="chat-header">
            <h3>Live Comments</h3>
            <span className="live-indicator">LIVE</span>
          </div>
          
          <div className="chat-messages">
            {chatMessages.map(msg => (
              <div key={msg.id} className="chat-message">
                <div className="message-header">
                  <span className="username">{msg.username}:</span>
                  <span className="timestamp">{msg.timestamp}</span>
                </div>
                <div className="message-content">{msg.message}</div>
              </div>
            ))}
          </div>
          
          <div className="chat-input">
            <input type="text" placeholder="Send message" />
            <button className="send-button">➤</button>
          </div>
        </div>
      </div>

      {/* Effect Notifications */}
      <div className="effect-notifications">
        {effectNotifications.map(notification => (
          <div key={notification.id} className="effect-notification">
            {notification.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VotingInterface;