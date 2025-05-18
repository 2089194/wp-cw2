let timerStart = null;
let results = [];
let sessionId = null;

const el = {}; // cache DOM refs

const LS = {
  RESULTS: 'raceResults', // pending batch
  NEXT_ID: 'nextRunnerId', // runner counter
  SESSION: 'sessionId', // current race id
  START: 'timerStart', // start time (ms)
  LAST_RESULTS: 'lastUploadedResults', // persisting results unitl new race start

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
  // starting a brand-new race will discard previous race’s persisted list
  localStorage.removeItem(LS.LAST_RESULTS);


  sessionId = localStorage.getItem(LS.SESSION) || String(Date.now());
  results = [];

  localStorage.setItem(LS.SESSION, sessionId);
  localStorage.setItem(LS.START, String(timerStart));
  resetIds();

  el.timer.textContent = 'Race started!';
  showSpectatorLink(); // make sure link visible even if prepare skipped

  el.startBtn.disabled = true; // prevent restarting race timer
  el.startBtn.title = 'Race already started';

  el.prepareBtn.disabled = true; // lock prepare once race has started
  el.prepareBtn.title = 'Race already started';

  el.finishBtn.disabled = false;
  el.uploadBtn.disabled = false;
  el.endBtn.disabled = false;
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

      // persists full race so far
      const prev = JSON.parse(localStorage.getItem(LS.LAST_RESULTS) || '[]');
      const merged = prev.concat(batch) // append this batch
        .sort((a, b) => a.finish_time - b.finish_time); // keep chronological
      localStorage.setItem(LS.LAST_RESULTS, JSON.stringify(merged));

      localStorage.removeItem(LS.RESULTS); // clear just-uploaded batch
      results = [];
    } else {
      alert('Upload failed');
    }
  } catch (e) {
    alert('Error: ' + e.message);
  }
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

  el.startBtn.disabled = false; // re-enable for next race
  el.startBtn.title = '';

  el.prepareBtn.disabled = false; // allow preparing again
  el.prepareBtn.title = '';

  el.finishBtn.disabled = true;
  el.uploadBtn.disabled = true;
  el.endBtn.disabled = true;
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
  el.endBtn = document.getElementById('endButton');
  el.copyLinkBtn = document.getElementById('copySpectatorLink');
  el.spectatorInput = document.getElementById('spectatorLink');
  el.linkBox = document.getElementById('linkBox');

  // attach events
  el.prepareBtn.addEventListener('click', prepareRace);
  el.startBtn.addEventListener('click', startRace);
  el.finishBtn.addEventListener('click', recordFinish);
  el.uploadBtn.addEventListener('click', uploadResults);
  el.endBtn.addEventListener('click', () => {
    const confirmed = confirm(
      'Are you sure you want to end the race?\n\nThis will disable recording and require starting a new session.',
    );
    if (confirmed) {
      endRace();
    }
  });

  el.copyLinkBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(el.spectatorInput.value)
      .then(() => alert('Spectator link copied!'))
      .catch(err => alert('Copy failed: ' + err));
  });

  // restore state from localStorage
  sessionId = localStorage.getItem(LS.SESSION);
  const startRaw = localStorage.getItem(LS.START);
  const hasSession = !!sessionId;
  const hasStart = !!startRaw && !isNaN(Number(startRaw));

  const raceIsRunning = hasSession && hasStart;


  if (raceIsRunning) {
    showSpectatorLink();

    el.startBtn.disabled = true;
    el.startBtn.title = 'Race already started';
    el.prepareBtn.disabled = true;
    el.prepareBtn.title = 'Race already started';

    el.finishBtn.disabled = false;
    el.uploadBtn.disabled = false;
    el.endBtn.disabled = false;
  } else {
    // Clean up any broken or half-finished state
    localStorage.removeItem(LS.START);

    if (hasSession && !hasStart) {
      localStorage.removeItem(LS.SESSION);
      sessionId = null;
    }

    el.startBtn.disabled = false;
    el.startBtn.title = '';
    el.prepareBtn.disabled = false;
    el.prepareBtn.title = '';

    el.finishBtn.disabled = true;
    el.uploadBtn.disabled = true;
    el.endBtn.disabled = true;

    el.linkBox.style.display = 'none'; // hide link if any
  }

  const stored = localStorage.getItem(LS.RESULTS);
  if (stored) results = JSON.parse(stored);
}

init();
