export interface DailyWorkspace {
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
      icon: "🔧",
      text: "Machine 12 vibration meningkat.",
      prompt: "Machine 12 alarm terus — show bearing vibration details",
      contextLabel: "Machine 12"
    },
    {
      icon: "📈",
      text: "Target produksi shift A diperkirakan terlambat 2%.",
      prompt: "Why might production target miss by 2% on shift A?",
      contextLabel: "Today's KPI"
    },
    {
      icon: "📩",
      text: "Ada 4 email yang berkaitan dengan quality issue.",
      prompt: "Summarize emails related to quality issues today",
      contextLabel: "Inbox"
    }
  ]
};

export const toyotaDailyWorkspace: DailyWorkspace = {
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
    { id: "cw-t1", label: "Machine EA-04", prompt: "Bolt torque out of specification at EA-04" },
    { id: "cw-t2", label: "White Streak Investigation", prompt: "Continue white streak investigation" },
    { id: "cw-t3", label: "Torque Calibration", prompt: "Show torque tool calibration schedule" }
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
    "Selamat pagi. Saya menemukan tiga hal yang mungkin perlu perhatianmu hari ini. Apakah ingin saya jelaskan?",
  proactiveCards: [
    {
      icon: "🔧",
      text: "Machine EA-04 vibration meningkat.",
      prompt: "What happened with Machine EA-04 yesterday?",
      contextLabel: "Machine EA-04"
    },
    {
      icon: "📈",
      text: "Target produksi shift A diperkirakan terlambat 3%.",
      prompt: "Why might production target miss by 3% today?",
      contextLabel: "Today's KPI"
    },
    {
      icon: "📩",
      text: "Ada 4 email yang berkaitan dengan quality issue.",
      prompt: "Summarize emails related to quality issues today",
      contextLabel: "Inbox"
    }
  ]
};

export const nestleDailyWorkspace: DailyWorkspace = {
  ...epsonDailyWorkspace,
  continueWorking: [
    { id: "cw-n1", label: "Line P-03", prompt: "Packaging contamination near seal area" },
    { id: "cw-n2", label: "HACCP-011", prompt: "Show HACCP-011 packaging contamination response" },
    { id: "cw-n3", label: "Cleaning Verification", prompt: "Show cleaning verification status for Line P-03" }
  ],
  aiSuggestions: [
    { text: "Line P-03 held due to contamination.", prompt: "Packaging contamination near seal area" },
    { text: "Cleaning verification still pending.", prompt: "Show cleaning verification status for Line P-03" }
  ],
  activityFeed: [
    { time: "07:45", message: "Pre-op inspection started on Line P-03." },
    { time: "08:30", message: "Packaging contamination detected." },
    { time: "09:00", message: "Line P-03 held for QA review." },
    { time: "10:15", message: "Supplier lot placed on hold." }
  ],
  proactiveCards: [
    {
      icon: "⚠",
      text: "Kontaminasi kemasan terdeteksi di Line P-03.",
      prompt: "Packaging contamination near seal area",
      contextLabel: "Line P-03"
    },
    {
      icon: "📄",
      text: "HACCP-011 perlu ditinjau segera.",
      prompt: "Show HACCP-011 packaging contamination response",
      contextLabel: "HACCP-011"
    },
    {
      icon: "📩",
      text: "Ada email supplier terkait lot kemasan.",
      prompt: "Summarize supplier emails about packaging lot hold",
      contextLabel: "Inbox"
    }
  ]
};

export const customDailyWorkspace: DailyWorkspace = {
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
