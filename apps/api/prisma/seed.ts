import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { getTenantThemeOrDefault } from "../src/tenants/index.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run seed.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const WORKSPACES = [
  {
    slug: "epson-factory",
    company: "Epson Demo",
    industry: "Electronics Manufacturing",
    organization: "Epson Indonesia",
    plant: "Karawang Plant",
    name: "Epson Factory"
  },
  {
    slug: "toyota-plant",
    company: "Toyota Demo",
    industry: "Automotive Assembly",
    organization: "Toyota Indonesia",
    plant: "Karawang Assembly",
    name: "Toyota Plant"
  },
  {
    slug: "nestle-factory",
    company: "Nestle Demo",
    industry: "Food & Beverage",
    organization: "Nestlé Indonesia",
    plant: "Cikupa Plant",
    name: "Nestlé Factory"
  },
  {
    slug: "custom-company",
    company: "Custom Company",
    industry: "General Manufacturing",
    organization: "Custom Workspace",
    plant: "Main Plant",
    name: "Custom Workspace"
  }
] as const;

const INVESTIGATION_STEPS = [
  { key: "evidence", label: "Evidence", done: false },
  { key: "root_cause", label: "Root Cause", done: false },
  { key: "countermeasure", label: "Countermeasure", done: false },
  { key: "approval", label: "Approval", done: false },
  { key: "closed", label: "Closed", done: false }
];

function todayAt(hour: number, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function seedWorkspace(config: (typeof WORKSPACES)[number]) {
  const company = await prisma.company.upsert({
    where: { id: `company-${config.slug}` },
    update: { name: config.company, industry: config.industry },
    create: {
      id: `company-${config.slug}`,
      name: config.company,
      industry: config.industry
    }
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: config.slug },
    update: {
      name: config.name,
      organization: config.organization,
      plant: config.plant,
      industry: config.industry
    },
    create: {
      id: `ws-${config.slug}`,
      companyId: company.id,
      slug: config.slug,
      name: config.name,
      organization: config.organization,
      plant: config.plant,
      industry: config.industry,
      domain: "manufacturing"
    }
  });

  const plant = await prisma.plant.upsert({
    where: { id: `plant-${config.slug}` },
    update: { name: config.plant },
    create: {
      id: `plant-${config.slug}`,
      workspaceId: workspace.id,
      name: config.plant
    }
  });

  const employees = await Promise.all(
    [
      { name: "Budi", email: "budi@demo.local", role: "Operator" },
      { name: "Abdul", email: "abdul@demo.local", role: "Engineer" },
      { name: "Sari", email: "sari@demo.local", role: "Supervisor" },
      { name: "Raka", email: "raka@demo.local", role: "Plant Manager" }
    ].map((emp) =>
      prisma.employee.upsert({
        where: { id: `emp-${config.slug}-${emp.role.toLowerCase().replace(/\s+/g, "-")}` },
        update: { name: emp.name, role: emp.role },
        create: {
          id: `emp-${config.slug}-${emp.role.toLowerCase().replace(/\s+/g, "-")}`,
          companyId: company.id,
          workspaceId: workspace.id,
          name: emp.name,
          email: emp.email,
          role: emp.role
        }
      })
    )
  );

  const engineer = employees.find((e) => e.role === "Engineer")!;
  const supervisor = employees.find((e) => e.role === "Supervisor")!;

  const lineCount = config.slug === "epson-factory" ? 6 : 4;
  const machinesPerLine = config.slug === "epson-factory" ? 12 : 10;
  const machineCodes: string[] = [];

  for (let lineIdx = 1; lineIdx <= lineCount; lineIdx++) {
    const line = await prisma.productionLine.upsert({
      where: { id: `line-${config.slug}-${lineIdx}` },
      update: { name: `Line ${lineIdx}` },
      create: {
        id: `line-${config.slug}-${lineIdx}`,
        plantId: plant.id,
        name: config.slug === "toyota-plant" && lineIdx === 1 ? "EA Line" : `Line ${lineIdx}`
      }
    });

    for (let m = 1; m <= machinesPerLine; m++) {
      const code =
        config.slug === "toyota-plant" && lineIdx === 1
          ? `EA-${String(m).padStart(2, "0")}`
          : config.slug === "nestle-factory" && lineIdx === 1
            ? `P-${String(m).padStart(2, "0")}`
            : `M-${lineIdx}${String(m).padStart(2, "0")}`;
      machineCodes.push(code);

      const machine = await prisma.machine.upsert({
        where: { id: `machine-${config.slug}-${code}` },
        update: {},
        create: {
          id: `machine-${config.slug}-${code}`,
          lineId: line.id,
          code,
          name: `Machine ${code}`,
          status: code.endsWith("12") || code === "EA-04" || code === "P-03" ? "alarm" : m % 7 === 0 ? "maintenance" : "running"
        }
      });

      for (let h = 4; h >= 0; h--) {
        const baseTemp = code.endsWith("12") || code === "EA-04" ? 72 : 68;
        const baseVib = code.endsWith("12") || code === "EA-04" || code === "P-03" ? 3.2 : 1.8;
        const recordedAt = hoursAgo(h * 0.5);
        await prisma.machineTelemetry.createMany({
          data: [
            {
              machineId: machine.id,
              metric: "temperature",
              value: baseTemp + h * 2 + (m % 3),
              recordedAt
            },
            {
              machineId: machine.id,
              metric: "vibration",
              value: Number((baseVib + h * 0.15).toFixed(2)),
              recordedAt
            }
          ],
          skipDuplicates: true
        });
      }
    }
  }

  const sopCategories = ["Quality", "Maintenance", "Safety", "Assembly", "Packaging"];
  for (let i = 1; i <= 120; i++) {
    const ref = `SOP-${String(i).padStart(3, "0")}`;
    await prisma.sopDocument.upsert({
      where: { workspaceId_referenceId: { workspaceId: workspace.id, referenceId: ref } },
      update: {},
      create: {
        workspaceId: workspace.id,
        referenceId: ref,
        title: `${sopCategories[i % sopCategories.length]} Procedure ${i}`,
        revision: `Rev.${(i % 5) + 1}`,
        category: sopCategories[i % sopCategories.length]!
      }
    });
  }

  const tenant = getTenantThemeOrDefault(config.slug);
  const flagshipMachineCode =
    config.slug === "custom-company"
      ? "M-101"
      : tenant.machineCode;
  const flagshipMachine = await prisma.machine.findFirst({
    where: { id: `machine-${config.slug}-${flagshipMachineCode}` }
  });
  const flagshipMachineId = flagshipMachine?.id ?? `machine-${config.slug}-${machineCodes[0] ?? "M-101"}`;

  if (config.slug === "custom-company") {
    console.log(`Seeded ${config.slug}: empty workspace`);
    return;
  }

  const primaryIssue = await prisma.issue.upsert({
    where: { id: `issue-${config.slug}-${tenant.primaryIssue.key}` },
    update: { progress: tenant.primaryIssue.progress, status: tenant.primaryIssue.status },
    create: {
      id: `issue-${config.slug}-${tenant.primaryIssue.key}`,
      workspaceId: workspace.id,
      machineId: flagshipMachineId,
      title: tenant.primaryIssue.title,
      description: tenant.primaryIssue.description,
      status: tenant.primaryIssue.status,
      severity: tenant.primaryIssue.severity,
      progress: tenant.primaryIssue.progress,
      ownerId: engineer.id,
      dueAt: todayAt(17, 0)
    }
  });

  await prisma.investigation.upsert({
    where: { issueId: primaryIssue.id },
    update: {
      progress: tenant.primaryIssue.progress,
      steps: [
        { key: "evidence", label: "Evidence", done: true },
        { key: "root_cause", label: "Root Cause", done: tenant.primaryIssue.progress > 50 },
        { key: "countermeasure", label: "Countermeasure", done: false },
        { key: "approval", label: "Approval", done: false },
        { key: "closed", label: "Closed", done: false }
      ]
    },
    create: {
      issueId: primaryIssue.id,
      status: "in_progress",
      progress: tenant.primaryIssue.progress,
      steps: [
        { key: "evidence", label: "Evidence", done: true },
        { key: "root_cause", label: "Root Cause", done: tenant.primaryIssue.progress > 50 },
        { key: "countermeasure", label: "Countermeasure", done: false },
        { key: "approval", label: "Approval", done: false },
        { key: "closed", label: "Closed", done: false }
      ]
    }
  });

  const secondaryIssue = await prisma.issue.upsert({
    where: { id: `issue-${config.slug}-${tenant.secondaryIssue.key}` },
    update: {},
    create: {
      id: `issue-${config.slug}-${tenant.secondaryIssue.key}`,
      workspaceId: workspace.id,
      machineId: flagshipMachineId,
      title: tenant.secondaryIssue.title,
      description: tenant.secondaryIssue.description,
      status: tenant.secondaryIssue.status,
      severity: tenant.secondaryIssue.severity,
      progress: tenant.secondaryIssue.progress,
      ownerId: engineer.id,
      dueAt: todayAt(15, 0)
    }
  });

  await prisma.investigation.upsert({
    where: { issueId: secondaryIssue.id },
    update: {},
    create: {
      issueId: secondaryIssue.id,
      status: "in_progress",
      progress: tenant.secondaryIssue.progress,
      steps: INVESTIGATION_STEPS.map((step, idx) => ({
        ...step,
        done: idx === 0
      }))
    }
  });

  for (let i = 1; i <= 28; i++) {
    const machineCode = machineCodes[i % machineCodes.length]!;
    const machineId = `machine-${config.slug}-${machineCode}`;
    const statuses = ["resolved", "closed", "investigating", "open"];
    await prisma.issue.upsert({
      where: { id: `issue-${config.slug}-hist-${i}` },
      update: {},
      create: {
        id: `issue-${config.slug}-hist-${i}`,
        workspaceId: workspace.id,
        machineId,
        title: `Historical Issue #${190 + i}`,
        status: statuses[i % statuses.length]!,
        severity: i % 4 === 0 ? "critical" : "medium",
        progress: (i * 7) % 100,
        ownerId: engineer.id,
        createdAt: hoursAgo(24 * (i % 14))
      }
    });
  }

  const workOrderTemplates =
    config.slug === "toyota-plant"
      ? [
          {
            id: `wo-${config.slug}-001`,
            number: "WO-240701",
            title: "Torque Tool Recalibration",
            reason: "Recalibrate torque tool after EA-04 drift",
            risk: "medium",
            issueId: primaryIssue.id
          },
          {
            id: `wo-${config.slug}-002`,
            number: "WO-240702",
            title: "Engine Inspection Catch-up",
            reason: "Clear engine inspection backlog at chassis line",
            risk: "high",
            issueId: secondaryIssue.id
          },
          {
            id: `wo-${config.slug}-003`,
            number: "WO-240703",
            title: "Welding Station Review",
            reason: "Verify welding parameters after torque incident",
            risk: "low",
            issueId: primaryIssue.id
          }
        ]
      : config.slug === "nestle-factory"
        ? [
            {
              id: `wo-${config.slug}-001`,
              number: "WO-240701",
              title: "Metal Detector Verification",
              reason: "Verify metal detector after alarm on P-03",
              risk: "high",
              issueId: primaryIssue.id
            },
            {
              id: `wo-${config.slug}-002`,
              number: "WO-240702",
              title: "Packaging Line Sanitation",
              reason: "Complete sanitation before line release",
              risk: "medium",
              issueId: secondaryIssue.id
            },
            {
              id: `wo-${config.slug}-003`,
              number: "WO-240703",
              title: "CCP Re-verification",
              reason: "Re-verify CCP after packaging hold",
              risk: "medium",
              issueId: primaryIssue.id
            }
          ]
        : [
            {
              id: `wo-${config.slug}-001`,
              number: "WO-240701",
              title: "Print Head Cleaning",
              reason: "Clean print head after white streak spike",
              risk: "medium",
              issueId: primaryIssue.id
            },
            {
              id: `wo-${config.slug}-002`,
              number: "WO-240702",
              title: "Ink Line Inspection",
              reason: "Investigate elevated ink consumption on Line 2",
              risk: "low",
              issueId: secondaryIssue.id
            },
            {
              id: `wo-${config.slug}-003`,
              number: "WO-240703",
              title: "Nozzle Calibration",
              reason: "Recalibrate nozzle after white streak analysis",
              risk: "high",
              issueId: primaryIssue.id
            }
          ];

  const pendingWorkOrders = workOrderTemplates.map((wo) => ({
    ...wo,
    machineId: flagshipMachineId
  }));

  for (const wo of pendingWorkOrders) {
    const workOrder = await prisma.workOrder.upsert({
      where: { id: wo.id },
      update: { status: "pending_approval" },
      create: {
        id: wo.id,
        workspaceId: workspace.id,
        number: wo.number,
        machineId: wo.machineId,
        issueId: wo.issueId,
        title: wo.title,
        reason: wo.reason,
        risk: wo.risk,
        status: "pending_approval",
        engineerId: engineer.id,
        aiReview: {
          checks: [
            { label: "SOP followed", status: "pass", detail: "SOP-014 Rev.5 referenced" },
            { label: "Parts available", status: "pass", detail: "Bearing SKF in stock (4 units)" },
            {
              label: "Downtime estimate",
              status: "warning",
              detail: wo.risk === "high" ? "60 min" : wo.risk === "medium" ? "40 min" : "25 min"
            }
          ],
          summary: "Work order is ready for supervisor review."
        }
      }
    });

    await prisma.approval.upsert({
      where: { workOrderId: workOrder.id },
      update: { status: "waiting" },
      create: {
        workOrderId: workOrder.id,
        status: "waiting"
      }
    });
  }

  for (let i = 4; i <= 45; i++) {
    const machineCode = machineCodes[i % machineCodes.length]!;
    const statuses = ["completed", "in_progress", "approved", "rejected"];
    const status = statuses[i % statuses.length]!;
    const woId = `wo-${config.slug}-${String(i).padStart(3, "0")}`;
    const workOrder = await prisma.workOrder.upsert({
      where: { id: woId },
      update: {},
      create: {
        id: woId,
        workspaceId: workspace.id,
        number: `WO-24${String(700 + i)}`,
        machineId: `machine-${config.slug}-${machineCode}`,
        title: `Maintenance Task ${i}`,
        reason: `Scheduled maintenance item ${i}`,
        risk: i % 3 === 0 ? "high" : "medium",
        status,
        engineerId: engineer.id,
        aiReview: {
          checks: [{ label: "SOP followed", status: "pass", detail: "Standard procedure" }],
          summary: "Historical work order"
        }
      }
    });

    if (status === "pending_approval") {
      await prisma.approval.upsert({
        where: { workOrderId: workOrder.id },
        update: {},
        create: { workOrderId: workOrder.id, status: "waiting" }
      });
    } else if (status === "approved" || status === "completed") {
      await prisma.approval.upsert({
        where: { workOrderId: workOrder.id },
        update: {},
        create: {
          workOrderId: workOrder.id,
          status: "approved",
          decidedById: supervisor.id,
          decidedAt: hoursAgo(i)
        }
      });
    }
  }

  const metrics = ["production", "quality", "delivery", "safety"];
  const baseValues: Record<string, number> = {
    production: 95,
    quality: 97,
    delivery: 98,
    safety: 100
  };

  for (let hour = 6; hour <= 11; hour++) {
    for (const metric of metrics) {
      await prisma.kpiSnapshot.create({
        data: {
          plantId: plant.id,
          metric,
          value: baseValues[metric]! + (hour - 8) * 0.4 + (metric === "production" ? 0.5 : 0),
          recordedAt: todayAt(hour, hour % 2 === 0 ? 0 : 30)
        }
      });
    }
  }

  const timelineEvents =
    config.slug === "toyota-plant"
      ? [
          { at: todayAt(8, 0), title: "Assembly Start", category: "production" },
          {
            at: todayAt(9, 15),
            title: "Torque Alarm",
            detail: `Station ${flagshipMachineCode} torque out of spec`,
            category: "quality"
          },
          {
            at: todayAt(9, 40),
            title: "Engineer Assigned",
            detail: `${engineer.name} assigned to ${flagshipMachineCode}`,
            category: "maintenance"
          },
          {
            at: todayAt(10, 5),
            title: "Engine Inspection Delay",
            detail: "3 units waiting at chassis line",
            category: "production"
          },
          {
            at: todayAt(10, 30),
            title: "ASM-022 Referenced",
            detail: "Torque standard review initiated",
            category: "quality"
          },
          { at: todayAt(11, 0), title: "Body Welding OK", detail: "Welding stations within tolerance", category: "production" }
        ]
      : config.slug === "nestle-factory"
        ? [
            { at: todayAt(7, 45), title: "Pre-op Inspection", category: "production" },
            {
              at: todayAt(8, 30),
              title: "Metal Detector Alarm",
              detail: `Alarm on Line ${flagshipMachineCode}`,
              category: "quality"
            },
            {
              at: todayAt(9, 0),
              title: "Line Held",
              detail: "Packaging line stopped for QA review",
              category: "production"
            },
            {
              at: todayAt(9, 30),
              title: "HACCP-011 Triggered",
              detail: "Containment procedure started",
              category: "quality"
            },
            {
              at: todayAt(10, 15),
              title: "Supplier Lot Hold",
              detail: "Packaging lot placed on hold",
              category: "quality"
            },
            { at: todayAt(11, 0), title: "CCP Check Complete", detail: "All CCP verified for shift A", category: "production" }
          ]
        : [
            { at: todayAt(8, 0), title: "Production Start", category: "production" },
            {
              at: todayAt(9, 15),
              title: "White Streak Alert",
              detail: "+12% vs yesterday on Line 2",
              category: "quality"
            },
            {
              at: todayAt(9, 40),
              title: "Engineer Assigned",
              detail: `${engineer.name} assigned to white streak investigation`,
              category: "quality"
            },
            {
              at: todayAt(10, 5),
              title: "Ink Consumption High",
              detail: "18% above target",
              category: "production"
            },
            {
              at: todayAt(10, 30),
              title: "SOP-014 Opened",
              detail: "Print head troubleshooting started",
              category: "quality"
            },
            { at: todayAt(11, 0), title: "Line 2 Running", detail: "Printer assembly within spec", category: "production" }
          ];

  await prisma.activityEvent.deleteMany({ where: { workspaceId: workspace.id } });
  for (const event of timelineEvents) {
    await prisma.activityEvent.create({
      data: {
        workspaceId: workspace.id,
        occurredAt: event.at,
        title: event.title,
        detail: event.detail,
        category: event.category
      }
    });
  }

  await prisma.graphEdge.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.graphEdge.createMany({
    data: [
      {
        workspaceId: workspace.id,
        fromType: "machine",
        fromId: flagshipMachineId,
        relation: "uses",
        toType: "part",
        toId: "bearing-skf-6205",
        label: "Bearing SKF 6205"
      },
      {
        workspaceId: workspace.id,
        fromType: "machine",
        fromId: flagshipMachineId,
        relation: "related_sop",
        toType: "sop",
        toId: "SOP-014",
        label: "SOP-014 Rev.5"
      },
      {
        workspaceId: workspace.id,
        fromType: "issue",
        fromId: primaryIssue.id,
        relation: "similar_issue",
        toType: "issue",
        toId: `issue-${config.slug}-hist-12`,
        label: "Issue #202 — same pattern"
      },
      {
        workspaceId: workspace.id,
        fromType: "issue",
        fromId: secondaryIssue.id,
        relation: "owned_by",
        toType: "employee",
        toId: engineer.id,
        label: engineer.name
      }
    ]
  });

  const sopRevision =
    config.slug === "toyota-plant"
      ? {
          referenceId: "ASM-022",
          title: "Engine Bolt Torque Standard",
          summary: "Updated torque values after EA-04 drift analysis."
        }
      : config.slug === "nestle-factory"
        ? {
            referenceId: "HACCP-011",
            title: "Packaging Contamination Response",
            summary: "Updated containment steps after metal detector alarm."
          }
        : {
            referenceId: "SOP-014",
            title: "Nozzle Calibration Procedure",
            summary: "Updated calibration interval after white streak analysis."
          };

  await prisma.sopRevision.upsert({
    where: { id: `sop-rev-${config.slug}-014` },
    update: { status: "pending_approval" },
    create: {
      id: `sop-rev-${config.slug}-014`,
      workspaceId: workspace.id,
      referenceId: sopRevision.referenceId,
      title: sopRevision.title,
      revision: "Rev.6",
      summary: sopRevision.summary,
      status: "pending_approval",
      submitterId: engineer.id,
      aiReview: {
        checks: [
          { label: "Safety review", status: "pass", detail: "No new hazards identified" },
          { label: "Impact assessment", status: "pass", detail: "Affects Line 3 nozzle setup" },
          { label: "Training required", status: "warning", detail: "Operators need briefing" }
        ],
        summary: "SOP revision ready for supervisor approval."
      }
    }
  });

  await prisma.engineeringReport.upsert({
    where: { id: `report-${config.slug}-001` },
    update: {},
    create: {
      id: `report-${config.slug}-001`,
      workspaceId: workspace.id,
      issueId: primaryIssue.id,
      title:
        config.slug === "toyota-plant"
          ? "Torque EA-04 Root Cause Analysis"
          : config.slug === "nestle-factory"
            ? "Metal Detector Alarm Investigation"
            : "White Streak Root Cause Analysis",
      content:
        config.slug === "toyota-plant"
          ? "Preliminary analysis indicates torque tool drift at EA-04. Recommend recalibration per ASM-022."
          : config.slug === "nestle-factory"
            ? "Metal detector alarm triggered during packaging run. HACCP-011 containment applied, supplier lot held."
            : "Preliminary analysis indicates nozzle pressure drift. Recommend recalibration per SOP-014.",
      status: "pending_approval",
      submittedAt: new Date(),
      authorId: engineer.id
    }
  });

  await prisma.engineeringReport.upsert({
    where: { id: `report-${config.slug}-002` },
    update: {},
    create: {
      id: `report-${config.slug}-002`,
      workspaceId: workspace.id,
      issueId: secondaryIssue.id,
      title:
        config.slug === "toyota-plant"
          ? "Engine Inspection Backlog Report"
          : config.slug === "nestle-factory"
            ? "Packaging Line Hold Report"
            : "Ink Consumption Analysis",
      content:
        config.slug === "toyota-plant"
          ? "Engine inspection backlog affecting chassis throughput. Prioritize units waiting > 2 hours."
          : config.slug === "nestle-factory"
            ? "Packaging line held pending sanitation verification and CCP re-check."
            : "Ink consumption 18% above target — investigate ink filling process on Line 2.",
      status: "pending_approval",
      authorId: engineer.id
    }
  });

  const complaintCustomer =
    config.slug === "toyota-plant"
      ? { customer: "Toyota Motor Asia", product: "Camry Door Panel", number: "CC-2026-021" }
      : config.slug === "nestle-factory"
        ? { customer: "Nestlé Regional", product: "KitKat 4-Finger", number: "CC-2026-018" }
        : { customer: "ABC Indonesia", product: "Printer X200", number: "CC-2026-021" };

  await prisma.customerComplaint.upsert({
    where: { id: `complaint-${config.slug}-001` },
    update: {},
    create: {
      id: `complaint-${config.slug}-001`,
      workspaceId: workspace.id,
      complaintNumber: complaintCustomer.number,
      customerName: complaintCustomer.customer,
      product: complaintCustomer.product,
      priority: "critical",
      status: "investigating",
      description: "Customer reported quality defect on delivered batch. Immediate containment required.",
      engineerId: engineer.id,
      dueAt: new Date(),
      timeline: [
        { time: "08:30", title: "Complaint Created" },
        { time: "09:10", title: "Engineer Assigned" },
        { time: "10:20", title: "Root Cause Analysis Started" }
      ],
      attachments: ["Photo", "QC Report", "Trend"]
    }
  });

  const lineName = tenant.lineLabel;
  const checklistItems =
    config.slug === "toyota-plant"
      ? [
          { id: "c1", label: "Torque Check EA-04", done: false },
          { id: "c2", label: "Engine Mount Verification", done: true },
          { id: "c3", label: "Body Welding Visual", done: false },
          { id: "c4", label: "Chassis Assembly Sign-off", done: false }
        ]
      : config.slug === "nestle-factory"
        ? [
            { id: "c1", label: "CCP Temperature Check", done: true },
            { id: "c2", label: "Metal Detector Test", done: false },
            { id: "c3", label: "Packaging Seal Inspection", done: false },
            { id: "c4", label: "Cleaning Verification", done: false }
          ]
        : [
            { id: "c1", label: "Print Head Inspection", done: true },
            { id: "c2", label: "Ink Level Check", done: false },
            { id: "c3", label: "White Streak Sample", done: false },
            { id: "c4", label: "PPM Verification", done: false }
          ];

  await prisma.operatorChecklistRun.upsert({
    where: { id: `checklist-${config.slug}-today` },
    update: {},
    create: {
      id: `checklist-${config.slug}-today`,
      workspaceId: workspace.id,
      line: lineName,
      shift: "Shift A",
      targetOutput: 420,
      progress: 165,
      items: checklistItems
    }
  });

  await prisma.memoryRecord.deleteMany({
    where: { workspaceId: workspace.id, scope: { startsWith: "machine:" } }
  });
  await prisma.memoryRecord.createMany({
    data: [
      {
        workspaceId: workspace.id,
        scope: `machine:${flagshipMachineCode}`,
        content:
          config.slug === "toyota-plant"
            ? "Torque tool TQ-07 was recalibrated 28 days ago. If drift returns at EA-04, check tool before bolt sequence."
            : config.slug === "nestle-factory"
              ? "Metal detector alarm on P-03 last month was caused by foil fragment — verify supplier lot before release."
              : "Similar white streak defect occurred in Issue #202 — resolved by print head cleaning per SOP-014.",
        tags:
          config.slug === "toyota-plant"
            ? ["torque", "history", "root_cause"]
            : config.slug === "nestle-factory"
              ? ["haccp", "metal_detector", "history"]
              : ["quality", "similar_case"]
      },
      {
        workspaceId: workspace.id,
        scope: `issue:${tenant.primaryIssueKey}`,
        content:
          config.slug === "toyota-plant"
            ? "Torque drift at EA-04 concentrated in last 3 shifts — ASM-022 revision may be needed."
            : config.slug === "nestle-factory"
              ? "HACCP-011 triggered — hold all product from affected batch until QA release."
              : "White streak rate increased 12% — ink consumption also elevated on same line.",
        tags:
          config.slug === "toyota-plant"
            ? ["torque", "ea-04"]
            : config.slug === "nestle-factory"
              ? ["haccp", "packaging"]
              : ["white_streak", "ink"]
      }
    ]
  });

  if (config.slug !== "custom-company") {
    const defaultRules = [
      {
        name: "PPM Critical Threshold",
        category: "quality",
        metric: "ppm",
        operator: "gt",
        threshold: 3000,
        severity: "critical",
        description: "IF PPM > 3000 THEN Critical"
      },
      {
        name: "Extended Downtime",
        category: "production",
        metric: "downtime_minutes",
        operator: "gt",
        threshold: 60,
        severity: "critical",
        description: "IF Downtime > 60 min AND Line Running THEN Critical"
      },
      {
        name: "Machine Down Alert",
        category: "maintenance",
        metric: "machines_down",
        operator: "gte",
        threshold: 1,
        severity: "high",
        description: "IF Machine Down > 30 min THEN Critical"
      },
      {
        name: "Customer Complaint",
        category: "quality",
        metric: "customer_complaints",
        operator: "gte",
        threshold: 1,
        severity: "critical",
        description: "IF Customer Complaint THEN Critical"
      },
      {
        name: "Safety Incident",
        category: "safety",
        metric: "safety_incidents",
        operator: "gte",
        threshold: 1,
        severity: "critical",
        description: "IF Safety Incident THEN Always Critical"
      }
    ];

    for (const rule of defaultRules) {
      await prisma.businessRule.upsert({
        where: { id: `rule-${config.slug}-${rule.metric}` },
        update: { enabled: true, threshold: rule.threshold },
        create: {
          id: `rule-${config.slug}-${rule.metric}`,
          workspaceId: workspace.id,
          name: rule.name,
          category: rule.category,
          metric: rule.metric,
          operator: rule.operator,
          threshold: rule.threshold,
          severity: rule.severity,
          description: rule.description,
          enabled: true
        }
      });
    }
  }

  console.log(`Seeded ${config.slug}: ${machineCodes.length} machines, 120 SOPs, issues & work orders`);
}

async function main() {
  const existing = await prisma.workspace.count();
  if (existing > 0) {
    console.log("Database already seeded — refreshing timeline & KPI snapshots only.");
  }

  for (const ws of WORKSPACES) {
    await seedWorkspace(ws);
  }

  console.log("Enterprise graph seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
