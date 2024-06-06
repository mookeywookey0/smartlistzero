import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SelectionComponent from './components/SelectionComponent';
import DailyLogTable from './components/DailyLogTable';
import Scoreboard from './components/Scoreboard';

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 text-gray-900">
        <Routes>
          <Route path="/" element={<SelectionComponent />} />
          <Route path="/daily-log" element={<DailyLogTable />} />
          <Route path="/scoreboard" element={<Scoreboard />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;