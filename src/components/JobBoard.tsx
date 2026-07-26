import React, { useState } from 'react';
import { Search, MapPin, DollarSign, Briefcase, Sparkles, Filter, X, Send, CheckCircle, FileText, ArrowRight } from 'lucide-react';
import { Job, Application } from '../types';

interface JobBoardProps {
  jobs: Job[];
  onApplySubmit: (applicationData: Partial<Application>) => Promise<void>;
  appliedJobIds: string[];
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

export const JobBoard: React.FC<JobBoardProps> = ({
  jobs,
  onApplySubmit,
  appliedJobIds,
  searchTerm: externalSearchTerm,
  setSearchTerm: externalSetSearchTerm
}) => {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const activeSearchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;

  const handleSearchChange = (val: string) => {
    if (externalSetSearchTerm) {
      externalSetSearchTerm(val);
    }
    setInternalSearchTerm(val);
  };

  const [typeFilter, setTypeFilter] = useState('All');
  const [levelFilter, setLevelFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  // Application form fields
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [experienceYears, setExperienceYears] = useState('4');
  const [resumeText, setResumeText] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Filter jobs logic
  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      !activeSearchTerm.trim() ||
      j.title.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
      j.company.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
      j.location.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
      j.description.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
      j.tags.some((t) => t.toLowerCase().includes(activeSearchTerm.toLowerCase()));

    const matchesType = typeFilter === 'All' || j.type === typeFilter;
    const matchesLevel = levelFilter === 'All' || j.experienceLevel === levelFilter;
    const matchesDepartment = departmentFilter === 'All' || j.department === departmentFilter;

    return matchesSearch && matchesType && matchesLevel && matchesDepartment;
  });

  const handleOpenApply = (job: Job) => {
    setSelectedJob(job);
    setIsApplyOpen(true);
    setSubmitSuccess(false);
  };

  const handleFillSampleResume = () => {
    setApplicantName('Jordan Vance');
    setApplicantEmail('jordan.vance@devmail.io');
    setApplicantPhone('+1 (555) 901-2345');
    setExperienceYears('5');
    setResumeText(
      `Full-Stack Software Engineer with 5 years experience specializing in MERN stack (MongoDB, Express, React, Node.js), Next.js, and TypeScript. Experienced in Docker containerization, cloud deployment to Vercel/Render, CI/CD with GitHub Actions, REST API security, and database query optimization.`
    );
    setCoverLetter(
      `Dear Hiring Manager,\n\nI am thrilled to submit my application for the ${selectedJob?.title} position at ${selectedJob?.company}. With 5 years of experience building scalable web applications and cloud services, I am confident I can bring immediate value to your team.\n\nBest regards,\nJordan Vance`
    );
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    setIsSubmitting(true);
    try {
      await onApplySubmit({
        jobId: selectedJob.id,
        applicantName,
        applicantEmail,
        applicantPhone,
        experienceYears: Number(experienceYears),
        resumeText,
        coverLetter
      });
      setSubmitSuccess(true);
    } catch (err) {
      console.error('Failed to submit application', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-[#f8fafc] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-10 text-white shadow-xl mb-8 border border-indigo-900/50">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Job Portal Management System</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Explore Open Positions & Manage Candidate Applications
          </h1>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            Discover verified tech roles, submit applications, and leverage real-time AI resume matching tailored to every job description.
          </p>
        </div>

        {/* Integrated Search Bar */}
        <div className="mt-6 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 bg-slate-900/80 px-3.5 py-2.5 rounded-lg border border-slate-700">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              id="job-search-input"
              type="text"
              placeholder="Search by title, skill (React, Docker, MongoDB), or company..."
              value={activeSearchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-transparent text-white placeholder-slate-400 text-sm focus:outline-none w-full"
            />
            {activeSearchTerm && (
              <button onClick={() => handleSearchChange('')} className="text-slate-400 hover:text-white" title="Clear search">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              id="filter-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-900/80 text-slate-200 text-xs sm:text-sm px-3 py-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Contract">Contract</option>
            </select>

            <select
              id="filter-level"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="bg-slate-900/80 text-slate-200 text-xs sm:text-sm px-3 py-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Seniority</option>
              <option value="Entry-level">Entry-level</option>
              <option value="Mid-level">Mid-level</option>
              <option value="Senior">Senior</option>
              <option value="Lead / Executive">Lead / Executive</option>
            </select>

            <select
              id="filter-department"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-slate-900/80 text-slate-200 text-xs sm:text-sm px-3 py-2.5 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="DevOps / Infrastructure">DevOps / Infrastructure</option>
              <option value="Design & Product">Design & Product</option>
              <option value="AI & Data Science">AI & Data Science</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Job Listings Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              <span>Available Openings</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                {filteredJobs.length}
              </span>
            </h2>
            {(typeFilter !== 'All' || levelFilter !== 'All' || departmentFilter !== 'All' || activeSearchTerm !== '') && (
              <button
                onClick={() => {
                  handleSearchChange('');
                  setTypeFilter('All');
                  setLevelFilter('All');
                  setDepartmentFilter('All');
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Reset Filters
              </button>
            )}
          </div>

          {filteredJobs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No jobs match your current search</h3>
              <p className="text-xs text-slate-500 mt-1">Try clearing filters or searching for terms like "React", "Docker", or "Node.js".</p>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const isApplied = appliedJobIds.includes(job.id);
              return (
                <div
                  key={job.id}
                  id={`job-card-${job.id}`}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all border-l-4 border-l-indigo-600 relative group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <img
                        src={job.logoUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80'}
                        alt={job.company}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 shadow-xs flex-shrink-0"
                      />
                      <div>
                        <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                          {job.title}
                        </h3>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">{job.company}</p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                            {job.salaryRange}
                          </span>
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium text-[11px]">
                            {job.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Apply / Applied Button */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                      {isApplied ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Applied
                        </span>
                      ) : (
                        <button
                          id={`apply-btn-${job.id}`}
                          onClick={() => handleOpenApply(job)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                        >
                          <span>Apply Now</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className="text-[11px] text-slate-400">Posted {job.postedAt}</span>
                    </div>
                  </div>

                  {/* Requirements Tags */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {job.tags.map((tag) => (
                        <span key={tag} className="bg-slate-100 text-slate-600 text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                    >
                      View Details & Requirements →
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar: Selected Job Details or Career Tips */}
        <div className="lg:col-span-1">
          {selectedJob ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm sticky top-20">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">
                  Job Details
                </span>
                <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4">
                <h3 className="text-xl font-bold text-slate-900">{selectedJob.title}</h3>
                <p className="text-xs font-medium text-slate-600 mt-1">{selectedJob.company} • {selectedJob.location}</p>

                <div className="mt-3 bg-slate-50 p-3 rounded-lg text-xs space-y-1.5 text-slate-700 border border-slate-100">
                  <p><span className="font-semibold text-slate-900">Salary:</span> {selectedJob.salaryRange}</p>
                  <p><span className="font-semibold text-slate-900">Experience:</span> {selectedJob.experienceLevel}</p>
                  <p><span className="font-semibold text-slate-900">Department:</span> {selectedJob.department}</p>
                </div>

                <div className="mt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Description</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{selectedJob.description}</p>
                </div>

                <div className="mt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Key Requirements</h4>
                  <ul className="text-xs text-slate-600 space-y-1.5">
                    {selectedJob.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1 flex-shrink-0"></span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Perks & Benefits</h4>
                    <ul className="text-xs text-slate-600 space-y-1">
                      {selectedJob.benefits.map((ben, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span>{ben}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-slate-100">
                  {appliedJobIds.includes(selectedJob.id) ? (
                    <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold p-3 rounded-lg text-center border border-emerald-200">
                      You have submitted an application for this position.
                    </div>
                  ) : (
                    <button
                      id="sidebar-apply-btn"
                      onClick={() => handleOpenApply(selectedJob)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" /> Apply for Position
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-5">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>AI Resume Optimization</span>
                </div>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  When you apply through HireSphere, our Gemini 3.6 Flash engine evaluates your resume against the job description in real-time to provide immediate match analytics and feedback.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Popular Tech Stacks</h4>
                <div className="flex flex-wrap gap-1.5">
                  {['React 19', 'Next.js App Router', 'Node.js Express', 'MongoDB Atlas', 'Docker Compose', 'Vercel Deploy', 'Render/Railway', 'CORS Security', 'JWT Auth'].map((stack) => (
                    <span
                      key={stack}
                      onClick={() => handleSearchChange(stack.split(' ')[0])}
                      className="cursor-pointer bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium transition-colors"
                    >
                      {stack}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Application Modal */}
      {isApplyOpen && selectedJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Job Application</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedJob.title}</h3>
                <p className="text-xs text-slate-300">{selectedJob.company} • {selectedJob.location}</p>
              </div>
              <button onClick={() => setIsApplyOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {submitSuccess ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">Application Submitted!</h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Your application has been received by <span className="font-semibold text-slate-800">{selectedJob.company}</span>.
                    An AI match score has been generated and appended to your profile in the employer portal.
                  </p>
                  <button
                    onClick={() => {
                      setIsApplyOpen(false);
                      setSubmitSuccess(false);
                    }}
                    className="bg-slate-900 text-white text-xs font-semibold px-6 py-2.5 rounded-lg hover:bg-slate-800"
                  >
                    Back to Jobs
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitApplication} className="space-y-4">
                  <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    <div className="flex items-center gap-2 text-xs font-medium text-indigo-900">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span>Need sample test data?</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleFillSampleResume}
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded font-semibold transition-colors"
                    >
                      Auto-Fill Sample Resume
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        placeholder="e.g. Alex Rivera"
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={applicantEmail}
                        onChange={(e) => setApplicantEmail(e.target.value)}
                        placeholder="alex@example.com"
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Years of Experience</label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Resume / Skills Summary *</label>
                    <textarea
                      rows={4}
                      required
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Paste your resume summary, tech stack experience, key projects, and achievements here..."
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cover Letter (Optional)</label>
                    <textarea
                      rows={3}
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Why are you a great fit for this role?"
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsApplyOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-6 py-2.5 rounded-lg shadow-sm flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          <span>Running AI Analysis & Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Application</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
