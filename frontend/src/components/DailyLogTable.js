import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { CSVLink } from 'react-csv';
import { Line } from 'react-chartjs-2';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Modal from 'react-modal';
import 'chart.js/auto';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../App.css'; // Import the CSS file

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
    <th ref={refCallback} style={{ opacity }} className="column">
      {children}
    </th>
  );
};

const DailyLogTable = () => {
  const [dailyLogs, setDailyLogs] = useState([]);
  const [smartListMap, setSmartListMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Modal.setAppElement('#root'); // Set the app element for accessibility

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

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  const handleClearLogs = async () => {
    closeModal();
    try {
      await axios.delete(`${API_BASE_URL}/api/daily-logs`);
      setDailyLogs([]);
    } catch (error) {
      console.error('Error clearing daily logs:', error);
    }
  };

  const handleDateChange = useCallback(async () => {
    if (!startDate || !endDate) {
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/daily-logs`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      setDailyLogs(response.data);
    } catch (error) {
      console.error('Error fetching logs with date range:', error);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    handleDateChange();
  }, [startDate, endDate, handleDateChange]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredLogs = dailyLogs.filter(log =>
    log.agentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedData = filteredLogs.reduce((acc, log) => {
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
    labels: [...new Set(filteredLogs.map(log => new Date(log.date).toLocaleDateString()))].reverse(),
    datasets: Object.entries(groupedData).map(([agentName, { dates, totals }], index) => ({
      label: agentName,
      data: totals.reverse(),
      backgroundColor: colors[index % colors.length],
      borderColor: colors[index % colors.length].replace('0.6', '1'),
      borderWidth: 1,
      fill: false,
    })),
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="main-container">
        <h1 className="heading">Daily Log</h1>
        {loading ? (
          <div className="loading-indicator">Loading...</div>
        ) : (
          <>
            <div className="button-container">
              <button
                onClick={openModal}
                className="clear-button"
              >
                Clear Daily Logs
              </button>
              <CSVLink
                data={filteredLogs.map(log => ({
                  date: new Date(log.date).toLocaleDateString(),
                  agentName: log.agentName,
                  ...log.smartListCounts,
                  total: log.total,
                }))}
                filename="daily_logs.csv"
                className="csv-button"
              >
                Export CSV
              </CSVLink>
            </div>
            <div className="date-picker-container">
              <div className="date-picker-label">
                <label>Start Date: </label>
                <DatePicker
                  selected={startDate}
                  onChange={date => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  isClearable
                  className="date-picker"
                  placeholderText="Select start date"
                />
              </div>
              <div className="date-picker-label">
                <label>End Date: </label>
                <DatePicker
                  selected={endDate}
                  onChange={date => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  isClearable
                  className="date-picker"
                  placeholderText="Select end date"
                />
              </div>
            </div>
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input p-2 border border-gray-300 rounded mb-4 w-full"
            />
            <div className="chart-container">
              <Line data={data} options={{ maintainAspectRatio: false }} height={400} />
            </div>
            <div className="table-container">
              <table className="table">
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
                  {filteredLogs.map(log => (
                    <tr key={log._id} className="border-b border-gray-200 hover:bg-gray-100 transition duration-300">
                      {columns.map((column) => (
                        <td key={`${log._id}-${column.id}`} className="py-4 px-6 text-center text-sm">
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
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          className="modal-content"
          overlayClassName="modal-overlay"
        >
          <h2 className="modal-header">Confirm Clear Logs</h2>
          <p>Are you sure you want to clear the daily logs? This action cannot be undone.</p>
          <div className="modal-buttons">
            <button
              onClick={closeModal}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleClearLogs}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300"
            >
              Clear Logs
            </button>
          </div>
        </Modal>
      </div>
    </DndProvider>
  );
};

export default DailyLogTable;
