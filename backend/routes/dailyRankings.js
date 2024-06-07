const express = require('express');
const router = express.Router();
const DailyLog = require('../models/DailyLog');

router.get('/daily-rankings', async (req, res) => {
  try {
    const latestLog = await DailyLog.findOne({}).sort({ date: -1 }); // Fetch the latest log entry
    if (!latestLog) {
      console.log('No logs found');
      return res.json({ bestAgents: [], worstAgents: [] });
    }

    const latestDate = new Date(latestLog.date);
    latestDate.setHours(0, 0, 0, 0);

    const nextDate = new Date(latestDate);
    nextDate.setDate(latestDate.getDate() + 1);

    // Fetch all logs for the latest date
    const logs = await DailyLog.find({ date: { $gte: latestDate, $lt: nextDate } });

    const agentMap = new Map();

    logs.forEach(log => {
      const total = Object.values(log.smartListCounts).reduce((sum, count) => sum + count, 0);
      const agentId = log.agentId;
      const agentName = log.agentName;
      if (!agentMap.has(agentId)) {
        agentMap.set(agentId, { agentId, agentName, total });
      } else {
        agentMap.get(agentId).total += total;
      }
    });

    const sortedAgents = Array.from(agentMap.values()).sort((a, b) => a.total - b.total); // Sort in ascending order

    console.log('Sorted agents:', sortedAgents);

    return res.json({
      bestAgents: sortedAgents.slice(0, 5),
      worstAgents: sortedAgents.slice(-5).reverse(),
    });
  } catch (error) {
    console.error('Error fetching daily rankings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
