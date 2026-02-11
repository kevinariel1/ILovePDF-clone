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
    try {
        const rotations = req.body.rotations ? JSON.parse(req.body.rotations) : [];
        const files = req.files.map((file, index) => `${file.path}:${rotations[index] || 0}`);
        const outputPath = `uploads/merged-${Date.now()}.pdf`;

        const pythonProcess = spawn('python', ['../python_services/merge.py', ...files, outputPath]);

        let pythonError = "";
        pythonProcess.stderr.on('data', (data) => {
            pythonError += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                // Return here so the function ends
                return res.download(outputPath, (err) => {
                    // Cleanup
                    req.files.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                });
            } else {
                console.error("Python Logic Error:", pythonError);
                // Only send error if we haven't already
                if (!res.headersSent) {
                    return res.status(500).send("Merging failed.");
                }
            }
        });
    } catch (err) {
        console.error("Server Error:", err);
        if (!res.headersSent) return res.status(500).send("Server error.");
    }
});

app.post('/get-thumbnail', upload.single('pdf'), (req, res) => {
    const pythonProcess = spawn('python', ['../python_services/thumbnail.py', req.file.path]);
    
    let imageData = "";
    pythonProcess.stdout.on('data', (data) => {
        imageData += data.toString();
    });

    pythonProcess.on('close', () => {
        res.json({ thumbnail: imageData.trim() });
    });
});


app.listen(5000, () => console.log("Server running on port 5000"));