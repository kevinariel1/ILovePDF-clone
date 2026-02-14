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

app.post("/get-all-thumbnails", upload.single("pdf"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const pythonProcess = spawn("python", [
    "../python_services/all_thumbnails.py",
    req.file.path,
  ]);

  let result = "";

  pythonProcess.stdout.on("data", (data) => {
    result += data.toString(); // Collect all chunks
  });

  pythonProcess.on("close", (code) => {
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

app.post('/split', upload.single('pdf'), (req, res) => {
    const { split_config, is_fused } = req.body; // Add is_fused here
    const outputDir = path.join(__dirname, 'temp_splits');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    const scriptPath = path.resolve(__dirname, '../python_services/split_logic.py');
    // Pass 4 arguments now
    const pythonProcess = spawn('python', [scriptPath, req.file.path, outputDir, split_config, is_fused]);

    let result = "";
    pythonProcess.stdout.on('data', (data) => result += data.toString());
    pythonProcess.stderr.on('data', (data) => console.error(`Python Stderr: ${data}`));

    pythonProcess.on('close', (code) => {
        try {
            const data = JSON.parse(result);
            if (data.error) throw new Error(data.error);

            // Important: Set the correct Content-Type so the browser knows what it is
            const contentType = data.type === 'zip' ? 'application/zip' : 'application/pdf';
            res.setHeader('Content-Type', contentType);
            
            res.download(data.path, (err) => {
                // Cleanup after a short delay to ensure the file is sent
                setTimeout(() => {
                    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                    // Only delete outputDir if you're sure no other processes are using it
                }, 1000);
            });
        } catch (e) {
            console.error("Split Logic Error:", e.message, "Raw Result:", result);
            res.status(500).json({ error: "Split failed" });
        }
    });
});

app.listen(5000, () => console.log("Server running on port 5000"));
