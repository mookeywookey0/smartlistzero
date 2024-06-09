const express = require('express');
const router = express.Router();
const DailyLog = require('../models/DailyLog');

// GET /api/agent-logs/:agentId
router.get('/:agentId', async (req, res) => {
  const { agentId } = req.params;
  console.log(`Received request for agent logs: ${agentId}`);
  try {
    const agentLogs = await DailyLog.find({ agentId }).sort({ date: 1 });
    if (!agentLogs || agentLogs.length === 0) {
      console.log(`No logs found for agent: ${agentId}`);
      return res.status(404).json({ message: 'No logs found for this agent.' });
    }
    console.log(`Returning logs for agent: ${agentId}`, agentLogs);
    res.json({ logs: agentLogs, name: agentLogs[0].agentName });
  } catch (error) {
    console.error('Error fetching agent logs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
