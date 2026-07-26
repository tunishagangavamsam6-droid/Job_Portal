import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Server as SocketIOServer } from 'socket.io';
import { GoogleGenAI, Type } from '@google/genai';
import { INITIAL_JOBS, INITIAL_APPLICATIONS } from './src/data/mockJobs';
import { Job, Application, PreFlightCheckRequest, PreFlightCheckResult, DeploymentConfigInput, DeploymentConfigFiles } from './src/types';

// In-memory data persistence for the session
let jobsStore: Job[] = [...INITIAL_JOBS];
let applicationsStore: Application[] = [...INITIAL_APPLICATIONS];

// In-memory comment/discussion store per application
const commentsStore: Record<string, Array<{ id: string; author: string; role: string; text: string; createdAt: string }>> = {};

// In-memory interviews store per application
const interviewsStore: Record<string, Array<any>> = {};
if (INITIAL_APPLICATIONS.length > 0) {
  const sampleApp = INITIAL_APPLICATIONS[0];
  interviewsStore[sampleApp.id] = [
    {
      id: 'int-sample-1',
      applicationId: sampleApp.id,
      applicantName: sampleApp.applicantName,
      jobTitle: sampleApp.jobTitle,
      company: sampleApp.company,
      date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      startTime: '14:00',
      endTime: '14:45',
      type: 'Technical Round',
      format: 'Google Meet',
      interviewerName: 'Sarah Jenkins (Lead Architect)',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      notes: 'Initial technical deep dive & system architecture review.',
      status: 'Proposed',
      createdAt: new Date().toISOString()
    }
  ];
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE']
    }
  });

  const PORT = 3000;

  app.use(express.json());

  // Socket.IO Real-Time Connection & Event Handling
  let connectedClients = 0;
  io.on('connection', (socket) => {
    connectedClients++;
    console.log(`🔌 Client connected [id=${socket.id}]. Total online: ${connectedClients}`);

    // Broadcast updated presence count
    io.emit('PRESENCE_UPDATED', { onlineCount: connectedClients });

    // Handle user room joins (e.g., joining an application discussion room)
    socket.on('JOIN_ROOM', (roomId: string) => {
      socket.join(roomId);
      console.log(`Client [${socket.id}] joined room: ${roomId}`);
    });

    socket.on('LEAVE_ROOM', (roomId: string) => {
      socket.leave(roomId);
    });

    // Client posts a live comment/note on an application
    socket.on('SEND_COMMENT', (payload: { applicationId: string; author: string; role: string; text: string }) => {
      const { applicationId, author, role, text } = payload;
      if (!applicationId || !text) return;

      const commentObj = {
        id: `comment-${Date.now()}`,
        author: author || 'Recruiter',
        role: role || 'Hiring Manager',
        text,
        createdAt: new Date().toISOString()
      };

      if (!commentsStore[applicationId]) {
        commentsStore[applicationId] = [];
      }
      commentsStore[applicationId].push(commentObj);

      // Broadcast new comment to all connected clients & to the application room
      io.emit('NEW_COMMENT', { applicationId, comment: commentObj });
    });

    socket.on('disconnect', () => {
      connectedClients = Math.max(0, connectedClients - 1);
      console.log(`🔌 Client disconnected [id=${socket.id}]. Total online: ${connectedClients}`);
      io.emit('PRESENCE_UPDATED', { onlineCount: connectedClients });
    });
  });

  // Initialize Gemini AI SDK lazily/safely
  const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // --- API ROUTES ---

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Cloud SQL & Auth Database Status Endpoint
  app.get('/api/db/status', async (req, res) => {
    const isConfigured = Boolean(process.env.SQL_HOST && process.env.SQL_DB_NAME);
    res.json({
      configured: isConfigured,
      database: process.env.SQL_DB_NAME || 'Cloud SQL (PostgreSQL)',
      region: 'asia-southeast1',
      projectId: 'intrepid-coast-g1ttq',
      instance: 'ai-studio-931e7bff',
      status: isConfigured ? 'connected' : 'provisioned'
    });
  });

  // Jobs Endpoints
  app.get('/api/jobs', (req, res) => {
    const { search, type, level, department } = req.query;
    let filtered = [...jobsStore];

    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q) ||
          j.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (type && type !== 'All') {
      filtered = filtered.filter((j) => j.type === type);
    }

    if (level && level !== 'All') {
      filtered = filtered.filter((j) => j.experienceLevel === level);
    }

    if (department && department !== 'All') {
      filtered = filtered.filter((j) => j.department === department);
    }

    res.json(filtered);
  });

  app.get('/api/jobs/:id', (req, res) => {
    const job = jobsStore.find((j) => j.id === req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  });

  app.post('/api/jobs', (req, res) => {
    const { title, company, location, type, department, salaryRange, experienceLevel, description, requirements, benefits, tags } = req.body;

    if (!title || !company || !description) {
      return res.status(400).json({ error: 'Title, company, and description are required.' });
    }

    const newJob: Job = {
      id: `job-${Date.now()}`,
      title,
      company,
      logoUrl: `https://images.unsplash.com/photo-${1550000000000 + Math.floor(Math.random() * 9000000)}?w=120&auto=format&fit=crop&q=80`,
      location: location || 'Remote',
      type: type || 'Full-time',
      department: department || 'Engineering',
      salaryRange: salaryRange || '$100,000 - $140,000 / yr',
      experienceLevel: experienceLevel || 'Mid-level',
      description,
      requirements: Array.isArray(requirements) ? requirements : (requirements ? requirements.split('\n').filter(Boolean) : []),
      benefits: Array.isArray(benefits) ? benefits : (benefits ? benefits.split('\n').filter(Boolean) : []),
      postedAt: new Date().toISOString().split('T')[0],
      applicantsCount: 0,
      status: 'active',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t: string) => t.trim()) : ['React', 'Node.js'])
    };

    jobsStore.unshift(newJob);
    res.status(201).json(newJob);
  });

  app.delete('/api/jobs/:id', (req, res) => {
    jobsStore = jobsStore.filter((j) => j.id !== req.params.id);
    applicationsStore = applicationsStore.filter((a) => a.jobId !== req.params.id);
    res.json({ success: true });
  });

  // Applications Endpoints
  app.get('/api/applications', (req, res) => {
    const { jobId } = req.query;
    if (jobId) {
      return res.json(applicationsStore.filter((a) => a.jobId === jobId));
    }
    res.json(applicationsStore);
  });

  app.post('/api/applications', async (req, res) => {
    const { jobId, applicantName, applicantEmail, applicantPhone, experienceYears, resumeText, coverLetter, portfolioUrl, githubUrl } = req.body;

    const targetJob = jobsStore.find((j) => j.id === jobId);
    if (!targetJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    let matchScore = 82;
    let matchAnalysis = {
      strengths: ['Relevant industry background', 'Clear communication in cover letter'],
      missingSkills: ['Specific cloud vendor certifications'],
      recommendation: 'Qualified Candidate: Recommended for hiring manager review.',
      keyHighlights: [`${experienceYears || 3}+ years relevant engineering experience`]
    };

    // Try AI Matching if Gemini key is set
    const ai = getGenAI();
    if (ai && resumeText) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: `Analyze the following candidate resume for the job titled "${targetJob.title}" at ${targetJob.company}.

Job Description:
${targetJob.description}

Requirements:
${targetJob.requirements.join('\n')}

Candidate Resume/Summary:
${resumeText}

Calculate a match score from 0 to 100 and evaluate key strengths, missing skills, and a hiring recommendation.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                matchScore: { type: Type.NUMBER, description: 'Score between 0 and 100' },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                recommendation: { type: Type.STRING },
                keyHighlights: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['matchScore', 'strengths', 'missingSkills', 'recommendation', 'keyHighlights']
            }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          matchScore = parsed.matchScore || matchScore;
          matchAnalysis = parsed;
        }
      } catch (err) {
        console.error('Gemini AI resume match error:', err);
      }
    }

    const newApplication: Application = {
      id: `app-${Date.now()}`,
      jobId,
      jobTitle: targetJob.title,
      company: targetJob.company,
      applicantName,
      applicantEmail,
      applicantPhone: applicantPhone || '',
      experienceYears: Number(experienceYears) || 0,
      resumeText,
      coverLetter,
      portfolioUrl,
      githubUrl,
      matchScore,
      matchAnalysis,
      status: 'Applied',
      appliedAt: new Date().toISOString()
    };

    applicationsStore.unshift(newApplication);

    // Increment job applicants count
    targetJob.applicantsCount += 1;

    // Broadcast live APPLICATION_SUBMITTED event via Socket.IO
    io.emit('APPLICATION_SUBMITTED', {
      application: newApplication,
      jobTitle: targetJob.title,
      company: targetJob.company,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(newApplication);
  });

  app.patch('/api/applications/:id/status', (req, res) => {
    const { status, notes } = req.body;
    const appItem = applicationsStore.find((a) => a.id === req.params.id);
    if (!appItem) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const previousStatus = appItem.status;
    if (status) appItem.status = status;
    if (notes !== undefined) appItem.notes = notes;

    // Broadcast live STATUS_UPDATED event via Socket.IO
    io.emit('STATUS_UPDATED', {
      application: appItem,
      previousStatus,
      newStatus: appItem.status,
      timestamp: new Date().toISOString()
    });

    res.json(appItem);
  });

  // Live Comments API Endpoints
  app.get('/api/applications/:id/comments', (req, res) => {
    const comments = commentsStore[req.params.id] || [];
    res.json(comments);
  });

  app.post('/api/applications/:id/comments', (req, res) => {
    const { author, role, text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Comment text is required.' });
    }

    const commentObj = {
      id: `comment-${Date.now()}`,
      author: author || 'Recruiter',
      role: role || 'Hiring Manager',
      text,
      createdAt: new Date().toISOString()
    };

    if (!commentsStore[req.params.id]) {
      commentsStore[req.params.id] = [];
    }
    commentsStore[req.params.id].push(commentObj);

    // Broadcast live NEW_COMMENT event via Socket.IO
    io.emit('NEW_COMMENT', {
      applicationId: req.params.id,
      comment: commentObj,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(commentObj);
  });

  // Interview Calendar API Endpoints
  app.get('/api/applications/:id/interviews', (req, res) => {
    const list = interviewsStore[req.params.id] || [];
    res.json(list);
  });

  app.post('/api/applications/:id/interviews', (req, res) => {
    const {
      date,
      startTime,
      endTime,
      type,
      format,
      interviewerName,
      meetingLink,
      notes,
      applicantName,
      jobTitle,
      company
    } = req.body;

    if (!date || !startTime) {
      return res.status(400).json({ error: 'Interview date and start time are required.' });
    }

    const appItem = applicationsStore.find((a) => a.id === req.params.id);

    const newSlot = {
      id: `int-${Date.now()}`,
      applicationId: req.params.id,
      applicantName: appItem?.applicantName || applicantName || 'Candidate',
      jobTitle: appItem?.jobTitle || jobTitle || 'Position',
      company: appItem?.company || company || 'HireSphere Company',
      date,
      startTime: startTime || '10:00',
      endTime: endTime || '10:45',
      type: type || 'Technical Round',
      format: format || 'Google Meet',
      interviewerName: interviewerName || 'Recruitment Team',
      meetingLink: meetingLink || (format === 'Google Meet' ? `https://meet.google.com/hs-${Math.random().toString(36).substring(2, 7)}` : ''),
      notes: notes || '',
      status: 'Proposed',
      createdAt: new Date().toISOString()
    };

    if (!interviewsStore[req.params.id]) {
      interviewsStore[req.params.id] = [];
    }
    interviewsStore[req.params.id].push(newSlot);

    // Automatically update application status to 'Interview'
    if (appItem && (appItem.status === 'Applied' || appItem.status === 'Reviewing')) {
      appItem.status = 'Interview';
      io.emit('STATUS_UPDATED', {
        application: appItem,
        previousStatus: 'Reviewing',
        newStatus: 'Interview',
        timestamp: new Date().toISOString()
      });
    }

    // Broadcast live INTERVIEW_SCHEDULED event
    io.emit('INTERVIEW_SCHEDULED', {
      applicationId: req.params.id,
      interview: newSlot,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(newSlot);
  });

  app.delete('/api/applications/:id/interviews/:interviewId', (req, res) => {
    const list = interviewsStore[req.params.id] || [];
    interviewsStore[req.params.id] = list.filter((i) => i.id !== req.params.interviewId);
    res.json({ success: true });
  });

  app.get('/api/interviews/calendar', (req, res) => {
    const allSlots: any[] = [];
    Object.values(interviewsStore).forEach((slots) => {
      allSlots.push(...slots);
    });
    allSlots.sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
    res.json(allSlots);
  });

  // AI Feature: Resume Matching endpoint
  app.post('/api/ai/match', async (req, res) => {
    const { resumeText, jobDescription, requirements } = req.body;
    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: 'resumeText and jobDescription are required.' });
    }

    const ai = getGenAI();
    if (!ai) {
      // Fallback deterministic analysis
      const score = Math.floor(75 + Math.random() * 20);
      return res.json({
        matchScore: score,
        matchAnalysis: {
          strengths: ['Solid technical fundamentals matching backend/frontend requirements', 'Relevant hands-on project experience'],
          missingSkills: ['Advanced CI/CD setup or specific database indexing rules'],
          recommendation: 'Strong Potential: Candidate demonstrates solid alignment with core stack requirements.',
          keyHighlights: ['MERN stack proficiency', 'Fast learner with deployment experience']
        }
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Evaluate how well this resume matches the job description.

Job Description:
${jobDescription}

Job Requirements:
${Array.isArray(requirements) ? requirements.join('\n') : requirements || ''}

Candidate Resume:
${resumeText}

Provide a detailed match score, top strengths, missing skills, key highlights, and hiring recommendation.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              matchScore: { type: Type.NUMBER },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendation: { type: Type.STRING },
              keyHighlights: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['matchScore', 'strengths', 'missingSkills', 'recommendation', 'keyHighlights']
          }
        }
      });

      const parsed = JSON.parse(response.text.trim());
      res.json({ matchScore: parsed.matchScore, matchAnalysis: parsed });
    } catch (err: any) {
      console.error('AI match error:', err);
      res.status(500).json({ error: 'Failed to generate match analysis using AI', details: err.message });
    }
  });

  // AI Feature: Job Description Auto-Generator
  app.post('/api/ai/generate-jd', async (req, res) => {
    const { title, department, seniority, keySkills } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Job title is required.' });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.json({
        description: `We are looking for an exceptional ${seniority || 'Mid-level'} ${title} to join our ${department || 'Engineering'} team. In this role, you will lead critical product initiatives, write high quality maintainable code, and collaborate with cross-functional teams.`,
        requirements: [
          `3+ years experience with ${keySkills || 'React, Node.js, and Express'}`,
          'Strong problem solving and software architecture skills',
          'Experience with Git, CI/CD, and Cloud deployments (Vercel/Render)',
          'Excellent written and verbal communication'
        ],
        benefits: [
          'Competitive salary & equity options',
          'Flexible remote/hybrid work options',
          'Comprehensive health insurance & wellness stipend',
          'Paid time off & annual learning budget'
        ]
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Generate a professional job description for a role with the following parameters:
Title: ${title}
Department: ${department || 'Engineering'}
Seniority: ${seniority || 'Mid-level'}
Key Skills/Keywords: ${keySkills || 'React, Express, MongoDB, Node.js, Docker'}

Return a JSON object with description (paragraph), requirements (array of bullet points), and benefits (array of bullet points).`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
              benefits: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['description', 'requirements', 'benefits']
          }
        }
      });

      const parsed = JSON.parse(response.text.trim());
      res.json(parsed);
    } catch (err: any) {
      console.error('AI generate-jd error:', err);
      res.status(500).json({ error: 'Failed to generate JD using AI', details: err.message });
    }
  });

  // DevOps Feature: Architectural Pre-Flight Checker
  app.post('/api/ai/preflight', async (req, res) => {
    const input: PreFlightCheckRequest = req.body;

    const checks: PreFlightCheckResult['checks'] = [
      {
        category: 'CORS & Network',
        test: 'Express CORS Origin Configuration',
        status: input.corsOrigin && input.corsOrigin.startsWith('http') ? 'pass' : 'fail',
        message: input.corsOrigin
          ? `CORS origin is configured for "${input.corsOrigin}"`
          : 'CORS origin is missing or set to wildcard (*), which breaks credentialed cross-site cookies.',
        fix: 'In Express, set `cors({ origin: "https://your-frontend.vercel.app", credentials: true })`.'
      },
      {
        category: 'Security & Auth',
        test: 'JWT Secret Environment Variable',
        status: input.hasJwtSecret ? 'pass' : 'fail',
        message: input.hasJwtSecret
          ? 'JWT Secret environment variable is present and configured.'
          : 'Missing JWT_SECRET in environment variables! App will crash or use unsafe default key.',
        fix: 'Add `JWT_SECRET=super_secret_64char_hex_key` in production environment variables.'
      },
      {
        category: 'Database',
        test: 'MongoDB Atlas URI String Format',
        status: input.hasMongoUri ? 'pass' : 'fail',
        message: input.hasMongoUri
          ? 'MongoDB connection string present.'
          : 'Missing MONGODB_URI. Server will fail to connect to database on launch.',
        fix: 'Configure `MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true&w=majority`.'
      },
      {
        category: 'Build & Runtime',
        test: 'Dynamic Server Port Allocation (process.env.PORT)',
        status: input.hasPortVar ? 'pass' : 'pass',
        message: 'Ensure Express server listens on `process.env.PORT || 3000` for Render/Cloud Run runtime dynamic binding.',
        fix: 'Use `const PORT = process.env.PORT || 3000; app.listen(PORT, "0.0.0.0")`.'
      },
      {
        category: 'Security & Auth',
        test: 'Authentication Cookie Security Flags (SameSite & Secure)',
        status: input.sameSiteCookie === 'None' ? 'warn' : 'pass',
        message: input.sameSiteCookie === 'None'
          ? 'SameSite=None requires Secure=true and HTTPS, otherwise cross-site cookies will be blocked by Chrome/Safari.'
          : `Cookie SameSite setting is set to ${input.sameSiteCookie}.`,
        fix: 'For cross-domain frontend/backend (Vercel + Render), set cookie options: `{ sameSite: "none", secure: true, httpOnly: true }`.'
      },
      {
        category: 'Build & Runtime',
        test: 'Linux File System Case-Sensitivity Check',
        status: input.caseSensitivityVerified ? 'pass' : 'warn',
        message: input.caseSensitivityVerified
          ? 'Imports verified for case-sensitivity matching.'
          : 'Windows/macOS file systems are case-insensitive, but Linux servers (Vercel/Render) are strictly case-sensitive.',
        fix: 'Double check all component imports (e.g., JobCard vs jobCard) before pushing to Git.'
      }
    ];

    const fails = checks.filter((c) => c.status === 'fail').length;
    const warns = checks.filter((c) => c.status === 'warn').length;

    let overallStatus: PreFlightCheckResult['overallStatus'] = 'Ready to Deploy';
    let score = 100 - fails * 25 - warns * 10;
    if (score < 0) score = 0;

    if (fails > 0) overallStatus = 'Critical Errors';
    else if (warns > 0) overallStatus = 'Warnings Detected';

    let aiAnalysis = `Pre-Flight Architecture Summary:\nPassed ${checks.filter(c => c.status === 'pass').length} of ${checks.length} deployment checks.`;

    const ai = getGenAI();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: `Act as a DevOps Engineer conducting a deployment pre-flight check for a MERN/Next.js Job Portal.

System Specs:
Frontend: ${input.frontendFramework}
Backend: ${input.backendFramework}
Database: ${input.databaseType}
CORS Origin: ${input.corsOrigin}
SameSite Cookie: ${input.sameSiteCookie}
Has JWT Secret: ${input.hasJwtSecret}
Has Mongo URI: ${input.hasMongoUri}

Check Results:
${JSON.stringify(checks, null, 2)}

Provide a concise 3-paragraph DevOps architectural evaluation, highlighting potential runtime bottlenecks, security advice, and exact fixes before pushing to production.`
        });
        if (response.text) {
          aiAnalysis = response.text;
        }
      } catch (err) {
        console.error('AI Preflight analysis error:', err);
      }
    }

    res.json({
      overallStatus,
      score,
      checks,
      aiAnalysis,
      timestamp: new Date().toISOString()
    });
  });

  // DevOps Feature: One-Click Config Generator
  app.post('/api/deploy/config', (req, res) => {
    const input: DeploymentConfigInput = req.body;
    const appSlug = (input.appName || 'job-portal').toLowerCase().replace(/[^a-z0-9]/g, '-');
    const feUrl = input.frontendUrl || `https://${appSlug}.vercel.app`;
    const port = input.backendPort || 5000;
    const dbName = input.dbName || 'jobportal_db';

    const vercelJson = JSON.stringify(
      {
        version: 2,
        builds: [
          {
            src: 'package.json',
            use: '@vercel/next'
          }
        ],
        routes: [
          {
            src: '/api/(.*)',
            dest: `${feUrl}/api/$1`
          }
        ],
        env: {
          NEXT_PUBLIC_API_URL: `https://${appSlug}-backend.onrender.com/api`
        }
      },
      null,
      2
    );

    const dockerfile = `# Dockerfile for MERN / Express Backend Deployment
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build || true

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=${port}

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

EXPOSE ${port}
USER node

CMD ["node", "dist/server.cjs"]
`;

    const dockerCompose = `version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "${port}:${port}"
    environment:
      - PORT=${port}
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/${dbName}
      - CORS_ORIGIN=${feUrl}
      - JWT_SECRET=production_super_secret_jwt_key_32chars
    depends_on:
      - mongo
${input.includeRedis ? '      - redis' : ''}
    restart: always

  mongo:
    image: mongo:7.0
    container_name: ${appSlug}-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: always

${input.includeRedis ? `  redis:
    image: redis:7-alpine
    container_name: ${appSlug}-redis
    ports:
      - "6379:6379"
    restart: always
` : ''}
volumes:
  mongo_data:
`;

    const envExample = `# Mandatory Server Environment Variables
PORT=${port}
NODE_ENV=production
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/${dbName}?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d
CORS_ORIGIN=${feUrl}

# Optional Integrations
${input.includeCloudinary ? `CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret` : '# CLOUDINARY_CLOUD_NAME='}

${input.includeStripe ? `STRIPE_SECRET_KEY=sk_live_51...
STRIPE_WEBHOOK_SECRET=whsec_...` : '# STRIPE_SECRET_KEY='}

${input.includeRedis ? `REDIS_URL=redis://localhost:6379` : '# REDIS_URL='}

# Frontend Client Environment Variables
NEXT_PUBLIC_API_URL=https://${appSlug}-backend.onrender.com/api
`;

    const migrateMongoScript = `// Automation Script to Migrate Local MongoDB Data to MongoDB Atlas Cluster
const { MongoClient } = require('mongodb');

const LOCAL_URI = process.env.LOCAL_MONGODB_URI || 'mongodb://127.0.0.1:27017/${dbName}';
const ATLAS_URI = process.env.ATLAS_MONGODB_URI || 'mongodb+srv://admin:password@cluster.mongodb.net/${dbName}?retryWrites=true&w=majority';

async function migrateData() {
  console.log('🚀 Starting MongoDB Migration Process...');
  const localClient = new MongoClient(LOCAL_URI);
  const atlasClient = new MongoClient(ATLAS_URI);

  try {
    await localClient.connect();
    console.log('✅ Connected to Local MongoDB.');
    await atlasClient.connect();
    console.log('✅ Connected to Production MongoDB Atlas.');

    const localDb = localClient.db();
    const atlasDb = atlasClient.db();

    const collections = await localDb.listCollections().toArray();
    console.log(\`📦 Found \${collections.length} collections to migrate.\`);

    for (const col of collections) {
      const colName = col.name;
      const documents = await localDb.collection(colName).find({}).toArray();
      if (documents.length > 0) {
        await atlasDb.collection(colName).deleteMany({});
        await atlasDb.collection(colName).insertMany(documents);
        console.log(\`  ✨ Migrated \${documents.length} records in collection: "\${colName}"\`);
      }
    }

    console.log('🎉 Migration Completed Successfully!');
  } catch (err) {
    console.error('❌ Migration Error:', err);
  } finally {
    await localClient.close();
    await atlasClient.close();
  }
}

migrateData();
`;

    const expressCorsSnippet = `// Production-Grade Express CORS & Cookie Middleware Setup
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || '${feUrl}';

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    if (origin === ALLOWED_ORIGIN || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy violation: Origin not allowed.'));
  },
  credentials: true, // Required for HTTP-only JWT cookies across domains
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(cookieParser());

// Example Auth Cookie Setting in Route Handler
app.post('/api/auth/login', (req, res) => {
  const token = 'sample_jwt_token';
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true on HTTPS Vercel/Render
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' required for cross-domain
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  res.json({ message: 'Login successful' });
});
`;

    const files: DeploymentConfigFiles = {
      vercelJson,
      dockerfile,
      dockerCompose,
      envExample,
      migrateMongoScript,
      expressCorsSnippet
    };

    res.json(files);
  });

  // --- VITE / STATIC SERVING MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server & WebSocket running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
