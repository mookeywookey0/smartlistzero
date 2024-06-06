import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LiveDashboard = () => {
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveCounts = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/agent-smartlist-counts');
        setCounts(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching live counts:', error);
      }
    };

    fetchLiveCounts();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold mb-6 text-center">Live Counts</h1>
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div>
          {counts && (
            <>
              <h2 className="text-2xl font-semibold mb-2 text-gray-700">Live Counts</h2>
              {Object.entries(counts.counts).map(([agentId, smartLists]) => (
                <div key={agentId} className="mb-4 p-4 border border-gray-300 rounded">
                  <h3 className="text-lg font-bold text-gray-800">Agent: {counts.agentMap[agentId]}</h3>
                  {Object.entries(smartLists).map(([smartListId, count]) => (
                    <p key={smartListId} className="text-gray-700">Smart List: {counts.smartListMap[smartListId]}, Lead Count: {count}</p>
                  ))}
                  <p className="font-semibold text-gray-800">Total Leads: {Object.values(smartLists).reduce((a, b) => a + b, 0)}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveDashboard;
