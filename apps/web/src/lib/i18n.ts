import type { AppLanguage } from "./user-preferences.js";

const STRINGS = {
  "prefs.appearance": { id: "Tampilan", en: "Appearance", ja: "表示" },
  "prefs.language": { id: "Bahasa", en: "Language", ja: "言語" },
  "investigation.loading": { id: "Memuat analisa engineering...", en: "Loading engineering analysis...", ja: "エンジニアリング分析を読み込み中..." },
  "investigation.evidence.title": { id: "LANGKAH 1 — Evidence", en: "STEP 1 — Evidence", ja: "ステップ 1 — 証拠" },
  "investigation.evidence.hint": {
    id: "Klik kartu di bawah untuk mengisi evidence otomatis dari data operator & sistem.",
    en: "Click cards below to auto-fill evidence from operator data and system records.",
    ja: "下のカードをクリックして、オペレーターとシステムのデータを証拠に追加します。"
  },
  "investigation.evidence.notesPlaceholder": {
    id: "Catatan evidence...",
    en: "Evidence notes...",
    ja: "証拠メモ..."
  },
  "investigation.evidence.trendTitle": { id: "AI Trend Insight", en: "AI Trend Insight", ja: "AIトレンド分析" },
  "investigation.rootCause.title": { id: "LANGKAH 2 — Possible Root Cause", en: "STEP 2 — Possible Root Cause", ja: "ステップ 2 — 推定根本原因" },
  "investigation.rootCause.hint": {
    id: "AI menganalisis NG operator + data mesin — engineer memilih.",
    en: "AI analyzed operator NG + machine data — engineer decides.",
    ja: "AIがオペレーターNGと設備データを分析 — エンジニアが決定。"
  },
  "investigation.countermeasure.title": { id: "LANGKAH 3 — Countermeasure", en: "STEP 3 — Countermeasure", ja: "ステップ 3 — 対策" },
  "investigation.countermeasure.hint": {
    id: "Persentase efektivitas berdasarkan root cause yang dipilih — urut dari tertinggi.",
    en: "Effectiveness % based on selected root cause — sorted highest first.",
    ja: "選択した根本原因に基づく有効性％ — 高い順。"
  },
  "investigation.countermeasure.historical": {
    id: "Gunakan countermeasure historis yang direkomendasikan AI?",
    en: "Use AI-recommended historical countermeasures?",
    ja: "AI推奨の過去対策を使用しますか？"
  },
  "investigation.ppm.source": { id: "Sumber PPM", en: "PPM source", ja: "PPMソース" },
  "investigation.ppm.fromOperator": { id: "Laporan operator (NG)", en: "Operator report (NG)", ja: "オペレーター報告（NG）" },
  "investigation.ppm.estimate": { id: "Estimasi sistem", en: "System estimate", ja: "システム推定" },
  "investigation.production.edit": {
    id: "Edit Data Produksi / NG",
    en: "Edit Production / NG Data",
    ja: "生産／NGデータを編集"
  },
  "investigation.production.save": { id: "Simpan Data NG", en: "Save NG Data", ja: "NGデータを保存" },
  "investigation.production.saved": {
    id: "Data produksi & NG diperbarui — PPM dihitung ulang.",
    en: "Production & NG data updated — PPM recalculated.",
    ja: "生産・NGデータを更新しました — PPMを再計算しました。"
  },
  "investigation.production": { id: "Produksi", en: "Production", ja: "生産" },
  "operator.ppmFromTotal": {
    id: "PPM dihitung dari: NG ÷ Total Produksi × 1.000.000",
    en: "PPM calculated from: NG ÷ Total Production × 1,000,000",
    ja: "PPM = NG ÷ 総生産数 × 1,000,000"
  },
  "investigation.ng": { id: "NG (reject)", en: "NG (reject)", ja: "NG（不良）" },
  "operator.totalProduction": { id: "Total produksi shift (pcs)", en: "Shift total production (pcs)", ja: "シフト総生産数（個）" },
  "operator.rejectCount": { id: "Jumlah NG / reject (pcs)", en: "NG / reject count (pcs)", ja: "NG／不良数（個）" },
  "operator.ppmPreview": { id: "PPM (otomatis)", en: "PPM (auto)", ja: "PPM（自動）" },
  "operator.ngPhenomenon": {
    id: "Fenomena NG (contoh: white streak, scratch)",
    en: "NG phenomenon (e.g. white streak, scratch)",
    ja: "NG現象（例：白筋、傷）"
  },
  "operator.ngRate": { id: "Tingkat NG", en: "NG rate", ja: "NG率" },
  "investigation.loadError": {
    id: "Analisa engineering tidak dapat dimuat",
    en: "Engineering analysis could not be loaded",
    ja: "エンジニアリング分析を読み込めませんでした"
  },
  "investigation.retry": { id: "Coba lagi", en: "Try again", ja: "再試行" },
  "investigation.evidence.ngReport": { id: "Laporan NG Operator", en: "Operator NG Report", ja: "オペレーターNG報告" },
  "investigation.evidence.ngPhenomenon": { id: "Fenomena NG", en: "NG Phenomenon", ja: "NG現象" },
  "investigation.evidence.machineTelemetry": { id: "Telemetri Mesin", en: "Machine Telemetry", ja: "設備テレメトリ" },
  "investigation.evidence.similarCase": { id: "Kasus Serupa", en: "Similar Case", ja: "類似事例" },
  "investigation.evidence.sop": { id: "Referensi SOP", en: "SOP Reference", ja: "SOP参照" },
  "common.yes": { id: "Ya", en: "Yes", ja: "はい" },
  "common.no": { id: "Tidak", en: "No", ja: "いいえ" },
  "common.back": { id: "← Kembali", en: "← Back", ja: "← 戻る" },
  "common.previous": { id: "← Sebelumnya", en: "← Previous", ja: "← 前へ" },
  "common.next": { id: "Selanjutnya →", en: "Next →", ja: "次へ →" }
} as const;

export type TranslationKey = keyof typeof STRINGS;

export function translate(
  language: AppLanguage,
  key: TranslationKey,
  vars?: Record<string, string | number>
): string {
  const entry = STRINGS[key];
  let text: string = entry[language] ?? entry.en;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}
