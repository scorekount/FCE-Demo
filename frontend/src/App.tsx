import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import VotingInterface from './components/VotingInterface';
import StreamerDashboard from './components/StreamerDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Main voting interface for viewers */}
          <Route path="/" element={<VotingInterface />} />
          
          {/* Streamer control panel */}
          <Route path="/streamer" element={<StreamerDashboard />} />
          
          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;