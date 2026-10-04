export type OpportunityType = "Job" | "Grant" | "Hackathon" | "Fellowship" | "Competition" | "Funding" | "Other";

export interface MockOpportunity {
  id: string;
  title: string;
  organization: string;
  type: OpportunityType;
  description: string;
  location?: string;
  remote?: boolean;
  deadline?: string;
  skills?: string[];
  matchScore?: number;
  matchReasons?: string[];
  eligibility?: string;
  applicationUrl?: string;
  amount?: string;
}

export const MOCK_OPPORTUNITIES: MockOpportunity[] = [
  {
    id: "opp-1",
    title: "Senior Full-Stack Engineer",
    organization: "Vercel",
    type: "Job",
    description: "Join the framework team to build the future of Next.js and frontend infrastructure. We are looking for experienced engineers passionate about web performance and developer experience.",
    location: "Remote (Global)",
    remote: true,
    deadline: "In 14 days",
    matchScore: 96,
    skills: ["TypeScript", "Next.js", "Serverless", "React"],
    matchReasons: ["Strong match with TypeScript experience", "Aligns with desired role: Frontend Engineer"],
    eligibility: "Open to global applicants with 5+ years of experience.",
    applicationUrl: "https://vercel.com/careers",
  },
  {
    id: "opp-2",
    title: "Global Climate Innovation Grant",
    organization: "Earth Foundation",
    type: "Grant",
    description: "Non-dilutive funding for early-stage startups building scalable solutions to climate change. Focus on carbon capture and renewable energy storage.",
    location: "Worldwide",
    remote: true,
    deadline: "In 21 days",
    matchScore: 91,
    skills: ["Climate Tech", "Hardware", "Research"],
    amount: "$50k - $150k",
    matchReasons: ["Matches interest in climate technology", "Fits funding requirements"],
    eligibility: "Early-stage startups with a working prototype.",
  },
  {
    id: "opp-3",
    title: "AI Systems & Intelligence Hackathon",
    organization: "Anthropic",
    type: "Hackathon",
    description: "Build the next generation of safe and constitutional AI applications. Access to unreleased Claude models and mentorship from core researchers.",
    location: "Online",
    remote: true,
    deadline: "In 5 days",
    matchScore: 88,
    skills: ["Generative AI", "Python", "Prompt Engineering"],
    amount: "$100k Prize Pool",
    matchReasons: ["Matches interest in Generative AI", "Timeline fits availability"],
    eligibility: "Open to all developers worldwide.",
  },
  {
    id: "opp-4",
    title: "Open Source Fellowship 2026",
    organization: "Mozilla Foundation",
    type: "Fellowship",
    description: "A 6-month paid fellowship to work on critical open-source infrastructure supporting privacy and decentralization on the web.",
    location: "Remote (Global)",
    remote: true,
    deadline: "In 30 days",
    matchScore: 89,
    skills: ["Open Source", "Rust", "WebAssembly"],
    amount: "$60,000 Stipend",
    matchReasons: ["Matches interest in open source and privacy"],
    eligibility: "Must have previous contributions to open source projects.",
  },
  {
    id: "opp-5",
    title: "Product Engineer",
    organization: "Linear",
    type: "Job",
    description: "Help us build the standard for modern software development tools. You will work across the stack to build fast, beautiful, and intuitive interfaces.",
    location: "Remote (US/EU)",
    remote: true,
    deadline: "In 10 days",
    matchScore: 94,
    skills: ["TypeScript", "React", "GraphQL", "MobX"],
    matchReasons: ["Matches preferred tech stack", "Aligns with product engineering focus"],
    eligibility: "Must be located in US or EU timezones.",
  },
  {
    id: "opp-6",
    title: "Y Combinator Winter 2027",
    organization: "Y Combinator",
    type: "Funding",
    description: "The premier startup accelerator program. Receive funding, mentorship, and access to the world's most powerful alumni network.",
    location: "San Francisco, CA",
    remote: false,
    deadline: "In 45 days",
    matchScore: 85,
    skills: ["Startups", "Founder", "B2B SaaS"],
    amount: "$500k Investment",
    matchReasons: ["Matches long-term goal of founding a startup"],
    eligibility: "Open to early-stage founders globally. Must relocate to SF for 3 months.",
  },
  {
    id: "opp-7",
    title: "Robotics Perception Challenge",
    organization: "Boston Dynamics",
    type: "Competition",
    description: "Develop novel computer vision algorithms for dynamic environments. Winning algorithms will be tested on Spot and Atlas.",
    location: "Online",
    remote: true,
    deadline: "In 12 days",
    matchScore: 78,
    skills: ["Computer Vision", "C++", "ROS", "Machine Learning"],
    amount: "$25,000 Prize",
    matchReasons: ["Matches AI/ML skill profile"],
    eligibility: "University students and independent researchers.",
  },
  {
    id: "opp-8",
    title: "Developer Advocate",
    organization: "Cloudflare",
    type: "Job",
    description: "Join the Developer Relations team to educate and inspire developers building on Cloudflare Workers and Pages.",
    location: "London, UK / Remote",
    remote: true,
    deadline: "In 7 days",
    matchScore: 92,
    skills: ["Technical Writing", "Public Speaking", "JavaScript", "Edge Computing"],
    matchReasons: ["Matches interest in developer tools and education"],
    eligibility: "3+ years of engineering or devrel experience.",
  },
  {
    id: "opp-9",
    title: "Web3 Innovation Grant",
    organization: "Ethereum Foundation",
    type: "Grant",
    description: "Funding for public goods and core infrastructure in the Ethereum ecosystem. Focus on zero-knowledge proofs and layer 2 scaling.",
    location: "Global",
    remote: true,
    deadline: "In 60 days",
    matchScore: 72,
    skills: ["Solidity", "Cryptography", "ZK-Rollups"],
    amount: "Up to $250k",
    matchReasons: ["Matches interest in decentralized systems"],
    eligibility: "Open source projects with a clear public benefit.",
  },
  {
    id: "opp-10",
    title: "Data Science Fellowship",
    organization: "DataKind",
    type: "Fellowship",
    description: "Apply your data science skills to solve real-world humanitarian challenges. Partner with NGOs to build impactful data models.",
    location: "New York, NY (Hybrid)",
    remote: false,
    deadline: "In 18 days",
    matchScore: 81,
    skills: ["Data Science", "Python", "Social Impact", "Machine Learning"],
    amount: "$80,000 Stipend",
    matchReasons: ["Matches non-profit sector interest"],
    eligibility: "Mid-level data scientists looking to transition into social impact.",
  },
  // Add 20 more to reach 30 mock opportunities
  ...Array.from({ length: 20 }).map((_, i) => {
    const types: OpportunityType[] = ["Job", "Grant", "Hackathon", "Fellowship", "Competition", "Funding", "Other"];
    return {
      id: `opp-${11 + i}`,
      title: `Mock Opportunity ${11 + i}`,
      organization: `Organization ${11 + i}`,
      type: types[i % types.length]!,
      description: `This is a mock description for Opportunity ${11 + i}. It contains enough text to simulate a real opportunity description on the platform.`,
      location: i % 2 === 0 ? "Remote" : "New York, NY",
      remote: i % 2 === 0,
      deadline: `In ${Math.floor(Math.random() * 30) + 1} days`,
      matchScore: Math.floor(Math.random() * 30) + 70, // 70-99
      skills: ["Skill 1", "Skill 2", "Skill 3"],
      matchReasons: ["Good skill match", "Location preference match"],
      eligibility: "Standard eligibility criteria apply to this opportunity.",
      amount: i % 3 === 0 ? "$10,000" : undefined,
    };
  })
];
