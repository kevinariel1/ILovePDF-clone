const fs = require("fs");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

// Setting up where to store uploaded files
const upload = multer({ dest: "uploads/" });

app.post("/merge", upload.array("pdfs"), (req, res) => {
  try {
    const rotations = req.body.rotations ? JSON.parse(req.body.rotations) : [];
    const files = req.files.map(
      (file, index) => `${file.path}:${rotations[index] || 0}`,
    );
    const outputPath = `uploads/merged-${Date.now()}.pdf`;

    const pythonProcess = spawn("python", [
      "../python_services/merge.py",
      ...files,
      outputPath,
    ]);

    let pythonError = "";
    pythonProcess.stderr.on("data", (data) => {
      pythonError += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        // Return here so the function ends
        return res.download(outputPath, (err) => {
          // Cleanup
          req.files.forEach((f) => {
            if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
          });
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

app.post("/get-thumbnail", upload.single("pdf"), (req, res) => {
  const pythonProcess = spawn("python", [
    "../python_services/thumbnail.py",
    req.file.path,
  ]);

  let imageData = "";
  pythonProcess.stdout.on("data", (data) => {
    imageData += data.toString();
  });

  pythonProcess.on("close", () => {
    res.json({ thumbnail: imageData.trim() });
  });
});

app.post('/get-all-thumbnails', upload.single('pdf'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const pythonProcess = spawn('python', ['../python_services/all_thumbnails.py', req.file.path]);
    
    let result = "";

    pythonProcess.stdout.on('data', (data) => {
        result += data.toString(); // Collect all chunks
    });

    pythonProcess.on('close', (code) => {
        try {
            // Now that the process is closed, result has the FULL string
            const parsedData = JSON.parse(result);
            
            if (parsedData.error) {
                return res.status(500).json({ error: parsedData.error });
            }

            res.json({ thumbnails: parsedData });
        } catch (e) {
            console.error("Parse Error! Check if Python is printing extra text.");
            res.status(500).json({ error: "Invalid JSON from Python" });
        }
    });
});

app.listen(5000, () => console.log("Server running on port 5000"));
