function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

async function loadResults() {
  try {
    // Fetch only the session chosen by the timer page
    const sessionId = localStorage.getItem('currentResultsSession') ||
    localStorage.getItem('sessionId') || ''; const url = sessionId ? `/results?sessionId=${sessionId}` : '/results';

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch results');
    const data = await res.json();


    const div = document.getElementById('results');
    div.innerHTML = '';

    data.forEach((r, i) => {
      const p = document.createElement('p');
      const formatted = formatDuration(r.finish_time);
      p.textContent = `#${i + 1} - Runner ${r.runnerId}: ${formatted}`;
      div.appendChild(p);
    });

    // Enable CSV download
    document.getElementById('downloadCSV').addEventListener('click', () => {
      const csvContent = 'data:text/csv;charset=utf-8,' +
      ['Position,Runner ID,Finish Time']
        .concat(data.map((r, i) => `${i + 1},${r.runnerId},${formatDuration(r.finish_time)}`))
        .join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'race_results.csv');

      // Append to DOM, click, and remove link after download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  } catch (error) {
    console.error('Error loading results:', error);
  }
}

loadResults();
