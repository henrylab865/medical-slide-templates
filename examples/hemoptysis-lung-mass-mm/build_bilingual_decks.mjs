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
      "One presentation, four unfinished clinical problems",
      "Case snapshot: define the patient before defining the lesion",
      "The timeline should show where uncertainty accumulated",
      "Severity is functional - not a single volume threshold",
      "Protect the airway first; use CTA to map the next move",
      "A mass plus hemoptysis needs a mechanism-based differential",
      "CT, CTA, bronchoscopy, and angiography answer different questions",
      "A nondiagnostic bronchoscopy does not close the case",
      "Repeated sampling fails for identifiable - and correctable - reasons",
      "Three vascular beds can produce clinically important bleeding",
      "Describe the culprit circuit - not merely 'abnormal vessels'",
      "Pseudoaneurysm treatment depends on inflow and flow direction",
      "BAE controls bleeding; it does not identify the lung mass",
      "Immediate success is high; durable control is more variable",
      "Rebleeding usually signals incomplete source control",
      "After BAE, choose a new tissue target - not the same failed route",
      "The M&M inflection point: hemostasis mistaken for diagnostic closure",
      "Prevention requires an owner, a target, a specimen plan, and a trigger",
      "Control the bleeding. Preserve uncertainty. Finish the diagnosis.",
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
      "同一個病例，同時有四個尚未完成的問題",
      "病例摘要：先定義病人，再定義病灶",
      "時間軸要呈現不確定性在哪裡累積",
      "嚴重度是功能性判斷，不是單一出血量門檻",
      "先保護呼吸道；穩定後用 CTA 規劃下一步",
      "肺部腫塊合併咳血，應以機轉建立鑑別診斷",
      "CT、CTA、支氣管鏡與血管攝影回答不同問題",
      "支氣管鏡未確診，不代表病例可以結案",
      "重複採樣失敗通常有可辨識、可修正的原因",
      "三個血管床都可能造成臨床重要的咳血",
      "描述完整責任血管迴路，不只寫「異常血管」",
      "假性動脈瘤的治療取決於流入、流出與血流方向",
      "BAE 負責止血，但不會告訴你腫塊的病因",
      "立即止血成功率高；長期控制則較不穩定",
      "再出血通常代表來源控制仍不完整",
      "BAE 後應重新選擇組織標的，不要複製失敗路徑",
      "M&M 的轉折點：把止血成功誤認為診斷完成",
      "預防需要診斷負責人、標的、檢體計畫與升級條件",
      "控制出血、保留不確定性、完成病因診斷",
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
    let size = lang === "zh"
      ? (title.length > 22 ? 31 : title.length > 16 ? 34 : 38)
      : (title.length > 48 ? 31 : title.length > 38 ? 35 : 40);
    if (lang === "zh" && index === 10) size = 30;
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
  textBox(slide, label, x, y + 72, 180, 44, { font, size: 17, bold: true, color: C.ink, align: "center" });
  if (sub) textBox(slide, sub, x, y + 118, 180, 34, { font, size: 12, color: C.gray, align: "center" });
}

function addFourColumns(slide, items, y, font) {
  const x0 = 64, gap = 20, w = 273;
  items.forEach((it, i) => {
    const x = x0 + i * (w + gap);
    rect(slide, x, y, w, 405, C.paper, it.color, 2, false);
    rect(slide, x, y, w, 8, it.color);
    textBox(slide, it.title, x + 18, y + 28, w - 36, 54, { font, size: 22, bold: true, color: it.color });
    textBox(slide, it.body, x + 18, y + 92, w - 36, 275, { font, size: 17, color: C.ink });
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
    textBox(s, it[2], 402, y, 760, 72, { font: t.font, size: 19, color: C.ink });
    if (i < 3) rect(s, 104, y + 72, 4, 35, C.line);
  });
  return s;
}

function slide03(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 3, t.titles[2], t.labels[2]);
  addPill(s, t.replace, 930, 151, 250, C.orange, t.font);
  const fields = lang === "en" ? [
    ["Age / sex", "[Age / sex]"], ["Relevant history", "[Smoking, TB/NTM, cancer, anticoagulation, prior thoracic procedure]"],
    ["Chief concern", "[Hemoptysis pattern, duration, estimated volume, trajectory]"], ["Physiology", "[Airway, oxygen requirement, hemodynamics, hemoglobin trend]"],
    ["Imaging", "[Mass/cavity location, nodes, hemorrhage, vascular signs]"], ["Current status", "[Specific malignant / specific benign / unresolved nondiagnostic mass]"],
  ] : [
    ["年齡／性別", "[年齡／性別]"], ["重要病史", "[吸菸、TB／NTM、癌症、抗凝治療、胸腔處置史]"],
    ["主訴", "[咳血型態、持續時間、估計量與變化趨勢]"], ["生理狀態", "[呼吸道、氧氣需求、血流動力、血紅素變化]"],
    ["影像", "[腫塊／空洞位置、淋巴結、出血區、血管徵象]"], ["目前診斷狀態", "[特定惡性／特定良性／未解決的未確診腫塊]"],
  ];
  fields.forEach((f, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 72 + col * 578, y = 170 + row * 144;
    textBox(s, f[0], x, y, 210, 28, { font: t.font, size: 17, bold: true, color: C.blue });
    rect(s, x, y + 34, 542, 86, C.soft, C.line, 1, false);
    textBox(s, f[1], x + 14, y + 50, 512, 54, { font: t.font, size: 16, color: C.gray });
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
    textBox(s, st[0], x, 410, 220, 38, { font: t.font, size: 20, bold: true, color: [C.red, C.slate, C.orange, C.blue][i], align: "center" });
    textBox(s, st[1], x, 458, 220, 76, { font: t.font, size: 17, color: C.gray, align: "center" });
    if (i < 3) textBox(s, lang === "en" ? "What was known?\nWhat remained unknown?" : "當時已知什麼？\n仍未知什麼？", x + 208, 250, 126, 56, { font: t.font, size: 12, color: C.lightGray, align: "center" });
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
    textBox(s, a[0], 112, y + 5, 215, 29, { font: t.font, size: 22, bold: true, color: a[2] });
    textBox(s, a[1], 340, y + 4, 790, 54, { font: t.font, size: 18, color: C.ink });
  });
  textBox(s, lang === "en" ? "The dominant threat is usually asphyxiation, not exsanguination." : "最直接的死亡威脅通常是窒息，而不是單純失血。", 290, 620, 770, 34, { font: t.font, size: 21, bold: true, color: C.red, align: "center" });
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
  textBox(s, initial, 440, 180, 400, 36, { font: t.font, size: 22, bold: true, color: C.red, align: "center" });
  const leftTitle = lang === "en" ? "UNSTABLE / AIRWAY THREATENED" : "不穩定／呼吸道受威脅";
  const rightTitle = lang === "en" ? "STABLE ENOUGH FOR MAPPING" : "可穩定完成血管定位";
  rect(s, 92, 300, 480, 280, C.paper, C.red, 2, false);
  rect(s, 708, 300, 480, 280, C.paper, C.blue, 2, false);
  textBox(s, leftTitle, 118, 326, 428, 34, { font: t.font, size: 19, bold: true, color: C.red, align: "center" });
  textBox(s, rightTitle, 734, 326, 428, 34, { font: t.font, size: 19, bold: true, color: C.blue, align: "center" });
  textBox(s, lang === "en" ? "1. Position bleeding lung down\n2. Secure airway / isolate lung if needed\n3. Bronchoscopy for clot, airway, localization\n4. Proceed to CTA/angiography when feasible" : "1. 出血側朝下\n2. 必要時建立呼吸道與單肺隔離\n3. 支氣管鏡清除血塊、定位與維持呼吸道\n4. 可行時接續 CTA／血管攝影", 126, 386, 412, 150, { font: t.font, size: 18, color: C.ink });
  textBox(s, lang === "en" ? "1. Contrast CT / CTA\n2. Define lesion and bleeding territory\n3. Map bronchial, non-bronchial, pulmonary beds\n4. Select bronchoscopic, endovascular, or surgical route" : "1. 對比 CT／CTA\n2. 定義病灶與出血區域\n3. 建立 bronchial、non-bronchial 與 pulmonary 地圖\n4. 選擇支氣管鏡、血管內或手術路徑", 742, 386, 412, 150, { font: t.font, size: 18, color: C.ink });
  return s;
}

function slide07(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 7, t.titles[6], t.labels[6], "Source: Expanded review synthesis; AAFP 2022 differential framework.");
  const items = lang === "en" ? [
    { title: "Malignancy", color: C.blue, body: "Mass / necrosis / nodes\n\nBleeding: neovascularity, airway invasion, arterial erosion\n\nNeed: specific malignant tissue" },
    { title: "Infection", color: C.green, body: "TB / NTM / Aspergillus / abscess\n\nBleeding: cavity erosion, collateral recruitment, pseudoaneurysm\n\nNeed: pathology + microbiology" },
    { title: "Inflammatory", color: C.violet, body: "Vasculitis / organizing pneumonia / inflammatory mass\n\nBleeding: capillaritis or vascular injury\n\nNonspecific inflammation is insufficient" },
    { title: "Vascular", color: C.red, body: "Aneurysm / pseudoaneurysm / AVM / fistula\n\nBleeding: high-pressure inflow or fragile circuit\n\nMay explain bleeding but not the mass" },
  ] : [
    { title: "惡性腫瘤", color: C.blue, body: "腫塊／壞死／淋巴結\n\n出血：新生血管、侵犯呼吸道、侵蝕動脈\n\n需要：特定惡性組織診斷" },
    { title: "感染", color: C.green, body: "TB／NTM／Aspergillus／膿瘍\n\n出血：空洞侵蝕、側枝循環、假性動脈瘤\n\n需要：病理＋微生物" },
    { title: "發炎性", color: C.violet, body: "血管炎／器質化肺炎／發炎性腫塊\n\n出血：微血管炎或血管壁損傷\n\n非特異性發炎不足以結案" },
    { title: "血管性", color: C.red, body: "動脈瘤／假性動脈瘤／AVM／瘻管\n\n出血：高壓流入或脆弱血管迴路\n\n可解釋咳血，未必解釋腫塊" },
  ];
  addFourColumns(s, items, 168, t.font);
  return s;
}

function slide08(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 8, t.titles[7], t.labels[7], "Sources: AAFP 2022; ACR; CIRSE 2022.");
  const rows = lang === "en" ? [
    ["Contrast CT", "Mass/cavity morphology, parenchyma, nodes", "Complete arterial map or airway control"],
    ["CTA", "Bleeding territory and bronchial/NBSA/pulmonary map", "Tissue diagnosis"],
    ["Bronchoscopy", "Airway, clot, active bleed, endobronchial lesion, sampling", "Complete systemic vascular map"],
    ["Angiography", "Dynamic flow, culprit vessel, shunt, embolization", "Mass pathology"],
  ] : [
    ["對比 CT", "腫塊／空洞型態、肺實質、淋巴結", "完整動脈地圖或即時呼吸道控制"],
    ["CTA", "出血區域與 bronchial／NBSA／pulmonary 地圖", "組織診斷"],
    ["支氣管鏡", "呼吸道、血塊、活動出血、氣管內病灶、採樣", "完整 systemic vascular map"],
    ["血管攝影", "動態血流、責任血管、shunt、同時栓塞", "腫塊病理"],
  ];
  const x = [72, 310, 738], widths = [238, 428, 438];
  [lang === "en" ? "Tool" : "工具", lang === "en" ? "Best question" : "最擅長回答", lang === "en" ? "Cannot answer alone" : "無法單獨回答"].forEach((h, i) => {
    rect(s, x[i], 166, widths[i], 48, C.blue);
    textBox(s, h, x[i] + 12, 178, widths[i] - 24, 24, { font: t.font, size: 17, bold: true, color: C.paper, align: i ? "left" : "center" });
  });
  rows.forEach((r, ri) => {
    const y = 214 + ri * 94;
    const fill = ri % 2 ? C.soft : C.paper;
    r.forEach((cell, ci) => {
      rect(s, x[ci], y, widths[ci], 94, fill, C.line, 1);
      textBox(s, cell, x[ci] + 14, y + 16, widths[ci] - 28, 62, { font: t.font, size: ci === 0 ? 18 : 16, bold: ci === 0, color: ci === 0 ? C.blue : C.ink, align: ci === 0 ? "center" : "left" });
    });
  });
  textBox(s, lang === "en" ? "These tools are complementary - not competitors." : "這些工具是互補關係，不是互相競爭。", 360, 612, 560, 30, { font: t.font, size: 20, bold: true, color: C.orange, align: "center" });
  return s;
}

function slide09(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 9, t.titles[8], t.labels[8], "Source: Gonzalez et al. ATS/ACCP Research Statement. AJRCCM. 2024;209:634-646.");
  const cols = lang === "en" ? [
    ["Specific malignant", "Cancer subtype or malignant diagnosis that explains the lesion", C.blue],
    ["Specific benign", "A diagnosis that explains the lesion and does not require immediate additional intervention", C.green],
    ["Nondiagnostic", "Atypia • nonspecific inflammation • blood • necrosis • normal lung • insufficient tissue", C.red],
  ] : [
    ["特定惡性診斷", "能解釋病灶的癌別或明確惡性診斷", C.blue],
    ["特定良性診斷", "足以解釋病灶，且不需立即追加診斷性處置", C.green],
    ["未確診／無診斷性", "異型細胞 • 非特異性發炎 • 血液 • 壞死 • 正常肺 • 組織不足", C.red],
  ];
  cols.forEach((c, i) => {
    const x = 72 + i * 380;
    rect(s, x, 176, 344, 330, C.paper, c[2], 3, false);
    rect(s, x, 176, 344, 10, c[2]);
    textBox(s, c[0], x + 22, 216, 300, 70, { font: t.font, size: 24, bold: true, color: c[2], align: "center" });
    textBox(s, c[1], x + 28, 308, 288, 140, { font: t.font, size: 18, color: C.ink, align: "center" });
  });
  rect(s, 168, 548, 944, 66, C.soft, C.orange, 1, false);
  textBox(s, lang === "en" ? "If another biopsy or surgery is still needed now, the prior procedure did not resolve the diagnostic question." : "如果現在仍需要再次 biopsy 或手術，前一次處置就沒有真正解決診斷問題。", 190, 566, 900, 34, { font: t.font, size: 20, bold: true, color: C.orange, align: "center" });
  return s;
}

function slide10(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 10, t.titles[9], t.labels[9], "Source: Expanded review synthesis; ATS/ACCP 2024.");
  const rows = lang === "en" ? [
    ["Targeting", "Peripheral lesion, absent bronchus sign, tool not in lesion", "Re-read CT; choose airway, pleural, or nodal target", C.blue],
    ["Sampling", "Surface tissue, necrotic center, insufficient core", "Change needle / cryobiopsy / TTNB route", C.orange],
    ["Pathology", "Blood, necrosis, atypia, nonspecific inflammation", "Label as nondiagnostic; do not call benign", C.red],
    ["Microbiology", "Cytology only; no AFB / fungal / bacterial allocation", "Predefine specimen allocation before the procedure", C.green],
    ["System", "Same route repeated without yield review or owner", "Multidisciplinary review + escalation trigger", C.violet],
  ] : [
    ["定位", "周邊病灶、無 bronchus sign、工具未進入病灶", "重讀 CT；改選 airway、pleural 或 nodal 標的", C.blue],
    ["採樣", "只取到表面、壞死中心或 core 不足", "更換 needle／cryobiopsy／TTNB 路徑", C.orange],
    ["病理", "血液、壞死、異型、非特異性發炎", "明確標為 nondiagnostic，不可寫成 benign", C.red],
    ["微生物", "只送 cytology，未分配 AFB／黴菌／細菌檢體", "處置前完成 specimen allocation", C.green],
    ["系統", "未重新檢討 yield 就重複同一路徑", "多專科討論＋明確升級條件", C.violet],
  ];
  textBox(s, lang === "en" ? "Failure mode" : "失敗層次", 72, 156, 170, 30, { font: t.font, size: 16, bold: true, color: C.gray });
  textBox(s, lang === "en" ? "What went wrong" : "問題在哪裡", 260, 156, 410, 30, { font: t.font, size: 16, bold: true, color: C.gray });
  textBox(s, lang === "en" ? "Change before repeating" : "重做前要改變什麼", 700, 156, 450, 30, { font: t.font, size: 16, bold: true, color: C.gray });
  rows.forEach((r, i) => {
    const y = 196 + i * 84;
    rect(s, 72, y, 1100, 72, i % 2 ? C.soft : C.paper, C.line, 1);
    rect(s, 72, y, 8, 72, r[3]);
    textBox(s, r[0], 94, y + 21, 146, 30, { font: t.font, size: 19, bold: true, color: r[3] });
    textBox(s, r[1], 260, y + 15, 410, 42, { font: t.font, size: 16, color: C.ink });
    textBox(s, r[2], 700, y + 15, 450, 42, { font: t.font, size: 16, bold: true, color: C.blue });
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
  textBox(s, lang === "en" ? "Always correlate the vascular bed with lesion location, pleural disease, prior surgery, and chronic inflammation." : "血管床必須與病灶位置、胸膜疾病、手術史與慢性發炎一起解讀。", 190, 573, 900, 42, { font: t.font, size: 18, color: C.gray, align: "center" });
  return s;
}

function slide12(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 12, t.titles[11], t.labels[11], "Source: CIRSE 2022 abnormal artery signs; expanded review synthesis.");
  arrow(s, 266, 282, 176, 48, C.red);
  arrow(s, 648, 282, 176, 48, C.orange);
  arrow(s, 1028, 282, 112, 48, C.slate);
  const nodes = lang === "en" ? [
    ["Inflow", "Hypertrophic / tortuous artery\nBronchial or non-bronchial systemic feeder", C.red, 72],
    ["Lesion / sac", "Parenchymal blush\nAneurysm or pseudoaneurysm\nExtravasation may be absent", C.orange, 450],
    ["Outflow / shunt", "Early venous filling\nBronchial-pulmonary communication\nDirection of flow", C.blue, 832],
  ] : [
    ["流入", "肥大／迂曲動脈\nbronchial 或 non-bronchial systemic feeder", C.red, 72],
    ["病灶／囊體", "肺實質染色\n動脈瘤或假性動脈瘤\n未必出現顯影劑外滲", C.orange, 450],
    ["流出／分流", "提早靜脈顯影\nbronchial-pulmonary communication\n血流方向", C.blue, 832],
  ];
  nodes.forEach((n) => {
    rect(s, n[3], 210, 310, 210, C.paper, n[2], 3, false);
    textBox(s, n[0], n[3] + 24, 238, 262, 38, { font: t.font, size: 24, bold: true, color: n[2], align: "center" });
    textBox(s, n[1], n[3] + 24, 300, 262, 92, { font: t.font, size: 17, color: C.ink, align: "center" });
  });
  const lex = lang === "en" ? "Report: hypertrophy • tortuosity • neovascularity • blush • early venous filling • pseudoaneurysm • systemic-pulmonary communication" : "報告用語：hypertrophy • tortuosity • neovascularity • blush • early venous filling • pseudoaneurysm • systemic-pulmonary communication";
  rect(s, 92, 494, 1096, 84, C.soft, C.slate, 1, false);
  textBox(s, lex, 118, 516, 1044, 48, { font: t.font, size: 17, bold: true, color: C.slate, align: "center" });
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
    textBox(s, ty[1], 250, y + 22, 360, 38, { font: t.font, size: 21, bold: true, color: C.ink });
    textBox(s, ty[2], 646, y + 18, 500, 74, { font: t.font, size: 17, color: C.gray });
    arrow(s, 594, y + 38, 40, 26, ty[3]);
  });
  textBox(s, lang === "en" ? "The treatment target is the full inflow-sack-outflow circuit - not the brightest spot on one image." : "治療標的是完整 inflow-sack-outflow 迴路，不是單張影像上最顯眼的亮點。", 150, 620, 980, 34, { font: t.font, size: 19, bold: true, color: C.orange, align: "center" });
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
    textBox(s, v, 166, 282 + i * 58, 380, 38, { font: t.font, size: 18, color: C.ink });
  });
  right.slice(1).forEach((v, i) => {
    ellipse(s, 720, 288 + i * 58, 22, 22, C.red);
    textBox(s, v, 760, 282 + i * 58, 380, 38, { font: t.font, size: 18, color: C.ink });
  });
  textBox(s, lang === "en" ? "Hemostasis is a clinical milestone - not a final diagnosis." : "止血是重要里程碑，但不是最終診斷。", 254, 600, 772, 40, { font: t.font, size: 23, bold: true, color: C.blue, align: "center" });
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
    const tickX = v === 100 ? x - 36 : x - 24;
    const tickW = v === 100 ? 72 : 48;
    textBox(s, `${v}%`, tickX, 540, tickW, 24, { font: t.font, size: 12, color: C.gray, align: "center" });
  });
  rows.forEach((r, i) => {
    const y = 210 + i * 82;
    textBox(s, r[0], 92, y + 8, 285, 34, { font: t.font, size: 20, bold: true, color: C.ink });
    rect(s, plotX, y, plotW, 44, C.soft, C.line, 1, false);
    const left = plotX + r[1] / 100 * plotW;
    const width = (r[2] - r[1]) / 100 * plotW;
    rect(s, left, y + 7, Math.max(width, 10), 30, r[3], "none", 0, true);
    textBox(s, `${r[1]}-${r[2]}%`, left - 65, y + 9, width + 130, 24, { font: t.font, size: 14, bold: true, color: C.ink, align: "center" });
  });
  textBox(s, lang === "en" ? "Do not quote 90-100% as if it meant one-year freedom from rebleeding." : "不可把 90-100% 技術成功率說成一年內不再出血。", 220, 606, 840, 34, { font: t.font, size: 20, bold: true, color: C.red, align: "center" });
  return s;
}

function slide16(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 16, t.titles[15], t.labels[15], "Source: CIRSE 2022, rebleeding risk factors.");
  const causes = lang === "en" ? [
    ["Incomplete embolization", "Culprit artery or collateral missed at the first procedure", C.red],
    ["Untreated disease", "Tumor, infection, or inflammatory destruction continues", C.blue],
    ["Recanalization", "Previously treated vessel becomes patent again", C.orange],
    ["New collaterals", "Chronic inflammation recruits new non-bronchial supply", C.violet],
  ] : [
    ["栓塞不完整", "第一次處置漏掉責任動脈或側枝循環", C.red],
    ["基礎疾病未治療", "腫瘤、感染或發炎性破壞持續進展", C.blue],
    ["血管再通", "原先處理的血管再次恢復通暢", C.orange],
    ["新生側枝", "慢性發炎招募新的 non-bronchial 供血", C.violet],
  ];
  causes.forEach((c, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 92 + col * 574, y = 176 + row * 208;
    ellipse(s, x, y, 58, 58, c[2]);
    textBox(s, String(i + 1), x, y + 12, 58, 32, { font: t.font, size: 22, bold: true, color: C.paper, align: "center" });
    textBox(s, c[0], x + 84, y + 2, 420, 34, { font: t.font, size: 23, bold: true, color: c[2] });
    textBox(s, c[1], x + 84, y + 52, 420, 70, { font: t.font, size: 18, color: C.ink });
    rect(s, x + 84, y + 136, 420, 2, C.line);
  });
  textBox(s, lang === "en" ? "Rebleeding should trigger renewed localization and etiologic review - not only repeat embolization." : "再出血應重新啟動定位與病因檢討，不只是直接重做栓塞。", 190, 606, 900, 36, { font: t.font, size: 20, bold: true, color: C.red, align: "center" });
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
  const headers = lang === "en" ? ["Best target", "Route", "Why it may be better"] : ["最佳標的", "建議路徑", "為什麼可能更好"];
  [72, 430, 780].forEach((x, i) => {
    const widths = [358, 350, 404];
    rect(s, x, 158, widths[i], 44, C.blue);
    textBox(s, headers[i], x + 12, 169, widths[i] - 24, 22, { font: t.font, size: 16, bold: true, color: C.paper, align: "center" });
  });
  rows.forEach((r, i) => {
    const y = 202 + i * 76, fill = i % 2 ? C.soft : C.paper;
    [72, 430, 780].forEach((x, ci) => {
      const widths = [358, 350, 404];
      rect(s, x, y, widths[ci], 76, fill, C.line, 1);
      textBox(s, r[ci], x + 14, y + 12, widths[ci] - 28, 48, { font: t.font, size: 15, bold: ci === 0, color: ci === 0 ? r[3] : C.ink, align: ci === 1 ? "center" : "left" });
    });
  });
  textBox(s, lang === "en" ? "Route selection must account for vascular safety before sampling." : "選擇採樣路徑前，必須先確認血管安全性。", 300, 600, 680, 34, { font: t.font, size: 19, bold: true, color: C.red, align: "center" });
  return s;
}

function slide18(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 18, t.titles[17], t.labels[17], "M&M framework: avoid hindsight bias; distinguish hemostatic and diagnostic outcomes.");
  rect(s, 98, 318, 1084, 6, C.line);
  const events = lang === "en" ? [
    ["Bleeding identified", "Severity and source still uncertain", C.red],
    ["Nondiagnostic sampling", "Mass remains unresolved", C.slate],
    ["BAE controls bleeding", "Acute hazard improves", C.green],
    ["Diagnostic closure", "The unresolved mass loses an owner", C.orange],
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
    textBox(s, e[0], x, 392, 226, 54, { font: t.font, size: 20, bold: true, color: e[2], align: "center" });
    textBox(s, e[1], x, 458, 226, 66, { font: t.font, size: 16, color: C.gray, align: "center" });
  });
  rect(s, 876, 176, 286, 66, C.soft, C.orange, 2, false);
  textBox(s, lang === "en" ? "Critical question:\nWho owns the unresolved diagnosis?" : "關鍵問題：\n誰負責未完成的病因診斷？", 894, 184, 250, 52, { font: t.font, size: 16, bold: true, color: C.orange, align: "center" });
  textBox(s, lang === "en" ? "A fair review asks what was known at the time - and which process allowed uncertainty to disappear from the problem list." : "公平的回顧應問：當時知道什麼？又是哪個流程讓不確定性從 problem list 消失？", 182, 594, 916, 44, { font: t.font, size: 19, bold: true, color: C.ink, align: "center" });
  return s;
}

function slide19(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 19, t.titles[18], t.labels[18]);
  arrow(s, 284, 312, 74, 38, C.line);
  arrow(s, 574, 312, 74, 38, C.line);
  arrow(s, 864, 312, 74, 38, C.line);
  const items = lang === "en" ? [
    ["1", "Diagnostic owner", "One clinician coordinates radiology, pulmonology, IR, surgery, pathology, and ID", C.blue],
    ["2", "Target agreement", "Name the exact lesion, airway, node, or vessel each team is addressing", C.slate],
    ["3", "Specimen allocation", "Pre-plan histology, cytology, bacterial, AFB, fungal, and molecular studies", C.green],
    ["4", "Deadline + trigger", "Set the next test date and escalation for growth, recurrent bleeding, nodes, or another nondiagnostic result", C.orange],
  ] : [
    ["1", "診斷負責人", "由單一臨床醫師整合影像、胸腔、IR、外科、病理與感染科", C.blue],
    ["2", "標的一致", "明確命名每個團隊處理的是哪個病灶、呼吸道、淋巴結或血管", C.slate],
    ["3", "檢體分配", "處置前規劃病理、細胞學、細菌、AFB、黴菌與分子檢查", C.green],
    ["4", "期限＋升級條件", "設定下一次檢查日期，以及腫塊增大、再出血、新淋巴結或再次未確診時的升級方案", C.orange],
  ];
  items.forEach((it, i) => {
    const x = 72 + i * 290;
    rect(s, x, 202, 250, 334, C.paper, it[3], 2, false);
    ellipse(s, x + 90, 164, 70, 70, it[3], C.paper, 3);
    textBox(s, it[0], x + 90, 181, 70, 34, { font: t.font, size: 24, bold: true, color: C.paper, align: "center" });
    textBox(s, it[1], x + 22, 270, 206, 62, { font: t.font, size: 22, bold: true, color: it[3], align: "center" });
    textBox(s, it[2], x + 24, 356, 202, 128, { font: t.font, size: 16, color: C.ink, align: "center" });
  });
  textBox(s, lang === "en" ? "Make unresolved diagnosis an explicit active problem." : "把「病因未解決」列為明確的 active problem。", 312, 594, 656, 38, { font: t.font, size: 21, bold: true, color: C.red, align: "center" });
  return s;
}

function slide20(p, lang) {
  const t = COPY[lang], s = p.slides.add();
  addBase(s, lang, 20, t.titles[19], t.labels[19], "Educational synthesis; patient-specific decisions require multidisciplinary judgment.");
  const msgs = lang === "en" ? [
    ["1", "Control bleeding by physiology", "Airway, gas exchange, hemodynamics, trajectory, and reserve determine urgency.", C.red],
    ["2", "Keep procedure results honest", "Blood, necrosis, atypia, and nonspecific inflammation are nondiagnostic - not benign.", C.orange],
    ["3", "Finish the underlying diagnosis", "BAE creates a window. Use it to select a better target, route, specimen plan, and owner.", C.blue],
  ] : [
    ["1", "依生理狀態控制出血", "呼吸道、氣體交換、血流動力、變化趨勢與心肺儲備決定急迫性。", C.red],
    ["2", "誠實標記處置結果", "血液、壞死、異型與非特異性發炎都是 nondiagnostic，不是 benign。", C.orange],
    ["3", "完成基礎病因診斷", "BAE 創造診斷時間窗；接著要選更好的標的、路徑、檢體計畫與負責人。", C.blue],
  ];
  msgs.forEach((m, i) => {
    const y = 168 + i * 126;
    ellipse(s, 82, y, 72, 72, m[3]);
    textBox(s, m[0], 82, y + 17, 72, 36, { font: t.font, size: 25, bold: true, color: C.paper, align: "center" });
    textBox(s, m[1], 186, y, 420, 38, { font: t.font, size: 23, bold: true, color: m[3] });
    textBox(s, m[2], 186, y + 48, 940, 56, { font: t.font, size: 18, color: C.ink });
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
