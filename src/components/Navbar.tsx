import React from 'react';
import { Briefcase, Building2, Sparkles, Terminal, CheckCircle2, HardDrive } from 'lucide-react';

interface NavbarProps {
  activeTab: 'jobs' | 'employer' | 'ai-tools' | 'devops' | 'workspace';
  setActiveTab: (tab: 'jobs' | 'employer' | 'ai-tools' | 'devops' | 'workspace') => void;
  appliedCount: number;
  activeJobsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, appliedCount, activeJobsCount }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('jobs')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">HireSphere</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
                  Job Portal
                </span>
              </div>
              <p className="text-xs text-slate-400">Job Portal Management System</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              id="nav-tab-jobs"
              onClick={() => setActiveTab('jobs')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'jobs'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Explore Jobs</span>
              <span className="ml-1 text-xs px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {activeJobsCount}
              </span>
            </button>

            <button
              id="nav-tab-employer"
              onClick={() => setActiveTab('employer')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'employer'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Employer ATS</span>
              {appliedCount > 0 && (
                <span className="ml-1 text-xs px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {appliedCount} Applicants
                </span>
              )}
            </button>

            <button
              id="nav-tab-ai-tools"
              onClick={() => setActiveTab('ai-tools')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'ai-tools'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>AI Resume Matcher</span>
            </button>

            <button
              id="nav-tab-workspace"
              onClick={() => setActiveTab('workspace')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'workspace'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <HardDrive className="w-4 h-4 text-blue-400" />
              <span>Drive & Chat Integrations</span>
            </button>

            <button
              id="nav-tab-devops"
              onClick={() => setActiveTab('devops')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'devops'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-cyan-300 hover:text-white hover:bg-cyan-950/60 border border-cyan-500/30'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Deployment Setup</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
            </button>
          </nav>

          {/* Quick Status / Environment Badge */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-lg text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full-Stack API Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex border-t border-slate-800 px-2 py-1 bg-slate-900/95 overflow-x-auto">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex-1 min-w-[90px] py-2 text-xs font-medium text-center rounded-md ${
            activeTab === 'jobs' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Jobs
        </button>
        <button
          onClick={() => setActiveTab('employer')}
          className={`flex-1 min-w-[90px] py-2 text-xs font-medium text-center rounded-md ${
            activeTab === 'employer' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          ATS Portal
        </button>
        <button
          onClick={() => setActiveTab('ai-tools')}
          className={`flex-1 min-w-[90px] py-2 text-xs font-medium text-center rounded-md ${
            activeTab === 'ai-tools' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          AI Matcher
        </button>
        <button
          onClick={() => setActiveTab('workspace')}
          className={`flex-1 min-w-[90px] py-2 text-xs font-medium text-center rounded-md ${
            activeTab === 'workspace' ? 'bg-blue-600 text-white' : 'text-slate-400'
          }`}
        >
          Drive & Chat
        </button>
        <button
          onClick={() => setActiveTab('devops')}
          className={`flex-1 min-w-[90px] py-2 text-xs font-medium text-center rounded-md ${
            activeTab === 'devops' ? 'bg-cyan-600 text-white' : 'text-slate-400'
          }`}
        >
          DevOps
        </button>
      </div>
    </header>
  );
};
