import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { useParams, Link } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const AgentDetail = () => {
  const { agentId } = useParams();
  const [agentLogs, setAgentLogs] = useState([]);
  const [agentName, setAgentName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgentLogs = async () => {
      try {
        console.log(`Making request to ${API_BASE_URL}/api/agent-logs/${agentId}`);
        const response = await axios.get(`${API_BASE_URL}/api/agent-logs/${agentId}`);
        console.log('Response:', response);
        setAgentLogs(response.data.logs);
        setAgentName(response.data.name);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching agent logs:', error);
      }
    };

    fetchAgentLogs();
  }, [agentId]);

  if (loading) {
    return <div className="loading-indicator">Loading...</div>;
  }

  if (!agentLogs || agentLogs.length === 0) {
    return <div className="no-data">No data available for this agent.</div>;
  }

  const data = {
    labels: agentLogs.map(log => new Date(log.date).toLocaleDateString()).reverse(),
    datasets: [
      {
        label: 'Performance',
        data: agentLogs.map(log => log.total).reverse(),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        fill: false,
      },
    ],
  };

  return (
    <div className="agent-detail-container">
      <Link to="/daily-log" className="back-button">Back to Daily Log</Link>
      <h1 className="heading">{agentName}'s Performance</h1>
      <div className="chart-container">
        <Line data={data} options={{ maintainAspectRatio: false }} height={400} />
      </div>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Total</th>
              {agentLogs[0].smartListCounts && Object.keys(agentLogs[0].smartListCounts).map(smartListId => (
                <th key={smartListId}>{smartListId}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {agentLogs.map(log => (
              <tr key={log._id} className="border-b border-gray-200 hover:bg-gray-100 transition duration-300">
                <td className="py-4 px-6 text-center text-sm">{new Date(log.date).toLocaleDateString()}</td>
                <td className="py-4 px-6 text-center text-sm">{log.total}</td>
                {log.smartListCounts && Object.values(log.smartListCounts).map((count, index) => (
                  <td key={index} className="py-4 px-6 text-center text-sm">{count}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AgentDetail;
