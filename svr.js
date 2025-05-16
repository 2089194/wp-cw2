import express from 'express';
import * as race from './race.js';
import fs from 'fs/promises';

const app = express();

// Handle incoming requests
app.use(express.json());

app.get('/results', async (req, res) => {
  try {
    const sessionId = req.query.sessionId;
    const data = sessionId
      ? await race.getResults(sessionId)
      : await race.getAllResults();
    res.json(data);
  } catch (err) {
    console.error('Error fetching results:', err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// API routes before static files
app.get('/export/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;

    console.log('Session ID:', sessionId); // Log the sessionId to ensure it's correct

    // Fetch results for the given sessionId
    const results = await race.getResults(sessionId);

    console.log('Fetched Results:', results); // Log the fetched results

    if (!results || results.length === 0) {
      return res.status(404).send('No results found for session: ' + sessionId);
    }

    // Create CSV content
    const csv = ['runnerId,finish_time,session_id'];
    results.forEach(r => {
      csv.push(`${r.runnerId},${r.finish_time},${r.session_id}`);
    });

    // Write to results.csv
    await fs.writeFile('./results.csv', csv.join('\n'), 'utf8');

    res.send('CSV file created successfully.');
  } catch (err) {
    console.error('Error exporting CSV:', err);
    res.status(500).send('Failed to export results.');
  }
});


app.post('/results', async (req, res) => {
  try {
    console.log('Received request body:', req.body); // Log the request for debugging

    const { results, sessionId } = req.body;

    if (!results || !Array.isArray(results) || !sessionId) {
      throw new Error('Invalid data structure');
    }

    await race.saveResults(results, sessionId); //Function handles the sessionId
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Error saving results:', err);
    res.status(500).json({ error: 'Failed to save results' });
  }
});


// Serve static files (HTML, CSS, JS) after API routes
app.use(express.static('client', { extensions: ['html'] }));

app.listen(8080, () => console.log('Server is running on http://localhost:8080'));
