import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import 'tailwindcss/tailwind.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

const SelectionComponent = () => {
  const [agents, setAgents] = useState([]);
  const [smartLists, setSmartLists] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [selectedSmartLists, setSelectedSmartLists] = useState([]);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchDate, setFetchDate] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch agents
const fetchAgents = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users`);
    const sortedAgents = Object.entries(response.data).sort(([, a], [, b]) => a.localeCompare(b));
    const agentOptions = sortedAgents.map(([id, name]) => ({ value: id, label: name }));
    setAgents(agentOptions);
    return agentOptions;
  } catch (error) {
    console.error('Error fetching agents:', error);
  }
};

// Fetch smart lists
const fetchSmartLists = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/smartlists`);
    const sortedSmartLists = Object.entries(response.data).sort(([, a], [, b]) => a.localeCompare(b));
    const smartListOptions = sortedSmartLists.map(([id, name]) => ({ value: id, label: name }));
    setSmartLists(smartListOptions);
    return smartListOptions;
  } catch (error) {
    console.error('Error fetching smart lists:', error);
  }
};

// Fetch selections
const fetchSelections = async (agentOptions, smartListOptions) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/get-selections`);
    const selections = response.data;

    const selectedAgentOptions = selections.agentIds.map(id => agentOptions.find(agent => agent.value === id)).filter(Boolean);
    const selectedSmartListOptions = selections.smartListIds.map(id => smartListOptions.find(smartList => smartList.value === id)).filter(Boolean);

    console.log('Fetched and set selected agents:', selectedAgentOptions);
    console.log('Fetched and set selected smart lists:', selectedSmartListOptions);

    setSelectedAgents(selectedAgentOptions);
    setSelectedSmartLists(selectedSmartListOptions);
  } catch (error) {
    console.error('Error fetching selections:', error);
  }
};

    const fetchData = async () => {
      const agentOptions = await fetchAgents();
      const smartListOptions = await fetchSmartLists();
      await fetchSelections(agentOptions, smartListOptions);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleSelection = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/selected-counts`, {
        agentIds: selectedAgents.map(agent => agent.value),
        smartListIds: selectedSmartLists.map(smartList => smartList.value)
      });
      setCounts(response.data);
      const currentDate = new Date(response.data.date).toLocaleDateString();
      setFetchDate(currentDate);
    } catch (error) {
      console.error('Error fetching selected counts:', error);
    }
  };

  const handleSaveSelections = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/save-selections`, {
        agentIds: selectedAgents.map(agent => agent.value),
        smartListIds: selectedSmartLists.map(smartList => smartList.value),
      });
      alert('Selections saved successfully!');
    } catch (error) {
      console.error('Error saving selections:', error);
    }
  };

  const handleClearSelections = () => {
    setSelectedAgents([]);
    setSelectedSmartLists([]);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">Select Agents and Smart Lists</h1>
      {loading ? (
        <div className="text-center text-gray-600">Loading...</div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2 text-gray-700">Agents</h2>
            <Select
              isMulti
              options={agents}
              value={selectedAgents}
              onChange={setSelectedAgents}
              className="basic-multi-select"
              classNamePrefix="select"
              placeholder="Select agents..."
            />
          </div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2 text-gray-700">Smart Lists</h2>
            <Select
              isMulti
              options={smartLists}
              value={selectedSmartLists}
              onChange={setSelectedSmartLists}
              className="basic-multi-select"
              classNamePrefix="select"
              placeholder="Select smart lists..."
            />
          </div>
          <div className="flex justify-between mb-6">
            <button
              onClick={handleSelection}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
            >
              Get Counts
            </button>
            <button
              onClick={handleSaveSelections}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition duration-300"
            >
              Save Selections
            </button>
            <button
              onClick={handleClearSelections}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition duration-300"
            >
              Clear Selections
            </button>
            <button
              onClick={() => navigate('/daily-log')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-300"
            >
              Go to Daily Log
            </button>
            <button
              onClick={() => navigate('/scoreboard')}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-300"
            >
              Go to Scoreboard
            </button>
          </div>
          {counts && (
            <div className="mt-6">
              <h2 className="text-2xl font-semibold mb-2 text-gray-700">Counts - Data pulled on {fetchDate}</h2>
              {Object.entries(counts.counts).map(([agentId, smartLists]) => (
                <div key={agentId} className="mb-4 p-4 border border-gray-300 rounded">
                  <h3 className="text-lg font-bold text-gray-800">Agent: {counts.agentMap[agentId]}</h3>
                  {Object.entries(smartLists).map(([smartListId, count]) => (
                    <p key={smartListId} className="text-gray-700">Smart List: {counts.smartListMap[smartListId]}, Lead Count: {count}</p>
                  ))}
                  <p className="font-semibold text-gray-800">Total Leads: {Object.values(smartLists).reduce((a, b) => a + b, 0)}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SelectionComponent;
