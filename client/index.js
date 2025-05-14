let timerStart = null;
let results = [];

const el = {};

// Function to format time in minutes and seconds
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}m ${secs}s`;
}

// Function to start the race, record the start time, and update the UI
let sessionId = Date.now(); // Use timestamp as session ID

function startRace() {
  timerStart = Date.now();
  results = [];
  localStorage.setItem('raceResults', JSON.stringify(results));

  // Use the session ID when saving results
  sessionId = Date.now(); // New session ID for each race session
  el.timerParagraph.textContent = 'Race started!';
}


// Function to record finish time and store it in local storage
function recordFinish() {
  if (!timerStart) return alert('Start the race first');
  const finishTime = Date.now() - timerStart;
  const runnerId = results.length + 1;
  results.push({ runnerId, finish_time: finishTime });
  el.timerParagraph.textContent = `Runner ${runnerId} finished at ${formatTime(finishTime)}`;
  localStorage.setItem('raceResults', JSON.stringify(results));
}

async function uploadResults() {
  const stored = JSON.parse(localStorage.getItem('raceResults') || '[]');
  if (stored.length === 0) return alert('No results to upload');

  try {
    const res = await fetch('/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results: stored, sessionId }), // Include session ID here
    });
    if (res.ok) {
      alert('Results uploaded');
      localStorage.removeItem('raceResults');
      results = [];
    } else {
      alert('Upload failed');
    }
  } catch (err) {
    alert('Error uploading: ' + err.message);
  }
}


// Initialize the app
function init() {
  el.timerParagraph = document.querySelector('#timerParagraph');
  el.startButton = document.querySelector('#startButton');
  el.finishButton = document.querySelector('#finishButton');
  el.uploadButton = document.querySelector('#uploadButton');

  el.startButton.addEventListener('click', startRace);
  el.finishButton.addEventListener('click', recordFinish);
  el.uploadButton.addEventListener('click', uploadResults);

  const stored = localStorage.getItem('raceResults');
  if (stored) results = JSON.parse(stored);
}

init();
