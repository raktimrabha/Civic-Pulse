// backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// --- Simplified In-Memory Data Store ---
let dataStore = {
  issues: [
    { id: 'iss001', title: 'Pothole on Main St & 5th', description: 'Deep pothole causing traffic issues.', votes: 12 },
    { id: 'iss002', title: 'Streetlight Out on Elm Ave (Block 300)', description: 'Reported multiple times, still out.', votes: 5 },
    { id: 'iss003', title: 'Park Needs More Trash Cans', description: 'Riverside Park is overflowing on weekends.', votes: 25 },
    { id: 'iss004', title: 'Request for Speed Bumps on Oak St', description: 'Cars often speed near the school.', votes: 8 },
  ],
};
// Ensure votes exist
dataStore.issues.forEach(i => { i.votes = i.votes ?? 0; });

// --- Helper ---
const findIssue = (id) => dataStore.issues.find(i => i.id === id);

// --- API Endpoints ---
// Get all issues (initial load)
app.get('/api/issues', (req, res) => {
  console.log('GET /api/issues');
  res.json(dataStore.issues); // Send the current state of issues
});

// Vote on an issue
app.post('/api/issues/:id/vote', (req, res) => {
  const { voteType } = req.body; // 'up' or 'down'
  const issue = findIssue(req.params.id);
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  if (voteType !== 'up' && voteType !== 'down') return res.status(400).json({ message: 'Invalid vote type' });

  issue.votes += (voteType === 'up' ? 1 : -1);
  console.log(`Vote on issue ${issue.id}: ${voteType}, new score: ${issue.votes}`);

  // Broadcast the single updated issue to all clients
  io.emit('issueUpdate', { id: issue.id, votes: issue.votes });
  console.log(`Emitted issueUpdate for ${issue.id}`);

  res.status(200).json({ id: issue.id, votes: issue.votes });
});

// --- Socket.IO Connection Logic ---
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

// --- Start Server ---
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));
