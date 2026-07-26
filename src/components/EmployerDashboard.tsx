import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Plus,
  Trash2,
  Users,
  Sparkles,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  ChevronRight,
  Wand2,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  Award,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
  Radio,
  Calendar,
  Video,
  MapPin,
  Phone,
  ExternalLink,
  Download,
  Copy,
  Check,
  User
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { Job, Application, ApplicationStatus, InterviewSlot } from '../types';

interface EmployerDashboardProps {
  jobs: Job[];
  applications: Application[];
  onJobCreate: (jobData: Partial<Job>) => Promise<void>;
  onJobDelete: (jobId: string) => Promise<void>;
  onStatusUpdate: (appId: string, status: ApplicationStatus, notes?: string) => Promise<void>;
}

export const EmployerDashboard: React.FC<EmployerDashboardProps> = ({
  jobs,
  applications,
  onJobCreate,
  onJobDelete,
  onStatusUpdate
}) => {
  const [activeTab, setActiveTab] = useState<'applicants' | 'jobs' | 'calendar'>('applicants');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(true);

  // Live Comments state for selected application
  const [comments, setComments] = useState<Array<{ id: string; author: string; role: string; text: string; createdAt: string }>>([]);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [reviewerName, setReviewerName] = useState<string>('Lead Recruiter');

  // Interview Calendar state
  const [appInterviews, setAppInterviews] = useState<InterviewSlot[]>([]);
  const [allMasterCalendar, setAllMasterCalendar] = useState<InterviewSlot[]>([]);
  const [isSchedulingOpen, setIsSchedulingOpen] = useState<boolean>(false);
  const [isSubmittingInterview, setIsSubmittingInterview] = useState<boolean>(false);
  const [copiedSlotId, setCopiedSlotId] = useState<string | null>(null);

  // Form fields for proposing interview slot
  const [interviewDate, setInterviewDate] = useState<string>(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [interviewStartTime, setInterviewStartTime] = useState<string>('14:00');
  const [interviewEndTime, setInterviewEndTime] = useState<string>('14:45');
  const [interviewType, setInterviewType] = useState<InterviewSlot['type']>('Technical Round');
  const [interviewFormat, setInterviewFormat] = useState<InterviewSlot['format']>('Google Meet');
  const [interviewerName, setInterviewerName] = useState<string>('Sarah Jenkins (Hiring Lead)');
  const [meetingLink, setMeetingLink] = useState<string>('');
  const [interviewNotes, setInterviewNotes] = useState<string>('Please prepare a short system architecture walk-through.');

  // Fetch interviews when selectedApp changes
  useEffect(() => {
    if (selectedApp) {
      fetch(`/api/applications/${selectedApp.id}/interviews`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setAppInterviews(data);
        })
        .catch((err) => console.error('Error fetching interviews:', err));
    } else {
      setAppInterviews([]);
    }
  }, [selectedApp?.id]);

  // Fetch all master calendar interviews
  const fetchMasterCalendar = () => {
    fetch('/api/interviews/calendar')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAllMasterCalendar(data);
      })
      .catch((err) => console.error('Error fetching master calendar:', err));
  };

  useEffect(() => {
    fetchMasterCalendar();
  }, []);

  useEffect(() => {
    if (activeTab === 'calendar') {
      fetchMasterCalendar();
    }
  }, [activeTab]);

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp || !interviewDate || !interviewStartTime) return;
    setIsSubmittingInterview(true);

    try {
      const payload = {
        date: interviewDate,
        startTime: interviewStartTime,
        endTime: interviewEndTime,
        type: interviewType,
        format: interviewFormat,
        interviewerName: interviewerName || 'Recruitment Team',
        meetingLink: meetingLink || (interviewFormat === 'Google Meet' ? `https://meet.google.com/hs-${Math.random().toString(36).substring(2, 7)}` : ''),
        notes: interviewNotes,
        applicantName: selectedApp.applicantName,
        jobTitle: selectedApp.jobTitle,
        company: selectedApp.company
      };

      const res = await fetch(`/api/applications/${selectedApp.id}/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const createdSlot: InterviewSlot = await res.json();
        setAppInterviews((prev) => [...prev, createdSlot]);
        onStatusUpdate(selectedApp.id, 'Interview');
        setSelectedApp({ ...selectedApp, status: 'Interview' });
        setIsSchedulingOpen(false);
        fetchMasterCalendar();
      }
    } catch (err) {
      console.error('Error scheduling interview:', err);
    } finally {
      setIsSubmittingInterview(false);
    }
  };

  const handleDeleteInterview = async (interviewId: string) => {
    if (!selectedApp) return;
    try {
      await fetch(`/api/applications/${selectedApp.id}/interviews/${interviewId}`, {
        method: 'DELETE'
      });
      setAppInterviews((prev) => prev.filter((i) => i.id !== interviewId));
      fetchMasterCalendar();
    } catch (err) {
      console.error('Error deleting interview slot:', err);
    }
  };

  const downloadIcsFile = (slot: InterviewSlot) => {
    const startDateTime = `${slot.date.replace(/-/g, '')}T${slot.startTime.replace(':', '')}00`;
    const endDateTime = `${slot.date.replace(/-/g, '')}T${slot.endTime.replace(':', '')}00`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HireSphere ATS//Interview Schedule//EN',
      'BEGIN:VEVENT',
      `SUMMARY:Interview with ${slot.applicantName} - ${slot.type} (${slot.jobTitle})`,
      `DESCRIPTION:${slot.notes || 'Interview scheduled via HireSphere ATS.'}\\n\\nFormat: ${slot.format}\\nInterviewer: ${slot.interviewerName}\\nMeeting Link: ${slot.meetingLink || 'N/A'}`,
      `LOCATION:${slot.meetingLink || slot.format}`,
      `DTSTART:${startDateTime}`,
      `DTEND:${endDateTime}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Interview_${slot.applicantName.replace(/\s+/g, '_')}_${slot.date}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getGoogleCalendarUrl = (slot: InterviewSlot) => {
    const title = encodeURIComponent(`Interview: ${slot.applicantName} - ${slot.type} (${slot.jobTitle})`);
    const details = encodeURIComponent(`Interview type: ${slot.type}\nInterviewer: ${slot.interviewerName}\nFormat: ${slot.format}\nLink: ${slot.meetingLink || 'N/A'}\n\nNotes: ${slot.notes || ''}`);
    const location = encodeURIComponent(slot.meetingLink || slot.format);

    const startFormatted = `${slot.date.replace(/-/g, '')}T${slot.startTime.replace(':', '')}00`;
    const endFormatted = `${slot.date.replace(/-/g, '')}T${slot.endTime.replace(':', '')}00`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${startFormatted}/${endFormatted}`;
  };

  const copyInviteText = (slot: InterviewSlot) => {
    const text = `Hi ${slot.applicantName},

We would like to invite you to a ${slot.type} interview for the ${slot.jobTitle} position at ${slot.company}.

Date: ${slot.date}
Time: ${slot.startTime} - ${slot.endTime}
Format: ${slot.format}
Interviewer: ${slot.interviewerName}
${slot.meetingLink ? `Meeting Link: ${slot.meetingLink}` : ''}

Notes: ${slot.notes || 'Please let us know if this time works or if you need to reschedule.'}

Best regards,
${slot.company} Hiring Team`;

    navigator.clipboard.writeText(text);
    setCopiedSlotId(slot.id);
    setTimeout(() => setCopiedSlotId(null), 2000);
  };

  useEffect(() => {
    if (selectedApp) {
      fetch(`/api/applications/${selectedApp.id}/comments`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setComments(data);
        })
        .catch((err) => console.error('Error fetching comments:', err));
    } else {
      setComments([]);
    }
  }, [selectedApp?.id]);

  const handlePostComment = async () => {
    if (!selectedApp || !newCommentText.trim()) return;
    const text = newCommentText.trim();
    setNewCommentText('');

    try {
      const res = await fetch(`/api/applications/${selectedApp.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: reviewerName,
          role: 'Hiring Committee',
          text
        })
      });
      if (res.ok) {
        const added = await res.json();
        setComments((prev) => [...prev, added]);
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  // Compute Application Growth over time
  const timelineData = useMemo(() => {
    if (!applications || applications.length === 0) return [];

    const dateCounts: Record<string, number> = {};
    applications.forEach((app) => {
      const d = new Date(app.appliedAt);
      const dateKey = !isNaN(d.getTime())
        ? d.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
    });

    const sortedDates = Object.keys(dateCounts).sort();
    let cumulative = 0;

    return sortedDates.map((dateStr) => {
      const daily = dateCounts[dateStr];
      cumulative += daily;
      const formatted = new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      return {
        date: formatted,
        fullDate: dateStr,
        daily,
        totalCumulative: cumulative
      };
    });
  }, [applications]);

  // Compute Application Status Distribution
  const statusDistribution = useMemo(() => {
    const statusCounts: Record<ApplicationStatus, number> = {
      Applied: 0,
      Reviewing: 0,
      Interview: 0,
      Offer: 0,
      Rejected: 0
    };

    applications.forEach((app) => {
      if (statusCounts[app.status] !== undefined) {
        statusCounts[app.status]++;
      } else {
        statusCounts['Applied']++;
      }
    });

    const STATUS_COLORS: Record<string, string> = {
      Applied: '#3b82f6',    // Blue
      Reviewing: '#f59e0b',  // Amber
      Interview: '#a855f7',  // Purple
      Offer: '#10b981',      // Emerald
      Rejected: '#64748b'    // Slate
    };

    return (['Applied', 'Reviewing', 'Interview', 'Offer', 'Rejected'] as ApplicationStatus[]).map((st) => ({
      name: st,
      value: statusCounts[st],
      color: STATUS_COLORS[st]
    }));
  }, [applications]);

  // KPI Metrics
  const kpiStats = useMemo(() => {
    const total = applications.length;
    const avgScore = total
      ? Math.round(applications.reduce((acc, a) => acc + (a.matchScore || 0), 0) / total)
      : 0;
    const interviewed = applications.filter(
      (a) => a.status === 'Interview' || a.status === 'Offer'
    ).length;
    const interviewRate = total ? Math.round((interviewed / total) * 100) : 0;
    const offers = applications.filter((a) => a.status === 'Offer').length;

    return { total, avgScore, interviewed, interviewRate, offers };
  }, [applications]);

  // New Job Modal state
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('HireSphere Tech');
  const [newLocation, setNewLocation] = useState('Remote (US)');
  const [newType, setNewType] = useState<Job['type']>('Remote');
  const [newDepartment, setNewDepartment] = useState('Engineering');
  const [newSalary, setNewSalary] = useState('$130,000 - $160,000 / yr');
  const [newLevel, setNewLevel] = useState<Job['experienceLevel']>('Senior');
  const [newDescription, setNewDescription] = useState('');
  const [newRequirements, setNewRequirements] = useState('');
  const [newBenefits, setNewBenefits] = useState('');
  const [newTags, setNewTags] = useState('React, Node.js, Express, MongoDB, Docker');

  const [isGeneratingJd, setIsGeneratingJd] = useState(false);
  const [isSavingJob, setIsSavingJob] = useState(false);

  // Handle AI Auto Generate Job Description
  const handleAiGenerateJd = async () => {
    if (!newTitle) {
      alert('Please enter a Job Title first (e.g. Senior MERN Engineer).');
      return;
    }

    setIsGeneratingJd(true);
    try {
      const res = await fetch('/api/ai/generate-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          department: newDepartment,
          seniority: newLevel,
          keySkills: newTags
        })
      });
      const data = await res.json();
      if (data.description) {
        setNewDescription(data.description);
      }
      if (Array.isArray(data.requirements)) {
        setNewRequirements(data.requirements.join('\n'));
      }
      if (Array.isArray(data.benefits)) {
        setNewBenefits(data.benefits.join('\n'));
      }
    } catch (err) {
      console.error('AI JD Generator failed:', err);
    } finally {
      setIsGeneratingJd(false);
    }
  };

  const handlePostJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingJob(true);
    try {
      await onJobCreate({
        title: newTitle,
        company: newCompany,
        location: newLocation,
        type: newType,
        department: newDepartment,
        salaryRange: newSalary,
        experienceLevel: newLevel,
        description: newDescription,
        requirements: newRequirements.split('\n').filter(Boolean),
        benefits: newBenefits.split('\n').filter(Boolean),
        tags: newTags.split(',').map((t) => t.trim())
      });
      setIsPostJobOpen(false);
      // Reset
      setNewTitle('');
      setNewDescription('');
      setNewRequirements('');
      setNewBenefits('');
    } catch (err) {
      console.error('Failed to post job:', err);
    } finally {
      setIsSavingJob(false);
    }
  };

  const filteredApplications = applications.filter((a) => {
    if (statusFilter === 'All') return true;
    return a.status === statusFilter;
  });

  const getStatusBadgeClass = (status: ApplicationStatus) => {
    switch (status) {
      case 'Applied':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Reviewing':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Interview':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Offer':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>Employer Hiring Workspace</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Applicant Tracking System (ATS)</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review candidate applications, track AI match scores, and publish new engineering job listings.
          </p>
        </div>

        <button
          id="post-job-btn"
          onClick={() => setIsPostJobOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Job Opening</span>
        </button>
      </div>

      {/* Visual Summary & Pipeline Analytics (Recharts Section) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Pipeline Analytics & Growth Overview</h2>
              <p className="text-xs text-slate-500">Visual application trend tracking and candidate stage distribution</p>
            </div>
          </div>

          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            {showAnalytics ? (
              <>
                <span>Collapse Summary</span>
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Expand Summary</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {showAnalytics && (
          <div className="space-y-6">
            {/* KPI Stat Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Applications</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-extrabold text-slate-900">{kpiStats.total}</span>
                  <Activity className="w-4 h-4 text-indigo-500" />
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Avg AI Match Score</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-extrabold text-indigo-600">{kpiStats.avgScore}%</span>
                  <Sparkles className="w-4 h-4 text-cyan-500" />
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Interview Rate</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-extrabold text-purple-600">{kpiStats.interviewRate}%</span>
                  <Award className="w-4 h-4 text-purple-500" />
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Offers Extended</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-extrabold text-emerald-600">{kpiStats.offers}</span>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
            </div>

            {/* Recharts 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Application Growth Over Time */}
              <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Application Growth Over Time</h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Cumulative Trend</span>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                        itemStyle={{ color: '#38bdf8' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Area type="monotone" dataKey="totalCumulative" name="Cumulative Total" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTotal)" />
                      <Area type="monotone" dataKey="daily" name="Daily New" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorDaily)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Distribution of Application Statuses */}
              <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Status Distribution</h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Candidate Pipeline Stage</span>
                </div>

                <div className="h-64 w-full flex flex-col sm:flex-row items-center justify-center gap-4">
                  <div className="h-56 w-full sm:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Status Legend List */}
                  <div className="w-full sm:w-1/2 space-y-2 pr-2">
                    {statusDistribution.map((st) => {
                      const percentage = kpiStats.total ? Math.round((st.value / kpiStats.total) * 100) : 0;
                      return (
                        <div key={st.name} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: st.color }}></span>
                            <span className="font-semibold text-slate-700">{st.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{st.value}</span>
                            <span className="text-[10px] font-medium text-slate-400">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Tabs */}
      <div className="flex items-center border-b border-slate-200 space-x-6 text-sm font-semibold text-slate-600">
        <button
          onClick={() => setActiveTab('applicants')}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'applicants'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Candidate Pipeline ({applications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'calendar'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Interview Schedule & Calendar ({allMasterCalendar.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'jobs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Manage Active Listings ({jobs.length})</span>
        </button>
      </div>

      {/* CANDIDATES PIPELINE TAB */}
      {activeTab === 'applicants' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-700">Filter Status:</span>
              {['All', 'Applied', 'Reviewing', 'Interview', 'Offer', 'Rejected'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-500">
              Showing {filteredApplications.length} candidate applications
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Candidate List Column */}
            <div className="lg:col-span-2 space-y-3">
              {filteredApplications.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
                  No applicants found under the selected status filter.
                </div>
              ) : (
                filteredApplications.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`bg-white rounded-xl border p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer ${
                      selectedApp?.id === app.id ? 'border-indigo-600 ring-2 ring-indigo-500/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">{app.applicantName}</h3>
                          {app.matchScore && (
                            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                              <Sparkles className="w-3 h-3" />
                              {app.matchScore}% AI Match
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 mt-0.5">
                          Applying for <span className="font-semibold text-slate-700">{app.jobTitle}</span> ({app.experienceYears} yrs exp)
                        </p>
                      </div>

                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusBadgeClass(app.status)}`}>
                        {app.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 mt-2 bg-slate-50 p-2 rounded border border-slate-100">
                      {app.resumeText}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                      <span className="text-indigo-600 font-medium flex items-center gap-1">
                        View Full Resume & Analysis <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Candidate Detail Drawer/Sidebar */}
            <div className="lg:col-span-1">
              {selectedApp ? (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs sticky top-20 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-sm">Applicant Details</h3>
                    <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-slate-600">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-base">{selectedApp.applicantName}</h4>
                      {selectedApp.matchScore && (
                        <span className="text-xs font-extrabold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-lg">
                          {selectedApp.matchScore}% Match
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedApp.applicantEmail} • {selectedApp.applicantPhone}</p>
                    <p className="text-xs font-medium text-slate-700 mt-1">Role: {selectedApp.jobTitle}</p>
                  </div>

                  {/* Pipeline Action Modifier */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                    <label className="block text-xs font-bold text-slate-700">Update Pipeline Status:</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['Applied', 'Reviewing', 'Interview', 'Offer', 'Rejected'] as ApplicationStatus[]).map((st) => (
                        <button
                          key={st}
                          onClick={() => {
                            onStatusUpdate(selectedApp.id, st);
                            setSelectedApp({ ...selectedApp, status: st });
                          }}
                          className={`text-xs py-1.5 px-2 rounded-md font-semibold transition-colors ${
                            selectedApp.status === st
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interview Calendar Proposer Tool */}
                  <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-indigo-950 font-bold text-xs uppercase tracking-wider">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        <span>Interview Calendar & Slots</span>
                      </div>
                      <button
                        onClick={() => setIsSchedulingOpen(!isSchedulingOpen)}
                        className="text-[11px] font-bold px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        {isSchedulingOpen ? 'Close' : 'Propose Time Slot'}
                      </button>
                    </div>

                    {/* Form to Propose Interview Slot */}
                    {isSchedulingOpen && (
                      <form onSubmit={handleScheduleInterview} className="bg-white p-3 rounded-lg border border-indigo-200 shadow-2xs space-y-3 text-xs">
                        <h6 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-1.5">
                          Propose Interview Time Slot to {selectedApp.applicantName}
                        </h6>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Date</label>
                            <input
                              type="date"
                              value={interviewDate}
                              onChange={(e) => setInterviewDate(e.target.value)}
                              required
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Start & End Time</label>
                            <div className="flex items-center gap-1">
                              <input
                                type="time"
                                value={interviewStartTime}
                                onChange={(e) => setInterviewStartTime(e.target.value)}
                                required
                                className="w-1/2 px-1.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                              />
                              <span className="text-slate-400">-</span>
                              <input
                                type="time"
                                value={interviewEndTime}
                                onChange={(e) => setInterviewEndTime(e.target.value)}
                                required
                                className="w-1/2 px-1.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Round Type</label>
                            <select
                              value={interviewType}
                              onChange={(e) => setInterviewType(e.target.value as any)}
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                            >
                              <option value="Screening">Screening Call</option>
                              <option value="Technical Round">Technical Round</option>
                              <option value="Hiring Manager">Hiring Manager</option>
                              <option value="Culture Fit">Culture Fit</option>
                              <option value="Final Round">Final Round</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Format / Location</label>
                            <select
                              value={interviewFormat}
                              onChange={(e) => setInterviewFormat(e.target.value as any)}
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                            >
                              <option value="Google Meet">Google Meet</option>
                              <option value="Zoom">Zoom Video</option>
                              <option value="Phone Call">Phone Call</option>
                              <option value="In-Person">In-Person</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Interviewer Name / Title</label>
                          <input
                            type="text"
                            value={interviewerName}
                            onChange={(e) => setInterviewerName(e.target.value)}
                            placeholder="e.g. Sarah Jenkins (Tech Lead)"
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                            Meeting Link <span className="text-slate-400 font-normal">(Auto-generated if empty)</span>
                          </label>
                          <input
                            type="url"
                            value={meetingLink}
                            onChange={(e) => setMeetingLink(e.target.value)}
                            placeholder="https://meet.google.com/..."
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Notes / Agenda for Candidate</label>
                          <textarea
                            rows={2}
                            value={interviewNotes}
                            onChange={(e) => setInterviewNotes(e.target.value)}
                            placeholder="Provide instructions or preparation notes..."
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs resize-none"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setIsSchedulingOpen(false)}
                            className="px-3 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 font-medium rounded-lg text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingInterview}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            {isSubmittingInterview ? 'Scheduling...' : 'Send Interview Proposal'}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Scheduled/Proposed Slots List */}
                    <div className="space-y-2">
                      {appInterviews.length > 0 ? (
                        appInterviews.map((slot) => (
                          <div key={slot.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900 text-xs">{slot.type}</span>
                                  <span className="bg-indigo-100 text-indigo-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                    {slot.format}
                                  </span>
                                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                    {slot.status}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1 font-medium">
                                  <Clock className="w-3 h-3 text-indigo-600" />
                                  {new Date(slot.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} • {slot.startTime} - {slot.endTime}
                                </p>
                                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <User className="w-3 h-3 text-slate-400" />
                                  Interviewer: <span className="font-semibold text-slate-700">{slot.interviewerName}</span>
                                </p>
                              </div>

                              <button
                                onClick={() => handleDeleteInterview(slot.id)}
                                title="Cancel Interview Slot"
                                className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {slot.notes && (
                              <p className="text-[11px] bg-slate-50 p-2 rounded border border-slate-100 text-slate-600">
                                <span className="font-semibold text-slate-700">Agenda:</span> {slot.notes}
                              </p>
                            )}

                            {/* Calendar Export & Link Actions */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-1.5 text-[11px]">
                              {slot.meetingLink && (
                                <a
                                  href={slot.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded border border-indigo-100"
                                >
                                  <Video className="w-3 h-3" /> Join Video Call <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}

                              <div className="flex items-center gap-1.5 ml-auto">
                                <a
                                  href={getGoogleCalendarUrl(slot)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded flex items-center gap-1 transition-colors"
                                  title="Add to Google Calendar"
                                >
                                  <Calendar className="w-3 h-3 text-emerald-600" /> Google Cal
                                </a>

                                <button
                                  onClick={() => downloadIcsFile(slot)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Download .ics Calendar Invite File"
                                >
                                  <Download className="w-3 h-3 text-blue-600" /> .ics File
                                </button>

                                <button
                                  onClick={() => copyInviteText(slot)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Copy Email Invitation Text"
                                >
                                  {copiedSlotId === slot.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-600" /> Copied!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 text-slate-500" /> Copy Invite
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 italic bg-white p-3 rounded-lg text-center border border-dashed border-indigo-200">
                          No interview slots scheduled yet. Click <strong>"Propose Time Slot"</strong> above to schedule a candidate interview.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* AI Match Analysis Details */}
                  {selectedApp.matchAnalysis && (
                    <div className="bg-gradient-to-br from-indigo-50/80 to-blue-50/80 border border-indigo-100 rounded-lg p-3.5 space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 text-indigo-900 font-bold">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>AI Hiring Evaluation</span>
                      </div>
                      <p className="text-slate-700 font-medium">{selectedApp.matchAnalysis.recommendation}</p>

                      {selectedApp.matchAnalysis.strengths.length > 0 && (
                        <div>
                          <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mt-1">Strengths:</p>
                          <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                            {selectedApp.matchAnalysis.strengths.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedApp.matchAnalysis.missingSkills.length > 0 && (
                        <div>
                          <p className="font-bold text-amber-800 text-[11px] uppercase tracking-wider mt-1">Skills Gaps:</p>
                          <ul className="list-disc list-inside text-amber-700 space-y-0.5">
                            {selectedApp.matchAnalysis.missingSkills.map((m, i) => (
                              <li key={i}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Resume & Cover Letter Text */}
                  <div className="space-y-2 text-xs">
                    <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Resume / Summary</h5>
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-700 max-h-40 overflow-y-auto font-mono text-[11px]">
                      {selectedApp.resumeText}
                    </div>

                    {selectedApp.coverLetter && (
                      <>
                        <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mt-2">Cover Letter</h5>
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-700 max-h-32 overflow-y-auto">
                          {selectedApp.coverLetter}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Real-Time Live Team Discussion / Notes */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-600" /> Live Team Notes & Discussion
                      </h5>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Radio className="w-2.5 h-2.5 text-emerald-500 animate-pulse" /> Live Sync
                      </span>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {comments.length > 0 ? (
                        comments.map((c) => (
                          <div key={c.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-xs space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-800">{c.author}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-600 leading-snug">{c.text}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic bg-slate-50/50 p-3 rounded-lg text-center border border-dashed border-slate-200">
                          No notes posted yet. Add a live comment below to collaborate in real-time.
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Add candidate note..."
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                        className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={handlePostComment}
                        disabled={!newCommentText.trim()}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-400 text-xs">
                  Click on any candidate application to review resume, AI match breakdown, and move through hiring pipeline.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* INTERVIEW SCHEDULE & MASTER CALENDAR TAB */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Calendar Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
                    <Calendar className="w-5 h-5" />
                  </span>
                  <h2 className="text-xl font-bold tracking-tight">Recruiter Interview Schedule & Calendar Tool</h2>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 max-w-2xl">
                  Propose interview time slots, coordinate Google Meet video calls, track candidate confirmations, and sync calendar invitations across your recruitment pipeline.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchMasterCalendar}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> Refresh Sync
                </button>
              </div>
            </div>

            {/* Quick KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Scheduled</p>
                <p className="text-xl font-bold text-white mt-0.5">{allMasterCalendar.length}</p>
              </div>

              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Google Meet Sessions</p>
                <p className="text-xl font-bold text-indigo-300 mt-0.5">
                  {allMasterCalendar.filter((i) => i.format === 'Google Meet').length}
                </p>
              </div>

              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Technical Rounds</p>
                <p className="text-xl font-bold text-cyan-300 mt-0.5">
                  {allMasterCalendar.filter((i) => i.type === 'Technical Round').length}
                </p>
              </div>

              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Confirmed Slots</p>
                <p className="text-xl font-bold text-emerald-400 mt-0.5">
                  {allMasterCalendar.filter((i) => i.status === 'Confirmed' || i.status === 'Proposed').length}
                </p>
              </div>
            </div>
          </div>

          {/* Master Calendar Slots Grid / Timeline */}
          {allMasterCalendar.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Interviews Scheduled Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Head over to the <strong>Candidate Pipeline</strong> tab, select an applicant, and click <strong>"Propose Time Slot"</strong> to schedule candidate interviews and generate meeting links.
              </p>
              <button
                onClick={() => setActiveTab('applicants')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Users className="w-4 h-4" /> Go to Candidate Pipeline
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allMasterCalendar.map((slot) => (
                <div key={slot.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-all space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {slot.type}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">{slot.applicantName}</h4>
                        <p className="text-xs text-slate-500 font-medium">{slot.jobTitle} • {slot.company}</p>
                      </div>

                      <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-700">
                        {slot.format}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-3 text-xs">
                      <p className="flex items-center gap-2 font-semibold text-slate-800">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        {new Date(slot.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-slate-600 pl-6 font-mono font-medium text-[11px]">
                        {slot.startTime} - {slot.endTime}
                      </p>

                      <p className="flex items-center gap-2 text-slate-600 mt-2">
                        <User className="w-4 h-4 text-slate-400" />
                        Interviewer: <span className="font-bold text-slate-800">{slot.interviewerName}</span>
                      </p>

                      {slot.notes && (
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-600 text-[11px] italic mt-2">
                          "{slot.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    {slot.meetingLink && (
                      <a
                        href={slot.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Video className="w-3.5 h-3.5" /> Launch Video Call <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <a
                        href={getGoogleCalendarUrl(slot)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Google Cal
                      </a>

                      <button
                        onClick={() => downloadIcsFile(slot)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-600" /> .ics File
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* JOBS LISTING MANAGEMENT TAB */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{job.title}</h3>
                    <p className="text-xs text-slate-500">{job.company} • {job.location}</p>
                  </div>
                  <button
                    onClick={() => onJobDelete(job.id)}
                    className="text-rose-500 hover:text-rose-700 p-1 bg-rose-50 rounded-md transition-colors"
                    title="Delete Job"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                  <span><strong>Salary:</strong> {job.salaryRange}</span>
                  <span><strong>Applicants:</strong> {job.applicantsCount}</span>
                  <span className="text-emerald-600 font-semibold uppercase">Active</span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">{job.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* POST NEW JOB MODAL */}
      {isPostJobOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="bg-slate-900 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Create Job Listing</span>
                <h3 className="text-lg font-bold text-white mt-0.5">Post New Engineering Opening</h3>
              </div>
              <button onClick={() => setIsPostJobOpen(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostJobSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Senior Full-Stack Engineer (MERN)"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Seniority</label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Entry-level">Entry-level</option>
                    <option value="Mid-level">Mid-level</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead / Executive">Lead / Executive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tags / Key Skills</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="React, Node.js, Express, MongoDB, Docker"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* AI Auto Generator Tool Banner */}
              <div className="bg-gradient-to-r from-indigo-50 via-cyan-50 to-blue-50 border border-indigo-200 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-900">AI Auto-Generator</span>
                  <span className="text-xs text-indigo-700 hidden sm:inline">
                    Instantly draft description and requirements with Gemini AI
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAiGenerateJd}
                  disabled={isGeneratingJd}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  {isGeneratingJd ? 'Generating...' : 'Auto-Generate JD'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Description *</label>
                <textarea
                  rows={3}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe the responsibilities and scope of this position..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Requirements (One per line)</label>
                <textarea
                  rows={3}
                  value={newRequirements}
                  onChange={(e) => setNewRequirements(e.target.value)}
                  placeholder="5+ years MERN experience&#10;Expertise in Docker containerization&#10;Strong API security background"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPostJobOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingJob}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-6 py-2.5 rounded-lg shadow-sm"
                >
                  {isSavingJob ? 'Saving Listing...' : 'Publish Job Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
