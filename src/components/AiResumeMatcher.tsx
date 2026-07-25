import React, { useState } from 'react';
import { Sparkles, FileText, CheckCircle2, AlertTriangle, Lightbulb, ArrowRight, RefreshCw } from 'lucide-react';
import { Job } from '../types';

interface AiResumeMatcherProps {
  jobs: Job[];
}

export const AiResumeMatcher: React.FC<AiResumeMatcherProps> = ({ jobs }) => {
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const [customJd, setCustomJd] = useState<string>('');
  const [resumeText, setResumeText] = useState<string>(
    `Full-Stack Engineer with 5 years experience in MERN stack (MongoDB, Express, React, Node.js), TypeScript, Next.js, and Docker. Experience with REST APIs, JWT authentication, and cloud deployments on Vercel and Render.`
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [matchResult, setMatchResult] = useState<any>(null);

  // Sync custom JD if job selected
  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      setCustomJd(`${job.title} at ${job.company}\n\nDescription:\n${job.description}\n\nRequirements:\n${job.requirements.join('\n')}`);
    }
  };

  const handleRunMatch = async () => {
    const jdText = customJd || (jobs.find((j) => j.id === selectedJobId)?.description || '');
    if (!jdText || !resumeText) {
      alert('Please provide both Job Description and Resume content.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jobDescription: jdText
        })
      });
      const data = await res.json();
      setMatchResult(data);
    } catch (err) {
      console.error('Error running AI match', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Gemini 3.6 Flash Neural Analysis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            AI Resume Matcher & Resume Optimization Engine
          </h1>
          <p className="mt-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
            Benchmark your resume against any Job Description. Uncover missing tech stack keywords, calculate match probability, and receive actionable suggestions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Input Form */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Target Job & Resume Inputs</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select from Active Jobs</label>
              <select
                value={selectedJobId}
                onChange={(e) => handleJobSelect(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500 bg-white"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} — {j.company} ({j.location})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Job Description</label>
              <textarea
                rows={5}
                value={customJd || (jobs.find((j) => j.id === selectedJobId)?.description || '')}
                onChange={(e) => setCustomJd(e.target.value)}
                placeholder="Paste the target job description here..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500 font-mono text-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Your Resume / Experience Summary</label>
              <textarea
                rows={6}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your full resume text or skills summary..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500 font-mono text-slate-700"
              />
            </div>

            <button
              onClick={handleRunMatch}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing Resume against JD...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run AI Match Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Output Analysis */}
        <div className="space-y-4">
          {matchResult ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              {/* Score Header */}
              <div className="bg-slate-900 text-white rounded-xl p-6 flex items-center justify-between shadow-md">
                <div>
                  <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">Match Probability</span>
                  <h3 className="text-3xl font-extrabold mt-1">{matchResult.matchScore}% Score</h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-xs">{matchResult.matchAnalysis?.recommendation}</p>
                </div>

                <div className="w-20 h-20 rounded-full border-4 border-cyan-400 flex items-center justify-center font-black text-2xl text-cyan-300 bg-slate-800">
                  {matchResult.matchScore}%
                </div>
              </div>

              {/* Strengths */}
              {matchResult.matchAnalysis?.strengths && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Key Matched Strengths</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {matchResult.matchAnalysis.strengths.map((str: string, idx: number) => (
                      <li key={idx} className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing Skills */}
              {matchResult.matchAnalysis?.missingSkills && matchResult.matchAnalysis.missingSkills.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Keywords & Skill Gaps to Address</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {matchResult.matchAnalysis.missingSkills.map((gap: string, idx: number) => (
                      <li key={idx} className="bg-amber-50 border border-amber-100 p-2.5 rounded-lg flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
                        <span>{gap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Highlights */}
              {matchResult.matchAnalysis?.keyHighlights && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-indigo-600" />
                    <span>Resume Optimization Highlights</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {matchResult.matchAnalysis.keyHighlights.map((hl: string, idx: number) => (
                      <li key={idx} className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-lg flex items-start gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-600 mt-0.5 flex-shrink-0" />
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-400 space-y-3">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No Match Generated Yet</h3>
              <p className="text-xs max-w-sm mx-auto">
                Paste your resume on the left and click "Run AI Match Analysis" to generate real-time match probability and keyword suggestions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
