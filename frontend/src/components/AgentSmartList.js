import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AgentSmartList = () => {
  const [agents, setAgents] = useState([]);
  const [smartLists, setSmartLists] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [selectedSmartLists, setSelectedSmartLists] = useState([]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await axios.get('/api/agents');
        setAgents(response.data);
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
    };

    const fetchSmartLists = async () => {
      try {
        const response = await axios.get('/api/smartlists');
        setSmartLists(response.data);
      } catch (error) {
        console.error('Error fetching smart lists:', error);
      }
    };

    fetchAgents();
    fetchSmartLists();
  }, []);

  const handleAgentChange = (event) => {
    const value = Array.from(event.target.selectedOptions, (option) => option.value);
    setSelectedAgents(value);
  };

  const handleSmartListChange = (event) => {
    const value = Array.from(event.target.selectedOptions, (option) => option.value);
    setSelectedSmartLists(value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await axios.post('/api/selection', {
        agents: selectedAgents,
        smartLists: selectedSmartLists,
      });
      alert('Selection saved successfully!');
    } catch (error) {
      console.error('Error saving selection:', error);
      alert('Failed to save selection.');
    }
  };

  return (
    <div>
      <h1>Select Agents and Smart Lists</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="agents">Select Agents:</label>
          <select id="agents" multiple value={selectedAgents} onChange={handleAgentChange}>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="smartLists">Select Smart Lists:</label>
          <select id="smartLists" multiple value={selectedSmartLists} onChange={handleSmartListChange}>
            {smartLists.map((smartList) => (
              <option key={smartList.id} value={smartList.id}>
                {smartList.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit">Save Selection</button>
      </form>
    </div>
  );
};

export default AgentSmartList;
