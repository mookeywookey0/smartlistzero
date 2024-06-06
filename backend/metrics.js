const express = require('express');
const router = express.Router();
const { fetchDailyLogs, fetchAgents, fetchSmartLists } = require('../fetchData');

// Endpoint to fetch metrics
router.get('/metrics', async (req, res) => {
  try {
    const agents = await fetchAgents();
    const smartLists = await fetchSmartLists();
    const dailyLogs = await fetchDailyLogs();
    
    // Transform data if necessary for frontend consumption
    const metrics = dailyLogs.map(log => ({
      date: log.date,
      callsMade: log.callsMade || 0, // Add more metrics as needed
      dealsClosed: log.dealsClosed || 0,
      conversionRate: log.conversionRate || 0,
    }));

    res.json({ metrics, agents, smartLists });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

module.exports = router;
