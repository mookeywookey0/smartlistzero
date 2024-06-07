const axios = require('axios');
const fs = require('fs');
const path = require('path');
const DailyLog = require('./models/DailyLog'); // Adjust the path to point to backend/models

const API_KEY = process.env.API_KEY || 'fka_0cyR5R4QjdhZrrxOyUM6vTaixZMPbslhMl';
const SYSTEM_KEY = process.env.SYSTEM_KEY || 'db097b53be2b32bbb13870d36758d8df';

const headers = {
  'X-System': 'AS',
  'X-System-Key': SYSTEM_KEY,
};

const SELECTIONS_FILE = path.join(__dirname, 'selections.json');

const fetchAgents = async () => {
  try {
    let agents = {};
    let url = 'https://api.followupboss.com/v1/users?limit=100';
    let fetchMore = true;

    while (fetchMore) {
      const response = await axios.get(url, {
        headers,
        auth: { username: API_KEY, password: '' },
      });

      const users = response.data.users;

      if (users && users.length > 0) {
        users.forEach(user => {
          agents[user.id] = user.name;
        });
      }

      if (response.data._metadata && response.data._metadata.next) {
        url = response.data._metadata.next;
      } else {
        fetchMore = false;
      }
    }
    return Object.fromEntries(Object.entries(agents).sort(([, a], [, b]) => a.localeCompare(b)));
  } catch (error) {
    console.error(`Error fetching agents: ${error.message}`);
    throw error;
  }
};

const fetchSmartLists = async () => {
  try {
    const response = await axios.get('https://api.followupboss.com/v1/smartLists', {
      headers,
      auth: { username: API_KEY, password: '' },
      params: { limit: 100, fub2: true, all: true },
    });
    if (!response.data || !response.data.smartlists) {
      throw new Error('SmartLists data is missing');
    }
    const smartLists = response.data.smartlists.reduce((acc, list) => {
      acc[list.id] = list.name;
      return acc;
    }, {});
    return Object.fromEntries(Object.entries(smartLists).sort(([, a], [, b]) => a.localeCompare(b)));
  } catch (error) {
    console.error(`Error fetching smart lists: ${error.message}`);
    throw error;
  }
};

const fetchPeopleInSmartList = async (smartListId) => {
  try {
    const people = [];
    let url = 'https://api.followupboss.com/v1/people';
    const params = { limit: 100, smartListId: smartListId };
    while (url) {
      const response = await axios.get(url, {
        headers,
        params,
        auth: { username: API_KEY, password: '' },
      });
      people.push(...response.data.people);
      url = response.data._metadata.nextLink || null;
    }
    return people;
  } catch (error) {
    console.error(`Error fetching people in smart list: ${error.message}`);
    throw error;
  }
};

const getAgentSmartListCounts = async (agentIds, smartListIds) => {
  try {
    const agents = await fetchAgents();
    const smartLists = await fetchSmartLists();

    const agentSmartListCounts = {};

    for (const agentId of agentIds) {
      agentSmartListCounts[agentId] = {};
      for (const smartListId of smartListIds) {
        agentSmartListCounts[agentId][smartListId] = 0; // Initialize with 0
      }
    }

    for (const smartListId of smartListIds) {
      if (smartLists[smartListId]) {
        const people = await fetchPeopleInSmartList(smartListId);
        console.log(`People in smart list ${smartListId}:`, people.length);
        people.forEach((person) => {
          const agentId = person.assignedUserId;
          if (agentIds.includes(String(agentId))) {
            agentSmartListCounts[agentId][smartListId] += 1;
          }
        });
      }
    }

    console.log('Final counts:', agentSmartListCounts);

    return {
      counts: agentSmartListCounts,
      agentMap: agents,
      smartListMap: smartLists,
      date: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error in getAgentSmartListCounts: ${error.message}`);
    throw error;
  }
};

const saveDailyLog = async (logEntry) => {
  try {
    const newLog = new DailyLog({
      ...logEntry,
      smartListCounts: { ...logEntry.smartListCounts }, // Ensure it's a plain object
    });
    await newLog.save();
  } catch (error) {
    console.error(`Error saving daily log: ${error.message}`);
    throw error;
  }
};

const fetchDailyLogs = async () => {
  try {
    const logs = await DailyLog.find({}).sort({ date: -1 }).exec();
    return logs;
  } catch (error) {
    console.error(`Error fetching daily logs: ${error.message}`);
    throw error;
  }
};

const saveSelections = async (agentIds, smartListIds) => {
  try {
    const selections = { agentIds, smartListIds };
    fs.writeFileSync(SELECTIONS_FILE, JSON.stringify(selections, null, 2), 'utf-8');
    console.log('Selections saved:', selections);
  } catch (error) {
    console.error(`Error saving selections: ${error.message}`);
    throw error;
  }
};

const fetchSelections = async () => {
  try {
    if (fs.existsSync(SELECTIONS_FILE)) {
      const data = fs.readFileSync(SELECTIONS_FILE, 'utf-8');
      console.log('Fetched selections from file:', data);
      return JSON.parse(data);
    }
    return { agentIds: [], smartListIds: [] };
  } catch (error) {
    console.error(`Error fetching selections: ${error.message}`);
    throw error;
  }
};

const getDailyRankings = async () => {
  try {
    const latestLog = await DailyLog.findOne({}).sort({ date: -1 }); // Fetch the latest log entry
    if (!latestLog) {
      console.log('No logs found');
      return { bestAgents: [], worstAgents: [] };
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
          smartListCountsArray: { $objectToArray: '$smartListCounts' },
        },
      },
      {
        $unwind: '$smartListCountsArray',
      },
      {
        $group: {
          _id: '$agentId',
          agentName: { $first: '$agentName' },
          total: { $sum: '$smartListCountsArray.v' },
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

    return {
      bestAgents: logs.slice(0, 5), // Lowest scores are best
      worstAgents: logs.slice(-5).reverse(), // Highest scores are worst
    };
  } catch (error) {
    console.error(`Error fetching daily rankings: ${error.message}`);
    throw error;
  }
};


module.exports = {
  getAgentSmartListCounts,
  fetchAgents,
  fetchSmartLists,
  fetchDailyLogs,
  saveSelections,
  fetchSelections,
  saveDailyLog,
  getDailyRankings,
};