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
  const [timeLeft, setTimeLeft] = useState(30);
  const [userPoints, setUserPoints] = useState(321);
  const [viewerCount, setViewerCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'fan-control' | 'team' | 'wager'>('fan-control');
  const [effectNotifications, setEffectNotifications] = useState<EffectNotification[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [currentVotingCategory, setCurrentVotingCategory] = useState<string>('');
  const [isVoting, setIsVoting] = useState(false);
  const [currentVoteOptions, setCurrentVoteOptions] = useState<VoteOption[]>([]);
  const [totalVoteCount, setTotalVoteCount] = useState(0); // Track total votes
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', username: 'vent_21', message: 'This game is too good😂😁😱', timestamp: '1m' },
    { id: '2', username: 'EsportsLover', message: 'That night mode + Low gravity combo is going to be insane 😂🔥', timestamp: '50s' },
    { id: '3', username: 'ProGamer145', message: 'ShadowBlitz is absolutely dominating. Those headshots 🎯', timestamp: '1m' },
    { id: '4', username: 'Twitchqueen_2', message: 'I voted for Limit Ammo to make it more challenging 😈', timestamp: '2m' },
    { id: '5', username: 'cs2_legendx', message: 'Anyone else betting on NightHawk for a comeback? 🚀', timestamp: '3m' },
    { id: '6', username: 'cs2_legendx', message: 'This fan control feature is revolutionary! ScoreKount ftw! 🔥', timestamp: '3m' }
  ]);

  // Updated categories to always have 4 options
  const categories = {
    weapons: [
      { id: 'pistols_only', name: 'Pistols only', votes: 487 },
      { id: 'no_snipers', name: 'No Snipers', votes: 212 },
      { id: 'limit_ammo', name: 'Limit Ammo', votes: 346 },
      { id: 'awp_only', name: 'AWP Only', votes: 562 }
    ],
    environment: [
      { id: 'fog', name: 'Fog', votes: 156 },
      { id: 'night_mode', name: 'Night Mode', votes: 623 },
      { id: 'rain', name: 'Rain', votes: 478 },
      { id: 'earthquake', name: 'Earthquake', votes: 298 }
    ],
    movement: [
      { id: 'low_gravity', name: 'Low Gravity', votes: 587 },
      { id: 'speed_boost', name: 'Speed Boost', votes: 265 },
      { id: 'no_heal', name: 'No Heal', votes: 152 },
      { id: 'one_shot_kill', name: 'One-Shot Kill', votes: 311 }
    ],
    vision: [
      { id: 'flashbang_spam', name: 'Flashbang Spam', votes: 390 },
      { id: 'smoke_chaos', name: 'Smoke Chaos', votes: 548 },
      { id: 'heavy_fog', name: 'Heavy Fog', votes: 151 },
      { id: 'blind_mode', name: 'Blind Mode', votes: 234 }
    ],
    chaos: [
      { id: 'friendly_fire', name: 'Friendly Fire ON', votes: 387 },
      { id: 'low_health', name: '10 HP Mode', votes: 468 },
      { id: 'random_weapons', name: 'Random Weapons', votes: 152 },
      { id: 'infinite_money', name: 'Max Money', votes: 701 }
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
      console.log('Vote started:', vote);
      setCurrentVotingCategory(vote.category);
      setActiveVote(vote);
      
      // Ensure we always have 4 options
      let options = vote.options || [];
      if (options.length < 4 && categories[vote.category as keyof typeof categories]) {
        options = categories[vote.category as keyof typeof categories].slice(0, 4);
      }
      setCurrentVoteOptions(options);
      
      setSelectedOption(null);
      setVoteResults({});
      setVoteCounts({});
      setTotalVoteCount(0);
      setIsVoting(true);
      setTimeLeft(30);
      
      // Start countdown and simulate vote counting
      const countdown = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdown);
            setIsVoting(false);
            return 0;
          }
          return prev - 1;
        });
        
        // Simulate votes increasing
        setTotalVoteCount(prev => prev + Math.floor(Math.random() * 15) + 5);
      }, 1000);
      
      return () => clearInterval(countdown);
    });
    
    socket.on('voteEnded', () => {
      setIsVoting(false);
      setActiveVote(null);
      setCurrentVoteOptions([]);
    });
    
    // Simulate dynamic chat messages
    const chatInterval = setInterval(() => {
      const newMessages = [
        { username: 'xXNoScopeXx', message: 'LETS GOOO! Night mode FTW! 🌙' },
        { username: 'GamersGirl92', message: 'omg this is intense 😱💯' },
        { username: 'TacticalTurtle', message: 'Pistols only would be EPIC right now' },
        { username: 'StreamSniper', message: '💀💀💀 RIP to whoever gets earthquake' },
        { username: 'MLGPro2025', message: 'First time seeing FCE, this is SICK! 🔥' },
        { username: 'CasualAndy', message: 'Imagine low gravity AWP battles 😂' },
        { username: 'EliteForce', message: 'VOTE CHAOS! Make them suffer 😈' },
        { username: 'n00bMaster', message: 'How do I vote??? nvm figured it out' },
        { username: 'ToxicAvenger', message: 'ez clap for Gamers Blitz 💪' },
        { username: 'Zexus1923', message: 'ayo @n00bMaster, sup my man?' },
		{ username: 'CGoProDave', message: 'go go go BluePandas' },
		{ username: 'ChilledBeerBoy', message: 'shawdows ftw boyz!' },
		{ username: 'SlayerSada9696', message: 'This is better than regular esports ngl' },
		{ username: 'HasdyFunk', message: 'Ayo everyone vote for RandomGuns mode!1!' },
		{ username: 'ChillVbes', message: 'this look hella fun' },
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
      socket.off('voteEnded');
    };
  }, []);

  const handleVote = (optionId: string) => {
    if (!isVoting) return;
    
    setSelectedOption(optionId);
    
    // Update local vote count with random increment
    const voteIncrement = Math.floor(Math.random() * 15) + 5;
    setVoteCounts(prev => ({
      ...prev,
      [optionId]: (prev[optionId] || 0) + voteIncrement
    }));
    
    setTotalVoteCount(prev => prev + voteIncrement);
    
    socket.emit('vote', optionId);
    
    // Trigger effect notification after vote ends
    if (timeLeft <= 1) {
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
        
        setTimeout(() => {
          setEffectNotifications(prev => prev.filter((n: EffectNotification) => n.id !== notification.id));
        }, 5000);
      }, 1000);
    }
  };

  const renderVotingOptions = () => {
    // Use actual options from server if available, otherwise fall back to hardcoded
    let options = currentVoteOptions.length > 0 
      ? currentVoteOptions.map(opt => ({
          id: opt.id,
          name: opt.name,
          votes: voteCounts[opt.id] || Math.floor(Math.random() * 500) + 100
        }))
      : (categories[currentVotingCategory as keyof typeof categories] || []);
    
    // Ensure we always show 4 options
    if (options.length < 4 && categories[currentVotingCategory as keyof typeof categories]) {
      options = categories[currentVotingCategory as keyof typeof categories].slice(0, 4);
    }
    
    if (options.length === 0) {
      return (
        <div className="waiting-for-vote">
          <h2>Waiting for vote to start...</h2>
          <p>The streamer will select a category soon!</p>
        </div>
      );
    }
    
    return (
      <div className="voting-grid">
        {options.slice(0, 4).map(option => {
          const currentVotes = voteCounts[option.id] || option.votes;
          const totalVotes = options.reduce((sum, opt) => sum + (voteCounts[opt.id] || opt.votes), 0);
          const votePercentage = totalVotes > 0 ? (currentVotes / totalVotes) * 100 : 0;
          const isWinning = Math.max(...options.map(o => voteCounts[o.id] || o.votes)) === currentVotes;
          
          return (
            <button
              key={option.id}
              className={`vote-option-card ${selectedOption === option.id ? 'selected' : ''} ${isWinning ? 'winning' : ''}`}
              onClick={() => handleVote(option.id)}
              disabled={!isVoting}
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
            <span className="coin-icon">🪙</span> 1513
          </div>
          <button className="notifications">🔔</button>
          <div className="user-avatar">
            <img src="mydiscordpfp_105597-1694397680.jpg" alt="User" />
          </div>
        </div>
      </header>

      <div className="main-content">
        {/* Game Stream Section */}
        <div className="stream-section">
          <div className="team-headers">
            <div className="team shadow-blitz">
              <img src="/team1-logo.png" alt="Gamers Blitz" />
              <div>
                <h3>Gamers Blitz</h3>
                <div className="stats">
                  <span>⚔️ 5v5</span>
                  <span>⏱️ 15 mins</span>
                  <span>🗺️ Inferno</span>
                </div>
              </div>
            </div>
            
            <div className="match-info">
              <div className="live-badge">LIVE</div>
              <div className="trophy">🏆</div>
              <div className="prize">250 Points</div>
            </div>
            
            <div className="team night-hawk">
              <div>
                <h3>BluePanda</h3>
                <div className="stats">
                  <span>⚔️ 5v5</span>
                  <span>⏱️ 15 mins</span>
                  <span>🗺️ Inferno</span>
                </div>
              </div>
              <img src="/team2-logo.png" alt="BluePanda" />
            </div>
          </div>
          
          <div className="video-container">
            <div className="video-player">
              <video width="1200" height="650"autoPlay loop muted className="user-video">
               <source src="Blacklist Trailer Footage.mp4" type="video/mp4" />
			    <img src="proxy-image.jpg" alt="Thumbnail Image" />
                 Your browser does not support the video tag.
              </video>
              <div className="video-controls">
                <button className="play-pause">▶️</button>
                <div className="progress-bar">
                  <div className="progress" style={{ width: '90%' }}></div>
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
                    {currentVotingCategory === 'environment' && '🌍 ENVIRONMENT EFFECTS'}
                    {currentVotingCategory === 'movement' && '🏃 PLAYER MODIFIERS'}
                    {currentVotingCategory === 'vision' && '👁️ VISION EFFECTS'}
                    {currentVotingCategory === 'chaos' && '💥 CHAOS MODE'}
                    {!currentVotingCategory && 'WAITING FOR CATEGORY...'}
                  </div>
                </div>
                <div className="countdown-timer">
                  <div className="timer-ring">
                    <svg viewBox="0 0 120 120" className="timer-svg">
                      <defs>
                        <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{stopColor: '#9333EA', stopOpacity: 1}} />
                          <stop offset="100%" style={{stopColor: '#6B46C1', stopOpacity: 1}} />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="rgba(139, 92, 246, 0.2)"
                        strokeWidth="6"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="url(#timer-gradient)"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${(timeLeft / 30) * 339} 339`}
                        style={{
                          transform: 'rotate(-90deg)',
                          transformOrigin: '50% 50%',
                          transition: 'stroke-dasharray 1s linear'
                        }}
                      />
                    </svg>
                    <div className="timer-content">
                      <div className="timer-label">Voting ends in</div>
                      <div className="timer-value">00:{timeLeft.toString().padStart(2, '0')}</div>
                      <div className="timer-votes">Votes: {totalVoteCount}</div>
                    </div>
                  </div>
                </div>
              </div>

              {isVoting && currentVoteOptions.length > 0 ? renderVotingOptions() : (
                <div className="waiting-for-vote">
                  <h2>Next vote coming up!</h2>
                  <p>The streamer will start a new vote soon!</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        <div className="chat-sidebar">
          <div className="chat-header">
            <h3>Stream Chat</h3>
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