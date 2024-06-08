import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CSVLink } from 'react-csv';
import { Line } from 'react-chartjs-2';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import 'chart.js/auto';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
const USER_ID = '123'; // Replace with actual user ID

const ItemType = {
  COLUMN: 'COLUMN',
};

const DraggableColumn = ({ id, children, moveColumn, findColumn, frozen }) => {
  const originalIndex = findColumn(id).index;
  const [{ isDragging }, ref] = useDrag({
    type: ItemType.COLUMN,
    item: { id, originalIndex },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const { id: droppedId, originalIndex } = item;
      const didDrop = monitor.didDrop();
      if (!didDrop) {
        moveColumn(droppedId, originalIndex);
      }
    },
  }, [id, originalIndex, moveColumn, findColumn]);

  const [, drop] = useDrop({
    accept: ItemType.COLUMN,
    hover({ id: draggedId }) {
      if (draggedId !== id) {
        const { index: overIndex } = findColumn(id);
        moveColumn(draggedId, overIndex);
      }
    },
  }, [id, findColumn, moveColumn]);

  const opacity = isDragging ? 0 : 1;
  const refCallback = (node) => {
    if (!frozen) {
      ref(drop(node));
    }
  };

  return (
    <th ref={refCallback} style={{ opacity }} className="py-3 px-6 bg-gray-800 text-white text-center text-xl">
      {children}
    </th>
  );
};

const DailyLogTable = () => {
  const [dailyLogs, setDailyLogs] = useState([]);
  const [smartListMap, setSmartListMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDailyLogs = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/daily-logs`);
        setDailyLogs(response.data);
      } catch (error) {
        console.error('Error fetching daily logs:', error);
      }
    };

    const fetchSmartLists = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/smartlists`);
        setSmartListMap(response.data);
      } catch (error) {
        console.error('Error fetching smart lists:', error);
      }
    };

    const fetchColumnOrder = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/get-column-order/${USER_ID}`);
        if (Array.isArray(response.data) && response.data.length > 0) {
          setColumns((prevColumns) => {
            const orderedColumns = response.data.map((id) => prevColumns.find((col) => col.id === id));
            return orderedColumns.filter(Boolean);
          });
        }
      } catch (error) {
        console.error('Error fetching column order:', error);
      }
    };

    const fetchData = async () => {
      await fetchDailyLogs();
      await fetchSmartLists();
      await fetchColumnOrder();
      setLoading(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (dailyLogs.length > 0) {
      setColumns([
        { id: 'date', label: 'Date', isFrozen: true },
        { id: 'agentName', label: "Agent's Name", isFrozen: true },
        ...Object.keys(dailyLogs[0].smartListCounts).map((smartListId) => ({
          id: smartListId,
          label: smartListMap[smartListId],
        })),
        { id: 'total', label: 'Total', isFrozen: true },
      ]);
    }
  }, [dailyLogs, smartListMap]);

  const moveColumn = useCallback((draggedId, overIndex) => {
    const draggedIndex = columns.findIndex((col) => col.id === draggedId);
    const newColumns = [...columns];
    const [movedColumn] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(overIndex, 0, movedColumn);
    setColumns(newColumns);
    saveColumnOrder(newColumns);
  }, [columns]);

  const findColumn = useCallback((id) => {
    const column = columns.find((col) => col.id === id);
    return {
      column,
      index: columns.indexOf(column),
    };
  }, [columns]);

  const saveColumnOrder = async (newColumns) => {
    try {
      const order = newColumns.map((col) => col.id);
      await axios.post(`${API_BASE_URL}/api/save-column-order`, { userId: USER_ID, order });
    } catch (error) {
      console.error('Error saving column order:', error);
    }
  };

  const handleClearLogs = async () => {
    if (window.confirm('Are you sure you want to clear the daily logs? You will lose your data.')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/daily-logs`);
        setDailyLogs([]);
      } catch (error) {
        console.error('Error clearing daily logs:', error);
      }
    }
  };

  const handleBackToSelection = () => {
    navigate('/');
  };

  const handleGoToScoreboard = () => {
    navigate('/scoreboard');
  };

  const groupedData = dailyLogs.reduce((acc, log) => {
    const date = new Date(log.date).toLocaleDateString();
    if (!acc[log.agentName]) {
      acc[log.agentName] = { dates: [], totals: [] };
    }
    acc[log.agentName].dates.push(date);
    acc[log.agentName].totals.push(log.total);
    return acc;
  }, {});

  const colors = [
    'rgba(75, 192, 192, 0.6)',
    'rgba(255, 99, 132, 0.6)',
    'rgba(54, 162, 235, 0.6)',
    'rgba(255, 206, 86, 0.6)',
    'rgba(75, 192, 192, 1)',
  ];

  const data = {
    labels: [...new Set(dailyLogs.map(log => new Date(log.date).toLocaleDateString()))],
    datasets: Object.entries(groupedData).map(([agentName, { dates, totals }], index) => ({
      label: agentName,
      data: totals,
      backgroundColor: colors[index % colors.length],
      borderColor: colors[index % colors.length].replace('0.6', '1'),
      borderWidth: 1,
      fill: false,
    })),
  };

  return (
    <DndProvider backend={HTML5Backend}>
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
                onClick={handleGoToScoreboard}
                className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition duration-300"
              >
                Go to Scoreboard
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
              <Line data={data} options={{ maintainAspectRatio: false }} height={400} />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg shadow-lg">
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <DraggableColumn
                        key={column.id}
                        id={column.id}
                        moveColumn={moveColumn}
                        findColumn={findColumn}
                        frozen={['date', 'agentName', 'total'].includes(column.id)}
                      >
                        {column.label}
                      </DraggableColumn>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dailyLogs.map(log => (
                    <tr key={log._id} className="border-b border-gray-200 hover:bg-gray-100 transition duration-300">
                      {columns.map((column) => (
                        <td key={`${log._id}-${column.id}`} className="py-4 px-6 text-center">
                          {column.id === 'date'
                            ? new Date(log.date).toLocaleDateString()
                            : column.id === 'agentName'
                              ? log.agentName
                              : column.id === 'total'
                                ? log.total
                                : log.smartListCounts[column.id]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </DndProvider>
  );
};

export default DailyLogTable;