import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

const Scoreboard = () => {
  const [rankings, setRankings] = useState({ bestAgents: [], worstAgents: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/daily-rankings`);
        if (response.data && response.data.bestAgents && response.data.worstAgents) {
          setRankings(response.data);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching daily rankings:', error);
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  const handleBackToLog = () => {
    navigate('/daily-log');
  };

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold mb-6 text-center">Daily Scoreboard</h1>
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-4 text-center text-green-500">Best Agents</h2>
            <table className="min-w-full bg-white rounded-lg shadow-lg">
              <thead>
                <tr>
                  <th className="py-3 px-6 bg-green-500 text-white text-center">Rank</th>
                  <th className="py-3 px-6 bg-green-500 text-white text-center">Agent's Name</th>
                  <th className="py-3 px-6 bg-green-500 text-white text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {rankings.bestAgents.length > 0 ? (
                  rankings.bestAgents.map((agent, index) => (
                    <tr key={agent.agentId} className="border-b border-gray-200 hover:bg-gray-100 transition duration-300">
                      <td className="py-4 px-6 text-center">{index + 1}</td>
                      <td className="py-4 px-6 text-center">{agent.agentName}</td>
                      <td className="py-4 px-6 text-center">{agent.total}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="py-4 px-6 text-center">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-4 text-center text-red-500">Worst Agents</h2>
            <table className="min-w-full bg-white rounded-lg shadow-lg">
              <thead>
                <tr>
                  <th className="py-3 px-6 bg-red-500 text-white text-center">Rank</th>
                  <th className="py-3 px-6 bg-red-500 text-white text-center">Agent's Name</th>
                  <th className="py-3 px-6 bg-red-500 text-white text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {rankings.worstAgents.length > 0 ? (
                  rankings.worstAgents.map((agent, index) => (
                    <tr key={agent.agentId} className="border-b border-gray-200 hover:bg-gray-100 transition duration-300">
                      <td className="py-4 px-6 text-center">{index + 1}</td>
                      <td className="py-4 px-6 text-center">{agent.agentName}</td>
                      <td className="py-4 px-6 text-center">{agent.total}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="py-4 px-6 text-center">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="text-center mt-6">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
        >
          Back to Selection
        </button>
        <button
          onClick={handleBackToLog}
          className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition duration-300"
        >
          Back to Daily Log
        </button>
      </div>
    </div>
  );
};

export default Scoreboard;
