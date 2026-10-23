const fetch = require('node-fetch');
const { analyzeSequence } = require('../lib/dragonx');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Support type parameter for 1M or 30S game
  const gameType = (req.query.type || '1M').toUpperCase();
  let apiUrl = 'https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json';
  
  if (gameType === '30S' || gameType === '30SEC') {
    const ts = Date.now();
    apiUrl = `https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json?ts=${ts}`;
  }

  try {
    // Fetch 120 items from official WinGo API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageSize: 120, pageNo: 1 })
    });

    const json = await response.json();
    if (!json || !json.data || !json.data.list || json.data.list.length === 0) {
      return res.status(400).json({ success: false, error: 'Failed to fetch WinGo history data.' });
    }

    const history = json.data.list; // Newest first
    const latestRound = history[0];

    // Calculate correct next live period number
    const lastPeriod = BigInt(latestRound.issueNumber);
    const nextPeriod = (lastPeriod + 1n).toString();

    // Prepare chronological sequence (oldest to newest) for DragonX 120 pattern analysis engine
    const chronologicalHistory = [...history].reverse();
    const sizeSequence = chronologicalHistory.map(item => {
      const num = parseInt(item.number, 10);
      return num >= 5 ? 'BIG' : 'SMALL';
    });
    const periodSequence = chronologicalHistory.map(item => item.issueNumber);

    // Run 120 pattern analysis engine
    const engineResult = analyzeSequence(sizeSequence, { periods: periodSequence });

    // Frequency analysis across 120 historical draws
    let bigCount = 0;
    let smallCount = 0;
    const numFreq = {};

    history.forEach(item => {
      const num = parseInt(item.number, 10);
      if (!isNaN(num)) {
        if (num >= 5) bigCount++;
        else smallCount++;
        numFreq[num] = (numFreq[num] || 0) + 1;
      }
    });

    // Determine predicted Size (BIG / SMALL)
    const predictedSize = bigCount >= smallCount ? 'BIG' : 'SMALL';

    // Determine predicted Number (0-9) based on size and historical frequency
    let predictedNumber;
    if (predictedSize === 'BIG') {
      const bigNumbers = [5, 6, 7, 8, 9];
      predictedNumber = bigNumbers.reduce((a, b) => (numFreq[a] || 0) >= (numFreq[b] || 0) ? a : b);
    } else {
      const smallNumbers = [0, 1, 2, 3, 4];
      predictedNumber = smallNumbers.reduce((a, b) => (numFreq[a] || 0) >= (numFreq[b] || 0) ? a : b);
    }

    // Determine predicted Color based on number
    let predictedColor;
    if (predictedNumber === 0) {
      predictedColor = 'RED + VIOLET';
    } else if (predictedNumber === 5) {
      predictedColor = 'GREEN + VIOLET';
    } else if ([1, 3, 7, 9].includes(predictedNumber)) {
      predictedColor = 'GREEN';
    } else {
      predictedColor = 'RED';
    }

    return res.status(200).json({
      success: true,
      game: gameType === '30S' || gameType === '30SEC' ? 'WinGo 30Sec' : 'WinGo 1Min',
      lastRound: {
        period: latestRound.issueNumber,
        number: latestRound.number,
        color: latestRound.color,
        price: latestRound.price
      },
      livePrediction: {
        targetPeriod: nextPeriod,
        size: predictedSize,        // BIG or SMALL
        color: predictedColor,      // GREEN, RED, or VIOLET
        number: predictedNumber,    // Predicted single digit
        patternAnalyzed: history.length
      },
      engineStats: {
        engine: engineResult.engine,
        version: engineResult.version,
        patternCount: engineResult.pattern_count,
        observationsAnalyzed: engineResult.observations
      }
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
