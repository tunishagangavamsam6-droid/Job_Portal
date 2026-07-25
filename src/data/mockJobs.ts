import { Job, Application } from '../types';

export const INITIAL_JOBS: Job[] = [
  {
    id: 'job-1',
    title: 'Senior Full-Stack Engineer (MERN)',
    company: 'CloudScale Technologies',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
    location: 'San Francisco, CA (Hybrid)',
    type: 'Hybrid',
    department: 'Engineering',
    salaryRange: '$140,000 - $175,000 / yr',
    experienceLevel: 'Senior',
    description: 'We are seeking an experienced Senior Full-Stack Engineer to lead the architecture and developer platform for our high-throughput enterprise SaaS products. You will work closely with product and engineering teams to build resilient React frontends and Node.js microservices.',
    requirements: [
      '5+ years of experience with React, Express, Node.js, and MongoDB',
      'Proven background building scalable REST and GraphQL APIs',
      'Strong expertise in TypeScript, Docker containerization, and CI/CD pipelines',
      'Experience with database indexing, Redis caching, and WebSockets',
      'Familiarity with cloud hosting on Vercel, AWS, or GCP Cloud Run'
    ],
    benefits: [
      'Flexible remote/hybrid work structure',
      '$3,000 annual home office & learning stipend',
      '100% employer-paid health, dental, & vision insurance',
      '401(k) matching up to 5%',
      'Unlimited Paid Time Off (PTO)'
    ],
    postedAt: '2026-07-22',
    applicantsCount: 14,
    status: 'active',
    tags: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'Docker']
  },
  {
    id: 'job-2',
    title: 'Backend DevOps & Cloud Engineer',
    company: 'Apex Cloud Solutions',
    logoUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=120&auto=format&fit=crop&q=80',
    location: 'Remote (US/Canada)',
    type: 'Remote',
    department: 'DevOps / Infrastructure',
    salaryRange: '$150,000 - $190,000 / yr',
    experienceLevel: 'Senior',
    description: 'Join our cloud platform squad responsible for multi-region container orchestration, automated deployment pipelines, database clustering, and security monitoring across GCP and Railway environments.',
    requirements: [
      '4+ years managing production Kubernetes or Cloud Run infrastructure',
      'Deep expertise in Docker, Terraform, Docker Compose, and GitHub Actions',
      'Solid experience with MongoDB Atlas multi-node replica sets and PostgreSQL',
      'Strong knowledge of SSL/TLS certificates, CORS security, and IAM rules',
      'Bash/Python scripting for automated database migrations and backups'
    ],
    benefits: [
      '100% Remote flexibility worldwide',
      'Quarterly company offsites in scenic destinations',
      'Competitive equity stock options',
      'Latest M3 Max MacBook Pro hardware provided'
    ],
    postedAt: '2026-07-20',
    applicantsCount: 9,
    status: 'active',
    tags: ['DevOps', 'Docker', 'MongoDB', 'Render', 'Vercel', 'AWS']
  },
  {
    id: 'job-3',
    title: 'Frontend Developer (Next.js / Tailwind CSS)',
    company: 'PixelCraft Design Studios',
    logoUrl: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=120&auto=format&fit=crop&q=80',
    location: 'Austin, TX (On-site)',
    type: 'Full-time',
    department: 'Design & Product',
    salaryRange: '$110,000 - $135,000 / yr',
    experienceLevel: 'Mid-level',
    description: 'PixelCraft is looking for a passionate Frontend Developer to craft sleek, responsive web interfaces, fluid animations, and accessible user experiences for top-tier digital products.',
    requirements: [
      '3+ years crafting web UIs using Next.js (App Router), React, and Tailwind CSS',
      'Expertise in web performance optimization, core web vitals, and accessibility (WCAG AA)',
      'Experience integrating headless APIs, Framer Motion, and state management (Zustand/Redux)',
      'Eye for design details, pixel-perfect accuracy, and responsive grid layouts'
    ],
    benefits: [
      'Modern open office in downtown Austin with stocked snack kitchen',
      'Wellness stipend & gym membership',
      'Annual bonus structure based on company targets'
    ],
    postedAt: '2026-07-18',
    applicantsCount: 22,
    status: 'active',
    tags: ['Next.js', 'Tailwind', 'TypeScript', 'React', 'Framer Motion']
  },
  {
    id: 'job-4',
    title: 'AI Platform & Data Systems Architect',
    company: 'NeuralFlow AI',
    logoUrl: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=120&auto=format&fit=crop&q=80',
    location: 'New York, NY (Hybrid)',
    type: 'Hybrid',
    department: 'AI & Data Science',
    salaryRange: '$170,000 - $220,000 / yr',
    experienceLevel: 'Lead / Executive',
    description: 'Lead the architecture of our next-gen generative AI orchestrator powered by Gemini 3.6 Flash, vector databases, and real-time streaming microservices.',
    requirements: [
      '6+ years in software architecture, distributed systems, and ML pipeline integration',
      'Hands-on experience with LLM APIs (Gemini, OpenAI), prompt engineering, and RAG architectures',
      'Proficiency in Node.js/TypeScript, Python, FastAPI, and MongoDB Vector Search',
      'Deep understanding of API rate limiting, streaming SSE responses, and token optimization'
    ],
    benefits: [
      'Executive-level base salary + high-upside equity',
      'Comprehensive family health care package',
      'Flexible work-from-home schedule'
    ],
    postedAt: '2026-07-15',
    applicantsCount: 6,
    status: 'active',
    tags: ['AI', 'Gemini API', 'Node.js', 'MongoDB', 'Python']
  }
];

export const INITIAL_APPLICATIONS: Application[] = [
  {
    id: 'app-101',
    jobId: 'job-1',
    jobTitle: 'Senior Full-Stack Engineer (MERN)',
    company: 'CloudScale Technologies',
    applicantName: 'Alex Rivera',
    applicantEmail: 'alex.rivera@devmail.io',
    applicantPhone: '+1 (555) 234-5678',
    experienceYears: 6,
    resumeText: 'Full-Stack Developer with 6 years experience specializing in MERN stack, Next.js, TypeScript, Express REST APIs, MongoDB Atlas indexing, Docker containerization, and Vercel/Render deployments. Successfully built and scaled 3 SaaS applications to over 100k active users.',
    coverLetter: 'I am excited to apply for the Senior Full-Stack role. My background in building resilient microservices with Node.js and MongoDB aligns perfectly with CloudScale\'s platform objectives.',
    portfolioUrl: 'https://alexrivera.dev',
    githubUrl: 'https://github.com/alexrivera-dev',
    matchScore: 92,
    matchAnalysis: {
      strengths: ['6 years MERN stack experience', 'Proven Docker & deployment knowledge', 'MongoDB Atlas performance tuning'],
      missingSkills: ['GraphQL (preferred skill)'],
      recommendation: 'Strong Candidate: High technical alignment with core stack requirements.',
      keyHighlights: ['Scaled 3 SaaS products to 100k users', 'Expert in TypeScript and Node.js']
    },
    status: 'Interview',
    appliedAt: '2026-07-23T14:30:00Z',
    notes: 'Scheduled round 1 technical interview for Thursday.'
  },
  {
    id: 'app-102',
    jobId: 'job-1',
    jobTitle: 'Senior Full-Stack Engineer (MERN)',
    company: 'CloudScale Technologies',
    applicantName: 'Samantha Chen',
    applicantEmail: 'sam.chen@techline.com',
    applicantPhone: '+1 (555) 876-5432',
    experienceYears: 4,
    resumeText: 'Software Engineer experienced in React, Express, Node.js, and PostgreSQL. Passionate about UI design, responsive Tailwind styling, and unit testing with Jest and Playwright.',
    coverLetter: 'I would love to contribute to CloudScale. I have strong React skills and solid Node experience.',
    portfolioUrl: 'https://samchen.design',
    matchScore: 78,
    matchAnalysis: {
      strengths: ['Solid React & Node foundations', 'Great testing and UI skills'],
      missingSkills: ['MongoDB Atlas experience (used PostgreSQL)', 'Docker containerization experience'],
      recommendation: 'Moderate Candidate: Strong frontend background, may need onboarding for MongoDB Atlas and Docker.',
      keyHighlights: ['4 years software development experience']
    },
    status: 'Reviewing',
    appliedAt: '2026-07-24T09:15:00Z'
  },
  {
    id: 'app-103',
    jobId: 'job-2',
    jobTitle: 'Backend DevOps & Cloud Engineer',
    company: 'Apex Cloud Solutions',
    applicantName: 'David Miller',
    applicantEmail: 'd.miller@opscloud.org',
    applicantPhone: '+1 (555) 345-6789',
    experienceYears: 5,
    resumeText: 'DevOps Engineer with 5 years experience in Terraform, Docker, Kubernetes, CI/CD with GitHub Actions, Render, AWS, and GCP Cloud Run. Extensive work in automated MongoDB backups, CORS header policies, and zero-downtime rolling deployments.',
    matchScore: 95,
    matchAnalysis: {
      strengths: ['5 years DevOps & Kubernetes experience', 'Strong Docker & Terraform expertise', 'Deep understanding of cloud security & CORS'],
      missingSkills: [],
      recommendation: 'Top Candidate: Exceptional fit for cloud infrastructure team.',
      keyHighlights: ['Zero-downtime deployment pipelines', 'Terraform & GCP specialist']
    },
    status: 'Offer',
    appliedAt: '2026-07-21T11:00:00Z',
    notes: 'Sent preliminary offer letter.'
  }
];
