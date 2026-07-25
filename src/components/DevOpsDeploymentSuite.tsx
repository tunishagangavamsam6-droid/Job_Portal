import React, { useState } from 'react';
import { Terminal, ShieldCheck, Download, Copy, Check, ExternalLink, RefreshCw, AlertCircle, Sparkles, Server, Database, Globe, Lock, Code2, Play } from 'lucide-react';
import { PreFlightCheckRequest, PreFlightCheckResult, DeploymentConfigInput, DeploymentConfigFiles } from '../types';

export const DevOpsDeploymentSuite: React.FC = () => {
  const [subTab, setSubTab] = useState<'guide' | 'generator' | 'preflight'>('guide');

  // Generator State
  const [genInput, setGenInput] = useState<DeploymentConfigInput>({
    appName: 'job-portal-mern',
    frontendUrl: 'https://job-portal-mern.vercel.app',
    backendPort: 5000,
    dbName: 'jobportal_db',
    includeCloudinary: true,
    includeStripe: true,
    includeRedis: false
  });

  const [generatedFiles, setGeneratedFiles] = useState<DeploymentConfigFiles | null>(null);
  const [activeFileKey, setActiveFileKey] = useState<keyof DeploymentConfigFiles>('vercelJson');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Pre-Flight Check Form state
  const [preflightInput, setPreflightInput] = useState<PreFlightCheckRequest>({
    frontendFramework: 'Next.js (App Router)',
    backendFramework: 'Node.js / Express',
    databaseType: 'MongoDB Atlas',
    authProvider: 'JWT / HttpOnly Cookie',
    corsOrigin: 'https://job-portal-mern.vercel.app',
    hasJwtSecret: true,
    hasMongoUri: true,
    hasPortVar: true,
    sameSiteCookie: 'None',
    caseSensitivityVerified: true
  });

  const [isScanning, setIsScanning] = useState(false);
  const [preflightResult, setPreflightResult] = useState<PreFlightCheckResult | null>(null);

  // Trigger Generator
  const handleGenerateConfigs = async () => {
    try {
      const res = await fetch('/api/deploy/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(genInput)
      });
      const data: DeploymentConfigFiles = await res.json();
      setGeneratedFiles(data);
    } catch (err) {
      console.error('Failed to generate deploy config', err);
    }
  };

  // Trigger Pre-Flight Scanner
  const handleRunPreflightScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/ai/preflight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preflightInput)
      });
      const data: PreFlightCheckResult = await res.json();
      setPreflightResult(data);
    } catch (err) {
      console.error('Failed to run preflight scan', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Initial auto-generation on tab view
  React.useEffect(() => {
    handleGenerateConfigs();
    handleRunPreflightScan();
  }, []);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-cyan-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30 mb-3">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Job Portal Management System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Job Portal Deployment & Setup Assistant
            </h1>
            <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
              Step-by-step production deployment guide, automated configuration file generator (`vercel.json`, `Dockerfile`, `docker-compose.yml`), and pre-flight architectural scan.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-xl border border-slate-700">
            <button
              onClick={() => setSubTab('guide')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                subTab === 'guide'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              Step-by-Step Guide
            </button>
            <button
              onClick={() => setSubTab('generator')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                subTab === 'generator'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              Config Generator
            </button>
            <button
              onClick={() => setSubTab('preflight')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                subTab === 'preflight'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              Pre-Flight Checker
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: STEP-BY-STEP DEPLOYMENT GUIDE */}
      {subTab === 'guide' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1: MongoDB Atlas */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">1. MongoDB Atlas Setup</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Create a free M0 cluster on MongoDB Atlas. Add a database user with readWrite privileges, allow IP access (`0.0.0.0/0`), and copy the connection string:
              </p>
              <div className="bg-slate-900 text-slate-200 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto">
                mongodb+srv://&lt;user&gt;:&lt;pass&gt;@cluster0.mongodb.net/jobportal_db?retryWrites=true&amp;w=majority
              </div>
            </div>

            {/* Step 2: Render/Railway Backend */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">2. Node/Express on Render</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect your GitHub repo to Render as a Web Service. Set Build Command: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">npm run build</code> and Start Command: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">npm start</code>.
              </p>
              <div className="bg-slate-900 text-slate-200 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto">
                PORT=5000&#10;MONGODB_URI=...&#10;CORS_ORIGIN=https://job-portal.vercel.app
              </div>
            </div>

            {/* Step 3: Vercel Frontend */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">3. Next.js on Vercel</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Import your Next.js frontend repo into Vercel. Set <code className="bg-slate-100 px-1 py-0.5 rounded text-cyan-700">NEXT_PUBLIC_API_URL</code> pointing to your deployed Render URL:
              </p>
              <div className="bg-slate-900 text-slate-200 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto">
                NEXT_PUBLIC_API_URL=https://job-portal-backend.onrender.com/api
              </div>
            </div>
          </div>

          {/* Deep-Dive CORS & Cookie Setup Instructions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-base border-b border-slate-100 pb-3">
              <Lock className="w-5 h-5 text-indigo-600" />
              <span>Cross-Domain CORS & Credentialed Cookies Strategy</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">Why Cross-Domain Requests Fail</h4>
                <p className="leading-relaxed">
                  When your Next.js app hosted on Vercel (<code className="bg-slate-100 px-1 font-mono text-slate-800">vercel.app</code>) calls your Express backend on Render (<code className="bg-slate-100 px-1 font-mono text-slate-800">onrender.com</code>), modern browsers enforce strict Same-Origin Rules.
                </p>
                <p className="leading-relaxed">
                  Wildcard origins (<code className="bg-slate-100 px-1 font-mono text-slate-800">*</code>) will block HTTP-only JWT cookies. You MUST specify exact origins and allow credentials.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">Production Express CORS Snippet</h4>
                <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] leading-relaxed relative group">
                  <pre>{`app.use(cors({
  origin: 'https://job-portal.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));`}</pre>
                  <button
                    onClick={() => handleCopyText(`app.use(cors({ origin: 'https://job-portal.vercel.app', credentials: true }));`, 'cors')}
                    className="absolute top-2 right-2 bg-slate-800 text-slate-300 hover:text-white p-1.5 rounded"
                  >
                    {copiedKey === 'cors' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ONE-CLICK CONFIGURATION FILE GENERATOR */}
      {subTab === 'generator' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Code2 className="w-5 h-5 text-cyan-600" />
              <span>Deployment Configuration Parameters</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">App Name Slug</label>
                <input
                  type="text"
                  value={genInput.appName}
                  onChange={(e) => setGenInput({ ...genInput, appName: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Frontend Domain (Vercel)</label>
                <input
                  type="text"
                  value={genInput.frontendUrl}
                  onChange={(e) => setGenInput({ ...genInput, frontendUrl: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Backend Port</label>
                <input
                  type="number"
                  value={genInput.backendPort}
                  onChange={(e) => setGenInput({ ...genInput, backendPort: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Database Name</label>
                <input
                  type="text"
                  value={genInput.dbName}
                  onChange={(e) => setGenInput({ ...genInput, dbName: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={genInput.includeCloudinary}
                  onChange={(e) => setGenInput({ ...genInput, includeCloudinary: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Include Cloudinary (Image Uploads)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={genInput.includeStripe}
                  onChange={(e) => setGenInput({ ...genInput, includeStripe: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Include Stripe (Payments)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={genInput.includeRedis}
                  onChange={(e) => setGenInput({ ...genInput, includeRedis: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span>Include Redis (Rate Limiting/Cache)</span>
              </label>

              <button
                onClick={handleGenerateConfigs}
                className="ml-auto bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-2xs"
              >
                Re-Generate Files
              </button>
            </div>
          </div>

          {/* Generated Files Viewer */}
          {generatedFiles && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
              {/* File Selector Tabs */}
              <div className="flex items-center bg-slate-950 px-4 py-2 border-b border-slate-800 overflow-x-auto space-x-2 text-xs">
                {[
                  { key: 'vercelJson', name: 'vercel.json' },
                  { key: 'dockerfile', name: 'Dockerfile' },
                  { key: 'dockerCompose', name: 'docker-compose.yml' },
                  { key: 'envExample', name: '.env.example' },
                  { key: 'migrateMongoScript', name: 'migrate-mongo.js' },
                  { key: 'expressCorsSnippet', name: 'cors-config.js' }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveFileKey(item.key as any)}
                    className={`px-3 py-1.5 rounded-lg font-mono font-medium transition-all ${
                      activeFileKey === item.key
                        ? 'bg-cyan-600 text-white font-bold shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>

              {/* Code Preview Header */}
              <div className="flex items-center justify-between px-6 py-3 bg-slate-900/90 border-b border-slate-800/80">
                <span className="font-mono text-xs text-cyan-400 font-bold">
                  {activeFileKey === 'vercelJson' && 'vercel.json (Frontend Deployment Config)'}
                  {activeFileKey === 'dockerfile' && 'Dockerfile (Backend Container Build)'}
                  {activeFileKey === 'dockerCompose' && 'docker-compose.yml (Local Orchestration)'}
                  {activeFileKey === 'envExample' && '.env.example (Environment Variables Matrix)'}
                  {activeFileKey === 'migrateMongoScript' && 'migrate-mongo.js (Automated Atlas Migration)'}
                  {activeFileKey === 'expressCorsSnippet' && 'cors-config.js (Production Express CORS & Cookies)'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyText(generatedFiles[activeFileKey], activeFileKey)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {copiedKey === activeFileKey ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Code
                      </>
                    )}
                  </button>

                  <button
                    onClick={() =>
                      handleDownloadFile(
                        activeFileKey === 'vercelJson'
                          ? 'vercel.json'
                          : activeFileKey === 'dockerfile'
                          ? 'Dockerfile'
                          : activeFileKey === 'dockerCompose'
                          ? 'docker-compose.yml'
                          : activeFileKey === 'envExample'
                          ? '.env.example'
                          : activeFileKey === 'migrateMongoScript'
                          ? 'migrate-mongo.js'
                          : 'cors-config.js',
                        generatedFiles[activeFileKey]
                      )
                    }
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              </div>

              {/* Code View Body */}
              <div className="p-6 overflow-x-auto max-h-[500px]">
                <pre className="font-mono text-xs text-emerald-400 leading-relaxed">
                  {generatedFiles[activeFileKey]}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: PRE-FLIGHT ARCHITECTURE ASSESSOR */}
      {subTab === 'preflight' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span>Interactive Pre-Flight Security & Architecture Audit</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify critical configuration parameters to prevent production deployment crashes and CORS cookie blocks.
                </p>
              </div>

              <button
                onClick={handleRunPreflightScan}
                disabled={isScanning}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              >
                {isScanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>Run Pre-Flight Audit</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Frontend Framework</label>
                <input
                  type="text"
                  value={preflightInput.frontendFramework}
                  onChange={(e) => setPreflightInput({ ...preflightInput, frontendFramework: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Backend Framework</label>
                <input
                  type="text"
                  value={preflightInput.backendFramework}
                  onChange={(e) => setPreflightInput({ ...preflightInput, backendFramework: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Configured CORS Origin</label>
                <input
                  type="text"
                  value={preflightInput.corsOrigin}
                  onChange={(e) => setPreflightInput({ ...preflightInput, corsOrigin: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">SameSite Cookie Policy</label>
                <select
                  value={preflightInput.sameSiteCookie}
                  onChange={(e) => setPreflightInput({ ...preflightInput, sameSiteCookie: e.target.value as any })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="None">None (Required for Vercel + Render cross-domain)</option>
                  <option value="Lax">Lax (Same domain only)</option>
                  <option value="Strict">Strict (Same origin only)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={preflightInput.hasJwtSecret}
                    onChange={(e) => setPreflightInput({ ...preflightInput, hasJwtSecret: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>JWT_SECRET Configured</span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={preflightInput.hasMongoUri}
                    onChange={(e) => setPreflightInput({ ...preflightInput, hasMongoUri: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  <span>MONGODB_URI String Set</span>
                </label>
              </div>
            </div>
          </div>

          {/* Audit Results */}
          {preflightResult && (
            <div className="space-y-6">
              {/* Score Banner */}
              <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-md flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider text-cyan-400 font-bold">Deployment Readiness Score</span>
                  <h3 className="text-3xl font-extrabold mt-1">{preflightResult.score} / 100</h3>
                  <p className="text-xs text-slate-300 mt-1">{preflightResult.overallStatus}</p>
                </div>

                <div
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase border ${
                    preflightResult.overallStatus === 'Ready to Deploy'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {preflightResult.overallStatus}
                </div>
              </div>

              {/* Checklist Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {preflightResult.checks.map((check, idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{check.category}</span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          check.status === 'pass'
                            ? 'bg-emerald-100 text-emerald-800'
                            : check.status === 'warn'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {check.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm">{check.test}</h4>
                    <p className="text-xs text-slate-600">{check.message}</p>

                    <div className="bg-slate-50 p-2.5 rounded border border-slate-100 text-[11px] text-indigo-900 font-medium">
                      <strong>Required Fix / Code:</strong> {check.fix}
                    </div>
                  </div>
                ))}
              </div>

              {/* Gemini AI Architectural Review */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-slate-100 rounded-2xl p-6 shadow-md space-y-3 border border-indigo-900/50">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Gemini AI DevOps Architectural Report</span>
                </div>
                <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                  {preflightResult.aiAnalysis}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
