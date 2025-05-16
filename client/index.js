let timerStart = null;
let results = [];

const el = {};

// --- localStorage keys grouped in one place ------------
const LS = {
  RESULTS: 'raceResults', // pending batch
  NEXT_ID: 'nextRunnerId', // runner counter
  SESSION: 'sessionId', // current race id
  START: 'timerStart', // start time ms
};


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
  sessionId = String(Date.now()); // fresh id
  results = [];

  localStorage.setItem(LS.SESSION, sessionId);
  localStorage.setItem(LS.START, String(timerStart));
  resetIds(); // ids + pending batch cleared

  el.timerParagraph.textContent = 'Race started!';
}

// Function to record finish time and store it in local storage
function recordFinish() {
  if (!timerStart) return alert('Start the race first');
  const finishTime = Date.now() - timerStart;

  const runnerId = nextId();

  results.push({ runnerId, finish_time: finishTime });
  el.timerParagraph.textContent =
    `Runner ${runnerId} finished at ${formatTime(finishTime)}`;
  localStorage.setItem('raceResults', JSON.stringify(results));

  console.log('nextRunnerId =', localStorage.getItem(LS.NEXT_ID));
}


async function uploadResults() {
  const stored = JSON.parse(localStorage.getItem('raceResults') || '[]');
  const currentSession = localStorage.getItem('sessionId');

  if (stored.length === 0 || !currentSession) {
    return alert('No results or session to upload');
  }

  try {
    const res = await fetch('/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        results: stored,
        sessionId: currentSession,
      }),
    });

    if (res.ok) {
      alert('Results uploaded');
      localStorage.removeItem(LS.RESULTS); // clear just-uploaded batch
      results = [];
    } else {
      alert('Upload failed');
    }
  } catch (err) {
    alert('Error uploading: ' + err.message);
  }

  localStorage.setItem('currentResultsSession', currentSession); // remember which session the spectator/results page should fetch
}


function nextId() {
  const current = Number(localStorage.getItem(LS.NEXT_ID) || '1');
  const next = current + 1;
  localStorage.setItem(LS.NEXT_ID, String(next)); // persist NEW value
  return current; // return the runner ID just used
}


function resetIds() {
  localStorage.setItem(LS.NEXT_ID, '1');
  localStorage.removeItem(LS.RESULTS);
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

  sessionId = localStorage.getItem(LS.SESSION) || String(Date.now());
  localStorage.setItem(LS.SESSION, sessionId);

  const stored = localStorage.getItem('raceResults');
  if (stored) results = JSON.parse(stored);
}

init();
