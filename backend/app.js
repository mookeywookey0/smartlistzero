const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const schedule = require('node-schedule');
const moment = require('moment-timezone');

const {
  getAgentSmartListCounts,
  fetchAgents,
  fetchSmartLists,
  fetchDailyLogs,
  saveSelections,
  fetchSelections,
  saveDailyLog,
  getDailyRankings
} = require('./fetchData');

const DailyLog = require('./models/DailyLog');
const columnOrderRoutes = require('./routes/columnOrder');
const agentLogsRoutes = require('./routes/agentLogs');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// API routes
app.get('/api/agent-smartlist-counts', async (req, res) => {
  try {
    const countsData = await getAgentSmartListCounts();
    res.json(countsData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/selected-counts', async (req, res) => {
  const { agentIds, smartListIds } = req.body;
  console.log('Received request for selected counts:', { agentIds, smartListIds });
  try {
    const countsData = await getAgentSmartListCounts(agentIds, smartListIds);
    console.log('Returning counts data:', countsData);

    const currentDate = new Date();
    const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(currentDate.setHours(23, 59, 59, 999));

    // Delete existing logs for the current date
    await DailyLog.deleteMany({ date: { $gte: startOfDay, $lte: endOfDay } });

    for (const [agentId, smartListCounts] of Object.entries(countsData.counts)) {
      const total = Object.values(smartListCounts).reduce((a, b) => a + b, 0);
      const logEntry = {
        date: new Date(),
        agentId,
        agentName: countsData.agentMap[agentId],
        smartListCounts: { ...smartListCounts },
        total,
      };
      await saveDailyLog(logEntry);
    }

    res.json(countsData);
  } catch (error) {
    console.error('Error in selected counts endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/save-selections', async (req, res) => {
  const { agentIds, smartListIds } = req.body;
  console.log('Saving selections:', { agentIds, smartListIds });
  try {
    await saveSelections(agentIds, smartListIds);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving selections:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/get-selections', async (req, res) => {
  try {
    const selections = await fetchSelections();
    console.log('Fetched selections:', selections);
    res.json(selections);
  } catch (error) {
    console.error('Error fetching selections:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const agents = await fetchAgents();
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/smartlists', async (req, res) => {
  try {
    const smartLists = await fetchSmartLists();
    res.json(smartLists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/logs', async (req, res) => {
  try {
    const logs = await fetchDailyLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/daily-logs', async (req, res) => {
  try {
    const dailyLogs = await fetchDailyLogs();
    res.json(dailyLogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/daily-rankings', async (req, res) => {
  try {
    const rankings = await getDailyRankings();
    res.json(rankings);
  } catch (error) {
    console.error('Error in /api/daily-rankings route:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/daily-logs', async (req, res) => {
  try {
    await DailyLog.deleteMany({});
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use('/api/agent-logs', agentLogsRoutes); // Use the agentLogs routes
app.use('/api', columnOrderRoutes); // Use the columnOrder routes

schedule.scheduleJob('0 4 * * *', async () => {
  try {
    const { agentIds, smartListIds } = await fetchSelections();
    const countsData = await getAgentSmartListCounts(agentIds, smartListIds);

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    await DailyLog.deleteMany({ date: { $gte: currentDate } });

    for (const [agentId, smartListCounts] of Object.entries(countsData.counts)) {
      const total = Object.values(smartListCounts).reduce((a, b) => a + b, 0);
      const logEntry = {
        date: currentDate,
        agentId,
        agentName: countsData.agentMap[agentId],
        smartListCounts: { ...smartListCounts },
        total,
      };
      await saveDailyLog(logEntry);
    }
    console.log('Daily log update completed at 4:00 AM');
  } catch (error) {
    console.error('Error during daily log update:', error);
  }
});

app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
