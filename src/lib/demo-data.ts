import type { PrismaClient } from "@/generated/prisma/client";

const DEMO_MARKER_EMAIL = "meredith.cole@northbridgelogistics.example";

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const daysFromNow = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

/**
 * Populates the CRM with a believable set of sample deals, candidates,
 * jobs, matches, activity notes, meetings and emails - covering every
 * pipeline stage so the app doesn't show empty states. Safe to call
 * repeatedly: skips entirely if the demo data is already present.
 */
export async function seedDemoData(
  prisma: PrismaClient,
  adminId: string
): Promise<{ skipped: boolean }> {
  const marker = await prisma.contact.findFirst({
    where: { email: DEMO_MARKER_EMAIL },
  });
  if (marker) {
    return { skipped: true };
  }

  async function makeContact(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    notes?: string;
  }) {
    return prisma.contact.create({ data: { ...data, ownerId: adminId } });
  }

  // --- Deals (clients), one per pipeline stage ---
  const meredith = await makeContact({
    firstName: "Meredith",
    lastName: "Cole",
    email: DEMO_MARKER_EMAIL,
    phone: "+1 415-555-0134",
    company: "Northbridge Logistics",
  });
  await prisma.client.create({
    data: {
      contactId: meredith.id,
      companyName: "Northbridge Logistics",
      stage: "INTERESTED",
    },
  });

  const owen = await makeContact({
    firstName: "Owen",
    lastName: "Faulkner",
    email: "owen.faulkner@trellisanalytics.example",
    phone: "+1 312-555-0177",
    company: "Trellis Analytics",
  });
  await prisma.client.create({
    data: {
      contactId: owen.id,
      companyName: "Trellis Analytics",
      stage: "CANDIDATE_MATCHED",
    },
  });

  const priya = await makeContact({
    firstName: "Priya",
    lastName: "Nathan",
    email: "priya.nathan@solheimretail.example",
    phone: "+1 646-555-0192",
    company: "Solheim Retail Group",
  });
  const solheim = await prisma.client.create({
    data: {
      contactId: priya.id,
      companyName: "Solheim Retail Group",
      stage: "CONTRACT_SIGNED",
    },
  });
  const storeManagerJob = await prisma.job.create({
    data: {
      clientId: solheim.id,
      title: "Store Manager",
      description: "Flagship downtown location, full-time.",
      status: "OPEN",
    },
  });
  await prisma.job.create({
    data: {
      clientId: solheim.id,
      title: "Assistant Buyer",
      description: "Seasonal buying support, hybrid.",
      status: "ON_HOLD",
    },
  });

  const derek = await makeContact({
    firstName: "Derek",
    lastName: "Alaba",
    email: "derek.alaba@foundrycreative.example",
    phone: "+1 213-555-0148",
    company: "Foundry Creative Co",
  });
  const foundry = await prisma.client.create({
    data: {
      contactId: derek.id,
      companyName: "Foundry Creative Co",
      stage: "TRIAL_PASSED",
    },
  });
  const designerJob = await prisma.job.create({
    data: {
      clientId: foundry.id,
      title: "Junior Designer",
      description: "In-house brand design, contract-to-hire.",
      status: "CLOSED",
    },
  });

  const vivian = await makeContact({
    firstName: "Vivian",
    lastName: "Marsh",
    email: "vivian.marsh@cobaltfreight.example",
    phone: "+1 617-555-0163",
    company: "Cobalt Freight",
  });
  await prisma.client.create({
    data: {
      contactId: vivian.id,
      companyName: "Cobalt Freight",
      stage: "LOST",
    },
  });

  // --- Candidates, one per pipeline stage ---
  const theo = await makeContact({
    firstName: "Theo",
    lastName: "Bannerman",
    email: "theo.bannerman@example.com",
    phone: "+1 503-555-0110",
  });
  await prisma.candidate.create({
    data: {
      contactId: theo.id,
      stage: "SOURCED",
      skills: "Warehouse Operations, Forklift Certified, Inventory Systems",
    },
  });

  const naomi = await makeContact({
    firstName: "Naomi",
    lastName: "Ferris",
    email: "naomi.ferris@example.com",
    phone: "+1 720-555-0121",
  });
  await prisma.candidate.create({
    data: {
      contactId: naomi.id,
      stage: "SUITABLE",
      skills: "Data Analysis, SQL, Tableau",
      resumeNotes: "6 years in retail analytics, strong Excel/SQL background.",
    },
  });

  const callum = await makeContact({
    firstName: "Callum",
    lastName: "Reyes",
    email: "callum.reyes@example.com",
    phone: "+1 305-555-0143",
  });
  const callumCandidate = await prisma.candidate.create({
    data: {
      contactId: callum.id,
      stage: "MATCHED",
      skills: "Retail Management, POS Systems, Team Leadership",
      resumeNotes: "Managed a 20-person team at a big-box retailer for 4 years.",
    },
  });
  await prisma.candidateMatch.create({
    data: {
      candidateId: callumCandidate.id,
      jobId: storeManagerJob.id,
      status: "PROPOSED",
    },
  });

  const isla = await makeContact({
    firstName: "Isla",
    lastName: "Whitfield",
    email: "isla.whitfield@example.com",
    phone: "+1 206-555-0187",
  });
  const islaCandidate = await prisma.candidate.create({
    data: {
      contactId: isla.id,
      stage: "ACCEPTED",
      skills: "Graphic Design, Adobe Creative Suite, Branding",
      resumeNotes: "Portfolio includes rebrands for two DTC startups.",
    },
  });
  await prisma.candidateMatch.create({
    data: {
      candidateId: islaCandidate.id,
      jobId: designerJob.id,
      status: "ACCEPTED",
    },
  });

  const marcus = await makeContact({
    firstName: "Marcus",
    lastName: "Dunleavy",
    email: "marcus.dunleavy@example.com",
    phone: "+1 214-555-0159",
  });
  await prisma.candidate.create({
    data: {
      contactId: marcus.id,
      stage: "REJECTED",
      skills: "Cold Calling, B2B Sales",
      resumeNotes: "Not enough experience for current openings; keep warm for future roles.",
    },
  });

  // --- Contacts not yet converted either way ---
  const harriet = await makeContact({
    firstName: "Harriet",
    lastName: "Solano",
    email: "harriet.solano@example.com",
    phone: "+1 617-555-0104",
    notes: "Met at the regional staffing meetup, following up next quarter.",
  });
  await makeContact({
    firstName: "Ben",
    lastName: "Okafor",
    email: "ben.okafor@example.com",
    phone: "+1 404-555-0176",
  });

  // --- Activity notes ---
  await prisma.activity.createMany({
    data: [
      {
        contactId: priya.id,
        authorId: adminId,
        body: "Contract signed - kicking off search for Store Manager role this week.",
      },
      {
        contactId: owen.id,
        authorId: adminId,
        body: "Great intro call, they're excited to see candidates for the analyst opening.",
      },
      {
        contactId: derek.id,
        authorId: adminId,
        body: "Isla passed her trial period - client wants to discuss a second hire.",
      },
      {
        contactId: vivian.id,
        authorId: adminId,
        body: "Went with an in-house hire instead. Keep on file for Q1 next year.",
      },
      {
        contactId: harriet.id,
        authorId: adminId,
        body: "Sent over our services overview, plans to follow up after budget season.",
      },
    ],
  });

  // --- Meetings ---
  await prisma.meeting.create({
    data: {
      contactId: priya.id,
      title: "Kickoff call - Store Manager search",
      scheduledStart: daysFromNow(1),
      scheduledEnd: daysFromNow(1),
      notes: "Walk through role requirements and timeline.",
    },
  });
  await prisma.meeting.create({
    data: {
      contactId: owen.id,
      title: "Intro call",
      scheduledStart: daysAgo(6),
      scheduledEnd: daysAgo(6),
    },
  });

  // --- Sample emails (manually seeded, not Gmail-linked) ---
  await prisma.emailMessage.create({
    data: {
      contactId: priya.id,
      subject: "Re: Store Manager role",
      fromAddress: "priya.nathan@solheimretail.example",
      toAddress: "sam@outwork.co.uk",
      snippet: "Thanks for the quick turnaround on candidates...",
      body: "Thanks for the quick turnaround on candidates - Callum's profile looks promising. Can we set up a call this week?",
      direction: "INBOUND",
      sentAt: daysAgo(2),
    },
  });
  await prisma.emailMessage.create({
    data: {
      contactId: vivian.id,
      subject: "Following up",
      fromAddress: "sam@outwork.co.uk",
      toAddress: "vivian.marsh@cobaltfreight.example",
      snippet: "Just checking in on the warehouse lead role...",
      body: "Just checking in on the warehouse lead role - happy to send over more candidates if it's still open.",
      direction: "OUTBOUND",
      sentAt: daysAgo(9),
    },
  });

  return { skipped: false };
}
