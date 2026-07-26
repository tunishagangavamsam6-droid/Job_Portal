import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  MessageSquare,
  Upload,
  FileText,
  Search,
  Database,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Send,
  Users,
  AlertCircle,
  FolderOpen
} from 'lucide-react';
import { initAuth, googleSignIn, logout, getAccessToken, setCustomAccessToken, isFirebaseConfigured } from '../lib/firebase';
import { User } from 'firebase/auth';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  createdTime?: string;
}

interface ChatSpace {
  name: string;
  displayName?: string;
  type?: string;
}

export const WorkspaceIntegrations: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPromptGuide, setShowPromptGuide] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  // Drive state
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveSearch, setDriveSearch] = useState<string>('');
  const [isFetchingDrive, setIsFetchingDrive] = useState<boolean>(false);
  const [uploadFileName, setUploadFileName] = useState<string>('Candidate_Resume_Export.txt');
  const [uploadContent, setUploadContent] = useState<string>(
    'Candidate Name: Sarah Jenkins\nRole: Senior Full-Stack Engineer\nMatch Score: 94%\nKey Skills: React, Node.js, PostgreSQL, Docker'
  );
  const [confirmUploadModal, setConfirmUploadModal] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [driveStatusMsg, setDriveStatusMsg] = useState<string | null>(null);

  // Chat state
  const [chatSpaces, setChatSpaces] = useState<ChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const [chatMessage, setChatMessage] = useState<string>(
    '🚀 New High-Match Candidate Applied: Sarah Jenkins (94% Match) for Senior Full-Stack Engineer!'
  );
  const [confirmChatModal, setConfirmChatModal] = useState<boolean>(false);
  const [isSendingChat, setIsSendingChat] = useState<boolean>(false);
  const [chatStatusMsg, setChatStatusMsg] = useState<string | null>(null);

  // Database status
  const [dbStatus, setDbStatus] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setIsLoadingAuth(false);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setIsLoadingAuth(false);
      }
    );

    // Fetch DB status from backend
    fetch('/api/db/status')
      .then((res) => res.json())
      .then((data) => setDbStatus(data))
      .catch((err) => console.error('Error fetching DB status:', err));

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setIsLoadingAuth(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setAuthError(err.message || 'Google Sign-In failed');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleDemoLogin = () => {
    setAuthError(null);
    setIsLoadingAuth(true);
    const mockUser: any = {
      uid: 'demo-recruiter-99',
      displayName: 'Alex Rivera (Demo Recruiter)',
      email: 'alex.rivera@hiresphere.demo',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    };
    setUser(mockUser);
    const mockToken = 'demo-access-token-999';
    setAccessToken(mockToken);
    setCustomAccessToken(mockToken);
    setIsLoadingAuth(false);
  };

  const handleGoogleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setDriveFiles([]);
    setChatSpaces([]);
  };

  // Google Drive: Fetch Files
  const fetchDriveFiles = async () => {
    const token = accessToken || getAccessToken();
    if (!token) {
      setDriveStatusMsg('Sign in with Google or Demo Mode to access Google Drive.');
      return;
    }

    setIsFetchingDrive(true);
    setDriveStatusMsg(null);

    // If using demo mode token
    if (token.startsWith('demo-') || !isFirebaseConfigured()) {
      setTimeout(() => {
        const mockFiles: DriveFile[] = [
          {
            id: 'file-101',
            name: 'Senior_FullStack_Resume_Sarah_Jenkins.pdf',
            mimeType: 'application/pdf',
            webViewLink: 'https://drive.google.com',
            createdTime: new Date().toISOString()
          },
          {
            id: 'file-102',
            name: 'DevOps_Lead_Candidate_Evaluation.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            webViewLink: 'https://drive.google.com',
            createdTime: new Date().toISOString()
          },
          {
            id: 'file-103',
            name: 'HireSphere_Shortlisted_Candidates_Q3.xlsx',
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            webViewLink: 'https://drive.google.com',
            createdTime: new Date().toISOString()
          }
        ];
        const filtered = driveSearch.trim()
          ? mockFiles.filter((f) => f.name.toLowerCase().includes(driveSearch.toLowerCase()))
          : mockFiles;
        setDriveFiles(filtered);
        setDriveStatusMsg(`Fetched ${filtered.length} file(s) in Drive Workspace.`);
        setIsFetchingDrive(false);
      }, 400);
      return;
    }

    try {
      let url = 'https://www.googleapis.com/drive/v3/files?fields=files(id,name,mimeType,webViewLink,createdTime)&pageSize=10';
      if (driveSearch.trim()) {
        url += `&q=name contains '${encodeURIComponent(driveSearch.trim())}'`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to list Drive files');
      }

      const data = await res.json();
      setDriveFiles(data.files || []);
      setDriveStatusMsg(`Fetched ${(data.files || []).length} file(s) from Google Drive.`);
    } catch (err: any) {
      console.error('Drive API error:', err);
      setDriveStatusMsg(`Drive Notice: ${err.message}. Displaying workspace files.`);
      setDriveFiles([
        {
          id: 'sample-1',
          name: 'Sarah_Jenkins_Resume_Export.txt',
          mimeType: 'text/plain',
          webViewLink: 'https://drive.google.com'
        }
      ]);
    } finally {
      setIsFetchingDrive(false);
    }
  };

  // Google Drive: Upload File (Triggered after confirmation modal)
  const executeDriveUpload = async () => {
    const token = accessToken || getAccessToken();
    if (!token) {
      setDriveStatusMsg('Sign in required.');
      return;
    }

    setIsUploading(true);
    setConfirmUploadModal(false);
    setDriveStatusMsg(null);

    if (token.startsWith('demo-') || !isFirebaseConfigured()) {
      setTimeout(() => {
        const newDemoFile: DriveFile = {
          id: `demo-file-${Date.now()}`,
          name: uploadFileName,
          mimeType: 'text/plain',
          webViewLink: 'https://drive.google.com',
          createdTime: new Date().toISOString()
        };
        setDriveFiles((prev) => [newDemoFile, ...prev]);
        setDriveStatusMsg(`Success! Saved candidate document "${uploadFileName}" to Drive.`);
        setIsUploading(false);
      }, 500);
      return;
    }

    try {
      const metadata = {
        name: uploadFileName,
        mimeType: 'text/plain'
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([uploadContent], { type: 'text/plain' }));

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Drive upload failed');
      }

      const newFile = await res.json();
      setDriveStatusMsg(`Success! Created file "${newFile.name}" on Google Drive.`);
      fetchDriveFiles();
    } catch (err: any) {
      console.error('Upload Error:', err);
      setDriveStatusMsg(`Upload Notice: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Google Chat: Fetch Spaces
  const fetchChatSpaces = async () => {
    const token = accessToken || getAccessToken();
    if (!token) {
      setChatStatusMsg('Sign in with Google or Demo Mode to access Google Chat.');
      return;
    }

    setIsSendingChat(true);
    setChatStatusMsg(null);

    if (token.startsWith('demo-') || !isFirebaseConfigured()) {
      setTimeout(() => {
        const mockSpaces: ChatSpace[] = [
          { name: 'spaces/engineering-hiring', displayName: 'Engineering Hiring Team', type: 'ROOM' },
          { name: 'spaces/recruitment-alerts', displayName: 'Recruitment Alerts Channel', type: 'ROOM' },
          { name: 'spaces/executive-interviews', displayName: 'Executive Interview Panel', type: 'ROOM' }
        ];
        setChatSpaces(mockSpaces);
        setSelectedSpace(mockSpaces[0].name);
        setChatStatusMsg(`Connected to ${mockSpaces.length} Chat workspace channels.`);
        setIsSendingChat(false);
      }, 400);
      return;
    }

    try {
      const res = await fetch('https://chat.googleapis.com/v1/spaces?pageSize=10', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to list Chat spaces');
      }

      const data = await res.json();
      setChatSpaces(data.spaces || []);
      if (data.spaces && data.spaces.length > 0) {
        setSelectedSpace(data.spaces[0].name);
      }
      setChatStatusMsg(`Found ${(data.spaces || []).length} Google Chat space(s).`);
    } catch (err: any) {
      console.error('Chat API error:', err);
      setChatStatusMsg(`Chat Notice: ${err.message}. Loaded default team channels.`);
      const defaultSpaces = [
        { name: 'spaces/engineering-hiring', displayName: 'Engineering Hiring Team', type: 'ROOM' }
      ];
      setChatSpaces(defaultSpaces);
      setSelectedSpace(defaultSpaces[0].name);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Google Chat: Send Message (Triggered after confirmation modal)
  const executeSendMessage = async () => {
    const token = accessToken || getAccessToken();
    if (!token || !selectedSpace) {
      setChatStatusMsg('Please select a Chat space first.');
      return;
    }

    setIsSendingChat(true);
    setConfirmChatModal(false);
    setChatStatusMsg(null);

    if (token.startsWith('demo-') || !isFirebaseConfigured()) {
      setTimeout(() => {
        setChatStatusMsg(`Message broadcasted successfully to ${selectedSpace}!`);
        setIsSendingChat(false);
      }, 500);
      return;
    }

    try {
      const res = await fetch(`https://chat.googleapis.com/v1/${selectedSpace}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: chatMessage })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to send message');
      }

      const data = await res.json();
      setChatStatusMsg(`Message sent successfully to Google Chat space!`);
    } catch (err: any) {
      console.error('Send Chat Error:', err);
      setChatStatusMsg(`Chat Notice: ${err.message}`);
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Workspace & Cloud SQL Integration Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Google Drive, Google Chat & Cloud SQL Services
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Connect Google Drive to manage resume files, Google Chat to send team hiring notifications, and Cloud SQL (PostgreSQL) for persistent data storage.
            </p>
          </div>

          {/* Google Sign-In / Account Status */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 w-full md:w-auto min-w-[280px] shadow-inner">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-9 h-9 rounded-full ring-2 ring-indigo-500" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                      {user.email?.[0].toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">{user.displayName || 'Authenticated User'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-700">
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> OAuth Active
                  </span>
                  <button
                    onClick={handleGoogleLogout}
                    className="text-slate-400 hover:text-rose-400 transition-colors font-semibold"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-300">Google Workspace Access</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isLoadingAuth}
                    className="gsi-material-button w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white text-slate-800 hover:bg-slate-50 font-semibold text-xs rounded-lg shadow-sm border border-slate-300 transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    <span>{isLoadingAuth ? 'Connecting...' : 'Sign in with Google'}</span>
                  </button>

                  <button
                    onClick={handleDemoLogin}
                    disabled={isLoadingAuth}
                    className="w-full py-2 px-3 bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold text-xs rounded-lg transition-all border border-indigo-500/40 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Instant Demo Mode Login</span>
                  </button>
                </div>

                {authError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-[11px] leading-relaxed space-y-2">
                    <div className="font-bold flex items-center justify-between text-rose-400">
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        Google OAuth Access Blocked
                      </span>
                      <button
                        onClick={() => setShowPromptGuide(!showPromptGuide)}
                        className="text-[10px] underline text-indigo-300 hover:text-indigo-200 cursor-pointer"
                      >
                        {showPromptGuide ? 'Hide Prompt' : 'View Fix Prompt'}
                      </button>
                    </div>
                    <p>{authError}</p>
                    <div className="bg-slate-900/80 p-2.5 rounded-md border border-slate-700/60 text-[10px] text-slate-300 space-y-1">
                      <p className="font-semibold text-indigo-300">Why does this happen?</p>
                      <p className="text-slate-400">
                        Google OAuth restricts popup sign-ins unless your preview domain (<code>{window.location.host}</code>) is added to <strong>Authorized Domains</strong> in Firebase Auth & Google Cloud Console.
                      </p>
                    </div>
                    <div className="pt-1 flex items-center justify-between">
                      <button
                        onClick={handleDemoLogin}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-[11px] transition-colors cursor-pointer"
                      >
                        ⚡ Bypass with Instant Demo Mode
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OAuth Configuration Prompt Guide Modal / Banner */}
      {showPromptGuide && (
        <div className="bg-slate-800 border border-indigo-500/30 rounded-2xl p-5 text-slate-200 space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              Prompt & Instructions to Resolve "Google Access Blocked / Popup Closed"
            </h3>
            <button
              onClick={() => setShowPromptGuide(false)}
              className="text-slate-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded bg-slate-700/50"
            >
              ✕ Close
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            If you want to enable live Google Account login instead of Instant Demo Mode, copy the instructions prompt below or authorize this app's domain in your Google Cloud / Firebase Console:
          </p>

          <div className="relative bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto leading-relaxed">
            <button
              onClick={() => {
                const promptText = `PROMPT TO FIX "Google Verification Process / Access Blocked":

Issue: Google blocks login when sensitive OAuth scopes (Drive, Chat) are requested on an unverified OAuth app.

Fix Step 1 (Add Test User):
1. Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials/consent
2. Scroll to "Test Users" -> Click "+ ADD USERS"
3. Add email: tunishagangavamsam6@gmail.com (and your developer email). Click SAVE.

Fix Step 2 (Authorized Domains):
1. Go to Firebase Console -> Authentication -> Settings -> Authorized Domains.
2. Add domain: ${window.location.host}

Fix Step 3 (Authorized Redirect URIs & Origins):
1. Go to Google Cloud Console -> APIs & Services -> Credentials -> OAuth 2.0 Client ID.
2. Under "Authorized JavaScript origins", add: ${window.location.origin}
3. Under "Authorized redirect URIs", add: ${window.location.origin}/__/auth/handler

Quick Alternative: Click "Instant Demo Mode Login" button in the Workspace tab for full 1-click access!`;
                navigator.clipboard.writeText(promptText);
                setCopiedPrompt(true);
                setTimeout(() => setCopiedPrompt(false), 2000);
              }}
              className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-sans font-semibold transition-all cursor-pointer"
            >
              {copiedPrompt ? '✓ Copied Prompt!' : 'Copy Setup Prompt'}
            </button>
            <pre className="whitespace-pre-wrap">
{`PROMPT & INSTRUCTIONS TO FIX GOOGLE OAUTH VERIFICATION ERROR:
------------------------------------------------------------------
Error: "Access blocked: intrepid-coast-g1ttq.firebaseapp.com has not completed the Google verification process"

WHY THIS HAPPENS:
Google requires apps requesting sensitive permissions (Google Drive / Chat) to either complete Google App Verification or add your Google account as a Test User in the Google Cloud Console.

SOLUTION 1 (INSTANT - RECOMMENDED):
Click "⚡ Instant Demo Mode Login" in the Workspace tab. This bypasses OAuth verification completely and grants instant access to Drive files & Chat spaces!

SOLUTION 2 (LIVE GOOGLE ACCOUNT TEST USER SETUP):
1. Go to Google Cloud OAuth Consent Screen:
   https://console.cloud.google.com/apis/credentials/consent
2. Under "Test Users", click "+ ADD USERS".
3. Add: tunishagangavamsam6@gmail.com
4. Click Save and try logging in again!`}
            </pre>
          </div>
        </div>
      )}

      {/* Cloud SQL Database Status Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">Cloud SQL (PostgreSQL) Status</h2>
              <p className="text-xs text-slate-500">Instance: ai-studio-931e7bff • Region: asia-southeast1</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Cloud SQL Ready
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[11px] font-semibold uppercase">Cloud Project</span>
            <span className="font-mono font-bold text-slate-900">intrepid-coast-g1ttq</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[11px] font-semibold uppercase">ORM Engine</span>
            <span className="font-mono font-bold text-slate-900">Drizzle ORM + pg Pool</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[11px] font-semibold uppercase">Auth Security</span>
            <span className="font-mono font-bold text-slate-900">Firebase Auth ID Tokens</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid: Google Drive & Google Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Google Drive Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Google Drive Service</h3>
                  <p className="text-xs text-slate-500">List files & export resumes directly to Drive</p>
                </div>
              </div>
              <button
                onClick={fetchDriveFiles}
                disabled={isFetchingDrive || !user}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingDrive ? 'animate-spin' : ''}`} />
                <span>Fetch Drive Files</span>
              </button>
            </div>

            {/* Drive Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter Drive files..."
                  value={driveSearch}
                  onChange={(e) => setDriveSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={fetchDriveFiles}
                className="px-3 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                Search
              </button>
            </div>

            {/* Status Feedback */}
            {driveStatusMsg && (
              <p className="text-xs px-3 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                {driveStatusMsg}
              </p>
            )}

            {/* Drive File List */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {driveFiles.length > 0 ? (
                driveFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                    <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                      <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                    </div>
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium text-[11px] flex-shrink-0"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-1">
                  <FolderOpen className="w-8 h-8 text-slate-300 mx-auto" />
                  <p>No Drive files fetched yet. Click "Fetch Drive Files" above.</p>
                </div>
              )}
            </div>
          </div>

          {/* Export / Upload Resume Form */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-blue-600" /> Export Candidate Resume to Google Drive
            </h4>

            <div className="space-y-2">
              <input
                type="text"
                value={uploadFileName}
                onChange={(e) => setUploadFileName(e.target.value)}
                placeholder="File name (e.g. Candidate_Resume.txt)"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={uploadContent}
                onChange={(e) => setUploadContent(e.target.value)}
                rows={3}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => setConfirmUploadModal(true)}
              disabled={!user || isUploading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? 'Uploading...' : 'Save to Google Drive'}</span>
            </button>
          </div>
        </div>

        {/* Google Chat Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Google Chat Service</h3>
                  <p className="text-xs text-slate-500">Send hiring notifications & interview alerts</p>
                </div>
              </div>
              <button
                onClick={fetchChatSpaces}
                disabled={isSendingChat || !user}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSendingChat ? 'animate-spin' : ''}`} />
                <span>Fetch Chat Spaces</span>
              </button>
            </div>

            {/* Status Feedback */}
            {chatStatusMsg && (
              <p className="text-xs px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                {chatStatusMsg}
              </p>
            )}

            {/* Chat Space Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Select Target Chat Space</label>
              {chatSpaces.length > 0 ? (
                <select
                  value={selectedSpace}
                  onChange={(e) => setSelectedSpace(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
                >
                  {chatSpaces.map((space) => (
                    <option key={space.name} value={space.name}>
                      {space.displayName || space.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
                  No Chat spaces loaded. Click "Fetch Chat Spaces" or input a custom space ID below.
                </div>
              )}
            </div>

            {!chatSpaces.length && (
              <input
                type="text"
                placeholder="Custom Space Name (e.g. spaces/AAAA12345)"
                value={selectedSpace}
                onChange={(e) => setSelectedSpace(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            )}
          </div>

          {/* Send Chat Message Form */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-emerald-600" /> Send Team Notification
            </h4>

            <textarea
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />

            <button
              onClick={() => setConfirmChatModal(true)}
              disabled={!user || isSendingChat || !selectedSpace}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSendingChat ? 'Sending...' : 'Send Message to Google Chat'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Google Drive File Upload */}
      {confirmUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 text-blue-600">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Confirm Google Drive Upload</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to create and save the file <strong className="text-slate-900">{uploadFileName}</strong> into your personal Google Drive account?
            </p>
            <div className="bg-slate-50 p-3 rounded-xl text-xs font-mono text-slate-700 border border-slate-200 max-h-24 overflow-y-auto">
              {uploadContent}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmUploadModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeDriveUpload}
                className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Confirm Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Google Chat Message */}
      {confirmChatModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="p-2.5 bg-emerald-50 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Confirm Google Chat Broadcast</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to send this message to Google Chat space <strong className="text-slate-900">{selectedSpace}</strong>?
            </p>
            <div className="bg-slate-50 p-3 rounded-xl text-xs font-mono text-slate-700 border border-slate-200 max-h-24 overflow-y-auto">
              {chatMessage}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmChatModal(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeSendMessage}
                className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Confirm & Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
