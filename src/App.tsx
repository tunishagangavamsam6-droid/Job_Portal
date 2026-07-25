import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { JobBoard } from './components/JobBoard';
import { EmployerDashboard } from './components/EmployerDashboard';
import { AiResumeMatcher } from './components/AiResumeMatcher';
import { DevOpsDeploymentSuite } from './components/DevOpsDeploymentSuite';
import { WorkspaceIntegrations } from './components/WorkspaceIntegrations';
import { RealTimeNotificationToast } from './components/RealTimeNotificationToast';
import { useSocket } from './hooks/useSocket';
import { Job, Application, ApplicationStatus } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'jobs' | 'employer' | 'ai-tools' | 'devops' | 'workspace'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize Real-Time WebSocket Hook
  const {
    isConnected,
    onlineCount,
    notifications,
    dismissNotification,
    clearAllNotifications
  } = useSocket();

  // Re-fetch data on real-time event notifications to ensure instant UI sync
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (latest.type === 'APPLICATION_SUBMITTED' || latest.type === 'STATUS_UPDATED') {
        fetchApplications();
        fetchJobs();
      }
    }
  }, [notifications]);

  // Load initial jobs and applications
  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      await Promise.all([fetchJobs(), fetchApplications()]);
      setIsLoading(false);
    };
    initData();
  }, []);

  const handleApplySubmit = async (appData: Partial<Application>) => {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appData)
    });

    if (!res.ok) {
      throw new Error('Failed to submit application');
    }

    await Promise.all([fetchJobs(), fetchApplications()]);
  };

  const handleJobCreate = async (jobData: Partial<Job>) => {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobData)
    });

    if (!res.ok) {
      throw new Error('Failed to create job');
    }

    await fetchJobs();
  };

  const handleJobDelete = async (jobId: string) => {
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      await Promise.all([fetchJobs(), fetchApplications()]);
    }
  };

  const handleStatusUpdate = async (appId: string, status: ApplicationStatus, notes?: string) => {
    const res = await fetch(`/api/applications/${appId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes })
    });

    if (res.ok) {
      await fetchApplications();
    }
  };

  const appliedJobIds = applications.map((a) => a.jobId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        appliedCount={applications.length}
        activeJobsCount={jobs.length}
      />

      <main className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-slate-500">Loading HireSphere Portal...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'jobs' && (
              <JobBoard
                jobs={jobs}
                onApplySubmit={handleApplySubmit}
                appliedJobIds={appliedJobIds}
              />
            )}

            {activeTab === 'employer' && (
              <EmployerDashboard
                jobs={jobs}
                applications={applications}
                onJobCreate={handleJobCreate}
                onJobDelete={handleJobDelete}
                onStatusUpdate={handleStatusUpdate}
              />
            )}

            {activeTab === 'ai-tools' && <AiResumeMatcher jobs={jobs} />}

            {activeTab === 'workspace' && <WorkspaceIntegrations />}

            {activeTab === 'devops' && <DevOpsDeploymentSuite />}
          </>
        )}
      </main>

      {/* Real-Time WebSocket Toast Notifications & Activity Stream Drawer */}
      <RealTimeNotificationToast
        isConnected={isConnected}
        onlineCount={onlineCount}
        notifications={notifications}
        onDismiss={dismissNotification}
        onClearAll={clearAllNotifications}
      />

      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 px-4 text-center text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Job Portal Management System.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveTab('jobs')} className="hover:text-white transition-colors">
              Jobs
            </button>
            <button onClick={() => setActiveTab('employer')} className="hover:text-white transition-colors">
              ATS Portal
            </button>
            <button onClick={() => setActiveTab('devops')} className="hover:text-white transition-colors">
              Deployment Setup
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
