import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SidebarNavigation from './components/SidebarNavigation';
import SelectionComponent from './components/SelectionComponent';
import DailyLogTable from './components/DailyLogTable';
import Scoreboard from './components/Scoreboard';
import AgentDetail from './components/AgentDetail'; // Import the new component
import './App.css';

const App = () => {
  return (
    <Router>
      <div className="App">
        <SidebarNavigation />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<SelectionComponent />} />
            <Route path="/daily-log" element={<DailyLogTable />} />
            <Route path="/scoreboard" element={<Scoreboard />} />
            <Route path="/agent-detail/:agentId" element={<AgentDetail />} /> {/* Add the new route */}
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
