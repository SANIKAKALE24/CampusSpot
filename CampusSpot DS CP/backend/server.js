const express = require('express');
const cors = require('cors');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = 3001;

app.post('/api/find-spaces', (req, res) => {
    // Increase limit if needed in express app config later, but usually default 100kb is enough for 100-200 entries.
    const inputData = req.body.query;
    const ttData = req.body.timetables;
    
    // Create temp files
    const tempInput = path.join(__dirname, 'temp_input.json');
    const tempTt = path.join(__dirname, 'temp_tt.json');
    
    fs.writeFileSync(tempInput, JSON.stringify(inputData || req.body));
    
    // If ttData is provided by frontend (which it should be), write it. 
    // Otherwise fallback to preloaded for safety.
    if (ttData && Array.isArray(ttData)) {
        fs.writeFileSync(tempTt, JSON.stringify(ttData));
    } else {
        const preloaded = fs.readFileSync(path.join(__dirname, '../public/data/preloaded_timetables.json'));
        fs.writeFileSync(tempTt, preloaded);
    }
    
    function getDsaExecutablePath() {
        const isWin = process.platform === "win32";
        const candidates = isWin
            ? ['campusspot_dsa.exe', 'campusspot.exe']
            : ['campusspot_dsa', 'campusspot'];
        
        for (const name of candidates) {
            const fullPath = path.join(__dirname, '../dsa', name);
            if (fs.existsSync(fullPath)) {
                return fullPath;
            }
        }
        return path.join(__dirname, '../dsa', candidates[0]);
    }

    const dsaExecutable = getDsaExecutablePath();
    const roomsJson = path.join(__dirname, '../public/data/rooms.json');
    
    execFile(dsaExecutable, [tempInput, roomsJson, tempTt], (error, stdout, stderr) => {
        if (error) {
            console.error("Execution error:", error);
            console.error("stderr:", stderr);
            return res.status(500).json({ error: "Failed to run DSA engine." });
        }
        
        try {
            const results = JSON.parse(stdout);
            res.json(results);
        } catch (e) {
            console.error("Parse error:", e);
            console.log("Raw output:", stdout);
            res.status(500).json({ error: "Failed to parse DSA output." });
        }
    });
});

app.get('/api/dsa-status', (req, res) => {
    function getDsaExecutablePath() {
        const isWin = process.platform === "win32";
        const candidates = isWin
            ? ['campusspot_dsa.exe', 'campusspot.exe']
            : ['campusspot_dsa', 'campusspot'];
        
        for (const name of candidates) {
            const fullPath = path.join(__dirname, '../dsa', name);
            if (fs.existsSync(fullPath)) {
                return fullPath;
            }
        }
        return path.join(__dirname, '../dsa', candidates[0]);
    }

    const dsaExecutable = getDsaExecutablePath();
    
    fs.access(dsaExecutable, fs.constants.F_OK, (err) => {
        if (err) {
            return res.json({ connected: false, path: dsaExecutable, error: "Executable not found" });
        }
        
        execFile(dsaExecutable, ['--test'], (error, stdout) => {
            if (error) {
                return res.json({ connected: false, path: dsaExecutable, error: error.message });
            }
            try {
                const result = JSON.parse(stdout);
                res.json({ connected: true, path: dsaExecutable, testOutput: result });
            } catch(e) {
                // if not json, just string
                res.json({ connected: true, path: dsaExecutable, testOutput: stdout });
            }
        });
    });
});

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});