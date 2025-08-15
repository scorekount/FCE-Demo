// server.js - Updated with Minecraft support
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
let currentGame = 'cs2'; // Track current game being voted on

// CS2 Effect definitions
const CS2_EFFECTS = {
  weapons: {
    pistol_only: { name: "Pistols Only!", duration: 120, cost: 100 },
    awp_madness: { name: "AWP for Everyone!", duration: 120, cost: 200 },
    nades_only: { name: "Grenades Only!", duration: 60, cost: 150 },
    knife_only: { name: "Knives Only!", duration: 90, cost: 175 }
  },
  movement: {
    speed_boost: { name: "1.5x Speed", duration: 30, cost: 50 },
    slow_motion: { name: "Slow Motion", duration: 20, cost: 75 },
    low_gravity: { name: "Moon Gravity", duration: 45, cost: 100 },
    bunny_hop: { name: "Bunny Hop Mode", duration: 60, cost: 125 }
  },
  vision: {
    flashbang_party: { name: "Flashbang Spam", duration: 30, cost: 125 },
    smoke_everywhere: { name: "Smoke Chaos", duration: 45, cost: 80 },
    fog_of_war: { name: "Heavy Fog", duration: 60, cost: 150 },
    night_mode: { name: "Night Vision", duration: 45, cost: 100 }
  },
  chaos: {
    friendly_fire: { name: "Friendly Fire ON", duration: 45, cost: 300 },
    low_health: { name: "10 HP Mode", duration: 60, cost: 250 },
    infinite_money: { name: "Max Money", duration: 0, cost: 400 },
    randomize_teams: { name: "Shuffle Teams", duration: 0, cost: 350 }
  }
};

// Minecraft Effect definitions
const MINECRAFT_EFFECTS = {
  mobs: {
    spawn_creeper: { name: "Creeper Attack!", duration: 0, cost: 150 },
    zombie_horde: { name: "Zombie Horde", duration: 0, cost: 200 },
    phantom_attack: { name: "Phantom Swarm", duration: 0, cost: 175 },
    friendly_iron_golem: { name: "Iron Golem Helper", duration: 60, cost: 250 }
  },
  world: {
    weather_thunder: { name: "Thunderstorm", duration: 60, cost: 100 },
    time_night: { name: "Instant Night", duration: 0, cost: 75 },
    time_day: { name: "Instant Day", duration: 0, cost: 75 },
    random_teleport: { name: "Random Teleport", duration: 0, cost: 150 }
  },
  player: {
    speed_boost: { name: "Speed Boost", duration: 30, cost: 100 },
    super_jump: { name: "Super Jump", duration: 30, cost: 125 },
    regeneration: { name: "Health Regen", duration: 20, cost: 150 },
    strength_buff: { name: "Strength Buff", duration: 30, cost: 175 },
    fire_resistance: { name: "Fire Immunity", duration: 60, cost: 100 },
    blindness: { name: "Blindness", duration: 10, cost: 125 }
  },
  chaos: {
    tnt_rain: { name: "TNT Rain!", duration: 0, cost: 300 },
    shuffle_inventory: { name: "Shuffle Hotbar", duration: 0, cost: 100 },
    give_diamonds: { name: "Diamond Gift", duration: 0, cost: 200 },
    lucky_chest: { name: "Lucky Chest", duration: 0, cost: 250 },
    instant_hunger: { name: "Instant Hunger", duration: 0, cost: 75 }
  }
};

// Get effects based on current game
function getEffects(game = currentGame) {
  return game === 'minecraft' ? MINECRAFT_EFFECTS : CS2_EFFECTS;
}

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

  // Start a vote with game selection
  socket.on('startVote', (data) => {
    console.log('Received startVote request:', data);
    if (activeVote) {
      console.log('Vote already active, ignoring');
      return;
    }
    
    // Handle both old format (string) and new format (object with game and category)
    let category, game;
    if (typeof data === 'string') {
      category = data;
      game = 'cs2'; // Default to CS2 for backward compatibility
    } else {
      category = data.category;
      game = data.game || 'cs2';
    }
    
    currentGame = game;
    const EFFECTS = getEffects(game);
    
    const options = Object.entries(EFFECTS[category]).map(([key, effect]) => ({
      id: key,
      ...effect
    }));
    
    activeVote = {
      game,
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
    const EFFECTS = getEffects(effectData.game || currentGame);
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
      game: effectData.game || currentGame,
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
      game: activeVote.game,
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
  
  // Send to appropriate game controller
  if (effect.game === 'minecraft') {
    sendToMinecraftController(effect);
  } else {
    sendToCS2Controller(effect);
  }
}

// WebSocket connections for game controllers
const WebSocket = require('ws');
let cs2Controller = null;
let minecraftController = null;

const wss = new WebSocket.Server({ port: 8081 });
wss.on('connection', (ws) => {
  console.log('Game controller connected');
  
  // Wait for identification
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'identify') {
        if (data.game === 'minecraft') {
          minecraftController = ws;
          console.log('Minecraft controller identified');
        } else {
          cs2Controller = ws;
          console.log('CS2 controller identified');
        }
      }
    } catch (e) {
      // Assume CS2 for backward compatibility
      cs2Controller = ws;
    }
  });
  
  ws.on('close', () => {
    if (ws === minecraftController) {
      minecraftController = null;
      console.log('Minecraft controller disconnected');
    } else if (ws === cs2Controller) {
      cs2Controller = null;
      console.log('CS2 controller disconnected');
    }
  });
});

function sendToCS2Controller(effect) {
  if (cs2Controller && cs2Controller.readyState === WebSocket.OPEN) {
    cs2Controller.send(JSON.stringify({
      type: 'execute',
      effect: effect
    }));
  }
}

function sendToMinecraftController(effect) {
  if (minecraftController && minecraftController.readyState === WebSocket.OPEN) {
    minecraftController.send(JSON.stringify({
      type: 'execute',
      effect: effect
    }));
  }
}

// API endpoint to get current game status
app.get('/api/status', (req, res) => {
  res.json({
    activeVote: activeVote !== null,
    currentGame,
    viewerCount: connectedViewers,
    totalVotes,
    totalEffects,
    sessionRevenue,
    controllers: {
      cs2: cs2Controller !== null,
      minecraft: minecraftController !== null
    }
  });
});

// API endpoint to get available games
app.get('/api/games', (req, res) => {
  res.json([
    { id: 'cs2', name: 'Counter-Strike 2', active: cs2Controller !== null },
    { id: 'minecraft', name: 'Minecraft', active: minecraftController !== null }
  ]);
});

server.listen(3001, () => {
  console.log('FCE Server running on port 3001');
  console.log('WebSocket server for game controllers on port 8081');
});