import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_LEADS = [
  {
    seedKey: 'demo-lead-01',
    name: 'Sarah Chen',
    companyName: 'Meridian Capital',
    companyUrl: 'https://meridiancapital.io',
    icpScore: 92,
    industry: 'FinTech SaaS',
    companySize: '100-200 employees',
    qualify: {
      icpScore: 92,
      reasoning:
        'Meridian Capital is a 150-person Series B FinTech SaaS company selling automated treasury management to mid-market CFOs. Their buyer profile (CFO/VP Finance at 50-500 employee companies), SaaS revenue model (ARR confirmed on LinkedIn), and active SDR team (3 open SDR roles on LinkedIn) maps directly to our ICP. High urgency signals: recent funding ($28M Series B, 8 months ago) and headcount growth (40% in 12 months) indicate active investment in GTM expansion.',
      matchedCriteria: [
        'SaaS business model with recurring revenue',
        'Series B funding stage with active GTM investment',
        '100-200 employee headcount (ideal ICP range)',
        'VP Sales + active SDR hiring signals',
        'CFO/Finance buyer persona with clear automation pain',
      ],
      weakCriteria: [
        'Financial services regulatory complexity may extend procurement cycle',
        'Competitive space with established players (Brex, Ramp)',
      ],
    },
    enrich: {
      companySize: '100-200 employees',
      industry: 'FinTech SaaS',
      techStack: ['Salesforce', 'HubSpot', 'AWS', 'React', 'Node.js', 'Stripe'],
      painPoints: [
        'Manual treasury reconciliation consuming 15+ hours weekly per finance analyst',
        'SDR team spending 60% of time on manual lead research instead of outreach',
        'No automated ICP scoring — reps qualify based on gut feel causing pipeline quality issues',
      ],
    },
    email:
      "Hi Sarah,\n\nI noticed Meridian Capital closed a $28M Series B earlier this year — congratulations on the milestone.\n\nAt FinTech SaaS companies your size, we typically see two pain points emerge right after a funding round: the SDR team gets buried in manual lead research instead of actual outreach, and there is no systematic ICP scoring so reps waste time on accounts that will never close.\n\nI built an AI SDR tool that addresses both: it qualifies leads against your ICP in seconds, auto-enriches company context (tech stack, funding, headcount), and generates personalized emails that reference FinTech-specific pain points — not generic templates.\n\nWould you be open to a 20-minute conversation to see how it handles treasury SaaS outreach specifically?\n\nBest,\nFernando",
  },
  {
    seedKey: 'demo-lead-02',
    name: 'James Okafor',
    companyName: 'ClearPath Health',
    companyUrl: 'https://clearpathhealth.com',
    icpScore: 78,
    industry: 'Healthcare SaaS',
    companySize: '50-100 employees',
    qualify: {
      icpScore: 78,
      reasoning:
        '80-person healthcare SaaS startup with a revenue cycle management product. SaaS model and active sales team (confirmed 2 SDR roles on LinkedIn) match ICP. Moderate fit: healthcare compliance requirements add sales cycle complexity and buyer is typically VP Revenue Cycle (finance-adjacent, not traditional Sales VP).',
      matchedCriteria: [
        'SaaS business model',
        'Active SDR team hiring (2 open roles)',
        '50-100 employee growth stage',
        'B2B sales motion with defined buyer persona',
      ],
      weakCriteria: [
        'Healthcare regulatory environment (HIPAA compliance reviews) extends procurement',
        'Smaller company size limits budget authority for new tooling',
        'Revenue cycle buyers are risk-averse — longer evaluation cycles',
      ],
    },
    enrich: {
      companySize: '50-100 employees',
      industry: 'Healthcare SaaS',
      techStack: ['Salesforce', 'AWS', 'Python', 'React', 'Redshift'],
      painPoints: [
        'SDR team lacks systematic lead qualification — manual HIPAA-compliant outreach is time-consuming',
        'No centralized enrichment for hospital system leads (size, buying authority, tech stack unknown)',
        'Compliance review required for any new vendor tool adds 6-8 week procurement delay',
      ],
    },
    email:
      "Hi James,\n\nClearPath Health's focus on revenue cycle management puts your SDR team in a tough spot — every outreach email needs to demonstrate HIPAA awareness before prospects will even respond.\n\nMost generic SDR tools can not handle healthcare-specific compliance language or enrich leads with hospital system context (EHR vendor, bed count, revenue cycle maturity). That forces your reps to do manual research before every single outreach.\n\nI built an AI SDR tool that automates qualification and personalization with healthcare-aware prompting, so your team can move faster without sacrificing compliance diligence.\n\nWould a 20-minute demo be useful? I can show you how it handles RCM-specific ICP scoring.\n\nBest,\nFernando",
  },
  {
    seedKey: 'demo-lead-03',
    name: 'Maria Santos',
    companyName: 'Cartflow Commerce',
    companyUrl: 'https://cartflowcommerce.com',
    icpScore: 67,
    industry: 'E-commerce SaaS',
    companySize: '200-500 employees',
    qualify: {
      icpScore: 67,
      reasoning:
        '300-person mid-market e-commerce SaaS. Has active sales team but buyer persona is Director of E-commerce/Merchandising — less aligned with finance/ops automation ICP. Revenue model is SaaS (subscription analytics platform) but competitive market makes differentiation harder.',
      matchedCriteria: [
        'SaaS subscription model',
        'Active outbound sales motion (confirmed on LinkedIn)',
        'Mid-market size with budget for tooling',
        'Clear SDR workflow with quota and pipeline targets',
      ],
      weakCriteria: [
        'Buyer persona (e-commerce directors) is less aligned with AI automation ICP',
        'Crowded market — many competitors offering similar SDR tooling',
        'Mid-market procurement process adds 4-6 week evaluation cycle',
      ],
    },
    enrich: {
      companySize: '200-500 employees',
      industry: 'E-commerce SaaS',
      techStack: ['Shopify', 'Klaviyo', 'Snowflake', 'React', 'Python', 'HubSpot'],
      painPoints: [
        'SDR team manually researches e-commerce brands before outreach — 45 minutes per lead',
        'No ICP scoring — all inbound leads treated equally regardless of store size or tech stack',
        'Email personalization is generic template-based — low open rates for outbound campaigns',
      ],
    },
    email:
      "Hi Maria,\n\nCartflow Commerce's analytics platform serves a wide range of e-commerce brands — which means your SDR team has to manually research each prospect to understand whether they are a good fit before reaching out.\n\nPersonalizing outreach at scale across diverse e-commerce segments (DTC, marketplace, wholesale) is exactly where generic SDR templates break down. Forty-five minutes of research per lead adds up fast when your team is running outbound campaigns across hundreds of Shopify and Klaviyo customers.\n\nI built an AI SDR tool that automates ICP scoring and generates personalized emails with e-commerce-specific context built in — store GMV signals, tech stack (Shopify vs Magento), and marketing stack enrichment.\n\nWould it be worth 20 minutes to see how it handles e-commerce segmentation?\n\nBest,\nFernando",
  },
  {
    seedKey: 'demo-lead-04',
    name: 'David Park',
    companyName: 'Vertex HR Systems',
    companyUrl: 'https://vertexhrsystems.com',
    icpScore: 43,
    industry: 'HR Software',
    companySize: '500-1000 employees',
    qualify: {
      icpScore: 43,
      reasoning:
        '700-person established HR software company. Large size creates longer sales cycles and risk-averse procurement. Sales team exists but is primarily focused on inbound (established brand). Limited active SDR expansion signals — company is in optimization mode not hypergrowth mode.',
      matchedCriteria: [
        'SaaS business model',
        'Defined sales team with CRM (Salesforce)',
        'B2B buyer persona (HR Directors) is well-understood',
      ],
      weakCriteria: [
        'Large company size (700+ employees) means longer procurement and legal review',
        'No hypergrowth signals — optimization mode vs active GTM expansion',
        'HR buyer persona is risk-averse — high bar for new tooling approval',
        'Established brand relies on inbound — outbound SDR motion is not a priority investment',
      ],
    },
    enrich: {
      companySize: '500-1000 employees',
      industry: 'HR Software',
      techStack: ['Salesforce', 'Workday', 'AWS', 'Angular', 'Java', 'Oracle'],
      painPoints: [
        'SDR team is small (2 reps) and focused primarily on following up inbound — not systematic outbound',
        'No automated lead enrichment — manual research per enterprise account is time-consuming',
        'HR compliance requirements create additional friction for technology vendor evaluation',
      ],
    },
    email:
      "Hi David,\n\nVertex HR Systems has built a strong inbound motion — but enterprise HR accounts still require significant manual research before your SDRs can qualify them effectively.\n\nAt companies your size, a two-person SDR team spending time on manual enrichment for complex enterprise accounts (org size, HRIS stack, compliance maturity) is a real velocity bottleneck. The research time per account often exceeds the time spent on actual outreach.\n\nI built an AI SDR tool that automates that enrichment step — qualifying enterprise leads against your ICP criteria and surfacing the context your reps need to reach out with confidence.\n\nWould a 20-minute walkthrough be useful to see if it fits your current motion?\n\nBest,\nFernando",
  },
  {
    seedKey: 'demo-lead-05',
    name: 'Rachel Nguyen',
    companyName: 'BuildPilot',
    companyUrl: 'https://buildpilot.io',
    icpScore: 31,
    industry: 'Construction Tech',
    companySize: '50-200 employees',
    qualify: {
      icpScore: 31,
      reasoning:
        '120-person construction tech SaaS targeting general contractors. Significant ICP mismatch: construction buyer persona (VP Operations, Project Managers) is not a traditional software buyer — long evaluation cycles, field-centric organization resists new tooling, and low digital maturity in the construction vertical.',
      matchedCriteria: [
        'SaaS business model',
        'Active sales team (confirmed 1 SDR role)',
      ],
      weakCriteria: [
        'Construction vertical buyer (VP Operations, PMs) is non-traditional software buyer',
        'Field-centric organization — digital tool adoption is slow',
        'Low SDR investment signals (only 1 SDR role for entire company)',
        'Niche vertical expertise required for effective outreach — generic SDR messaging will not land',
        'Procurement involves field ops approval, not just finance',
      ],
    },
    enrich: {
      companySize: '50-200 employees',
      industry: 'Construction Tech',
      techStack: ['Procore', 'Microsoft Teams', 'AWS', 'React Native', 'PostgreSQL'],
      painPoints: [
        'SDR spends excessive time learning construction industry jargon before outreach',
        'Lead qualification is manual and inconsistent — no scoring model for contractor company size or project volume',
        'Email personalization requires deep vertical knowledge that current SDR team lacks',
      ],
    },
    email:
      "Hi Rachel,\n\nSelling construction project management software requires a level of vertical context that most SDR tools completely miss — general contractors and subcontractors have very different buying triggers, and generic outreach gets deleted immediately.\n\nBuildPilot's single SDR has to research Procore usage, project volume, and subcontractor network size before every outreach — that is a lot of manual work for a niche that moves slowly.\n\nI built an AI SDR tool that can incorporate vertical-specific ICP signals, including construction tech indicators like ERP stack (Procore, Sage, Viewpoint) and project type, to score and personalize outreach more efficiently.\n\nWould it be worth a quick 20-minute conversation to see if it could help your current SDR motion?\n\nBest,\nFernando",
  },
  {
    seedKey: 'demo-lead-06',
    name: 'Tyler Brooks',
    companyName: 'Mosaic Mobile',
    companyUrl: 'https://mosaicmobile.app',
    icpScore: 22,
    industry: 'Consumer Mobile Apps',
    companySize: '10-50 employees',
    qualify: {
      icpScore: 22,
      reasoning:
        '20-person early-stage consumer mobile app startup. Strong ICP mismatch: no B2B sales motion, revenue is consumer subscription (not enterprise SaaS), no SDR team, and company size/stage is below ICP minimum. Outbound SDR tooling is not relevant at this stage.',
      matchedCriteria: ['Technology company with SaaS-adjacent revenue model'],
      weakCriteria: [
        'Consumer product — no B2B outbound sales motion',
        'No SDR team and none planned in near term (seed stage)',
        'Company size (20 employees) is below ICP minimum',
        'Revenue model is B2C subscriptions — no enterprise sales process',
        'No CRM in use — Notion for tracking leads',
        'Founder-led sales, not SDR-driven',
      ],
    },
    enrich: {
      companySize: '10-50 employees',
      industry: 'Consumer Mobile Apps',
      techStack: ['React Native', 'Firebase', 'Node.js', 'Stripe', 'Mixpanel'],
      painPoints: [
        'No structured outbound sales process — all growth from app store and social media',
        'Founder is sole "SDR" — no capacity to build systematic outreach',
        'No budget for enterprise sales tooling at this stage',
      ],
    },
    email:
      "Hi Tyler,\n\nMosaic Mobile's consumer-first model means you are probably not running a traditional B2B outbound motion right now — and that is completely the right call at seed stage.\n\nThat said, if Mosaic ever moves toward enterprise distribution partnerships or B2B licensing (app stores for enterprise, white-label deals), having an automated qualification and outreach system becomes immediately relevant.\n\nI built an AI SDR tool for B2B SaaS teams — it is probably not the right fit for Mosaic today, but I wanted to reach out now so you know what is available when the time comes.\n\nFeel free to bookmark this and circle back if the direction shifts toward B2B.\n\nBest,\nFernando",
  },
  {
    seedKey: 'demo-lead-07',
    name: 'Alex Rivera',
    companyName: 'Stackline DevOps',
    companyUrl: 'https://stacklinedevops.com',
    icpScore: 85,
    industry: 'DevTools SaaS',
    companySize: '100-300 employees',
    qualify: {
      icpScore: 85,
      reasoning:
        '180-person growth-stage DevTools SaaS with a strong PLG + sales-assist motion. CRO hired 6 months ago (LinkedIn confirmation). Active SDR expansion: 3 SDR roles open. Buyer persona (VP Engineering, CTO) buys on technical value — outreach must be highly personalized to tech stack. Strong ICP fit: SaaS, growth stage, active GTM investment, technical buyer who values automation.',
      matchedCriteria: [
        'SaaS DevTools with clear B2B revenue model',
        'Growth stage with active GTM investment (CRO hire + SDR expansion)',
        '100-300 employee headcount is ideal ICP range',
        'Technical buyer (VP Eng/CTO) responds well to automated, relevant outreach',
        'PLG + sales-assist motion where SDR enrichment directly improves conversion',
      ],
      weakCriteria: [
        'Technical buyer persona requires highly customized messaging — generic outreach will be deleted',
        'DevTools market has high vendor fatigue — SDR outreach must be precise',
      ],
    },
    enrich: {
      companySize: '100-300 employees',
      industry: 'DevTools SaaS',
      techStack: [
        'GitHub Actions',
        'AWS',
        'Kubernetes',
        'Datadog',
        'React',
        'Go',
        'PostgreSQL',
      ],
      painPoints: [
        'SDR team manually researches tech stack from GitHub profiles and job postings — 90 minutes per enterprise account',
        'Outbound emails are too generic for technical buyers — low response rates on cold campaigns',
        'No systematic ICP scoring — AEs waste time on non-technical companies that will never buy DevTools',
      ],
    },
    email:
      "Hi Alex,\n\nStackline DevOps hiring a CRO six months ago signals a real investment in scaling the sales-assist motion — but DevTools SDRs face a unique challenge that most outreach tools can not solve: technical buyers (VP Eng, CTOs) immediately delete emails that do not reference their actual stack.\n\nYour team spending 90 minutes researching GitHub profiles and job postings before each enterprise outreach is a real velocity bottleneck. Generic SDR templates that mention \"CI/CD automation\" without referencing GitHub Actions usage or Kubernetes adoption get ignored.\n\nI built an AI SDR tool that automatically enriches leads with tech stack signals from public sources and generates outreach that references specific tools — so your SDRs send emails that read like they came from a DevTools expert, not a template.\n\nWould a 20-minute demo be worth it to see how it handles DevTools ICP scoring specifically?\n\nBest,\nFernando",
  },
  {
    seedKey: 'demo-lead-08',
    name: 'Priya Mehta',
    companyName: 'LogiStream',
    companyUrl: 'https://logistream.io',
    icpScore: 55,
    industry: 'Logistics Tech',
    companySize: '200-500 employees',
    qualify: {
      icpScore: 55,
      reasoning:
        '280-person logistics tech company with a SaaS freight management platform. Moderate ICP fit: SaaS model and active sales team confirmed, but logistics buyer (VP Operations, Freight Director) is operationally focused and cautious about new tooling. SDR team is small (2 reps) and primarily handles inbound from freight broker referrals.',
      matchedCriteria: [
        'SaaS platform with subscription revenue',
        'Defined sales team with Salesforce CRM',
        'B2B sales motion targeting logistics operators',
        'Mid-market size with tooling budget',
      ],
      weakCriteria: [
        'Logistics buyer (VP Operations) is operationally cautious — slow to adopt new sales tools',
        'Small SDR team (2 reps) primarily handles inbound — limited outbound motion to accelerate',
        'Niche vertical knowledge required for effective outreach',
        'Procurement involves operations approval alongside finance',
      ],
    },
    enrich: {
      companySize: '200-500 employees',
      industry: 'Logistics Tech',
      techStack: ['Salesforce', 'SAP', 'AWS', 'Python', 'React', 'PostgreSQL'],
      painPoints: [
        'SDR team manually researches freight broker companies — carrier data is fragmented across multiple sources',
        'No ICP scoring for logistics leads — all freight operator inquiries treated equally regardless of volume or tech stack',
        'Email personalization is generic — outreach does not reference specific freight volumes or carrier network size',
      ],
    },
    email:
      "Hi Priya,\n\nLogiStream's freight management platform targets a buyer (VP Operations, Freight Directors) who gets inundated with vendor outreach — and most of it is generic enough to ignore.\n\nYour two-person SDR team researching fragmented carrier data across multiple sources before each outreach is a real bottleneck, especially when logistics leads require context (freight volume, carrier network size, tech stack) that is not available in standard enrichment tools.\n\nI built an AI SDR tool that automates qualification and generates personalized outreach with logistics-specific context built in — so your reps can reach freight operators with emails that reference actual operational signals, not boilerplate templates.\n\nWould it be worth a 20-minute conversation to see how it handles logistics ICP scoring?\n\nBest,\nFernando",
  },
];

async function main() {
  for (const lead of DEMO_LEADS) {
    const existing = await prisma.demoLead.findUnique({
      where: { seedKey: lead.seedKey },
    });
    if (existing) {
      console.log(`[${lead.seedKey}] already seeded — skipping`);
      continue;
    }

    const created = await prisma.lead.create({
      data: {
        name: lead.name,
        companyName: lead.companyName,
        companyUrl: lead.companyUrl,
        status: 'complete',
        icpScore: lead.icpScore,
        industry: lead.industry,
        companySize: lead.companySize,
      },
    });

    await prisma.aIOutput.createMany({
      data: [
        { leadId: created.id, step: 'qualify', content: lead.qualify },
        { leadId: created.id, step: 'enrich', content: lead.enrich },
        { leadId: created.id, step: 'personalize', content: { email: lead.email } },
      ],
    });

    await prisma.demoLead.create({
      data: {
        seedKey: lead.seedKey,
        name: lead.name,
        companyName: lead.companyName,
        companyUrl: lead.companyUrl,
      },
    });

    console.log(`[${lead.seedKey}] seeded — icpScore: ${lead.icpScore}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
