import React, { useState, useEffect, useRef } from 'react';
import {
  Briefcase,
  Building2,
  Sparkles,
  Terminal,
  CheckCircle2,
  HardDrive,
  User as UserIcon,
  LogOut,
  ChevronDown,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  X,
  Lock,
  Search,
  MapPin,
  Tag,
  ArrowRight
} from 'lucide-react';
import { UserProfile, Job } from '../types';
import { googleSignIn, logout, initAuth, isFirebaseConfigured } from '../lib/firebase';

interface NavbarProps {
  activeTab: 'jobs' | 'employer' | 'ai-tools' | 'devops' | 'workspace';
  setActiveTab: (tab: 'jobs' | 'employer' | 'ai-tools' | 'devops' | 'workspace') => void;
  appliedCount: number;
  activeJobsCount: number;
  userProfile?: UserProfile | null;
  setUserProfile?: (profile: UserProfile | null) => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  jobs?: Job[];
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  appliedCount,
  activeJobsCount,
  userProfile: externalProfile,
  setUserProfile: externalSetProfile,
  searchTerm = '',
  setSearchTerm,
  jobs = []
}) => {
  const [internalUser, setInternalUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('hiresphere_user_account');
    return saved ? JSON.parse(saved) : null;
  });

  const currentUser = externalProfile !== undefined ? externalProfile : internalUser;

  const updateUser = (user: UserProfile | null) => {
    if (externalSetProfile) {
      externalSetProfile(user);
    }
    setInternalUser(user);
    if (user) {
      localStorage.setItem('hiresphere_user_account', JSON.stringify(user));
    } else {
      localStorage.removeItem('hiresphere_user_account');
    }
  };

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'candidate' | 'employer'>('candidate');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Email form fields
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  // Sync with Firebase auth state
  useEffect(() => {
    const unsubscribe = initAuth((firebaseUser) => {
      if (firebaseUser && !currentUser) {
        const profile: UserProfile = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Portal User',
          email: firebaseUser.email || 'user@hiresphere.com',
          photoURL: firebaseUser.photoURL || undefined,
          role: selectedRole
        };
        updateUser(profile);
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleGoogleAuth = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      const profile: UserProfile = {
        uid: res.user.uid,
        displayName: res.user.displayName || 'Google User',
        email: res.user.email || 'user@gmail.com',
        photoURL: res.user.photoURL || undefined,
        role: selectedRole
      };
      updateUser(profile);
      setIsLoginModalOpen(false);
    } catch (err: any) {
      console.error('Login error:', err);
      setAuthError(err.message || 'Google Sign-In failed');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleDemoAuth = (role: 'candidate' | 'employer') => {
    setIsLoadingAuth(true);
    setAuthError(null);
    setTimeout(() => {
      const profile: UserProfile =
        role === 'candidate'
          ? {
              uid: 'demo-cand-101',
              displayName: 'Alex Johnson',
              email: 'alex.johnson@candidate.dev',
              photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
              role: 'candidate'
            }
          : {
              uid: 'demo-emp-202',
              displayName: 'Sarah Jenkins (Hiring Lead)',
              email: 'sarah.jenkins@techcorp.com',
              photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
              role: 'employer'
            };
      updateUser(profile);
      setIsLoadingAuth(false);
      setIsLoginModalOpen(false);
      if (role === 'employer') {
        setActiveTab('employer');
      } else {
        setActiveTab('jobs');
      }
    }, 300);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    const profile: UserProfile = {
      uid: `custom-${Date.now()}`,
      displayName: nameInput.trim() || emailInput.split('@')[0],
      email: emailInput.trim(),
      role: selectedRole
    };
    updateUser(profile);
    setIsLoginModalOpen(false);
  };

  // Search state & click outside listener
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter matching jobs for quick popover preview
  const matchingSearchJobs = jobs.filter((j) => {
    if (!searchTerm.trim()) return false;
    const term = searchTerm.toLowerCase().trim();
    return (
      j.title.toLowerCase().includes(term) ||
      j.company.toLowerCase().includes(term) ||
      j.location.toLowerCase().includes(term) ||
      j.department.toLowerCase().includes(term) ||
      j.tags.some((t) => t.toLowerCase().includes(term))
    );
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (setSearchTerm) {
      setSearchTerm(val);
    }
  };

  const handleClearSearch = () => {
    if (setSearchTerm) {
      setSearchTerm('');
    }
  };

  const handleSelectSearchResult = (job: Job) => {
    if (setSearchTerm) {
      setSearchTerm(job.title);
    }
    setActiveTab('jobs');
    setIsSearchFocused(false);
  };

  const handleLogout = async () => {
    await logout();
    updateUser(null);
    setIsProfileMenuOpen(false);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => setActiveTab('jobs')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div className="hidden lg:block">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">HireSphere</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
                  Job Portal
                </span>
              </div>
              <p className="text-xs text-slate-400">Job Portal Management System</p>
            </div>
          </div>

          {/* Global Search Component */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-md mx-3 lg:mx-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className={`w-4 h-4 transition-colors ${isSearchFocused ? 'text-indigo-400' : 'text-slate-400'}`} />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setActiveTab('jobs');
                    setIsSearchFocused(false);
                  }
                }}
                placeholder="Search jobs by title, company, or location..."
                className={`w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-slate-800/90 text-white placeholder-slate-400 border transition-all ${
                  isSearchFocused
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-slate-800'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              />
              {searchTerm && (
                <button
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Live Autocomplete Suggestions Overlay */}
            {isSearchFocused && searchTerm.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden z-50 text-xs">
                <div className="px-3 py-2 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                  <span>Matching Active Jobs ({matchingSearchJobs.length})</span>
                  <span className="text-[10px] text-indigo-400 font-mono">Press Enter to view all</span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                  {matchingSearchJobs.length > 0 ? (
                    matchingSearchJobs.slice(0, 5).map((job) => (
                      <div
                        key={job.id}
                        onClick={() => handleSelectSearchResult(job)}
                        className="p-3 hover:bg-slate-800/90 cursor-pointer transition-colors group flex items-start justify-between gap-2"
                      >
                        <div>
                          <h5 className="font-bold text-white group-hover:text-indigo-300 transition-colors text-xs flex items-center gap-1.5">
                            {job.title}
                          </h5>
                          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span className="font-semibold text-slate-300">{job.company}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {job.location}
                            </span>
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-semibold">
                            {job.type}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 italic">
                      No active jobs found for "{searchTerm}"
                    </div>
                  )}
                </div>

                {matchingSearchJobs.length > 5 && (
                  <button
                    onClick={() => {
                      setActiveTab('jobs');
                      setIsSearchFocused(false);
                    }}
                    className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[11px] font-bold text-center border-t border-slate-700/60 transition-colors flex items-center justify-center gap-1"
                  >
                    View all {matchingSearchJobs.length} results <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
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
              <span>Drive & Chat</span>
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
              <span>DevOps</span>
            </button>
          </nav>

          {/* User Account / Login Area */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-all cursor-pointer"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-500/40"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                      {currentUser.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-white max-w-[120px] truncate leading-tight">
                      {currentUser.displayName}
                    </span>
                    <span className="text-[10px] text-indigo-300 capitalize font-medium">
                      {currentUser.role === 'employer' ? 'Employer / Hiring' : 'Candidate'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                </button>

                {/* Account Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl z-50 p-3 space-y-2 text-xs">
                    <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-1">
                      <p className="font-bold text-white text-xs">{currentUser.displayName}</p>
                      <p className="text-slate-400 text-[11px] truncate">{currentUser.email}</p>
                      <span className="inline-block px-2 py-0.5 mt-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold rounded-md border border-indigo-500/30 capitalize">
                        {currentUser.role} Account
                      </span>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-slate-800">
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setActiveTab('jobs');
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors text-left cursor-pointer"
                      >
                        <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Browse Job Listings</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setActiveTab('employer');
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors text-left cursor-pointer"
                      >
                        <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Employer ATS Portal</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setActiveTab('workspace');
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors text-left cursor-pointer"
                      >
                        <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                        <span>Google Drive & Chat Integrations</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold rounded-xl border border-rose-500/30 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out Account</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthError(null);
                  setIsLoginModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/20 border border-indigo-400/30 transition-all cursor-pointer"
              >
                <UserIcon className="w-4 h-4" />
                <span>Account Login / Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Front-Page Account Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-slate-100 space-y-5 animate-in fade-in zoom-in duration-150">
            {/* Close Button */}
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white">Sign In to HireSphere</h2>
              <p className="text-xs text-slate-400">
                Access your candidate job applications, employer ATS dashboard, or workspace tools.
              </p>
            </div>

            {/* Role Selection Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedRole('candidate')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedRole === 'candidate'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Candidate / Job Seeker
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('employer')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedRole === 'employer'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Employer / Recruiter
              </button>
            </div>

            {/* Login Method Buttons */}
            <div className="space-y-3">
              {/* Google Auth Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoadingAuth}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer border border-slate-300"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isLoadingAuth ? 'Connecting...' : 'Sign in with Google Account'}</span>
              </button>

              {/* Instant Demo Login Button */}
              <button
                type="button"
                onClick={() => handleDemoAuth(selectedRole)}
                disabled={isLoadingAuth}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 border border-emerald-400/30"
              >
                <span>⚡ Instant Demo Login ({selectedRole === 'candidate' ? 'Alex Johnson' : 'Sarah Jenkins'})</span>
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-slate-800"></div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">or sign in with email</span>
                <div className="flex-1 h-px bg-slate-800"></div>
              </div>

              {/* Custom Email Form */}
              <form onSubmit={handleCustomSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Rivera"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  Continue as {selectedRole === 'candidate' ? 'Candidate' : 'Employer'}
                </button>
              </form>
            </div>

            {/* Error Message Notice */}
            {authError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-[11px] leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1 text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Google Auth Notice</span>
                </div>
                <p>{authError}</p>
                <p className="text-slate-400 text-[10px]">
                  Tip: Click <strong>⚡ Instant Demo Login</strong> above to log in immediately without OAuth verification restrictions!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

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

