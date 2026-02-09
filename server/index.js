const fs = require('fs');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
app.use(cors({
  origin: 'http://localhost:5173'
}));

// Setting up where to store uploaded files
const upload = multer({ dest: 'uploads/' });

app.post('/merge', upload.array('pdfs'), (req, res) => {
    const files = req.files.map(f => f.path);
    const outputPath = `uploads/merged-${Date.now()}.pdf`;

    const pythonProcess = spawn('python', [
        '../python_services/merge.py', 
        ...files, 
        outputPath
    ]);

    pythonProcess.on('close', (code) => {
        if (code === 0) {
            // 2. We use the callback function inside res.download
            res.download(outputPath, (err) => {
                if (err) {
                    console.error("Download error:", err);
                }

                // 3. CLEANUP: This runs AFTER the download finishes or fails
                console.log("Cleaning up files...");
                
                // Delete original uploaded parts
                files.forEach(filePath => {
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                });

                // Delete the final merged result
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                
                console.log("Cleanup complete! Disk is clean.");
            });
        } else {
            res.status(500).send("Merging failed.");
        }
    });
});

app.listen(5000, () => console.log("Server running on port 5000"));