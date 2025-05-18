# Race Timer – by up2089194  

## Key features  
A web-based race timer app that times runners and lets spectators follow live results

## How to Use  
1. Download and extract .zip folder
2. run **npm install** 
3. run **npm run setup** 
4. run **npm start**

### Prepare / Share spectator link  
* **Where:** `index.html` -> **Prepare Race (share spectator link)** button  
* **What it does:**  
  * Allocates a fresh `sessionId` in `localStorage`.  
  * Builds a shareable URL of the form `/spectate.html?sessionId=…` and places it in a read-only input.  
  * Disables itself (prevents double-click mistakes) while enabling **Start Race**.  

### Start / Live timer  
* **Where:** **Start Race** button  
* **What it does:**  
  * Stores `timerStart` and `sessionId` in `localStorage`.  
  * Locks the Prepare/Start buttons and starts a `setInterval` that updates the **Race Time** banner every second.  
* **Spectator sync:** `spectate.html` allows for organizers to share a link to the spectator page which displays live race results.

### Record finish times
* **Where:** **Record Finish** button  
* **What it does:** Pushes `{runnerId, finish_time}` so the state survives any accidental reloads.  
* **Design note:** Runner IDs are generated locally by incrementing `nextRunnerId`. This guarantees stable bib positions even when batches are uploaded hours later.

### Batch / Live upload  
* **Where:** **Upload Results** button  
* **What it does:**  
  * Posts the current `raceResults` batch to `/results`.  
  * On success merges the batch into `lastUploadedResults` (used by the results page fallback) and clears the working copy.  

### Spectator view  
* **Where:** `spectate.html`
* **What it does:**  
  * Polls `/results?sessionId=…` (runner results) every 15s
  * Shows a real-time race clock that starts automatically when the organiser clicks **Start Race**.  
  * Stops and resets when the organiser clicks **End Race**.

### Results archive & CSV  
* **Where:** `results.html` (**View Results** button)  
* **What it does:**  
  * Allows organizers to view current runner results.  
  * Generates a .csv file with all racer results.

### Additional features  
* **End Race** is coloured red, shows a `confirm()` guard, and clears every key.  
* Buttons become `disabled` at the appropriate stage to guard against double taps and cold-weather fat-finger errors.  
* Large, full-width buttons.

## AI  

### Overall approach  
Used ChatGPT to address additional features and check to make sure code remain in line with coursework requirements

- **CSV download** | For a pure browser .csv download, ChatGPT suggested `data:text/csv;charset=utf-8,`

What *didn’t* work:  
* An attempt to auto-generate QR codes client-side relied on scripts and tools which violated delivery requirements, so the idea was abandoned, opted for standard URL instead.

Overall the AI accelerated repetitive tasks (.csv file generation, `storage` nuances) but every line was reviewed and often simplified to stay within the “no libraries” constraint.