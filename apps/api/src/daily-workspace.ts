export interface DailyWorkspace {
  dailyBrief: Array<{
    id: string;
    severity: "critical" | "warning" | "success";
    icon: string;
    title: string;
    detail: string;
    confidence?: string;
    actionLabel: string;
    prompt: string;
    contextLabel: string;
  }>;
  focusCategories: Array<{
    id: string;
    label: string;
    status: "green" | "yellow" | "red";
    summary: string;
    prompt: string;
  }>;
  copilotSuggestions: Array<{ label: string; prompt: string }>;
  recentSearchCategories: string[];
  todayFocus: Array<{ icon: string; label: string }>;
  quickActions: Array<{ icon: string; label: string; prompt: string; contextLabel: string }>;
  continueWorking: Array<{ id: string; label: string; prompt: string }>;
  aiSuggestions: Array<{ text: string; prompt: string }>;
  todayKpi: Array<{
    label: string;
    value: string;
    status: "green" | "yellow" | "red";
    prompt: string;
  }>;
  inbox: { unread: number; aiSummary: string[] };
  meeting: {
    time: string;
    title: string;
    agenda: string[];
    linkLabel: string;
  } | null;
  activityFeed: Array<{ time: string; message: string }>;
  notifications: Array<{
    id: string;
    category: string;
    message: string;
    prompt: string;
  }>;
  knowledgeRecent: Array<{ id: string; label: string; prompt: string }>;
  knowledgeRecentlyUpdated: Array<{ id: string; label: string; prompt: string }>;
  proactiveGreeting: string;
  proactiveCards: Array<{ icon: string; text: string; prompt: string; contextLabel: string }>;
}

export const epsonDailyWorkspace: DailyWorkspace = {
  dailyBrief: [
    {
      id: "brief-1",
      severity: "critical",
      icon: "🔴",
      title: "White streak meningkat 12%",
      detail: "Reject rate naik dibanding kemarin.",
      confidence: "88%",
      actionLabel: "Investigate",
      prompt: "Continue white streak investigation — possible cause analysis",
      contextLabel: "White Streak"
    },
    {
      id: "brief-2",
      severity: "warning",
      icon: "🟠",
      title: "Ink Consumption tinggi",
      detail: "18% di atas target di Line 2.",
      actionLabel: "Review",
      prompt: "Why is ink consumption high on Line 2?",
      contextLabel: "Ink"
    },
    {
      id: "brief-3",
      severity: "success",
      icon: "🟢",
      title: "Line 2 berjalan normal",
      detail: "Print head dan assembly dalam spesifikasi.",
      actionLabel: "View Summary",
      prompt: "Show printer assembly line status",
      contextLabel: "Line 2"
    }
  ],
  focusCategories: [
    {
      id: "machine",
      label: "Machine",
      status: "red",
      summary: "M-12 vibration high",
      prompt: "Machine 12 alarm terus"
    },
    {
      id: "production",
      label: "Production",
      status: "green",
      summary: "96% on target",
      prompt: "Show today's production status"
    },
    {
      id: "quality",
      label: "Quality",
      status: "yellow",
      summary: "White streak +18%",
      prompt: "Continue white streak investigation"
    },
    {
      id: "meeting",
      label: "Meeting",
      status: "green",
      summary: "13:00 Production standup",
      prompt: "What is the agenda for today's production meeting?"
    },
    {
      id: "supplier",
      label: "Supplier",
      status: "yellow",
      summary: "1 delayed shipment",
      prompt: "Summarize supplier delay emails today"
    },
    {
      id: "email",
      label: "Email",
      status: "yellow",
      summary: "4 need review",
      prompt: "Summarize emails that need my attention today"
    }
  ],
  copilotSuggestions: [
    { label: "Explain Alarm", prompt: "Explain the Machine M-12 alarm and what happened" },
    { label: "Show SOP", prompt: "Show SOP-014 printer white streak troubleshooting" },
    { label: "Generate Countermeasure", prompt: "Recommend countermeasure for Machine M-12 vibration" },
    { label: "Create Work Order", prompt: "Create a maintenance work order for Machine M-12 bearing inspection" }
  ],
  recentSearchCategories: [
    "Machine Manual",
    "SOP",
    "QC Standard",
    "Meeting Notes",
    "Supplier",
    "Engineering Drawing"
  ],
  todayFocus: [
    { icon: "🟡", label: "2 Production Issues" },
    { icon: "🟠", label: "1 Machine Needs Attention" },
    { icon: "🟢", label: "Meeting at 13:00" },
    { icon: "📩", label: "4 Emails Need Review" }
  ],
  quickActions: [
    {
      icon: "📄",
      label: "Open Work Order",
      prompt: "Show open work orders for today",
      contextLabel: "Work Orders"
    },
    {
      icon: "📈",
      label: "View Today's KPI",
      prompt: "Show today's KPI summary",
      contextLabel: "Today's KPI"
    },
    {
      icon: "🔧",
      label: "Machine Status",
      prompt: "Show machine status overview",
      contextLabel: "Machine Status"
    },
    {
      icon: "📚",
      label: "Documents",
      prompt: "Show relevant documents for today",
      contextLabel: "Documents"
    }
  ],
  continueWorking: [
    { id: "cw-1", label: "Machine 12", prompt: "Machine 12 alarm terus" },
    { id: "cw-2", label: "White Streak Investigation", prompt: "Continue white streak investigation" },
    { id: "cw-3", label: "SOP-014", prompt: "Show SOP-014 printer white streak troubleshooting" }
  ],
  aiSuggestions: [
    { text: "Machine 12 vibration increased.", prompt: "Machine 12 alarm terus — show bearing vibration details" },
    { text: "Production target may miss by 3%.", prompt: "Why might production target miss by 3% today?" }
  ],
  todayKpi: [
    { label: "Production", value: "96%", status: "green", prompt: "Show production KPI details for today" },
    { label: "Quality", value: "98%", status: "green", prompt: "Show quality KPI details for today" },
    { label: "Delivery", value: "99%", status: "green", prompt: "Show delivery KPI details for today" }
  ],
  inbox: {
    unread: 4,
    aiSummary: ["2 emails require approval.", "1 supplier delayed shipment."]
  },
  meeting: {
    time: "13:00",
    title: "Daily Production Meeting",
    agenda: ["Shift A output review", "Machine 12 status", "White streak action plan"],
    linkLabel: "Open Teams"
  },
  activityFeed: [
    { time: "08:10", message: "Production started." },
    { time: "09:20", message: "Machine 12 alarm." },
    { time: "09:35", message: "QC detected white streak issue." },
    { time: "10:15", message: "Maintenance scheduled for Machine 12." }
  ],
  notifications: [
    {
      id: "n-1",
      category: "Machine Alarm",
      message: "Machine 12 bearing vibration high",
      prompt: "Machine 12 alarm terus"
    },
    {
      id: "n-2",
      category: "Quality",
      message: "White streak defects increased on Line 3",
      prompt: "Continue white streak investigation"
    },
    {
      id: "n-3",
      category: "Production",
      message: "Shift A output on track",
      prompt: "Show today's production status"
    },
    {
      id: "n-4",
      category: "New SOP",
      message: "SOP-014 revision pending approval",
      prompt: "Show SOP-014 printer white streak troubleshooting"
    },
    {
      id: "n-5",
      category: "Meeting",
      message: "Daily Production Meeting at 13:00",
      prompt: "What is the agenda for today's production meeting?"
    }
  ],
  knowledgeRecent: [
    { id: "kr-1", label: "SOP-014", prompt: "Show SOP-014 printer white streak troubleshooting" },
    { id: "kr-2", label: "QC Standard 12", prompt: "Show QC Standard 12 for printer output" },
    { id: "kr-3", label: "Machine 12 Manual", prompt: "Show Machine 12 maintenance manual" }
  ],
  knowledgeRecentlyUpdated: [
    { id: "ku-1", label: "SOP-014 — White Streak", prompt: "Show SOP-014 updates" },
    { id: "ku-2", label: "Escalation Rule — Line 3", prompt: "Show escalation rules for Line 3" },
    { id: "ku-3", label: "Kaizen KAIZEN-004", prompt: "Show Kaizen KAIZEN-004 details" }
  ],
  proactiveGreeting:
    "Selamat pagi Abdul. Saya menemukan tiga hal yang mungkin perlu perhatianmu hari ini. Apakah ingin saya jelaskan?",
  proactiveCards: [
    {
      icon: "🔴",
      text: "White Streak meningkat 12%.",
      prompt: "Continue white streak investigation — possible cause analysis",
      contextLabel: "White Streak"
    },
    {
      icon: "🟠",
      text: "Ink Consumption tinggi di Line 2.",
      prompt: "Why is ink consumption high on Line 2?",
      contextLabel: "Ink"
    },
    {
      icon: "🟢",
      text: "Line 2 berjalan normal.",
      prompt: "Show printer assembly line status",
      contextLabel: "Line 2"
    }
  ]
};

export const toyotaDailyWorkspace: DailyWorkspace = {
  dailyBrief: [
    {
      id: "brief-t1",
      severity: "critical",
      icon: "🔴",
      title: "Torque Station EA-04 gagal",
      detail: "Bolt torque out of specification.",
      confidence: "91%",
      actionLabel: "Investigate",
      prompt: "Bolt torque out of specification at EA-04 — technical investigation",
      contextLabel: "Station EA-04"
    },
    {
      id: "brief-t2",
      severity: "warning",
      icon: "🟠",
      title: "Engine Inspection terlambat",
      detail: "3 unit menunggu di chassis line.",
      actionLabel: "Review",
      prompt: "Engine inspection backlog status and impact",
      contextLabel: "Engine Inspection"
    },
    {
      id: "brief-t3",
      severity: "success",
      icon: "🟢",
      title: "Body Welding normal",
      detail: "Semua station welding dalam toleransi.",
      actionLabel: "View Summary",
      prompt: "Show body welding station status",
      contextLabel: "Body Welding"
    }
  ],
  focusCategories: [
    {
      id: "machine",
      label: "Machine",
      status: "red",
      summary: "EA-04 torque drift",
      prompt: "Bolt torque out of specification at EA-04"
    },
    {
      id: "production",
      label: "Production",
      status: "green",
      summary: "96% on target",
      prompt: "Show today's assembly production status"
    },
    {
      id: "quality",
      label: "Quality",
      status: "yellow",
      summary: "Torque inspection flagged",
      prompt: "Show QC torque inspection results for EA-04"
    },
    {
      id: "meeting",
      label: "Meeting",
      status: "green",
      summary: "13:00 Daily standup",
      prompt: "What is the agenda for today's production meeting?"
    },
    {
      id: "supplier",
      label: "Supplier",
      status: "yellow",
      summary: "1 delayed shipment",
      prompt: "Summarize supplier delay emails today"
    },
    {
      id: "email",
      label: "Email",
      status: "yellow",
      summary: "4 need review",
      prompt: "Summarize emails related to quality issues today"
    }
  ],
  copilotSuggestions: [
    { label: "Explain Alarm", prompt: "Explain the Machine EA-04 alarm" },
    { label: "Show SOP", prompt: "Show ASM-022 engine bolt torque standard" },
    { label: "Generate Countermeasure", prompt: "Recommend countermeasure for EA-04 torque drift" },
    { label: "Create Work Order", prompt: "Create work order for torque tool calibration" }
  ],
  recentSearchCategories: [
    "Machine Manual",
    "SOP",
    "QC Standard",
    "Meeting Notes",
    "Supplier",
    "Engineering Drawing"
  ],
  todayFocus: [
    { icon: "🟡", label: "2 Production Issues" },
    { icon: "🟠", label: "1 Machine Needs Attention" },
    { icon: "🟢", label: "Meeting at 13:00" },
    { icon: "📩", label: "4 Emails Need Review" }
  ],
  quickActions: [
    {
      icon: "📄",
      label: "Open Work Order",
      prompt: "Show open work orders for today",
      contextLabel: "Work Orders"
    },
    {
      icon: "📈",
      label: "View Today's KPI",
      prompt: "Show today's KPI summary",
      contextLabel: "Today's KPI"
    },
    {
      icon: "🔧",
      label: "Machine Status",
      prompt: "Show machine EA-04 status",
      contextLabel: "Machine EA-04"
    },
    {
      icon: "📚",
      label: "Documents",
      prompt: "Show ASM-022 and related documents",
      contextLabel: "Documents"
    }
  ],
  continueWorking: [
    { id: "cw-t1", label: "Torque EA-04", prompt: "Bolt torque out of specification at EA-04" },
    { id: "cw-t2", label: "Engine Inspection", prompt: "Engine inspection backlog status" },
    { id: "cw-t3", label: "ASM-022", prompt: "Show ASM-022 engine bolt torque standard" }
  ],
  aiSuggestions: [
    { text: "Machine EA-04 vibration increased.", prompt: "What happened with Machine EA-04 yesterday?" },
    { text: "Production target may miss by 3%.", prompt: "Why might production target miss by 3% today?" }
  ],
  todayKpi: [
    { label: "Production", value: "96%", status: "green", prompt: "Show production KPI details for today" },
    { label: "Quality", value: "98%", status: "green", prompt: "Show quality KPI details for today" },
    { label: "Delivery", value: "99%", status: "green", prompt: "Show delivery KPI details for today" }
  ],
  inbox: {
    unread: 4,
    aiSummary: ["2 emails require approval.", "1 supplier delayed shipment."]
  },
  meeting: {
    time: "13:00",
    title: "Daily Production Meeting",
    agenda: ["Torque drift at EA-04", "Tool calibration schedule", "Shift B handover"],
    linkLabel: "Open Teams"
  },
  activityFeed: [
    { time: "08:10", message: "Production started." },
    { time: "09:20", message: "Machine EA-04 alarm." },
    { time: "09:35", message: "QC detected torque issue." },
    { time: "10:15", message: "Maintenance scheduled." }
  ],
  notifications: [
    {
      id: "n-t1",
      category: "Machine Alarm",
      message: "Machine EA-04 torque drift detected",
      prompt: "Bolt torque out of specification at EA-04"
    },
    {
      id: "n-t2",
      category: "Quality",
      message: "Bolt torque out of spec at station EA-04",
      prompt: "Bolt torque out of specification at EA-04"
    },
    {
      id: "n-t3",
      category: "Production",
      message: "Assembly line output on track",
      prompt: "Show today's assembly production status"
    },
    {
      id: "n-t4",
      category: "New SOP",
      message: "ASM-022 updated this week",
      prompt: "Show ASM-022 engine bolt torque standard"
    },
    {
      id: "n-t5",
      category: "Meeting",
      message: "Daily Production Meeting at 13:00",
      prompt: "What is the agenda for today's production meeting?"
    }
  ],
  knowledgeRecent: [
    { id: "kr-t1", label: "ASM-022", prompt: "Show ASM-022 engine bolt torque standard" },
    { id: "kr-t2", label: "QC Torque Standard", prompt: "Show QC torque inspection standard" },
    { id: "kr-t3", label: "Machine EA-04 Manual", prompt: "Show Machine EA-04 manual" }
  ],
  knowledgeRecentlyUpdated: [
    { id: "ku-t1", label: "ASM-022 — Engine Bolt", prompt: "Show ASM-022 updates" },
    { id: "ku-t2", label: "Torque Tool Calibration", prompt: "Show torque tool calibration procedure" },
    { id: "ku-t3", label: "Safety Rule — EA Line", prompt: "Show safety rules for EA assembly line" }
  ],
  proactiveGreeting:
    "Selamat pagi Sari. Saya menemukan tiga hal yang mungkin perlu perhatianmu hari ini. Apakah ingin saya jelaskan?",
  proactiveCards: [
    {
      icon: "🔧",
      text: "Torque Station EA-04 gagal — perlu investigasi.",
      prompt: "Bolt torque out of specification at EA-04",
      contextLabel: "Station EA-04"
    },
    {
      icon: "📈",
      text: "Engine Inspection terlambat — 3 unit menunggu.",
      prompt: "Engine inspection backlog status",
      contextLabel: "Engine Inspection"
    },
    {
      icon: "🟢",
      text: "Body Welding berjalan normal.",
      prompt: "Show body welding station status",
      contextLabel: "Body Welding"
    }
  ]
};

export const nestleDailyWorkspace: DailyWorkspace = {
  dailyBrief: [
    {
      id: "brief-n1",
      severity: "critical",
      icon: "🔴",
      title: "Metal Detector Alarm",
      detail: "Alarm terpicu di Line P-03.",
      confidence: "94%",
      actionLabel: "Investigate",
      prompt: "Metal detector alarm on Line P-03 — HACCP response",
      contextLabel: "Line P-03"
    },
    {
      id: "brief-n2",
      severity: "warning",
      icon: "🟠",
      title: "Packaging Line berhenti",
      detail: "Line ditahan menunggu QA review.",
      actionLabel: "Review",
      prompt: "Packaging line P-03 stop — investigation and containment",
      contextLabel: "Packaging"
    },
    {
      id: "brief-n3",
      severity: "success",
      icon: "🟢",
      title: "CCP Check selesai",
      detail: "Semua critical control point terverifikasi.",
      actionLabel: "View",
      prompt: "Show CCP check results for today",
      contextLabel: "CCP"
    }
  ],
  focusCategories: [
    {
      id: "food-safety",
      label: "Food Safety",
      status: "red",
      summary: "Metal detector alarm",
      prompt: "Metal detector alarm on Line P-03"
    },
    {
      id: "production",
      label: "Production",
      status: "yellow",
      summary: "Line P-03 held",
      prompt: "Show packaging line production status"
    },
    {
      id: "quality",
      label: "Quality",
      status: "yellow",
      summary: "Packaging stop",
      prompt: "Packaging line P-03 stop status"
    },
    {
      id: "compliance",
      label: "Compliance",
      status: "green",
      summary: "CCP verified",
      prompt: "Show CCP compliance status"
    },
    {
      id: "supplier",
      label: "Supplier",
      status: "yellow",
      summary: "Lot on hold",
      prompt: "Supplier packaging lot hold status"
    },
    {
      id: "email",
      label: "Email",
      status: "yellow",
      summary: "3 need review",
      prompt: "Summarize supplier emails about packaging lot hold"
    }
  ],
  copilotSuggestions: [
    { label: "HACCP Response", prompt: "Show HACCP-011 packaging contamination response" },
    { label: "CCP Status", prompt: "Show CCP check results for today" },
    { label: "Containment Plan", prompt: "Draft containment plan for metal detector alarm" },
    { label: "Release Criteria", prompt: "What are the release criteria for Line P-03?" }
  ],
  recentSearchCategories: ["HACCP", "GMP", "Packaging SOP", "CCP", "Cleaning SOP", "Batch Record"],
  todayFocus: [
    { icon: "🔴", label: "Metal Detector Alarm" },
    { icon: "🟠", label: "Packaging Line Held" },
    { icon: "🟢", label: "CCP Check Complete" },
    { icon: "📩", label: "3 Emails Need Review" }
  ],
  quickActions: [
    {
      icon: "⚠",
      label: "HACCP Response",
      prompt: "Show HACCP-011 packaging contamination response",
      contextLabel: "HACCP"
    },
    {
      icon: "📈",
      label: "CCP Dashboard",
      prompt: "Show CCP check results for today",
      contextLabel: "CCP"
    },
    {
      icon: "🔧",
      label: "Line P-03 Status",
      prompt: "What is the current status of Line P-03?",
      contextLabel: "Line P-03"
    },
    {
      icon: "📚",
      label: "Food Safety Docs",
      prompt: "Show food safety documents for packaging line",
      contextLabel: "Documents"
    }
  ],
  continueWorking: [
    { id: "cw-n1", label: "Metal Detector Alarm", prompt: "Metal detector alarm on Line P-03" },
    { id: "cw-n2", label: "HACCP-011", prompt: "Show HACCP-011 packaging contamination response" },
    { id: "cw-n3", label: "Packaging Line Stop", prompt: "Packaging line P-03 stop status" }
  ],
  aiSuggestions: [
    { text: "Metal detector alarm di Line P-03.", prompt: "Metal detector alarm on Line P-03" },
    { text: "Packaging line ditahan menunggu QA.", prompt: "Packaging line P-03 stop status" }
  ],
  todayKpi: [
    { label: "Production", value: "87%", status: "yellow", prompt: "Show production KPI for packaging line" },
    { label: "HACCP", value: "Alert", status: "red", prompt: "Show HACCP status" },
    { label: "CCP", value: "OK", status: "green", prompt: "Show CCP check results" }
  ],
  inbox: {
    unread: 3,
    aiSummary: ["1 HACCP action pending.", "1 supplier lot on hold."]
  },
  meeting: {
    time: "10:00",
    title: "Food Safety Review",
    agenda: ["Metal detector alarm P-03", "Batch hold decision", "CCP verification"],
    linkLabel: "Open Teams"
  },
  activityFeed: [
    { time: "07:45", message: "Pre-op inspection started on Line P-03." },
    { time: "08:30", message: "Metal detector alarm triggered." },
    { time: "09:00", message: "Line P-03 held for QA review." },
    { time: "10:15", message: "Supplier lot placed on hold." }
  ],
  notifications: [
    {
      id: "n-n1",
      category: "Food Safety",
      message: "Metal detector alarm on Line P-03",
      prompt: "Metal detector alarm on Line P-03"
    },
    {
      id: "n-n2",
      category: "Production",
      message: "Packaging line P-03 stopped",
      prompt: "Packaging line P-03 stop status"
    },
    {
      id: "n-n3",
      category: "CCP",
      message: "CCP check completed for shift A",
      prompt: "Show CCP check results for today"
    },
    {
      id: "n-n4",
      category: "HACCP",
      message: "HACCP-011 triggered — review required",
      prompt: "Show HACCP-011 packaging contamination response"
    }
  ],
  knowledgeRecent: [
    { id: "kr-n1", label: "HACCP-011", prompt: "Show HACCP-011 packaging contamination response" },
    { id: "kr-n2", label: "GMP Packaging", prompt: "Show GMP packaging standard" },
    { id: "kr-n3", label: "CCP Checklist", prompt: "Show CCP checklist for packaging line" }
  ],
  knowledgeRecentlyUpdated: [
    { id: "ku-n1", label: "HACCP-011 — Containment", prompt: "Show HACCP-011 updates" },
    { id: "ku-n2", label: "Cleaning SOP CLN-004", prompt: "Show cleaning verification procedure" },
    { id: "ku-n3", label: "Metal Detector Calibration", prompt: "Show metal detector calibration procedure" }
  ],
  proactiveGreeting:
    "Selamat pagi Budi. Saya menemukan tiga hal yang mungkin perlu perhatianmu hari ini. Apakah ingin saya jelaskan?",
  proactiveCards: [
    {
      icon: "🔴",
      text: "Metal Detector Alarm di Line P-03.",
      prompt: "Metal detector alarm on Line P-03",
      contextLabel: "Line P-03"
    },
    {
      icon: "🟠",
      text: "Packaging Line berhenti — menunggu QA.",
      prompt: "Packaging line P-03 stop status",
      contextLabel: "Packaging"
    },
    {
      icon: "🟢",
      text: "CCP Check selesai untuk shift ini.",
      prompt: "Show CCP check results for today",
      contextLabel: "CCP"
    }
  ]
};

export const customDailyWorkspace: DailyWorkspace = {
  dailyBrief: [],
  focusCategories: [],
  copilotSuggestions: [
    { label: "Upload SOP", prompt: "How do I upload SOP documents?" },
    { label: "Activate AI", prompt: "What do I need to activate the AI worker?" }
  ],
  recentSearchCategories: ["SOP", "Work Instruction", "QC Standard"],
  todayFocus: [{ icon: "📄", label: "Upload knowledge to get started" }],
  quickActions: [
    {
      icon: "📄",
      label: "Upload SOP",
      prompt: "How do I upload SOP documents?",
      contextLabel: "Setup"
    }
  ],
  continueWorking: [],
  aiSuggestions: [],
  todayKpi: [],
  inbox: { unread: 0, aiSummary: [] },
  meeting: null,
  activityFeed: [],
  notifications: [],
  knowledgeRecent: [],
  knowledgeRecentlyUpdated: [],
  proactiveGreeting: "Workspace belum aktif. Upload SOP untuk mengaktifkan AI worker.",
  proactiveCards: []
};
