/* ---------- state & helpers ---------- */
let timerStart = null;
let results = [];
let sessionId = null;

const el = {}; // cache DOM refs

const LS = {
  RESULTS: 'raceResults', // pending batch
  NEXT_ID: 'nextRunnerId', // runner counter
  SESSION: 'sessionId', // current race id
  START: 'timerStart', // start time (ms)
};

function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m ${s}s`;
}

function showSpectatorLink() {
  const url = `${location.origin}/spectate.html?sessionId=${sessionId}`;
  localStorage.setItem('currentResultsSession', sessionId);
  el.spectatorInput.value = url;
  el.linkBox.style.display = 'block';
}

function prepareRace() {
  // reserve a sessionId if none yet
  if (!localStorage.getItem(LS.SESSION)) {
    sessionId = String(Date.now());
    localStorage.setItem(LS.SESSION, sessionId);
  } else {
    sessionId = localStorage.getItem(LS.SESSION);
  }
  showSpectatorLink();
}

function startRace() {
  timerStart = Date.now();
  sessionId = localStorage.getItem(LS.SESSION) || String(Date.now());
  results = [];

  localStorage.setItem(LS.SESSION, sessionId);
  localStorage.setItem(LS.START, String(timerStart));
  resetIds();

  el.timer.textContent = 'Race started!';
  showSpectatorLink(); // make sure link visible even if prepare skipped
}

function recordFinish() {
  if (!timerStart) return alert('Start the race first');
  const finishTime = Date.now() - timerStart;
  const runnerId = nextId();

  results.push({ runnerId, finish_time: finishTime });
  el.timer.textContent = `Runner ${runnerId} finished at ${formatTime(finishTime)}`;
  localStorage.setItem(LS.RESULTS, JSON.stringify(results));
}

async function uploadResults() {
  const batch = JSON.parse(localStorage.getItem(LS.RESULTS) || '[]');
  const currentSession = localStorage.getItem(LS.SESSION);
  if (batch.length === 0) return alert('No results to upload');

  try {
    const res = await fetch('/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results: batch, sessionId: currentSession }),
    });

    if (res.ok) {
      alert('Results uploaded');
      localStorage.removeItem(LS.RESULTS); // clear just-uploaded batch
      results = [];
    } else { alert('Upload failed'); }
  } catch (e) { alert('Error: ' + e.message); }
}

function nextId() {
  const cur = Number(localStorage.getItem(LS.NEXT_ID) || '1');
  localStorage.setItem(LS.NEXT_ID, String(cur + 1));
  return cur;
}

function endRace() {
  // clear session so a new Prepare will get a fresh id
  localStorage.removeItem(LS.SESSION);
  localStorage.removeItem('currentResultsSession');
  resetIds(); // clear runner counter + pending batch
  results = [];
  sessionId = null;

  el.timer.textContent = 'Race ended. Click "Prepare Race" for a new race.';
  el.linkBox.style.display = 'none'; // hide old link
}


function resetIds() {
  localStorage.setItem(LS.NEXT_ID, '1');
  localStorage.removeItem(LS.RESULTS);
}

function init() {
  el.timer = document.getElementById('timerParagraph');
  el.prepareBtn = document.getElementById('prepareButton');
  el.startBtn = document.getElementById('startButton');
  el.finishBtn = document.getElementById('finishButton');
  el.uploadBtn = document.getElementById('uploadButton');
  el.copyLinkBtn = document.getElementById('copySpectatorLink');
  el.spectatorInput = document.getElementById('spectatorLink');
  el.linkBox = document.getElementById('linkBox');

  // attach events
  el.prepareBtn.addEventListener('click', prepareRace);
  el.startBtn.addEventListener('click', startRace);
  el.finishBtn.addEventListener('click', recordFinish);
  el.uploadBtn.addEventListener('click', uploadResults);
  el.endBtn = document.getElementById('endButton');
  el.endBtn.addEventListener('click', endRace);


  el.copyLinkBtn.addEventListener('click', () => {
    const url = el.spectatorInput.value;
    navigator.clipboard.writeText(url)
      .then(() => alert('Spectator link copied!'))
      .catch(err => alert('Copy failed: ' + err));
  });

  /* restore any in-progress race */
  sessionId = localStorage.getItem(LS.SESSION);
  if (sessionId) showSpectatorLink();

  const stored = localStorage.getItem(LS.RESULTS);
  if (stored) results = JSON.parse(stored);
}
init();
