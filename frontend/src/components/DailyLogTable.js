import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CSVLink } from 'react-csv';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';

const DailyLogTable = () => {
  const [dailyLogs, setDailyLogs] = useState([]);
  const [smartListMap, setSmartListMap] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDailyLogs = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/daily-logs');
        setDailyLogs(response.data);
      } catch (error) {
        console.error('Error fetching daily logs:', error);
      }
    };

    const fetchSmartLists = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/smartlists');
        setSmartListMap(response.data);
      } catch (error) {
        console.error('Error fetching smart lists:', error);
      }
    };

    const fetchData = async () => {
      await fetchDailyLogs();
      await fetchSmartLists();
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleClearLogs = async () => {
    if (window.confirm('Are you sure you want to clear the daily logs?')) {
      try {
        await axios.delete('http://localhost:3000/api/daily-logs');
        setDailyLogs([]);
      } catch (error) {
        console.error('Error clearing daily logs:', error);
      }
    }
  };

  const handleBackToSelection = () => {
    navigate('/');
  };

  const data = {
    labels: dailyLogs.map(log => log.agentName),
    datasets: [
      {
        label: 'Total Leads',
        data: dailyLogs.map(log => log.total),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold mb-6 text-center">Daily Log</h1>
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <>
          <div className="flex justify-between mb-6">
            <button
              onClick={handleBackToSelection}
              className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
            >
              Back to Selection
            </button>
            <button
              onClick={handleClearLogs}
              className="px-6 py-3 bg-red-500 text-white rounded hover:bg-red-600 transition duration-300"
            >
              Clear Daily Logs
            </button>
            <CSVLink
              data={dailyLogs.map(log => ({
                date: new Date(log.date).toLocaleDateString(),
                agentName: log.agentName,
                ...log.smartListCounts,
                total: log.total,
              }))}
              filename="daily_logs.csv"
              className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition duration-300"
            >
              Export CSV
            </CSVLink>
          </div>
          <div className="overflow-x-auto mb-6">
            <Bar data={data} options={{ maintainAspectRatio: false }} height={400} />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-lg">
              <thead>
                <tr>
                  <th className="py-3 px-6 bg-gray-800 text-white text-center text-xl">Date</th>
                  <th className="py-3 px-6 bg-gray-800 text-white text-center text-xl">Agent's Name</th>
                  {dailyLogs.length > 0 && Object.keys(dailyLogs[0].smartListCounts).map(smartListId => (
                    <th key={smartListId} className="py-3 px-6 bg-gray-800 text-white text-center text-xl">{smartListMap[smartListId]}</th>
                  ))}
                  <th className="py-3 px-6 bg-gray-800 text-white text-center text-xl">Total</th>
                </tr>
              </thead>
              <tbody>
                {dailyLogs.map(log => (
                  <tr key={log._id} className="border-b border-gray-200 hover:bg-gray-100 transition duration-300">
                    <td className="py-4 px-6 text-center">{new Date(log.date).toLocaleDateString()}</td>
                    <td className="py-4 px-6 text-center">{log.agentName}</td>
                    {Object.entries(log.smartListCounts).map(([smartListId, count]) => (
                      <td key={smartListId} className="py-4 px-6 text-center">{count}</td>
                    ))}
                    <td className="py-4 px-6 text-center">{log.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default DailyLogTable;
