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

    // Fetch all logs for the latest date using aggregation
    const logs = await DailyLog.aggregate([
      {
        $match: {
          date: { $gte: latestDate, $lt: nextDate },
        },
      },
      {
        $project: {
          agentId: 1,
          agentName: 1,
          total: { $sum: { $objectToArray: '$smartListCounts.v' } },
        },
      },
      {
        $group: {
          _id: '$agentId',
          agentName: { $first: '$agentName' },
          total: { $sum: '$total' },
        },
      },
      {
        $sort: { total: 1 }, // Sort by ascending order for best agents
      },
      {
        $project: {
          _id: 0,
          agentId: '$_id',
          agentName: 1,
          total: 1,
        },
      },
    ]);

    console.log('Sorted agents:', logs);

    return res.json({
      bestAgents: logs.slice(0, 5), // Lowest scores are best
      worstAgents: logs.slice(-5).reverse(), // Highest scores are worst
    });
  } catch (error) {
    console.error('Error fetching daily rankings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
