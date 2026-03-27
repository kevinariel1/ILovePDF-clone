I vibecoded this.

-----------------------------------------------------------------------------
Fullstack
- Frontend (React) packs files into a FormData object.

- Network (HTTP) carries that binary data to port 5000.

- Backend (Node) saves the files to the /uploads folder.

- System (Child Process) hands the file paths to a Python script.

- Python reads the binary, merges it, and writes a new file.

- Response sends that final file back across the "bridge" to your browser.


-----------------------------------------------------------------------------

Node.js acts as the Orchestrator (Traffic Control).

Python acts as the Processor (The Heavy Lifting).
