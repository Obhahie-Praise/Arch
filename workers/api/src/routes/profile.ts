import { Hono } from "hono";
import { createAuth, type Env } from "../auth";
import { uploadFile } from "../lib/storage";

export const profileRouter = new Hono<{ Bindings: Env }>();

// Helper to calculate profile completeness score
function calculateCompletenessScore(profile: any, experiences: any[], education: any[], sessionUser?: any) {
  let score = 0;

  const name = profile.fullName || profile.preferredName || sessionUser?.name;
  const email = profile.email || sessionUser?.email;
  const username = profile.username || (email ? email.split("@")[0] : "");
  const avatar = profile.avatarUrl || sessionUser?.image;

  // Identity (20%)
  if (name) score += 6;
  if (username) score += 5;
  if (profile.country || profile.city) score += 5;
  if (avatar || profile.bio) score += 4;

  // Target Opportunities & Roles (20%)
  const oppTypes = safeParseJson(profile.opportunityTypes);
  const roles = safeParseJson(profile.desiredRoles);
  const industries = safeParseJson(profile.desiredIndustries);
  const workArr = safeParseJson(profile.workArrangements);

  if (oppTypes.length > 0) score += 5;
  if (roles.length > 0) score += 5;
  if (industries.length > 0) score += 5;
  if (workArr.length > 0) score += 5;

  // Skills (20%)
  const techSkills = safeParseJson(profile.technicalSkills);
  const tools = safeParseJson(profile.tools);
  const langs = safeParseJson(profile.languages);

  if (techSkills.length > 0) score += 8;
  if (tools.length > 0) score += 6;
  if (langs.length > 0) score += 6;

  // Experience & Education (20%)
  if (experiences.length > 0) score += 12;
  if (education.length > 0) score += 8;

  // Preferences & Application Materials (20%)
  if (profile.desiredCompensationMin || profile.desiredCompensationMax || profile.currency) score += 5;
  const priorities = safeParseJson(profile.keyPriorities);
  if (priorities.length > 0 || profile.shortTermGoals || profile.longTermGoals) score += 5;
  if (profile.resumeUrl) score += 10;

  return Math.min(100, score);
}

function safeParseJson(val: any) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// GET /api/profile - Fetch current user's profile
profileRouter.get("/", async (c) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session || !session.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userId = session.user.id;

  try {
    const profileStmt = c.env.arch_db.prepare(
      `SELECT * FROM "profiles" WHERE "userId" = ?`
    );
    const profile = await profileStmt.bind(userId).first<any>();

    if (!profile) {
      // Return empty profile shell with auth user default data & initial non-zero completeness
      const defaultShell = {
        userId,
        fullName: session.user.name || "",
        preferredName: "",
        username: session.user.email ? session.user.email.split("@")[0] : "",
        email: session.user.email || "",
        avatarUrl: session.user.image || "",
        country: "",
        state: "",
        city: "",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        phone: "",
        website: "",
        github: "",
        linkedin: "",
        twitter: "",
        portfolioUrl: "",
        bio: "",
        shortTermGoals: "",
        longTermGoals: "",
        opportunityTypes: [],
        desiredRoles: [],
        desiredIndustries: [],
        workTypes: [],
        workArrangements: [],
        technicalSkills: [],
        nonTechnicalSkills: [],
        tools: [],
        languages: [],
        areasOfInterest: [],
        causes: [],
        citizenship: "",
        workAuthorization: [],
        requiresSponsorship: 0,
        studentStatus: "",
        graduationYear: null,
        availabilityStart: "",
        hoursPerWeek: null,
        preferredSchedule: "",
        desiredCompensationMin: null,
        desiredCompensationMax: null,
        currency: "USD",
        compensationType: "Annual salary",
        equityPreference: "Open to equity",
        keyPriorities: [],
        dealBreakers: [],
        resumeUrl: "",
        resumeFilename: "",
      };

      const initialScore = calculateCompletenessScore(defaultShell, [], [], session.user);

      return c.json({
        profile: {
          ...defaultShell,
          completenessScore: initialScore,
        },
        experiences: [],
        education: [],
        projects: [],
        achievements: [],
      });
    }

    // Fetch related child records
    const expStmt = c.env.arch_db.prepare(
      `SELECT * FROM "profile_experiences" WHERE "profileId" = ? ORDER BY "displayOrder" ASC, "createdAt" DESC`
    );
    const eduStmt = c.env.arch_db.prepare(
      `SELECT * FROM "profile_education" WHERE "profileId" = ? ORDER BY "displayOrder" ASC, "createdAt" DESC`
    );
    const projStmt = c.env.arch_db.prepare(
      `SELECT * FROM "profile_projects" WHERE "profileId" = ? ORDER BY "displayOrder" ASC, "createdAt" DESC`
    );
    const achStmt = c.env.arch_db.prepare(
      `SELECT * FROM "profile_achievements" WHERE "profileId" = ? ORDER BY "displayOrder" ASC, "createdAt" DESC`
    );

    const [expRes, eduRes, projRes, achRes] = await Promise.all([
      expStmt.bind(profile.id).all<any>(),
      eduStmt.bind(profile.id).all<any>(),
      projStmt.bind(profile.id).all<any>(),
      achStmt.bind(profile.id).all<any>(),
    ]);

    const experiences = (expRes.results || []).map((e: any) => ({
      ...e,
      skillsUsed: safeParseJson(e.skillsUsed),
    }));

    const education = eduRes.results || [];
    const projects = (projRes.results || []).map((p: any) => ({
      ...p,
      technologies: safeParseJson(p.technologies),
    }));
    const achievements = achRes.results || [];

    // Parse array fields on profile
    const parsedProfile = {
      ...profile,
      email: session.user.email || "",
      opportunityTypes: safeParseJson(profile.opportunityTypes),
      desiredRoles: safeParseJson(profile.desiredRoles),
      desiredIndustries: safeParseJson(profile.desiredIndustries),
      workTypes: safeParseJson(profile.workTypes),
      workArrangements: safeParseJson(profile.workArrangements),
      technicalSkills: safeParseJson(profile.technicalSkills),
      nonTechnicalSkills: safeParseJson(profile.nonTechnicalSkills),
      tools: safeParseJson(profile.tools),
      languages: safeParseJson(profile.languages),
      areasOfInterest: safeParseJson(profile.areasOfInterest),
      causes: safeParseJson(profile.causes),
      workAuthorization: safeParseJson(profile.workAuthorization),
      keyPriorities: safeParseJson(profile.keyPriorities),
      dealBreakers: safeParseJson(profile.dealBreakers),
    };

    return c.json({
      profile: parsedProfile,
      experiences,
      education,
      projects,
      achievements,
    });
  } catch {
    return c.json({ error: "Failed to fetch profile" }, 500);
  }
});

// PUT /api/profile - Save or update current user's profile
profileRouter.put("/", async (c) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session || !session.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userId = session.user.id;
  const body = await c.req.json();

  const {
    fullName = "",
    preferredName = "",
    username = "",
    avatarUrl = "",
    country = "",
    state = "",
    city = "",
    timezone = "",
    phone = "",
    website = "",
    github = "",
    linkedin = "",
    twitter = "",
    portfolioUrl = "",
    bio = "",
    shortTermGoals = "",
    longTermGoals = "",
    opportunityTypes = [],
    desiredRoles = [],
    desiredIndustries = [],
    workTypes = [],
    workArrangements = [],
    technicalSkills = [],
    nonTechnicalSkills = [],
    tools = [],
    languages = [],
    areasOfInterest = [],
    causes = [],
    citizenship = "",
    workAuthorization = [],
    requiresSponsorship = 0,
    studentStatus = "",
    graduationYear = null,
    availabilityStart = "",
    hoursPerWeek = null,
    preferredSchedule = "",
    desiredCompensationMin = null,
    desiredCompensationMax = null,
    currency = "USD",
    compensationType = "Annual salary",
    equityPreference = "Open to equity",
    keyPriorities = [],
    dealBreakers = [],
    resumeUrl = "",
    resumeFilename = "",
    experiences = [],
    education = [],
    projects = [],
    achievements = [],
  } = body;

  try {
    const existingStmt = c.env.arch_db.prepare(
      `SELECT "id" FROM "profiles" WHERE "userId" = ?`
    );
    const existing = await existingStmt.bind(userId).first<{ id: string }>();

    const now = new Date().toISOString();
    const profileId = existing ? existing.id : crypto.randomUUID();

    const completenessScore = calculateCompletenessScore(body, experiences, education, session.user);

    if (existing) {
      // Update existing profile
      await c.env.arch_db
        .prepare(
          `UPDATE "profiles" SET
            "fullName" = ?, "preferredName" = ?, "username" = ?, "avatarUrl" = ?,
            "country" = ?, "state" = ?, "city" = ?, "timezone" = ?, "phone" = ?,
            "website" = ?, "github" = ?, "linkedin" = ?, "twitter" = ?, "portfolioUrl" = ?,
            "bio" = ?, "shortTermGoals" = ?, "longTermGoals" = ?, "opportunityTypes" = ?,
            "desiredRoles" = ?, "desiredIndustries" = ?, "workTypes" = ?, "workArrangements" = ?,
            "technicalSkills" = ?, "nonTechnicalSkills" = ?, "tools" = ?, "languages" = ?,
            "areasOfInterest" = ?, "causes" = ?, "citizenship" = ?, "workAuthorization" = ?,
            "requiresSponsorship" = ?, "studentStatus" = ?, "graduationYear" = ?,
            "availabilityStart" = ?, "hoursPerWeek" = ?, "preferredSchedule" = ?,
            "desiredCompensationMin" = ?, "desiredCompensationMax" = ?, "currency" = ?,
            "compensationType" = ?, "equityPreference" = ?, "keyPriorities" = ?, "dealBreakers" = ?,
            "resumeUrl" = ?, "resumeFilename" = ?, "completenessScore" = ?, "updatedAt" = ?
          WHERE "id" = ?`
        )
        .bind(
          fullName, preferredName, username, avatarUrl,
          country, state, city, timezone, phone,
          website, github, linkedin, twitter, portfolioUrl,
          bio, shortTermGoals, longTermGoals, JSON.stringify(opportunityTypes),
          JSON.stringify(desiredRoles), JSON.stringify(desiredIndustries), JSON.stringify(workTypes), JSON.stringify(workArrangements),
          JSON.stringify(technicalSkills), JSON.stringify(nonTechnicalSkills), JSON.stringify(tools), JSON.stringify(languages),
          JSON.stringify(areasOfInterest), JSON.stringify(causes), citizenship, JSON.stringify(workAuthorization),
          requiresSponsorship ? 1 : 0, studentStatus, graduationYear ? Number(graduationYear) : null,
          availabilityStart, hoursPerWeek ? Number(hoursPerWeek) : null, preferredSchedule,
          desiredCompensationMin ? Number(desiredCompensationMin) : null, desiredCompensationMax ? Number(desiredCompensationMax) : null, currency,
          compensationType, equityPreference, JSON.stringify(keyPriorities), JSON.stringify(dealBreakers),
          resumeUrl, resumeFilename, completenessScore, now,
          profileId
        )
        .run();
    } else {
      // Insert new profile
      await c.env.arch_db
        .prepare(
          `INSERT INTO "profiles" (
            "id", "userId", "fullName", "preferredName", "username", "avatarUrl",
            "country", "state", "city", "timezone", "phone",
            "website", "github", "linkedin", "twitter", "portfolioUrl",
            "bio", "shortTermGoals", "longTermGoals", "opportunityTypes",
            "desiredRoles", "desiredIndustries", "workTypes", "workArrangements",
            "technicalSkills", "nonTechnicalSkills", "tools", "languages",
            "areasOfInterest", "causes", "citizenship", "workAuthorization",
            "requiresSponsorship", "studentStatus", "graduationYear",
            "availabilityStart", "hoursPerWeek", "preferredSchedule",
            "desiredCompensationMin", "desiredCompensationMax", "currency",
            "compensationType", "equityPreference", "keyPriorities", "dealBreakers",
            "resumeUrl", "resumeFilename", "completenessScore", "createdAt", "updatedAt"
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          profileId, userId, fullName, preferredName, username, avatarUrl,
          country, state, city, timezone, phone,
          website, github, linkedin, twitter, portfolioUrl,
          bio, shortTermGoals, longTermGoals, JSON.stringify(opportunityTypes),
          JSON.stringify(desiredRoles), JSON.stringify(desiredIndustries), JSON.stringify(workTypes), JSON.stringify(workArrangements),
          JSON.stringify(technicalSkills), JSON.stringify(nonTechnicalSkills), JSON.stringify(tools), JSON.stringify(languages),
          JSON.stringify(areasOfInterest), JSON.stringify(causes), citizenship, JSON.stringify(workAuthorization),
          requiresSponsorship ? 1 : 0, studentStatus, graduationYear ? Number(graduationYear) : null,
          availabilityStart, hoursPerWeek ? Number(hoursPerWeek) : null, preferredSchedule,
          desiredCompensationMin ? Number(desiredCompensationMin) : null, desiredCompensationMax ? Number(desiredCompensationMax) : null, currency,
          compensationType, equityPreference, JSON.stringify(keyPriorities), JSON.stringify(dealBreakers),
          resumeUrl, resumeFilename, completenessScore, now, now
        )
        .run();
    }

    // Replace child items for atomic accuracy
    await c.env.arch_db.batch([
      c.env.arch_db.prepare(`DELETE FROM "profile_experiences" WHERE "profileId" = ?`).bind(profileId),
      c.env.arch_db.prepare(`DELETE FROM "profile_education" WHERE "profileId" = ?`).bind(profileId),
      c.env.arch_db.prepare(`DELETE FROM "profile_projects" WHERE "profileId" = ?`).bind(profileId),
      c.env.arch_db.prepare(`DELETE FROM "profile_achievements" WHERE "profileId" = ?`).bind(profileId),
    ]);

    // Insert new experiences
    if (Array.isArray(experiences) && experiences.length > 0) {
      for (let i = 0; i < experiences.length; i++) {
        const exp = experiences[i];
        if (!exp.organization || !exp.role) continue;
        await c.env.arch_db
          .prepare(
            `INSERT INTO "profile_experiences" (
              "id", "profileId", "organization", "role", "employmentType", "location",
              "startDate", "endDate", "isCurrent", "description", "skillsUsed", "displayOrder", "createdAt"
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            crypto.randomUUID(), profileId, exp.organization, exp.role, exp.employmentType || "", exp.location || "",
            exp.startDate || "", exp.endDate || "", exp.isCurrent ? 1 : 0, exp.description || "",
            JSON.stringify(exp.skillsUsed || []), i, now
          )
          .run();
      }
    }

    // Insert new education
    if (Array.isArray(education) && education.length > 0) {
      for (let i = 0; i < education.length; i++) {
        const edu = education[i];
        if (!edu.institution) continue;
        await c.env.arch_db
          .prepare(
            `INSERT INTO "profile_education" (
              "id", "profileId", "institution", "degree", "fieldOfStudy",
              "startDate", "endDate", "isCurrent", "achievements", "displayOrder", "createdAt"
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            crypto.randomUUID(), profileId, edu.institution, edu.degree || "", edu.fieldOfStudy || "",
            edu.startDate || "", edu.endDate || "", edu.isCurrent ? 1 : 0, edu.achievements || "", i, now
          )
          .run();
      }
    }

    // Insert new projects
    if (Array.isArray(projects) && projects.length > 0) {
      for (let i = 0; i < projects.length; i++) {
        const proj = projects[i];
        if (!proj.title) continue;
        await c.env.arch_db
          .prepare(
            `INSERT INTO "profile_projects" (
              "id", "profileId", "title", "description", "url", "repositoryUrl",
              "role", "technologies", "status", "year", "achievements", "displayOrder", "createdAt"
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            crypto.randomUUID(), profileId, proj.title, proj.description || "", proj.url || "", proj.repositoryUrl || "",
            proj.role || "", JSON.stringify(proj.technologies || []), proj.status || "", proj.year || "", proj.achievements || "", i, now
          )
          .run();
      }
    }

    // Insert new achievements
    if (Array.isArray(achievements) && achievements.length > 0) {
      for (let i = 0; i < achievements.length; i++) {
        const ach = achievements[i];
        if (!ach.title) continue;
        await c.env.arch_db
          .prepare(
            `INSERT INTO "profile_achievements" (
              "id", "profileId", "title", "category", "issuer", "date", "url", "description", "displayOrder", "createdAt"
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            crypto.randomUUID(), profileId, ach.title, ach.category || "", ach.issuer || "",
            ach.date || "", ach.url || "", ach.description || "", i, now
          )
          .run();
      }
    }

    return c.json({
      success: true,
      message: "Profile saved successfully",
      completenessScore,
    });
  } catch {
    return c.json({ error: "Failed to save profile" }, 500);
  }
});

// POST /api/profile/upload - Handle profile assets upload (Avatar, Resume)
profileRouter.post("/upload", async (c) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session || !session.user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (!c.env.UPLOADTHING_TOKEN) {
    console.error("[upload] UPLOADTHING_TOKEN is not set in the Worker environment. Add it to .env for local development (used via `wrangler dev --env-file .env`) or set it as a Wrangler secret for production.");
    return c.json({ error: "Storage not configured" }, 503);
  }

  try {
    const formData = await c.req.parseBody();
    const file = formData.file;

    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file provided" }, 400);
    }

    // Validate file size client-side limit: images ≤ 5 MB, documents ≤ 10 MB
    const isImage = file.type.startsWith("image/");
    const maxBytes = isImage ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      return c.json(
        { error: `File too large. Maximum size is ${isImage ? "5" : "10"} MB.` },
        413
      );
    }

    const result = await uploadFile(c.env.UPLOADTHING_TOKEN, file);

    return c.json({
      success: true,
      url: result.url,
      key: result.key,
      filename: result.name,
      mimeType: file.type,
      size: result.size,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[upload] Upload failed:", message);
    return c.json({ error: "Upload failed" }, 500);
  }
});
