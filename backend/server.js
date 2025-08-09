// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Voting state
let activeVote = null;
let totalVotes = 0;
let totalEffects = 0;
let sessionRevenue = 0;
let votes = {};
let connectedViewers = 0;
let effectQueue = [];
let points = {}; // User points system

// Effect definitions
const EFFECTS = {
  weapons: {
    pistol_only: { name: "Pistols Only!", duration: 120, cost: 100 },
    awp_madness: { name: "AWP for Everyone!", duration: 120, cost: 200 },
    nades_only: { name: "Grenades Only!", duration: 60, cost: 150 }
  },
  movement: {
    speed_boost: { name: "1.5x Speed", duration: 30, cost: 50 },
    slow_motion: { name: "Slow Motion", duration: 20, cost: 75 },
    low_gravity: { name: "Moon Gravity", duration: 45, cost: 100 }
  },
  vision: {
    flashbang_party: { name: "Flashbang Spam", duration: 30, cost: 125 },
    smoke_everywhere: { name: "Smoke Chaos", duration: 45, cost: 80 },
    fog_of_war: { name: "Heavy Fog", duration: 60, cost: 150 }
  },
  chaos: {
    friendly_fire: { name: "Friendly Fire ON", duration: 45, cost: 300 },
    low_health: { name: "10 HP Mode", duration: 60, cost: 250 },
    infinite_money: { name: "Max Money", duration: 0, cost: 400 }
  }
};

io.on('connection', (socket) => {
  connectedViewers++;
  io.emit('viewerCount', connectedViewers);
  
  // Initialize user points
  socket.on('register', (userId) => {
    if (!points[userId]) {
      points[userId] = 500; // Starting points
    }
    socket.userId = userId;
    socket.emit('points', points[userId]);
  });

  // Start a vote
  socket.on('startVote', (category) => {
  console.log('Received startVote request for category:', category);
  if (activeVote) {
    console.log('Vote already active, ignoring');
    return;
  }
    
    const options = Object.entries(EFFECTS[category]).map(([key, effect]) => ({
      id: key,
      ...effect
    }));
    
    activeVote = {
      category,
      options,
      votes: {},
      endTime: Date.now() + 30000 // 30 second vote
    };
    
    io.emit('voteStarted', activeVote);
    
    // Auto-end vote
    setTimeout(() => {
      endVote();
    }, 30000);
  });

  // Cast vote
  socket.on('vote', (optionId) => {
    if (!activeVote || !socket.userId) return;
    
    activeVote.votes[socket.userId] = optionId;
    
    // Calculate live results
    const results = {};
    Object.values(activeVote.votes).forEach(vote => {
      results[vote] = (results[vote] || 0) + 1;
    });
    
    io.emit('voteUpdate', results);
  });

  // Purchase effect with points
  socket.on('purchaseEffect', (effectData) => {
    const userId = socket.userId;
    const effect = EFFECTS[effectData.category]?.[effectData.id];
    
    if (!effect || !userId || points[userId] < effect.cost) {
      socket.emit('purchaseFailed', 'Insufficient points');
      return;
    }
    
    points[userId] -= effect.cost;
    socket.emit('points', points[userId]);
    
    queueEffect({
      ...effect,
      id: effectData.id,
      category: effectData.category,
      purchasedBy: userId,
      timestamp: Date.now()
    });
  });

  socket.on('disconnect', () => {
    connectedViewers--;
    io.emit('viewerCount', connectedViewers);
  });
});

function endVote() {
  if (!activeVote) return;
  
  // Count votes and determine winner
  const results = {};
  Object.values(activeVote.votes).forEach(vote => {
    results[vote] = (results[vote] || 0) + 1;
  });
  
  // Update total votes
  totalVotes += Object.keys(activeVote.votes).length;
  
  const winner = Object.entries(results)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (winner) {
    const [effectId] = winner;
    const effect = activeVote.options.find(o => o.id === effectId);
    
    // Update stats
    totalEffects++;
    sessionRevenue += (Math.random() * 5 + 1); // Simulate $1-6 per effect
    
    // Broadcast updated stats
    io.emit('statsUpdate', {
      totalVotes,
      totalEffects,
      sessionRevenue,
      viewerCount: connectedViewers
    });
    
    queueEffect({
      ...effect,
      category: activeVote.category,
      votedBy: Object.keys(activeVote.votes).length,
      timestamp: Date.now()
    });
    
    // Award points to voters who picked the winner
    Object.entries(activeVote.votes).forEach(([userId, vote]) => {
      if (vote === effectId) {
        points[userId] = (points[userId] || 0) + 25;
        io.to(userId).emit('points', points[userId]);
      }
    });
  }
  
  io.emit('voteEnded', { winner: winner?.[0], results });
  activeVote = null;
}

function queueEffect(effect) {
  effectQueue.push(effect);
  io.emit('effectQueued', effect);
  
  // Send to game controller
  sendToGameController(effect);
}

// WebSocket connection to AHK/C# controller
const WebSocket = require('ws');
let gameController = null;

const wss = new WebSocket.Server({ port: 8081 });
wss.on('connection', (ws) => {
  gameController = ws;
  console.log('Game controller connected');
  
  ws.on('close', () => {
    gameController = null;
    console.log('Game controller disconnected');
  });
});

function sendToGameController(effect) {
  if (gameController && gameController.readyState === WebSocket.OPEN) {
    gameController.send(JSON.stringify({
      type: 'execute',
      effect: effect
    }));
  }
}

server.listen(3001, () => {
  console.log('FCE Server running on port 3001');
});