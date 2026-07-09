const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// In-memory database for scan history (persistent for server lifetime)
let scanHistory = [];

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Retrieve all scans
app.get('/api/history', (req, res) => {
  res.json({
    success: true,
    data: scanHistory
  });
});

// Log a new scan result
app.post('/api/history', (req, res) => {
  try {
    const { numbers, gaps, totalGap, expectedLast, isCorrect, timestamp } = req.body;

    // Validate request
    if (!Array.isArray(numbers) || numbers.length !== 4) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input. "numbers" must be an array of 4 elements.'
      });
    }

    const newScan = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      numbers,
      gaps,
      totalGap,
      expectedLast,
      isCorrect,
      timestamp: timestamp || new Date().toISOString()
    };

    // Keep history bounded to last 50 entries to prevent memory growth
    scanHistory.unshift(newScan);
    if (scanHistory.length > 50) {
      scanHistory = scanHistory.slice(0, 50);
    }

    res.status(201).json({
      success: true,
      data: newScan
    });
  } catch (error) {
    console.error('Error logging scan:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while saving scan.'
    });
  }
});

// Clear scan history
app.delete('/api/history', (req, res) => {
  scanHistory = [];
  res.json({
    success: true,
    message: 'Scan history cleared.'
  });
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
