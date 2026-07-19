import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const OUT_DIR = path.resolve(process.env.OUTPUT_DIR ?? "./output");
const QA_ROOT = path.resolve(process.env.QA_ROOT ?? "./qa");

const C = {
  paper: "#FFFFFF",
  soft: "#F5F7F8",
  ink: "#202124",
  gray: "#5F6368",
  lightGray: "#8B9298",
  line: "#D9DEE3",
  red: "#BC3C29",
  blue: "#0072B5",
  orange: "#E18727",
  green: "#20854E",
  violet: "#7876B1",
  slate: "#6F99AD",
  gold: "#FFDC91",
  pink: "#EE4C97",
};

const COPY = {
  en: {
    font: "Arial",
    deckTitle: "Hemoptysis + Lung Mass",
    deckSubtitle: "When hemostasis is not the end of the diagnosis",
    deckKicker: "M&M CLINICAL REVIEW",
    footer: "Hemoptysis + Lung Mass | Editable M&M Deck",
    replace: "REPLACE WITH CHART DATA",
    labels: [
      "TITLE", "CLINICAL-FRAME", "CASE-SNAPSHOT", "CASE-TIMELINE", "FUNCTIONAL-SEVERITY",
      "IMMEDIATE-PATHWAY", "MECHANISM-DIFFERENTIAL", "MODALITY-ROLES", "DIAGNOSTIC-STATUS",
      "FAILURE-ANALYSIS", "VASCULAR-BEDS", "CULPRIT-CIRCUIT", "PSEUDOANEURYSM-FLOW",
      "BAE-ROLE", "BAE-OUTCOMES", "REBLEEDING", "TISSUE-STRATEGY", "MM-INFLECTION",
      "PREVENTION-BUNDLE", "TAKE-HOME",
    ],
    titles: [
      "Hemoptysis + Lung Mass",
      "Four questions must stay open",
      "Define the patient before the lesion",
      "Show where uncertainty accumulated",
      "Severity is physiologic - not volumetric",
      "Protect the airway; use CTA to map",
      "A mass with hemoptysis needs a mechanism",
      "Each test answers a different question",
      "Nondiagnostic is not benign",
      "Why repeated sampling fails",
      "Most severe bleeding is systemic",
      "Map the entire culprit circuit",
      "Treat the circuit - not the brightest spot",
      "BAE controls bleeding - not the diagnosis",
      "Immediate success is high; durability varies",
      "Rebleeding means source control is incomplete",
      "Choose a new tissue target after BAE",
      "M&M error: hemostasis became diagnostic closure",
      "Prevention needs ownership and deadlines",
      "Control bleeding. Finish the diagnosis.",
    ],
  },
  zh: {
    font: "PingFang TC",
    deckTitle: "咳血合併肺部腫塊",
    deckSubtitle: "止血成功，不等於診斷完成",
    deckKicker: "M&M 臨床回顧",
    footer: "咳血合併肺部腫塊｜可編輯 M&M 簡報",
    replace: "請以實際病歷資料替換",
    labels: [
      "封面", "臨床架構", "病例摘要", "病例時間軸", "功能性嚴重度",
      "立即處置", "機轉式鑑別", "工具分工", "診斷狀態", "失敗分析",
      "三個血管床", "責任血管迴路", "假性動脈瘤血流", "BAE 定位", "BAE 成效",
      "再出血", "組織策略", "M&M 轉折點", "預防組合", "重點結論",
    ],
    titles: [
      "咳血合併肺部腫塊",
      "四個問題都不能提前結案",
      "先定義病人，再定義病灶",
      "呈現不確定性在哪裡累積",
      "嚴重度看生理，不只看出血量",
      "先保護呼吸道，再用 CTA 規劃",
      "肺部腫塊合併咳血：先想機轉",
      "每項檢查回答不同問題",
      "未確診不等於良性",
      "重複採樣為什麼失敗",
      "嚴重咳血多來自體循環",
      "畫出完整責任血管迴路",
      "治療整個迴路，不只處理亮點",
      "BAE 負責止血，不負責病因診斷",
      "立即成功率高，長期控制較不穩定",
      "再出血代表來源控制仍不完整",
      "BAE 後要換新的組織標的",
      "M&M 錯誤：把止血當成診斷完成",
      "預防需要負責人與明確期限",
      "控制出血，完成病因診斷",
    ],
  },
};

function rect(slide, x, y, w, h, fill = "none", lineFill = "none", lineWidth = 0, radius = false, name) {
  return slide.shapes.add({
    geometry: radius ? "roundRect" : "rect",
    name,
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: lineFill, width: lineWidth },
    ...(radius ? { borderRadius: "rounded-lg" } : {}),
  });
}

function ellipse(slide, x, y, w, h, fill, lineFill = "none", lineWidth = 0, name) {
  return slide.shapes.add({
    geometry: "ellipse",
    name,
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: lineFill, width: lineWidth },
  });
}

function arrow(slide, x, y, w, h, fill = C.line, name) {
  return slide.shapes.add({
    geometry: "rightArrow",
    name,
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill, width: 0 },
  });
}

function textBox(slide, text, x, y, w, h, opts = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    name: opts.name,
    position: { left: x, top: y, width: w, height: h },
    fill: opts.fill ?? "none",
    line: { style: "solid", fill: opts.lineFill ?? "none", width: opts.lineWidth ?? 0 },
    ...(opts.radius ? { borderRadius: "rounded-lg" } : {}),
  });
  shape.text = text;
  shape.text.style = {
    fontFamily: opts.font,
    fontSize: opts.size ?? 20,
    bold: opts.bold ?? false,
    color: opts.color ?? C.ink,
    alignment: opts.align ?? "left",
    verticalAlignment: opts.valign ?? "top",
    ...(opts.italic ? { italic: true } : {}),
  };
  return shape;
}

function addBase(slide, lang, index, title, label, source = "") {
  const t = COPY[lang];
  slide.background.fill = C.paper;
  rect(slide, 0, 0, 12, 720, index === 1 ? C.red : C.blue);
  textBox(slide, label.toUpperCase(), 28, 18, 320, 18, { font: t.font, size: 11, bold: true, color: C.slate, name: `label-${index}` });
  if (index > 1) {
    // Keep claim-style titles to one line so the content grid always begins at y=150.
    // CJK glyphs are wider than Latin text, so use language-aware thresholds.
    const size = lang === "zh"
      ? (title.length > 18 ? 36 : 40)
      : (title.length > 48 ? 36 : title.length > 38 ? 38 : 40);
    textBox(slide, title, 64, 60, 1128, 58, { font: t.font, size, bold: true, color: C.ink, name: `title-${index}` });
    rect(slide, 64, 128, 1152, 2, C.line);
  }
  rect(slide, 64, 677, 1152, 1, C.line);
  textBox(slide, source || t.footer, 64, 686, 980, 17, { font: t.font, size: 10, color: C.lightGray, name: `source-${index}` });
  textBox(slide, String(index).padStart(2, "0"), 1152, 681, 64, 22, { font: t.font, size: 12, bold: true, color: C.gray, align: "right", name: `page-${index}` });
}

function addPill(slide, label, x, y, w, fill, font, color = C.paper) {
  rect(slide, x, y, w, 30, fill, "none", 0, true);
  textBox(slide, label, x + 8, y + 5, w - 16, 20, { font, size: 13, bold: true, color, align: "center", valign: "middle" });
}

function addMetric(slide, value, label, x, y, color, font, sub = "") {
  textBox(slide, value, x, y, 180, 70, { font, size: 54, bold: true, color, align: "center" });
  textBox(slide, label, x - 10, y + 72, 200, 52, { font, size: 22, bold: true, color: C.ink, align: "center" });
  if (sub) textBox(slide, sub, x - 10, y + 126, 200, 38, { font, size: 16, color: C.gray, align: "center" });
}

function addFourColumns(slide, items, y, font) {
  const x0 = 64, gap = 20, w = 273;
  items.forEach((it, i) => {
    const x = x0 + i * (w + gap);
    rect(slide, x, y, w, 405, C.paper, it.color, 2, false);
    rect(slide, x, y, w, 8, it.color);
    textBox(slide, it.title, x + 18, y + 28, w - 36, 54, { font, size: 22, bold: true, color: it.color });
    textBox(slide, it.body, x + 18, y + 92, w - 36, 275, { font, size: 22, color: C.ink });
  });
}

function slide01(p, lang) {
  const t = COPY[lang];
  const s = p.slides.add();
  addBase(s, lang, 1, t.titles[0], t.labels[0]);
  textBox(s, t.deckKicker, 72, 182, 420, 26, { font: t.font, size: 14, bold: true, color: C.blue });
  textBox(s, t.deckTitle, 72, 232, 780, 78, { font: t.font, size: lang === "en" ? 58 : 56, bold: true, color: C.ink, name: "deck-title" });
  textBox(s, t.deckSubtitle, 72, 326, 850, 48, { font: t.font, size: 25, color: C.gray, name: "deck-subtitle" });
  rect(s, 72, 413, 480, 5, C.red);
  textBox(s, lang === "en" ? "Severity  •  Localization  •  Hemostasis  •  Etiology" : "嚴重度  •  定位  •  止血  •  病因", 72, 438, 780, 34, { font: t.font, size: 18, bold: true, color: C.blue });
  rect(s, 950, 160, 220, 360, C.soft, C.line, 1, false);
  [C.red, C.blue, C.orange, C.green].forEach((color, i) => {
    rect(s, 980, 205 + i * 70, 160, 22, color);
    rect(s, 980, 233 + i * 70, 112 - i * 12, 8, C.line);
  });
  textBox(s, lang === "en" ? "Editable bilingual edition\nNEJM-derived palette" : "可編輯雙語版本\nNEJM 衍生配色", 950, 560, 220, 58, { font: t.font, size: 16, bold: true, color: C.gray, align: "center" });
  return s;
}

function slide02(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 2, t.titles[1], t.labels[1], "Source: Expanded review synthesis; AAFP 2022; CIRSE 2022.");
  const items = lang === "en" ? [
    ["1", "Severity", "Is the patient at immediate risk from airway obstruction, gas-exchange failure, or hemodynamic collapse?", C.red],
    ["2", "Localization", "Which side, lobe, lesion, and vascular bed are responsible for the bleeding?", C.slate],
    ["3", "Hemostasis", "What will control bleeding now - bronchoscopy, embolization, surgery, or a combination?", C.orange],
    ["4", "Etiology", "What underlying process created the mass, cavity, or abnormal vascular circuit?", C.blue],
  ] : [
    ["1", "嚴重度", "病人是否正面臨呼吸道阻塞、氣體交換失敗或血流動力崩解？", C.red],
    ["2", "定位", "出血來自哪一側、哪個肺葉、哪個病灶與哪個血管床？", C.slate],
    ["3", "止血", "現在應以支氣管鏡、栓塞、手術或組合策略控制出血？", C.orange],
    ["4", "病因", "是哪個基礎疾病造成腫塊、空洞或異常血管迴路？", C.blue],
  ];
  items.forEach((it, i) => {
    const y = 166 + i * 116;
    ellipse(s, 72, y, 68, 68, it[3]);
    textBox(s, it[0], 72, y + 14, 68, 36, { font: t.font, size: 28, bold: true, color: C.paper, align: "center" });
    textBox(s, it[1], 166, y, 220, 34, { font: t.font, size: 24, bold: true, color: it[3] });
    textBox(s, it[2], 402, y - 2, 760, 78, { font: t.font, size: 24, color: C.ink });
    if (i < 3) rect(s, 104, y + 72, 4, 35, C.line);
  });
  return s;
}

function slide03(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 3, t.titles[2], t.labels[2]);
  addPill(s, t.replace, 930, 151, 250, C.orange, t.font);
  const fields = lang === "en" ? [
    ["Age / sex", "[Age / sex]"], ["Relevant history", "[Smoking • infection • cancer • anticoagulation]"],
    ["Chief concern", "[Pattern • duration • amount • trajectory]"], ["Physiology", "[Airway • oxygen • blood pressure • Hb]"],
    ["Imaging", "[Mass/cavity • nodes • hemorrhage • vessels]"], ["Current status", "[Malignant • benign • still nondiagnostic]"],
  ] : [
    ["年齡／性別", "[年齡／性別]"], ["重要病史", "[吸菸 • 感染 • 癌症 • 抗凝治療]"],
    ["主訴", "[型態 • 時間 • 出血量 • 變化]"], ["生理狀態", "[呼吸道 • 氧氣 • 血壓 • Hb]"],
    ["影像", "[腫塊／空洞 • 淋巴結 • 出血 • 血管]"], ["目前診斷", "[惡性 • 良性 • 仍未確診]"],
  ];
  fields.forEach((f, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 72 + col * 578, y = 170 + row * 144;
    textBox(s, f[0], x, y, 230, 30, { font: t.font, size: 22, bold: true, color: C.blue });
    rect(s, x, y + 34, 542, 86, C.soft, C.line, 1, false);
    textBox(s, f[1], x + 14, y + 48, 512, 58, { font: t.font, size: 23, color: C.gray });
  });
  return s;
}

function slide04(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 4, t.titles[3], t.labels[3]);
  addPill(s, t.replace, 930, 151, 250, C.orange, t.font);
  rect(s, 120, 352, 1000, 5, C.line);
  const steps = lang === "en" ? [
    ["Initial presentation", "[Bleeding physiology]\n[CT mass/cavity]"],
    ["First sampling", "[Target + route]\n[Pathology wording]"],
    ["Recurrence / CTA", "[Interval change]\n[Vascular map]"],
    ["BAE / post-BAE", "[Technical result]\n[Next tissue plan]"],
  ] : [
    ["初次表現", "[出血生理狀態]\n[CT 腫塊／空洞]"],
    ["第一次採樣", "[標的＋路徑]\n[病理原文]"],
    ["復發／CTA", "[影像變化]\n[血管地圖]"],
    ["BAE／BAE 後", "[技術結果]\n[下一步組織計畫]"],
  ];
  steps.forEach((st, i) => {
    const x = 95 + i * 290;
    ellipse(s, x + 77, 320, 64, 64, [C.red, C.slate, C.orange, C.blue][i], C.paper, 3);
    textBox(s, String(i + 1), x + 77, 334, 64, 34, { font: t.font, size: 24, bold: true, color: C.paper, align: "center" });
    textBox(s, st[0], x - 5, 410, 230, 46, { font: t.font, size: 24, bold: true, color: [C.red, C.slate, C.orange, C.blue][i], align: "center" });
    textBox(s, st[1], x - 5, 468, 230, 86, { font: t.font, size: 22, color: C.gray, align: "center" });
    if (i < 3) textBox(s, lang === "en" ? "Known?\nStill unknown?" : "已知？\n仍未知？", x + 210, 250, 122, 60, { font: t.font, size: 18, color: C.lightGray, align: "center" });
  });
  return s;
}

function slide05(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 5, t.titles[4], t.labels[4], "Source: O'Gurek & Choi, Am Fam Physician. 2022;105:144-151.");
  const axes = lang === "en" ? [
    ["Airway", "Cannot clear clot, voice change, unilateral flooding", C.red],
    ["Gas exchange", "Rising respiratory effort, falling SpO2, escalating support", C.orange],
    ["Hemodynamics", "Hypotension, hemoglobin fall, transfusion or vasopressor", C.violet],
    ["Trajectory", "Recurrent, accelerating, or ongoing active bleeding", C.blue],
    ["Reserve", "COPD, prior lung resection, cardiac disease, anticoagulation", C.green],
  ] : [
    ["呼吸道", "無法清除血塊、聲音改變、單側大量灌血", C.red],
    ["氣體交換", "呼吸功增加、SpO2 下降、支持需求快速上升", C.orange],
    ["血流動力", "低血壓、Hb 下降、需要輸血或升壓劑", C.violet],
    ["變化趨勢", "反覆、加速或持續活動性出血", C.blue],
    ["心肺儲備", "COPD、肺切除、心臟病、抗凝治療", C.green],
  ];
  axes.forEach((a, i) => {
    const y = 164 + i * 91;
    rect(s, 72, y, 18, 64, a[2]);
    textBox(s, a[0], 112, y + 3, 215, 34, { font: t.font, size: 25, bold: true, color: a[2] });
    textBox(s, a[1], 340, y + 2, 820, 60, { font: t.font, size: 24, color: C.ink });
  });
  textBox(s, lang === "en" ? "The immediate threat is usually asphyxiation." : "最直接的威脅通常是窒息。", 290, 616, 770, 40, { font: t.font, size: 26, bold: true, color: C.red, align: "center" });
  return s;
}

function slide06(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 6, t.titles[5], t.labels[5], "Sources: AAFP 2022; ACR Appropriateness Criteria Hemoptysis; CIRSE 2022.");
  arrow(s, 586, 205, 108, 44, C.line);
  arrow(s, 338, 318, 140, 44, C.line);
  arrow(s, 802, 318, 140, 44, C.line);
  const initial = lang === "en" ? "Hemoptysis with threatened physiology" : "咳血合併生理威脅";
  rect(s, 408, 158, 464, 82, C.soft, C.red, 2, true);
  textBox(s, initial, 440, 170, 400, 64, { font: t.font, size: 24, bold: true, color: C.red, align: "center" });
  const leftTitle = lang === "en" ? "UNSTABLE / AIRWAY THREATENED" : "不穩定／呼吸道受威脅";
  const rightTitle = lang === "en" ? "STABLE ENOUGH FOR MAPPING" : "可穩定完成血管定位";
  rect(s, 92, 300, 480, 280, C.paper, C.red, 2, false);
  rect(s, 708, 300, 480, 280, C.paper, C.blue, 2, false);
  textBox(s, leftTitle, 108, 324, 448, 42, { font: t.font, size: 24, bold: true, color: C.red, align: "center" });
  textBox(s, rightTitle, 724, 324, 448, 42, { font: t.font, size: 24, bold: true, color: C.blue, align: "center" });
  textBox(s, lang === "en" ? "1. Bleeding lung down\n2. Secure / isolate airway\n3. Bronchoscopy for clot and localization\n4. CTA or angiography when feasible" : "1. 出血側朝下\n2. 建立／隔離呼吸道\n3. 支氣管鏡清血塊並定位\n4. 可行時接續 CTA／血管攝影", 126, 382, 412, 170, { font: t.font, size: 23, color: C.ink });
  textBox(s, lang === "en" ? "1. Contrast CT / CTA\n2. Define lesion and bleeding territory\n3. Map all three vascular beds\n4. Choose endoscopic, vascular, or surgical route" : "1. 對比 CT／CTA\n2. 定義病灶與出血區域\n3. 建立三個血管床地圖\n4. 選擇內視鏡、血管內或手術路徑", 742, 382, 412, 170, { font: t.font, size: 23, color: C.ink });
  return s;
}

function slide07(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 7, t.titles[6], t.labels[6], "Source: Expanded review synthesis; AAFP 2022 differential framework.");
  const items = lang === "en" ? [
    { title: "Malignancy", color: C.blue, body: "Mass • necrosis • nodes\n\nNew vessels\nAirway invasion\nArterial erosion\n\nNeed malignant tissue" },
    { title: "Infection", color: C.green, body: "TB • NTM • fungus • abscess\n\nCavity erosion\nCollateral flow\nPseudoaneurysm\n\nNeed tissue + cultures" },
    { title: "Inflammatory", color: C.violet, body: "Vasculitis\nOrganizing pneumonia\nInflammatory mass\n\nCapillaritis or vessel injury\n\nInflammation alone is insufficient" },
    { title: "Vascular", color: C.red, body: "Aneurysm • AVM • fistula\n\nHigh-pressure inflow\nFragile circuit\n\nMay explain bleeding—not the mass" },
  ] : [
    { title: "惡性腫瘤", color: C.blue, body: "腫塊 • 壞死 • 淋巴結\n\n新生血管\n侵犯呼吸道\n侵蝕動脈\n\n需要惡性組織診斷" },
    { title: "感染", color: C.green, body: "TB • NTM • 黴菌 • 膿瘍\n\n空洞侵蝕\n側枝循環\n假性動脈瘤\n\n需要組織＋培養" },
    { title: "發炎性", color: C.violet, body: "血管炎\n器質化肺炎\n發炎性腫塊\n\n微血管炎／血管損傷\n\n非特異發炎不足以結案" },
    { title: "血管性", color: C.red, body: "動脈瘤 • AVM • 瘻管\n\n高壓流入\n脆弱血管迴路\n\n可解釋咳血，未必解釋腫塊" },
  ];
  addFourColumns(s, items, 168, t.font);
  return s;
}

function slide08(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 8, t.titles[7], t.labels[7], "Sources: AAFP 2022; ACR; CIRSE 2022.");
  const rows = lang === "en" ? [
    ["Contrast CT", "Mass, cavity, lung and nodes", "Full arterial map / airway control"],
    ["CTA", "Bleeding territory + 3 vascular beds", "Tissue diagnosis"],
    ["Bronchoscopy", "Airway, clot, active bleed, sampling", "Full systemic vascular map"],
    ["Angiography", "Flow, culprit vessel, shunt, embolization", "Mass pathology"],
  ] : [
    ["對比 CT", "腫塊、空洞、肺實質與淋巴結", "完整動脈地圖／呼吸道控制"],
    ["CTA", "出血區域＋三個血管床", "組織診斷"],
    ["支氣管鏡", "呼吸道、血塊、活動出血、採樣", "完整體循環血管地圖"],
    ["血管攝影", "血流、責任血管、分流與栓塞", "腫塊病理"],
  ];
  const x = [72, 310, 738], widths = [238, 428, 438];
  [lang === "en" ? "Tool" : "工具", lang === "en" ? "Best question" : "最擅長回答", lang === "en" ? "Cannot answer alone" : "無法單獨回答"].forEach((h, i) => {
    rect(s, x[i], 166, widths[i], 48, C.blue);
    textBox(s, h, x[i] + 12, 175, widths[i] - 24, 32, { font: t.font, size: 22, bold: true, color: C.paper, align: i ? "left" : "center" });
  });
  rows.forEach((r, ri) => {
    const y = 214 + ri * 94;
    const fill = ri % 2 ? C.soft : C.paper;
    r.forEach((cell, ci) => {
      rect(s, x[ci], y, widths[ci], 94, fill, C.line, 1);
      textBox(s, cell, x[ci] + 14, y + 12, widths[ci] - 28, 70, { font: t.font, size: ci === 0 ? 23 : 21, bold: ci === 0, color: ci === 0 ? C.blue : C.ink, align: ci === 0 ? "center" : "left" });
    });
  });
  textBox(s, lang === "en" ? "Use them together." : "這些工具要搭配使用。", 360, 608, 560, 38, { font: t.font, size: 26, bold: true, color: C.orange, align: "center" });
  return s;
}

function slide09(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 9, t.titles[8], t.labels[8], "Source: Gonzalez et al. ATS/ACCP Research Statement. AJRCCM. 2024;209:634-646.");
  const cols = lang === "en" ? [
    ["Specific malignant", "Malignant tissue that explains the lesion", C.blue],
    ["Specific benign", "A benign diagnosis that fully explains the lesion", C.green],
    ["Nondiagnostic", "Atypia • inflammation • blood • necrosis • insufficient tissue", C.red],
  ] : [
    ["特定惡性診斷", "能完整解釋病灶的惡性組織", C.blue],
    ["特定良性診斷", "能完整解釋病灶的良性診斷", C.green],
    ["未確診／無診斷性", "異型 • 發炎 • 血液 • 壞死 • 組織不足", C.red],
  ];
  cols.forEach((c, i) => {
    const x = 72 + i * 380;
    rect(s, x, 176, 344, 330, C.paper, c[2], 3, false);
    rect(s, x, 176, 344, 10, c[2]);
    textBox(s, c[0], x + 22, 216, 300, 70, { font: t.font, size: 24, bold: true, color: c[2], align: "center" });
    textBox(s, c[1], x + 24, 302, 296, 152, { font: t.font, size: 25, color: C.ink, align: "center" });
  });
  rect(s, 168, 548, 944, 66, C.soft, C.orange, 1, false);
  textBox(s, lang === "en" ? "If more tissue is needed, the diagnosis is still open." : "如果仍需要組織，診斷就還沒有完成。", 190, 562, 900, 42, { font: t.font, size: 27, bold: true, color: C.orange, align: "center" });
  return s;
}

function slide10(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 10, t.titles[9], t.labels[9], "Source: Expanded review synthesis; ATS/ACCP 2024.");
  const rows = lang === "en" ? [
    ["Target", "Tool missed the lesion", "Re-read CT; choose airway, pleural, or nodal target", C.blue],
    ["Sample", "Surface tissue, necrosis, or too little core", "Change the needle, biopsy method, or route", C.orange],
    ["Pathology", "Blood, necrosis, atypia, or inflammation", "Call it nondiagnostic—not benign", C.red],
    ["Cultures", "No AFB, fungal, or bacterial allocation", "Plan specimen allocation before the procedure", C.green],
  ] : [
    ["標的", "工具沒有真正進入病灶", "重讀 CT；改選呼吸道、胸膜或淋巴結", C.blue],
    ["採樣", "表面、壞死中心或組織量不足", "更換針具、採樣方式或路徑", C.orange],
    ["病理", "血液、壞死、異型或非特異發炎", "標為未確診，不可寫成良性", C.red],
    ["培養", "沒有分配 AFB、黴菌或細菌檢體", "處置前先規劃檢體分配", C.green],
  ];
  textBox(s, lang === "en" ? "Failure" : "失敗層次", 72, 156, 170, 32, { font: t.font, size: 21, bold: true, color: C.gray });
  textBox(s, lang === "en" ? "What went wrong" : "問題在哪裡", 250, 156, 420, 32, { font: t.font, size: 21, bold: true, color: C.gray });
  textBox(s, lang === "en" ? "Change before repeating" : "重做前要改什麼", 690, 156, 470, 32, { font: t.font, size: 21, bold: true, color: C.gray });
  rows.forEach((r, i) => {
    const y = 202 + i * 98;
    rect(s, 72, y, 1100, 86, i % 2 ? C.soft : C.paper, C.line, 1);
    rect(s, 72, y, 8, 86, r[3]);
    textBox(s, r[0], 94, y + 24, 136, 36, { font: t.font, size: 24, bold: true, color: r[3] });
    textBox(s, r[1], 250, y + 14, 420, 62, { font: t.font, size: 22, color: C.ink });
    textBox(s, r[2], 690, y + 14, 470, 62, { font: t.font, size: 22, bold: true, color: C.blue });
  });
  return s;
}

function slide11(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 11, t.titles[10], t.labels[10], "Source: CIRSE Standards of Practice on BAE. 2022.");
  addMetric(s, "90%", lang === "en" ? "Bronchial circulation" : "支氣管循環", 120, 186, C.red, t.font, lang === "en" ? "High-pressure systemic bed" : "高壓 systemic 血管床");
  addMetric(s, "5%", lang === "en" ? "Pulmonary circulation" : "肺循環", 550, 186, C.blue, t.font, lang === "en" ? "Pseudoaneurysm / erosion" : "假性動脈瘤／侵蝕");
  addMetric(s, "5%", lang === "en" ? "Non-bronchial systemic" : "非支氣管 systemic", 980, 186, C.orange, t.font, lang === "en" ? "Pleural collateral supply" : "胸膜側枝供血");
  arrow(s, 302, 224, 180, 36, C.line);
  arrow(s, 732, 224, 180, 36, C.line);
  const note = lang === "en" ? "A search priority - not an exclusion rule" : "這是搜尋優先順序，不是排除規則";
  rect(s, 258, 468, 764, 70, C.soft, C.orange, 2, false);
  textBox(s, note, 292, 488, 696, 34, { font: t.font, size: 24, bold: true, color: C.orange, align: "center" });
  textBox(s, lang === "en" ? "Always match the vessel to the lesion." : "血管床必須和病灶位置一起解讀。", 190, 573, 900, 44, { font: t.font, size: 26, color: C.gray, align: "center" });
  return s;
}

function slide12(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 12, t.titles[11], t.labels[11], "Source: CIRSE 2022 abnormal artery signs; expanded review synthesis.");
  arrow(s, 266, 282, 176, 48, C.red);
  arrow(s, 648, 282, 176, 48, C.orange);
  arrow(s, 1028, 282, 112, 48, C.slate);
  const nodes = lang === "en" ? [
    ["Inflow", "Hypertrophic systemic feeder", C.red, 72],
    ["Lesion / sac", "Blush\nAneurysm / pseudoaneurysm", C.orange, 450],
    ["Outflow / shunt", "Early venous filling\nShunt / flow direction", C.blue, 832],
  ] : [
    ["流入", "肥大、迂曲的體循環供血", C.red, 72],
    ["病灶／囊體", "染色\n動脈瘤／假性動脈瘤", C.orange, 450],
    ["流出／分流", "提早靜脈顯影\n分流／血流方向", C.blue, 832],
  ];
  nodes.forEach((n) => {
    rect(s, n[3], 210, 310, 210, C.paper, n[2], 3, false);
    textBox(s, n[0], n[3] + 24, 238, 262, 38, { font: t.font, size: 24, bold: true, color: n[2], align: "center" });
    textBox(s, n[1], n[3] + 18, 292, 274, 110, { font: t.font, size: 22, color: C.ink, align: "center" });
  });
  const lex = lang === "en" ? "Report: hypertrophy • blush • early venous filling • pseudoaneurysm • shunt" : "報告用語：肥大 • 染色 • 提早靜脈顯影 • 假性動脈瘤 • 分流";
  rect(s, 92, 494, 1096, 84, C.soft, C.slate, 1, false);
  textBox(s, lex, 118, 512, 1044, 56, { font: t.font, size: 24, bold: true, color: C.slate, align: "center" });
  return s;
}

function slide13(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 13, t.titles[12], t.labels[12], "Source: Chen et al. J Thorac Dis. 2022;14:1784-1793. Mechanistic case series (n=9).");
  const types = lang === "en" ? [
    ["Type I", "Pulmonary artery pseudoaneurysm", "PA is the parent vessel; systemic collaterals may fill it retrogradely", C.blue],
    ["Type II", "Systemic arterial pseudoaneurysm", "The sac arises from a bronchial or non-bronchial systemic artery", C.red],
    ["Type III", "Systemic-pulmonary anastomotic", "Systemic and pulmonary branches form a shared circuit; direction may vary", C.orange],
  ] : [
    ["Type I", "肺動脈假性動脈瘤", "parent vessel 為 PA；systemic collateral 可逆向顯影", C.blue],
    ["Type II", "Systemic 動脈假性動脈瘤", "囊體由 bronchial 或 non-bronchial systemic artery 形成", C.red],
    ["Type III", "Systemic-pulmonary 吻合型", "systemic 與 pulmonary 分支形成共同迴路，血流方向可變", C.orange],
  ];
  types.forEach((ty, i) => {
    const y = 174 + i * 145;
    rect(s, 76, y, 1120, 120, C.paper, ty[3], 2, false);
    textBox(s, ty[0], 104, y + 24, 124, 34, { font: t.font, size: 23, bold: true, color: ty[3] });
    textBox(s, ty[1], 250, y + 18, 350, 76, { font: t.font, size: 24, bold: true, color: C.ink });
    textBox(s, ty[2], 646, y + 12, 500, 92, { font: t.font, size: 22, color: C.gray });
    arrow(s, 594, y + 38, 40, 26, ty[3]);
  });
  textBox(s, lang === "en" ? "Treat the entire inflow-sac-outflow circuit." : "治療完整的流入－囊體－流出迴路。", 150, 614, 980, 42, { font: t.font, size: 27, bold: true, color: C.orange, align: "center" });
  return s;
}

function slide14(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 14, t.titles[13], t.labels[13], "Source: CIRSE 2022; expanded review synthesis.");
  const left = lang === "en" ? ["BAE CAN", "Control active bleeding", "Treat identified pathologic arteries", "Create a safer diagnostic window", "Bridge to surgery or definitive therapy"] : ["BAE 可以", "控制活動性出血", "處理已辨識的病理血管", "創造較安全的診斷時間窗", "銜接手術或病因治療"];
  const right = lang === "en" ? ["BAE CANNOT", "Prove the mass is benign", "Replace pathology or microbiology", "Explain every recurrence by itself", "Resolve diagnostic ownership"] : ["BAE 不可以", "證明肺部腫塊是良性", "取代病理或微生物診斷", "單獨解釋所有再出血", "取代診斷負責人的追蹤"];
  rect(s, 88, 180, 510, 374, C.paper, C.green, 3, false);
  rect(s, 682, 180, 510, 374, C.paper, C.red, 3, false);
  textBox(s, left[0], 120, 212, 446, 40, { font: t.font, size: 24, bold: true, color: C.green, align: "center" });
  textBox(s, right[0], 714, 212, 446, 40, { font: t.font, size: 24, bold: true, color: C.red, align: "center" });
  left.slice(1).forEach((v, i) => {
    ellipse(s, 126, 288 + i * 58, 22, 22, C.green);
    textBox(s, v, 166, 278 + i * 58, 390, 46, { font: t.font, size: 23, color: C.ink });
  });
  right.slice(1).forEach((v, i) => {
    ellipse(s, 720, 288 + i * 58, 22, 22, C.red);
    textBox(s, v, 760, 278 + i * 58, 390, 46, { font: t.font, size: 23, color: C.ink });
  });
  textBox(s, lang === "en" ? "Hemostasis is not a diagnosis." : "止血不等於完成診斷。", 254, 596, 772, 46, { font: t.font, size: 29, bold: true, color: C.blue, align: "center" });
  return s;
}

function slide15(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 15, t.titles[14], t.labels[14], "Source: CIRSE 2022, Table 7. Ranges reflect heterogeneous studies and etiologies.");
  const rows = lang === "en" ? [
    ["Technical success", 90, 100, C.blue], ["Clinical success - 24 h", 82, 100, C.green],
    ["Clinical success - 30 d", 70, 92, C.orange], ["Clinical success - 1 y", 64, 92, C.red],
  ] : [
    ["技術成功", 90, 100, C.blue], ["24 小時臨床成功", 82, 100, C.green],
    ["30 天臨床成功", 70, 92, C.orange], ["1 年臨床成功", 64, 92, C.red],
  ];
  const plotX = 410, plotW = 700;
  [0, 20, 40, 60, 80, 100].forEach((v) => {
    const x = plotX + v / 100 * plotW;
    rect(s, x, 190, 1, 340, C.line);
    const tickX = x - 36;
    const tickW = 72;
    textBox(s, `${v}%`, tickX, 538, tickW, 30, { font: t.font, size: 17, color: C.gray, align: "center" });
  });
  rows.forEach((r, i) => {
    const y = 210 + i * 82;
    textBox(s, r[0], 92, y + 4, 295, 42, { font: t.font, size: 24, bold: true, color: C.ink });
    rect(s, plotX, y, plotW, 44, C.soft, C.line, 1, false);
    const left = plotX + r[1] / 100 * plotW;
    const width = (r[2] - r[1]) / 100 * plotW;
    rect(s, left, y + 7, Math.max(width, 10), 30, r[3], "none", 0, true);
    textBox(s, `${r[1]}-${r[2]}%`, left - 65, y + 6, width + 130, 30, { font: t.font, size: 18, bold: true, color: C.ink, align: "center" });
  });
  textBox(s, lang === "en" ? "Technical success is not one-year control." : "技術成功不等於一年內不再出血。", 220, 600, 840, 44, { font: t.font, size: 27, bold: true, color: C.red, align: "center" });
  return s;
}

function slide16(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 16, t.titles[15], t.labels[15], "Source: CIRSE 2022, rebleeding risk factors.");
  const causes = lang === "en" ? [
    ["Incomplete embolization", "A culprit artery or collateral was missed", C.red],
    ["Untreated disease", "Tumor, infection, or inflammation continues", C.blue],
    ["Recanalization", "A treated vessel becomes patent again", C.orange],
    ["New collaterals", "Chronic inflammation recruits new supply", C.violet],
  ] : [
    ["栓塞不完整", "漏掉責任動脈或側枝循環", C.red],
    ["基礎疾病未治療", "腫瘤、感染或發炎持續進展", C.blue],
    ["血管再通", "已處理的血管再次恢復通暢", C.orange],
    ["新生側枝", "慢性發炎招募新的供血", C.violet],
  ];
  causes.forEach((c, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 92 + col * 574, y = 176 + row * 208;
    ellipse(s, x, y, 58, 58, c[2]);
    textBox(s, String(i + 1), x, y + 12, 58, 32, { font: t.font, size: 22, bold: true, color: C.paper, align: "center" });
    textBox(s, c[0], x + 84, y, 430, 42, { font: t.font, size: 26, bold: true, color: c[2] });
    textBox(s, c[1], x + 84, y + 50, 430, 76, { font: t.font, size: 23, color: C.ink });
    rect(s, x + 84, y + 136, 420, 2, C.line);
  });
  textBox(s, lang === "en" ? "Re-localize. Reassess the disease." : "再出血時，要重新定位並檢討病因。", 190, 600, 900, 46, { font: t.font, size: 28, bold: true, color: C.red, align: "center" });
  return s;
}

function slide17(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 17, t.titles[16], t.labels[16], "Sources: Expanded review synthesis; JAMA 2022 nodule review (route trade-offs, scope qualified).");
  const rows = lang === "en" ? [
    ["Visible endobronchial lesion", "Conventional bronchoscopy biopsy", "Direct view + airway management", C.red],
    ["Airway-adjacent peripheral lesion", "Guided / robotic bronchoscopy ± radial EBUS", "Lower pneumothorax risk; can stage", C.slate],
    ["Pleural-based or peripheral mass", "CT-guided core biopsy", "Direct route; usually more tissue", C.blue],
    ["Mediastinal / hilar node", "EBUS-TBNA", "Diagnosis + staging; avoids vascular mass", C.green],
    ["Persistent high suspicion", "VATS / surgical biopsy or resection", "Definitive tissue; may also treat", C.orange],
  ] : [
    ["可見 endobronchial lesion", "傳統支氣管鏡 biopsy", "直接可視＋同時管理呼吸道", C.red],
    ["鄰近呼吸道的周邊病灶", "導引／機器人支氣管鏡 ± radial EBUS", "氣胸風險較低，可同時 staging", C.slate],
    ["胸膜基底／周邊腫塊", "CT 導引 core biopsy", "路徑直接，通常組織量較多", C.blue],
    ["縱膈／肺門淋巴結", "EBUS-TBNA", "診斷＋分期，避開高血管性腫塊", C.green],
    ["高度疑慮持續", "VATS／外科 biopsy 或切除", "取得 definitive tissue，也可能同時治療", C.orange],
  ];
  const headers = lang === "en" ? ["Best target", "Route"] : ["最佳標的", "建議路徑"];
  [72, 542].forEach((x, i) => {
    const widths = [470, 642];
    rect(s, x, 158, widths[i], 44, C.blue);
    textBox(s, headers[i], x + 12, 164, widths[i] - 24, 32, { font: t.font, size: 23, bold: true, color: C.paper, align: "center" });
  });
  rows.forEach((r, i) => {
    const y = 202 + i * 80, fill = i % 2 ? C.soft : C.paper;
    [72, 542].forEach((x, ci) => {
      const widths = [470, 642];
      rect(s, x, y, widths[ci], 80, fill, C.line, 1);
      textBox(s, r[ci], x + 16, y + 10, widths[ci] - 32, 60, { font: t.font, size: 22, bold: ci === 0, color: ci === 0 ? r[3] : C.ink, align: ci === 1 ? "center" : "left" });
    });
  });
  textBox(s, lang === "en" ? "Confirm vascular safety before sampling." : "採樣前先確認血管安全性。", 300, 614, 680, 38, { font: t.font, size: 25, bold: true, color: C.red, align: "center" });
  return s;
}

function slide18(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 18, t.titles[17], t.labels[17], "M&M framework: avoid hindsight bias; distinguish hemostatic and diagnostic outcomes.");
  rect(s, 98, 318, 1084, 6, C.line);
  const events = lang === "en" ? [
    ["Bleeding identified", "Severity and source uncertain", C.red],
    ["Nondiagnostic sample", "Mass remains unresolved", C.slate],
    ["BAE controls bleeding", "Acute hazard improves", C.green],
    ["Diagnostic closure", "The mass loses an owner", C.orange],
  ] : [
    ["辨識咳血", "嚴重度與來源仍未完成", C.red],
    ["採樣未確診", "肺部腫塊仍未解決", C.slate],
    ["BAE 控制出血", "急性危險改善", C.green],
    ["診斷提前結案", "未解決腫塊失去追蹤負責人", C.orange],
  ];
  events.forEach((e, i) => {
    const x = 74 + i * 292;
    ellipse(s, x + 78, 286, 70, 70, e[2], C.paper, 3);
    textBox(s, String(i + 1), x + 78, 303, 70, 34, { font: t.font, size: 23, bold: true, color: C.paper, align: "center" });
    textBox(s, e[0], x, 388, 226, 64, { font: t.font, size: 24, bold: true, color: e[2], align: "center" });
    textBox(s, e[1], x, 462, 226, 82, { font: t.font, size: 22, color: C.gray, align: "center" });
  });
  rect(s, 842, 168, 320, 86, C.soft, C.orange, 2, false);
  textBox(s, lang === "en" ? "Who owns the\nunresolved diagnosis?" : "誰負責未完成的\n病因診斷？", 860, 182, 284, 62, { font: t.font, size: 22, bold: true, color: C.orange, align: "center" });
  textBox(s, lang === "en" ? "Ask what was known then—and why uncertainty vanished." : "問當時知道什麼，也問不確定性為何消失。", 182, 590, 916, 52, { font: t.font, size: 25, bold: true, color: C.ink, align: "center" });
  return s;
}

function slide19(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 19, t.titles[18], t.labels[18]);
  arrow(s, 284, 312, 74, 38, C.line);
  arrow(s, 574, 312, 74, 38, C.line);
  arrow(s, 864, 312, 74, 38, C.line);
  const items = lang === "en" ? [
    ["1", "Diagnostic owner", "One clinician owns the unresolved diagnosis", C.blue],
    ["2", "Exact target", "Name the lesion, airway, node, or vessel", C.slate],
    ["3", "Specimen plan", "Pre-assign pathology and cultures", C.green],
    ["4", "Deadline", "Set the next test and escalation rule", C.orange],
  ] : [
    ["1", "診斷負責人", "由一位臨床醫師負責未完成診斷", C.blue],
    ["2", "明確標的", "命名病灶、呼吸道、淋巴結或血管", C.slate],
    ["3", "檢體計畫", "事先分配病理與微生物檢體", C.green],
    ["4", "明確期限", "設定下一次檢查與升級條件", C.orange],
  ];
  items.forEach((it, i) => {
    const x = 72 + i * 290;
    rect(s, x, 202, 250, 334, C.paper, it[3], 2, false);
    ellipse(s, x + 90, 164, 70, 70, it[3], C.paper, 3);
    textBox(s, it[0], x + 90, 181, 70, 34, { font: t.font, size: 24, bold: true, color: C.paper, align: "center" });
    textBox(s, it[1], x + 18, 266, 214, 72, { font: t.font, size: 25, bold: true, color: it[3], align: "center" });
    textBox(s, it[2], x + 18, 354, 214, 142, { font: t.font, size: 23, color: C.ink, align: "center" });
  });
  textBox(s, lang === "en" ? "Keep the unresolved diagnosis active." : "把「病因未解決」列為 active problem。", 312, 590, 656, 46, { font: t.font, size: 27, bold: true, color: C.red, align: "center" });
  return s;
}

function slide20(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 20, t.titles[19], t.labels[19], "Educational synthesis; patient-specific decisions require multidisciplinary judgment.");
  const msgs = lang === "en" ? [
    ["1", "Control bleeding by physiology", "Airway, oxygenation, circulation, trajectory, and reserve set urgency.", C.red],
    ["2", "Keep procedure results honest", "Blood, necrosis, atypia, and inflammation are nondiagnostic—not benign.", C.orange],
    ["3", "Finish the diagnosis", "After BAE, choose a better target, route, specimen plan, and owner.", C.blue],
  ] : [
    ["1", "依生理狀態控制出血", "呼吸道、氣體交換、血流動力、變化趨勢與心肺儲備決定急迫性。", C.red],
    ["2", "誠實標記處置結果", "血液、壞死、異型與非特異性發炎都是 nondiagnostic，不是 benign。", C.orange],
    ["3", "完成基礎病因診斷", "BAE 創造診斷時間窗；接著要選更好的標的、路徑、檢體計畫與負責人。", C.blue],
  ];
  msgs.forEach((m, i) => {
    const y = 168 + i * 126;
    ellipse(s, 82, y, 72, 72, m[3]);
    textBox(s, m[0], 82, y + 17, 72, 36, { font: t.font, size: 25, bold: true, color: C.paper, align: "center" });
    textBox(s, m[1], 186, y - 2, 470, 46, { font: t.font, size: 27, bold: true, color: m[3] });
    textBox(s, m[2], 186, y + 50, 940, 68, { font: t.font, size: 23, color: C.ink });
  });
  rect(s, 72, 558, 1120, 74, C.soft, C.line, 1, false);
  textBox(s, lang === "en" ? "Key sources: AAFP 2022 • ACR Hemoptysis • CIRSE 2022 • ATS/ACCP 2024 • JAMA 2022 • Chen 2022\nScope warning: pulmonary nodule thresholds do not automatically apply to a >3 cm mass." : "主要來源：AAFP 2022 • ACR Hemoptysis • CIRSE 2022 • ATS/ACCP 2024 • JAMA 2022 • Chen 2022\n範圍提醒：pulmonary nodule 的追蹤門檻不能直接套用到 >3 cm 的 lung mass。", 94, 574, 1076, 44, { font: t.font, size: 14, color: C.gray, align: "center" });
  return s;
}

const BUILDERS = [slide01, slide02, slide03, slide04, slide05, slide06, slide07, slide08, slide09, slide10, slide11, slide12, slide13, slide14, slide15, slide16, slide17, slide18, slide19, slide20];

async function writeBlob(filePath, blob) {
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

async function build(lang, fileName) {
  const p = Presentation.create({ slideSize: { width: 1280, height: 720 } });
  for (const fn of BUILDERS) fn(p, lang);

  const qaDir = path.join(QA_ROOT, lang);
  await fs.mkdir(qaDir, { recursive: true });
  for (const [i, slide] of p.slides.items.entries()) {
    const stem = `slide-${String(i + 1).padStart(2, "0")}`;
    await writeBlob(path.join(qaDir, `${stem}.png`), await p.export({ slide, format: "png", scale: 1 }));
    const layout = await slide.export({ format: "layout" });
    await fs.writeFile(path.join(qaDir, `${stem}.layout.json`), await layout.text());
  }
  await writeBlob(path.join(qaDir, "montage.webp"), await p.export({ format: "webp", montage: true, scale: 1 }));
  await fs.mkdir(OUT_DIR, { recursive: true });
  const pptx = await PresentationFile.exportPptx(p);
  const out = path.join(OUT_DIR, fileName);
  await pptx.save(out);
  return out;
}

const en = await build("en", "Hemoptysis_Lung_Mass_MM_NEJM_EN.pptx");
const zh = await build("zh", "Hemoptysis_Lung_Mass_MM_NEJM_ZH-TW.pptx");
console.log(en);
console.log(zh);
