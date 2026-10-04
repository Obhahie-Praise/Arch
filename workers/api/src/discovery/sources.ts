import type { OpportunityDiscoveryProvider, OpportunityInput, DiscoveryContext, OpportunityCandidate } from "./types";

export class SeedDiscoverySource implements OpportunityDiscoveryProvider {
  id = "seed-curated-source";
  name = "Arch Curated Seed Provider";
  type = "manual" as const;

  async discover(_context?: DiscoveryContext): Promise<OpportunityCandidate[]> {
    const rawInputs = await this.discoverInputs();
    return rawInputs.map((input) => ({
      url: input.sourceUrl,
      title: input.title,
      snippet: input.description,
      sourceType: "manual" as const,
    }));
  }

  async discoverInputs(): Promise<OpportunityInput[]> {
    const seedData: OpportunityInput[] = [
      {
        title: "Senior Full Stack Engineer (TypeScript & Next.js)",
        organizationName: "Vercel",
        organizationUrl: "https://vercel.com",
        type: "job",
        description:
          "We are looking for a Senior Full Stack Engineer to work on Next.js core framework infrastructure, developer tools, and global deployment performance.",
        applicationUrl: "https://vercel.com/careers/senior-full-stack-engineer",
        sourceUrl: "https://vercel.com/careers/senior-full-stack-engineer",
        location: "San Francisco, CA / Remote",
        country: "USA",
        isRemote: true,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        eligibility: ["3+ years experience with React/Next.js", "Strong TypeScript background"],
        requirements: ["Next.js", "TypeScript", "Node.js", "Serverless Architecture"],
        skills: ["TypeScript", "React", "Next.js", "Tailwind CSS", "GraphQL", "Cloudflare Workers"],
        benefits: ["Competitive Salary", "Equity", "Unlimited PTO", "Remote Setup Stipend"],
        compensation: { min: 160000, max: 220000, currency: "USD", period: "yearly" },
        externalId: "vercel-sr-fullstack-01",
      },
      {
        title: "Global AI & Autonomous Systems Grant 2026",
        organizationName: "OpenAI Foundation",
        organizationUrl: "https://openai.com",
        type: "grant",
        description:
          "Funding innovative research projects developing safe autonomous AI agents and evaluation frameworks for societal benefit.",
        applicationUrl: "https://openai.com/grants/2026-agent-research",
        sourceUrl: "https://openai.com/grants/2026-agent-research",
        location: "Global / Remote",
        isRemote: true,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        eligibility: ["Open to independent researchers, startups, and academic institutions worldwide"],
        requirements: ["Project proposal", "Technical architecture overview", "Safety mitigation plan"],
        skills: ["Artificial Intelligence", "Python", "Machine Learning", "LLMs", "Agentic Systems"],
        benefits: ["Direct non-dilutive grant funding", "API credits", "Mentorship from AI researchers"],
        fundingAmount: { amount: 100000, currency: "USD", type: "grant" },
        externalId: "openai-grant-2026-01",
      },
      {
        title: "Build the Future of Web Apps Hackathon",
        organizationName: "Cloudflare Developer Platform",
        organizationUrl: "https://cloudflare.com",
        type: "hackathon",
        description:
          "Build full-stack serverless web applications using Cloudflare Workers, D1, R2, and AI Bindings.",
        applicationUrl: "https://cloudflare.devpost.com",
        sourceUrl: "https://cloudflare.devpost.com",
        location: "Virtual",
        isRemote: true,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        eligibility: ["Open to developers globally"],
        requirements: ["Must use Cloudflare Workers or D1", "Open source GitHub repository"],
        skills: ["Cloudflare Workers", "Hono", "TypeScript", "D1", "React"],
        benefits: ["$50,000 Total Prize Pool", "Cloudflare Swag", "Keynote Feature at Cloudflare TV"],
        compensation: { prizePool: 50000, currency: "USD" },
        externalId: "cf-hackathon-2026",
      },
      {
        title: "Techstars Founder Fellowship 2026",
        organizationName: "Techstars",
        organizationUrl: "https://techstars.com",
        type: "fellowship",
        description:
          "A 3-month intensive accelerator and mentorship fellowship for early-stage software and AI founders.",
        applicationUrl: "https://techstars.com/apply",
        sourceUrl: "https://techstars.com/apply",
        location: "New York / Remote Hybrid",
        country: "USA",
        isRemote: true,
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        eligibility: ["Early-stage tech startups with MVP"],
        requirements: ["Full-time founder commitment", "Working prototype"],
        skills: ["Entrepreneurship", "Product Management", "Software Architecture", "Go-To-Market"],
        benefits: ["$120k initial funding", "Access to 3,000+ mentors", "Alumni network"],
        fundingAmount: { amount: 120000, currency: "USD", type: "investment" },
        externalId: "techstars-fellowship-2026",
      },
      {
        title: "Frontend Architect & Engineering Lead",
        organizationName: "Stripe",
        organizationUrl: "https://stripe.com",
        type: "job",
        description:
          "Lead the frontend architectural direction for Stripe Dashboard and merchant developer tools.",
        applicationUrl: "https://stripe.com/jobs/frontend-architect",
        sourceUrl: "https://stripe.com/jobs/frontend-architect",
        location: "Seattle, WA / Remote",
        country: "USA",
        isRemote: true,
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        eligibility: ["5+ years experience building web applications", "Expert TypeScript/React knowledge"],
        requirements: ["TypeScript", "Design Systems", "Web Performance", "React"],
        skills: ["TypeScript", "React", "Design Systems", "CSS", "Performance Optimization"],
        benefits: ["Competitive Salary", "Stock Grants", "Health/Dental/Vision", "Learning Stipend"],
        compensation: { min: 180000, max: 250000, currency: "USD", period: "yearly" },
        externalId: "stripe-frontend-lead-01",
      },
      {
        title: "Open Source Infrastructure Security Grant",
        organizationName: "Linux Foundation",
        organizationUrl: "https://linuxfoundation.org",
        type: "grant",
        description:
          "Financial grants for developers maintaining critical open-source software libraries and infrastructure tools.",
        applicationUrl: "https://linuxfoundation.org/grants/sec-2026",
        sourceUrl: "https://linuxfoundation.org/grants/sec-2026",
        location: "Global",
        isRemote: true,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        eligibility: ["Maintainers of active open source packages with >10k monthly downloads"],
        requirements: ["Security audit report", "Project roadmap"],
        skills: ["Security", "Open Source", "C/C++", "Rust", "Go", "TypeScript"],
        benefits: ["$25,000 grant per maintainer", "Security audit support"],
        fundingAmount: { amount: 25000, currency: "USD", type: "grant" },
        externalId: "linux-sec-grant-2026",
      },
      {
        title: "AI Product Designer & UX Engineer",
        organizationName: "Linear",
        organizationUrl: "https://linear.app",
        type: "job",
        description:
          "Craft high-performance, calm, and responsive user interfaces for modern software teams.",
        applicationUrl: "https://linear.app/careers/product-designer",
        sourceUrl: "https://linear.app/careers/product-designer",
        location: "San Francisco / Remote Europe & US",
        isRemote: true,
        deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
        eligibility: ["Strong UX portfolio", "Ability to code prototypes in React/Tailwind"],
        requirements: ["Figma", "React", "Tailwind CSS", "UI/UX Design"],
        skills: ["UI/UX Design", "React", "Tailwind CSS", "TypeScript", "Product Design"],
        benefits: ["Top-tier compensation", "Flexible work hours", "Annual retreats"],
        compensation: { min: 150000, max: 210000, currency: "USD", period: "yearly" },
        externalId: "linear-ui-designer-01",
      },
    ];

    return seedData;
  }
}
