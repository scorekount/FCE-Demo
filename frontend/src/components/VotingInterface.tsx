import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import StreamPreview from './StreamPreview';
import './VotingInterface.css';

const socket = io('http://localhost:3001');

interface VoteOption {
  id: string;
  name: string;
  duration: number;
  cost: number;
}

interface ActiveVote {
  category: string;
  options: VoteOption[];
  votes: Record<string, string>;
  endTime: number;
}

interface Effect {
  name: string;
  timestamp: number;
  category: string;
  id: string;
}

const VotingInterface: React.FC = () => {
  const [activeVote, setActiveVote] = useState<ActiveVote | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [voteResults, setVoteResults] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [effectQueue, setEffectQueue] = useState<Effect[]>([]);

  useEffect(() => {
    // Generate or retrieve user ID
    const userId = localStorage.getItem('userId') || 
                   `viewer_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', userId);
    
    socket.emit('register', userId);
    
    // Socket listeners
    socket.on('voteStarted', (vote: ActiveVote) => {
      setActiveVote(vote);
      setSelectedOption(null);
      setVoteResults({});
    });
    
    socket.on('voteUpdate', (results: Record<string, number>) => {
      setVoteResults(results);
    });
    
    socket.on('voteEnded', ({ winner, results }: { winner: string; results: Record<string, number> }) => {
      setActiveVote(null);
      // Show celebration animation for winner
    });
    
    socket.on('points', (points: number) => {
      setUserPoints(points);
    });
    
    socket.on('viewerCount', (count: number) => {
      setViewerCount(count);
    });
    
    socket.on('effectQueued', (effect: Effect) => {
      setEffectQueue(prev => [...prev, effect]);
      setTimeout(() => {
        setEffectQueue(prev => prev.filter(e => e.timestamp !== effect.timestamp));
      }, 5000);
    });
    
    return () => {
      socket.off('voteStarted');
      socket.off('voteUpdate');
      socket.off('voteEnded');
      socket.off('points');
      socket.off('viewerCount');
      socket.off('effectQueued');
    };
  }, []);

  useEffect(() => {
    if (activeVote) {
      const timer = setInterval(() => {
        const remaining = Math.max(0, 
          Math.floor((activeVote.endTime - Date.now()) / 1000)
        );
        setTimeLeft(remaining);
        
        if (remaining === 0) {
          clearInterval(timer);
        }
      }, 100);
      
      return () => clearInterval(timer);
    }
  }, [activeVote]);

  const handleVote = (optionId: string) => {
    setSelectedOption(optionId);
    socket.emit('vote', optionId);
  };

  const calculatePercentage = (optionId: string): string => {
    const total = Object.values(voteResults).reduce((a, b) => a + b, 0);
    return total > 0 ? ((voteResults[optionId] || 0) / total * 100).toFixed(1) : '0';
  };

  return (
    <div className="voting-interface">
      <div className="header">
        <div className="logo">FCE</div>
        <div className="stats">
          <span className="viewers">👁 {viewerCount} viewers</span>
          <span className="points">🪙 {userPoints} points</span>
        </div>
      </div>

    <StreamPreview />

      {activeVote ? (
        <div className="active-vote">
          <div className="vote-header">
            <h2>Vote Now!</h2>
            <div className="timer">
              <svg className="timer-svg" viewBox="0 0 100 100">
                <circle
                  className="timer-circle"
                  cx="50"
                  cy="50"
                  r="45"
                  style={{
                    strokeDasharray: `${(timeLeft / 30) * 283} 283`
                  }}
                />
              </svg>
              <span className="timer-text">00:{timeLeft.toString().padStart(2, '0')}</span>
            </div>
          </div>

          <div className="vote-options">
            {activeVote.options.map(option => (
              <button
                key={option.id}
                className={`vote-option ${selectedOption === option.id ? 'selected' : ''}`}
                onClick={() => handleVote(option.id)}
              >
                <div className="option-content">
                  <h3>{option.name}</h3>
                  <span className="duration">{option.duration}s</span>
                </div>
                <div className="vote-bar">
                  <div 
                    className="vote-fill"
                    style={{ width: `${calculatePercentage(option.id)}%` }}
                  />
                  <span className="vote-percent">{calculatePercentage(option.id)}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="waiting">
          <h2>Waiting for next vote...</h2>
          <p>The streamer will start a new vote soon!</p>
        </div>
      )}

      <div className="effect-queue">
        {effectQueue.map((effect) => (
          <div key={effect.timestamp} className="effect-notification">
            <span className="effect-icon">⚡</span>
            <span>{effect.name} activated!</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VotingInterface;