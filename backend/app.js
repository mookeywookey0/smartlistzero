const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const schedule = require('node-schedule');
const { getAgentSmartListCounts, fetchAgents, fetchSmartLists, fetchDailyLogs, saveSelections, fetchSelections, saveDailyLog, getDailyRankings } = require('./fetchData');
const DailyLog = require('./models/DailyLog'); // Correct path for DailyLog

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/slz-app';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(bodyParser.json());

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

    for (const [agentId, smartListCounts] of Object.entries(countsData.counts)) {
      const total = Object.values(smartListCounts).reduce((a, b) => a + b, 0);
      const logEntry = {
        date: new Date(),
        agentId,
        agentName: countsData.agentMap[agentId],
        smartListCounts: { ...smartListCounts }, // Ensure it's a plain object
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
  try {
    await saveSelections(agentIds, smartListIds);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/get-selections', async (req, res) => {
  try {
    const selections = await fetchSelections();
    res.json(selections);
  } catch (error) {
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
    res.status(500).json({ error: error.message });
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

schedule.scheduleJob('0 4 * * *', async () => {
  try {
    const { agentIds, smartListIds } = await fetchSelections();
    const countsData = await getAgentSmartListCounts(agentIds, smartListIds);

    for (const [agentId, smartListCounts] of Object.entries(countsData.counts)) {
      const total = Object.values(smartListCounts).reduce((a, b) => a + b, 0);
      const logEntry = {
        date: new Date(),
        agentId,
        agentName: countsData.agentMap[agentId],
        smartListCounts: { ...smartListCounts }, // Ensure it's a plain object
        total,
      };
      await saveDailyLog(logEntry);
    }
    console.log('Daily log update completed at 4:00 AM');
  } catch (error) {
    console.error('Error during daily log update:', error);
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/build')));

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
