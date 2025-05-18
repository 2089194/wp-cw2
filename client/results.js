const LS = {
  LAST: 'lastUploadedResults', // permanent copy of last race
  CURR: 'currentResultsSession',
  SESSION: 'sessionId',
};


function formatDuration(ms) {
  const tot = Math.floor(ms / 1000);
  const h = String(Math.floor(tot / 3600)).padStart(2, '0');
  const m = String(Math.floor((tot % 3600) / 60)).padStart(2, '0');
  const s = String(tot % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function render(data) {
  const box = document.getElementById('results');
  box.innerHTML = '';

  if (!data || data.length === 0) {
    box.textContent = 'No results available yet.';
    return;
  }

  data.forEach((r, i) => {
    const p = document.createElement('p');
    p.textContent = `#${i + 1} – Runner ${r.runnerId}: ${formatDuration(r.finish_time)}`;
    box.appendChild(p);
  });

  // CSV download
  document.getElementById('downloadCSV').onclick = () => {
    const csv = ['Position,Runner ID,Finish Time']
      .concat(data.map((r, i) =>
        `${i + 1},${r.runnerId},${formatDuration(r.finish_time)}`))
      .join('\n');

    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = 'race_results.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
}

async function loadResults() {
  const sessionId =
    localStorage.getItem(LS.CURR) ||
    localStorage.getItem(LS.SESSION);

  if (sessionId) {
    try {
      const res = await fetch(`/results?sessionId=${sessionId}`);
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        render(data);
        return;
      } else {
        throw new Error('No live results found');
      }
    } catch (e) {
      console.warn('Live fetch failed or empty, falling back to last results.', e);
    }
  }

  // Fallback to last uploaded race (if any)
  const last = localStorage.getItem(LS.LAST);
  if (last) {
    render(JSON.parse(last));
  } else {
    document.getElementById('results').textContent =
      'No race selected and no previous results found.';
  }
}

loadResults();
