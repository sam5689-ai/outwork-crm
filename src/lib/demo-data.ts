import type { PrismaClient } from "@/generated/prisma/client";

const DEMO_MARKER_EMAIL = "meredith.cole@northbridgelogistics.example";

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const daysFromNow = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

/**
 * Populates the CRM with a believable set of sample deals, jobs (with
 * openings, bill rates and margins), candidates and placements - covering
 * every job stage so the app doesn't show empty states. Safe to call
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
      name: "Northbridge Logistics",
      email: DEMO_MARKER_EMAIL,
      stage: "INTERESTED",
      industry: "Logistics & Warehousing",
      employeeCount: 220,
      workHours: "Mon-Fri, 6:00 AM - 2:30 PM",
      payRate: 24,
      payUnit: "hourly",
      city: "Oakland",
      state: "CA",
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
      name: "Trellis Analytics",
      email: "owen.faulkner@trellisanalytics.example",
      stage: "CANDIDATE_MATCHED",
      industry: "Data & Analytics",
      employeeCount: 65,
      payRate: 42,
      city: "Chicago",
      state: "IL",
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
      name: "Solheim Retail Group",
      email: "priya.nathan@solheimretail.example",
      website: "https://solheimretail.example",
      stage: "CONTRACT_SIGNED",
      industry: "Retail",
      employeeCount: 340,
      workHours: "Mon-Sat, 9:00 AM - 6:00 PM",
      payRate: 26,
      street: "88 Market St",
      city: "New York",
      state: "NY",
      zipCode: "10007",
    },
  });

  // Multi-opening job: 5 store associate seats, 2 placed + 1 scheduled so far
  const storeAssociateJob = await prisma.job.create({
    data: {
      clientId: solheim.id,
      title: "Store Associate",
      description: "Flagship downtown location, full-time seasonal ramp-up.",
      stage: "SCHEDULED",
      openingsCount: 5,
      startDate: daysFromNow(10),
      workHours: "Mon-Sat, 9:00 AM - 6:00 PM",
      billRate: 26,
      targetPayRate: 18,
      requiredSkills: ["POS Systems", "Customer Service", "Retail"],
    },
  });

  await prisma.job.create({
    data: {
      clientId: solheim.id,
      title: "Assistant Buyer",
      description: "Seasonal buying support, hybrid.",
      stage: "MATCHING",
      openingsCount: 1,
      startDate: daysFromNow(21),
      workHours: "Mon-Fri, 9:00 AM - 5:00 PM",
      billRate: 34,
      targetPayRate: 24,
      requiredSkills: ["Merchandising", "Excel"],
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
      name: "Foundry Creative Co",
      email: "derek.alaba@foundrycreative.example",
      stage: "TRIAL_PASSED",
      industry: "Creative Agency",
      employeeCount: 28,
      payRate: 45,
      city: "Los Angeles",
      state: "CA",
    },
  });

  // Fully filled job - demonstrates the FILLED_WON auto-transition
  const designerJob = await prisma.job.create({
    data: {
      clientId: foundry.id,
      title: "Junior Designer",
      description: "In-house brand design, contract-to-hire.",
      stage: "FILLED_WON",
      openingsCount: 1,
      startDate: daysAgo(14),
      workHours: "Mon-Fri, 10:00 AM - 6:00 PM",
      billRate: 45,
      targetPayRate: 32,
      requiredSkills: ["Adobe Creative Suite", "Branding"],
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
      name: "Cobalt Freight",
      email: "vivian.marsh@cobaltfreight.example",
      stage: "LOST",
      industry: "Freight",
      employeeCount: 90,
      city: "Boston",
      state: "MA",
    },
  });

  // --- Candidates, one per pipeline stage, with pay/availability data ---
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
      agreedPay: 19,
      education: "High School / GED",
      availableFrom: daysFromNow(5),
      availabilityNote: "Needs 3 days notice",
      city: "Oakland",
      state: "CA",
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
      agreedPay: 28,
      education: "Bachelor's",
      availableFrom: daysFromNow(14),
      city: "Chicago",
      state: "IL",
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
      agreedPay: 18,
      education: "Associate's",
      availableFrom: daysFromNow(10),
      city: "New York",
      state: "NY",
    },
  });
  await prisma.candidateMatch.create({
    data: {
      candidateId: callumCandidate.id,
      jobId: storeAssociateJob.id,
      status: "SCHEDULED",
      agreedPayRate: 18,
    },
  });

  // Two more placed store associates, filling 3 of the 5 openings
  const jasmine = await makeContact({
    firstName: "Jasmine",
    lastName: "Ortiz",
    email: "jasmine.ortiz@example.com",
    phone: "+1 646-555-0155",
  });
  const jasmineCandidate = await prisma.candidate.create({
    data: {
      contactId: jasmine.id,
      stage: "ACCEPTED",
      skills: "POS Systems, Customer Service",
      agreedPay: 18.5,
      education: "High School / GED",
      availabilityStatus: "Placed",
      city: "New York",
      state: "NY",
    },
  });
  await prisma.candidateMatch.create({
    data: {
      candidateId: jasmineCandidate.id,
      jobId: storeAssociateJob.id,
      status: "PLACED",
      agreedPayRate: 18.5,
    },
  });

  const raymond = await makeContact({
    firstName: "Raymond",
    lastName: "Achebe",
    email: "raymond.achebe@example.com",
    phone: "+1 646-555-0166",
  });
  const raymondCandidate = await prisma.candidate.create({
    data: {
      contactId: raymond.id,
      stage: "ACCEPTED",
      skills: "Retail, Inventory",
      agreedPay: 17.75,
      education: "High School / GED",
      availabilityStatus: "Placed",
      city: "Brooklyn",
      state: "NY",
    },
  });
  await prisma.candidateMatch.create({
    data: {
      candidateId: raymondCandidate.id,
      jobId: storeAssociateJob.id,
      status: "PLACED",
      agreedPayRate: 17.75,
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
      agreedPay: 32,
      education: "Bachelor's",
      availabilityStatus: "Placed",
      city: "Los Angeles",
      state: "CA",
    },
  });
  await prisma.candidateMatch.create({
    data: {
      candidateId: islaCandidate.id,
      jobId: designerJob.id,
      status: "PLACED",
      agreedPayRate: 32,
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
      education: "Trade Cert",
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
        body: "Contract signed - kicking off search for Store Associate openings this week.",
      },
      {
        contactId: owen.id,
        authorId: adminId,
        body: "Great intro call, they're excited to see candidates for the analyst opening.",
      },
      {
        contactId: derek.id,
        authorId: adminId,
        body: "Isla passed her trial period and the Junior Designer role is filled.",
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
      title: "Kickoff call - Store Associate search",
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
      subject: "Re: Store Associate openings",
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
