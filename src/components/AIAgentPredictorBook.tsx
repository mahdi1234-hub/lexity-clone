"use client";

import React, {
  useRef,
  useState,
  useCallback,
  forwardRef,
  useMemo,
} from "react";
import HTMLFlipBook from "react-pageflip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ------------------------------------------------------------------ */
/*  Flipbook Page wrapper (forwardRef required by react-pageflip)     */
/* ------------------------------------------------------------------ */
const BookPage = forwardRef<
  HTMLDivElement,
  { children: React.ReactNode; className?: string }
>(({ children, className = "" }, ref) => (
  <div ref={ref} className={`predictor-page-content ${className}`}>
    {children}
  </div>
));
BookPage.displayName = "BookPage";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface FormState {
  decisionTitle: string;
  decisionCategory: string;
  urgency: string;
  stakeholders: string;
  currentState: string;
  painPoints: string[];
  constraints: string;
  budget: string;
  desiredOutcome: string;
  successMetrics: string;
  timeframe: string;
  riskTolerance: string;
  optionA: string;
  optionB: string;
  optionC: string;
  additionalContext: string;
  externalFactors: string[];
  dependencies: string;
  assumptions: string;
  reversibility: string;
  priorities: string[];
  ethicalConsiderations: string;
  longTermVision: string;
  dealBreakers: string;
  deepDiveDoNothing: string;
  deepDiveWorstCase: string;
  deepDiveReference: string;
}

const INITIAL_FORM: FormState = {
  decisionTitle: "",
  decisionCategory: "",
  urgency: "",
  stakeholders: "",
  currentState: "",
  painPoints: [],
  constraints: "",
  budget: "",
  desiredOutcome: "",
  successMetrics: "",
  timeframe: "",
  riskTolerance: "",
  optionA: "",
  optionB: "",
  optionC: "",
  additionalContext: "",
  externalFactors: [],
  dependencies: "",
  assumptions: "",
  reversibility: "",
  priorities: [],
  ethicalConsiderations: "",
  longTermVision: "",
  dealBreakers: "",
  deepDiveDoNothing: "",
  deepDiveWorstCase: "",
  deepDiveReference: "",
};

const PAIN_POINTS_OPTIONS = [
  "High costs",
  "Slow processes",
  "Poor user experience",
  "Technical debt",
  "Team capacity",
  "Market competition",
  "Regulatory pressure",
  "Data quality issues",
];

const EXTERNAL_FACTORS_OPTIONS = [
  "Market trends",
  "Regulatory changes",
  "Competitor actions",
  "Technology shifts",
  "Economic conditions",
  "Customer demand",
  "Supply chain",
  "Talent availability",
];

const PRIORITY_OPTIONS = [
  "Revenue growth",
  "Cost reduction",
  "Customer satisfaction",
  "Innovation",
  "Scalability",
  "Team morale",
  "Sustainability",
  "Speed to market",
];

/* ------------------------------------------------------------------ */
/*  AI Analysis Engine                                                */
/* ------------------------------------------------------------------ */
function generateAnalysis(form: FormState) {
  const { decisionCategory, urgency, riskTolerance, painPoints, priorities, externalFactors } = form;

  const causalFactors: string[] = [];
  if (painPoints.includes("High costs") && priorities.includes("Cost reduction"))
    causalFactors.push("Cost pressure is both a root cause and a priority -- address this first to unlock downstream benefits.");
  if (painPoints.includes("Slow processes") && priorities.includes("Speed to market"))
    causalFactors.push("Process bottlenecks directly delay time-to-market. Streamlining workflows will have a multiplicative effect.");
  if (externalFactors.includes("Market trends") && priorities.includes("Innovation"))
    causalFactors.push("Market momentum favors innovation -- early movers in this space will capture disproportionate value.");
  if (externalFactors.includes("Regulatory changes"))
    causalFactors.push("Regulatory shifts introduce both risk and opportunity -- build compliance as a competitive advantage.");
  if (painPoints.includes("Technical debt"))
    causalFactors.push("Technical debt compounds over time -- addressing it now reduces future cost of change significantly.");
  if (priorities.includes("Customer satisfaction") && painPoints.includes("Poor user experience"))
    causalFactors.push("User experience gaps are directly eroding satisfaction -- this is a high-leverage improvement area.");

  if (causalFactors.length === 0) {
    causalFactors.push(
      "Your inputs suggest a multi-dimensional decision. Consider mapping cause-effect relationships between your pain points and desired outcomes.",
      "External factors should be monitored as leading indicators that may shift the optimal path."
    );
  }

  let riskLevel = "Moderate";
  let riskNote = "";
  if (riskTolerance === "aggressive" && urgency === "critical") {
    riskLevel = "High";
    riskNote = "Your aggressive risk tolerance combined with critical urgency suggests a bold, fast-action strategy. Ensure fallback plans are in place.";
  } else if (riskTolerance === "conservative") {
    riskLevel = "Low";
    riskNote = "Conservative approach is wise. Focus on incremental wins and validated steps before committing larger resources.";
  } else if (riskTolerance === "balanced") {
    riskNote = "A balanced approach allows for calculated bets. Allocate 70% to proven strategies and 30% to experimental initiatives.";
  } else {
    riskNote = "Evaluate the reversibility of each option -- favor decisions that can be adjusted if early signals are negative.";
  }

  const options = [
    { label: "Option A", value: form.optionA },
    { label: "Option B", value: form.optionB },
    { label: "Option C", value: form.optionC },
  ].filter((o) => o.value.trim());

  const optionInsights = options.map((o) => {
    const words = o.value.toLowerCase();
    let score = 50;
    if (words.includes("automate") || words.includes("ai") || words.includes("technology")) score += 15;
    if (words.includes("cost") || words.includes("save") || words.includes("reduce")) score += 10;
    if (words.includes("risk") || words.includes("uncertain")) score -= 10;
    if (words.includes("partner") || words.includes("collaborate")) score += 8;
    if (words.includes("build") || words.includes("develop") || words.includes("create")) score += 12;
    score = Math.min(95, Math.max(20, score));
    return { ...o, score };
  });

  let categoryAdvice = "";
  switch (decisionCategory) {
    case "strategic":
      categoryAdvice = "Strategic decisions benefit from scenario planning. Map out best-case, worst-case, and most-likely outcomes for each option.";
      break;
    case "operational":
      categoryAdvice = "Operational decisions should optimize for efficiency and measurability. Define clear KPIs before implementing.";
      break;
    case "financial":
      categoryAdvice = "Financial decisions require sensitivity analysis. Model the impact of +/-20% variance on key assumptions.";
      break;
    case "technical":
      categoryAdvice = "Technical decisions should consider long-term maintainability and total cost of ownership, not just immediate capability.";
      break;
    case "hiring":
      categoryAdvice = "Hiring decisions have compounding effects on culture and capability. Prioritize values alignment alongside skill requirements.";
      break;
    default:
      categoryAdvice = "Consider the second-order effects of this decision -- how will it change your available options 6-12 months from now?";
  }

  const topOption = optionInsights.sort((a, b) => b.score - a.score)[0];

  return {
    causalFactors,
    riskLevel,
    riskNote,
    optionInsights,
    categoryAdvice,
    topOption,
    urgencyNote:
      urgency === "critical"
        ? "Given the critical urgency, bias toward action. A good decision now often outperforms a perfect decision later."
        : urgency === "high"
        ? "High urgency warrants swift but structured evaluation. Set a decision deadline within the next 48 hours."
        : "You have time to deliberate. Use it wisely -- gather additional data points and validate assumptions before committing.",
  };
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */
const SectionBadge = ({ number, label }: { number: string; label: string }) => (
  <div
    className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-6"
    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
  >
    <span className="inline-block h-[5px] w-[5px] rounded-full bg-[#C48C56]" />
    {number} &mdash; {label}
  </div>
);

const PageTitle = ({ children }: { children: React.ReactNode }) => (
  <h2
    className="text-[1.5rem] sm:text-[1.8rem] leading-[1.05] tracking-[-0.03em] text-[#181512] mb-4"
    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300 }}
  >
    {children}
  </h2>
);

const FieldLabel = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
  <Label
    htmlFor={htmlFor}
    className="text-[12px] font-medium text-[#5f5851] tracking-wide uppercase"
    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
  >
    {children}
  </Label>
);

const StyledInput = (props: React.ComponentProps<typeof Input>) => (
  <Input
    {...props}
    className={`bg-white/60 border-[#d9d1c5] text-[#181512] text-[13px] placeholder:text-[#8a8178]/60 focus:border-[#C48C56] focus:ring-[#C48C56]/20 ${props.className || ""}`}
    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", ...props.style }}
  />
);

const StyledTextarea = (props: React.ComponentProps<typeof Textarea>) => (
  <Textarea
    {...props}
    className={`bg-white/60 border-[#d9d1c5] text-[#181512] text-[13px] placeholder:text-[#8a8178]/60 focus:border-[#C48C56] focus:ring-[#C48C56]/20 min-h-[60px] resize-none ${props.className || ""}`}
    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", ...props.style }}
  />
);

const CheckboxField = ({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (c: boolean) => void;
}) => (
  <div className="flex items-center gap-2.5">
    <Checkbox
      id={id}
      checked={checked}
      onCheckedChange={(c) => onCheckedChange(c === true)}
      className="border-[#d9d1c5] data-[state=checked]:bg-[#C48C56] data-[state=checked]:border-[#C48C56]"
    />
    <label
      htmlFor={id}
      className="text-[12px] text-[#5f5851] cursor-pointer leading-tight"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {label}
    </label>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function AIAgentPredictorBook() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);

  const totalPages = 11;

  const needsExtraDetail = useMemo(() => {
    return (
      form.decisionCategory === "strategic" ||
      form.decisionCategory === "financial" ||
      form.urgency === "critical" ||
      form.painPoints.length >= 4
    );
  }, [form.decisionCategory, form.urgency, form.painPoints]);

  const onFlip = useCallback((e: { data: number }) => {
    setCurrentPage(e.data);
  }, []);

  const goNext = () => bookRef.current?.pageFlip()?.flipNext();
  const goPrev = () => bookRef.current?.pageFlip()?.flipPrev();

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: "painPoints" | "externalFactors" | "priorities", item: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(item) ? prev[key].filter((i) => i !== item) : [...prev[key], item],
    }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    goNext();
  };

  const analysis = useMemo(() => generateAnalysis(form), [form]);

  const stepCompletion = useMemo(() => {
    return {
      step1: !!(form.decisionTitle && form.decisionCategory && form.urgency),
      step2: !!(form.currentState && form.painPoints.length > 0),
      step3: !!(form.desiredOutcome && form.timeframe && form.riskTolerance),
      step4: !!(form.optionA),
      step5: !!(form.externalFactors.length > 0),
      step6: !!(form.priorities.length > 0),
    };
  }, [form]);

  const agentMessage = useMemo(() => {
    if (!form.decisionTitle) return "Start by describing the decision you are facing. I will guide you through a structured causal analysis.";
    if (!stepCompletion.step1) return "Complete the decision context -- category and urgency help me calibrate the analysis depth.";
    if (!stepCompletion.step2) return "Tell me about the current situation and pain points. This establishes the causal baseline.";
    if (!stepCompletion.step3) return "Define your desired outcome. Clear success criteria sharpen the analysis significantly.";
    if (!stepCompletion.step4) return "List at least one option you are considering. I will score each against your stated criteria.";
    if (!stepCompletion.step5) return "Identify external factors that may influence outcomes. These are the causal variables outside your control.";
    if (!stepCompletion.step6) return "Almost there -- set your priorities and I will generate a comprehensive causal analysis.";
    return "All steps complete. Flip to the analysis pages to see your personalized causal decision report.";
  }, [form.decisionTitle, stepCompletion]);

  const deepDiveMessage = useMemo(() => {
    if (form.decisionCategory === "strategic")
      return "Strategic decisions have long-lasting effects. The AI agent detected this and is requesting additional scenario data.";
    if (form.decisionCategory === "financial")
      return "Financial decisions require sensitivity analysis. Please provide additional data points for a more robust model.";
    if (form.urgency === "critical")
      return "Critical urgency detected. The agent needs to understand fallback positions to provide responsible guidance.";
    if (form.painPoints.length >= 4)
      return "Multiple pain points detected. The causal graph is complex -- additional context will improve accuracy.";
    return "Providing additional context helps the AI agent build a stronger causal model for your decision.";
  }, [form.decisionCategory, form.urgency, form.painPoints]);

  return (
    <section id="ai-predictor" className="relative border-b border-[#d9d1c5] bg-[#f4f0e9] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(196,140,86,0.06),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(47,93,80,0.04),transparent_24%)]" />
      </div>

      <div className="relative max-w-[1380px] mx-auto px-6 sm:px-8 lg:px-14 py-16 sm:py-20 lg:py-24">
        {/* Section header */}
        <div className="grid lg:grid-cols-[0.34fr_1fr] gap-10 lg:gap-16 items-end mb-14 lg:mb-16">
          <div>
            <div
              className="inline-flex items-center gap-3 text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-[#6f675f] mb-6"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <span className="inline-block h-[6px] w-[6px] rounded-full bg-[#2F5D50]" />
              AI Agent Predictor
            </div>
            <p
              className="max-w-[15rem] text-[13px] leading-7 text-[#7a7268] font-light"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              A causal decision-making engine that guides you step by step, analyzes
              trade-offs, and delivers actionable insights.
            </p>
          </div>

          <div>
            <h2
              className="tracking-[-0.04em] leading-[0.94] text-[2.2rem] sm:text-[3rem] md:text-[3.7rem] lg:text-[4rem] xl:text-[4.5rem] max-w-[18ch] text-[#181512]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300 }}
            >
              <span>Decisions powered by </span>
              <span className="italic text-[#2F5D50]">causal intelligence.</span>
            </h2>
            <p
              className="mt-6 max-w-[42rem] text-[15px] sm:text-[16px] leading-8 text-[#5f5851] font-light"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Flip through the pages to walk through a structured decision analysis.
              The AI agent adapts to your context, asks the right questions, and
              reveals the causal pathways behind each option.
            </p>
          </div>
        </div>

        {/* AI Agent Status Bar */}
        <div className="mb-8 max-w-[900px] mx-auto">
          <div className="flex items-start gap-3 bg-white/50 backdrop-blur-sm border border-[#d9d1c5] rounded-xl px-5 py-4">
            <div className="flex-shrink-0 mt-0.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-[#2F5D50] flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10 21h4" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#C48C56] border-2 border-white" />
              </div>
            </div>
            <div className="flex-1">
              <p
                className="text-[11px] uppercase tracking-[0.12em] text-[#8a8178] mb-1"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                AI Agent Guidance
              </p>
              <p
                className="text-[13px] leading-6 text-[#5f5851] font-light"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {agentMessage}
              </p>
            </div>
            <div className="flex-shrink-0 flex gap-1">
              {Object.values(stepCompletion).map((done, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${done ? "bg-[#2F5D50]" : "bg-[#d9d1c5]"}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Flipbook */}
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-[900px]" style={{ perspective: "2000px" }}>
            <HTMLFlipBook
              ref={bookRef}
              width={420}
              height={560}
              size="stretch"
              minWidth={300}
              maxWidth={450}
              minHeight={400}
              maxHeight={580}
              drawShadow
              flippingTime={800}
              usePortrait={false}
              startZIndex={0}
              autoSize
              maxShadowOpacity={0.4}
              showCover
              mobileScrollSupport
              onFlip={onFlip}
              className="predictor-book-container"
              style={{}}
              startPage={0}
              clickEventForward={false}
              useMouseEvents
              swipeDistance={30}
              showPageCorners
              disableFlipByClick={false}
            >
              {/* ====== COVER ====== */}
              <BookPage className="bg-[#181512] text-[#F2EFEA] flex flex-col justify-between p-0 overflow-hidden">
                <div className="relative w-full h-full flex flex-col justify-between" style={{ minHeight: "100%" }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2F5D50]/20 via-[#181512] to-[#181512]" />
                  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

                  <div className="relative z-10 flex flex-col justify-between h-full p-8 sm:p-10">
                    <div>
                      <div
                        className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[#C48C56]/70 mb-4"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        <span className="inline-block h-[5px] w-[5px] rounded-full bg-[#2F5D50]" />
                        AI Decision Engine
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                      <div className="mb-8">
                        <svg className="w-12 h-12 text-[#2F5D50]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                        </svg>
                      </div>
                      <h1
                        className="text-[2.4rem] sm:text-[3rem] leading-[0.92] tracking-[-0.04em] text-[#F2EFEA] mb-6"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300 }}
                      >
                        Causal
                        <br />
                        Decision
                        <br />
                        <span className="italic text-[#2F5D50]">Predictor</span>
                      </h1>
                      <p
                        className="text-[13px] leading-7 text-[#F2EFEA]/45 max-w-[26ch] font-light"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        A structured, AI-guided journey through
                        your most important decisions. Six steps to clarity.
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <p
                        className="text-[11px] text-[#F2EFEA]/30 tracking-wide"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        Powered by Lexity AI
                      </p>
                      <div className="flex items-center gap-1.5">
                        <div className="h-[1px] w-8 bg-[#2F5D50]/40" />
                        <span className="text-[10px] text-[#2F5D50]/60">Flip to begin</span>
                      </div>
                    </div>
                  </div>
                </div>
              </BookPage>

              {/* ====== STEP 1: Decision Context ====== */}
              <BookPage className="bg-[#f4f0e9] p-0 overflow-hidden">
                <div className="h-full flex flex-col p-7 sm:p-9 overflow-y-auto">
                  <SectionBadge number="01" label="Decision Context" />
                  <PageTitle>
                    What decision are you
                    <br />
                    <span className="italic text-[#2F5D50]">facing today?</span>
                  </PageTitle>

                  <p className="text-[12px] leading-6 text-[#8a8178] font-light mb-5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Start by framing the decision. A well-defined question is half the answer.
                  </p>

                  <div className="flex-1 space-y-4">
                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="pred-decisionTitle">Decision Title</FieldLabel>
                      <StyledInput
                        id="pred-decisionTitle"
                        placeholder="e.g., Should we expand into the European market?"
                        value={form.decisionTitle}
                        onChange={(e) => updateField("decisionTitle", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <FieldLabel>Category</FieldLabel>
                      <Select value={form.decisionCategory} onValueChange={(v) => updateField("decisionCategory", v)}>
                        <SelectTrigger className="bg-white/60 border-[#d9d1c5] text-[13px] text-[#181512] focus:ring-[#C48C56]/20" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          <SelectValue placeholder="Select category..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="strategic">Strategic</SelectItem>
                          <SelectItem value="operational">Operational</SelectItem>
                          <SelectItem value="financial">Financial</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="hiring">Hiring / People</SelectItem>
                          <SelectItem value="product">Product / Feature</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <FieldLabel>Urgency Level</FieldLabel>
                      <Select value={form.urgency} onValueChange={(v) => updateField("urgency", v)}>
                        <SelectTrigger className="bg-white/60 border-[#d9d1c5] text-[13px] text-[#181512] focus:ring-[#C48C56]/20" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          <SelectValue placeholder="How urgent is this?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical -- needs decision today</SelectItem>
                          <SelectItem value="high">High -- within this week</SelectItem>
                          <SelectItem value="medium">Medium -- within this month</SelectItem>
                          <SelectItem value="low">Low -- can deliberate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="pred-stakeholders">Key Stakeholders</FieldLabel>
                      <StyledInput
                        id="pred-stakeholders"
                        placeholder="Who is affected by this decision?"
                        value={form.stakeholders}
                        onChange={(e) => updateField("stakeholders", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#d9d1c5] mt-3">
                    <p className="text-[11px] text-[#8a8178] italic" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Tip: Be specific. &ldquo;Expand to Europe&rdquo; is better than &ldquo;grow the business.&rdquo;
                    </p>
                  </div>
                </div>
              </BookPage>

              {/* ====== STEP 2: Current Situation ====== */}
              <BookPage className="bg-[#f4f0e9] p-0 overflow-hidden">
                <div className="h-full flex flex-col p-7 sm:p-9 overflow-y-auto">
                  <SectionBadge number="02" label="Current Situation" />
                  <PageTitle>
                    Where do things
                    <br />
                    <span className="italic text-[#C48C56]">stand right now?</span>
                  </PageTitle>

                  <p className="text-[12px] leading-6 text-[#8a8178] font-light mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Understanding your baseline is essential for causal analysis.
                  </p>

                  <div className="flex-1 space-y-4">
                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="pred-currentState">Current State Description</FieldLabel>
                      <StyledTextarea
                        id="pred-currentState"
                        placeholder="Describe the current situation in 2-3 sentences..."
                        value={form.currentState}
                        onChange={(e) => updateField("currentState", e.target.value)}
                        rows={3}
                      />
                    </div>

                    <Separator className="bg-[#d9d1c5]" />

                    <div className="space-y-2">
                      <FieldLabel>Pain Points (select all that apply)</FieldLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {PAIN_POINTS_OPTIONS.map((pp) => (
                          <CheckboxField
                            key={pp}
                            id={`pred-pp-${pp.replace(/\s/g, "-")}`}
                            label={pp}
                            checked={form.painPoints.includes(pp)}
                            onCheckedChange={() => toggleArrayItem("painPoints", pp)}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="pred-constraints">Key Constraints</FieldLabel>
                      <StyledInput
                        id="pred-constraints"
                        placeholder="Budget limits, deadlines, dependencies..."
                        value={form.constraints}
                        onChange={(e) => updateField("constraints", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <FieldLabel>Budget Range</FieldLabel>
                      <Select value={form.budget} onValueChange={(v) => updateField("budget", v)}>
                        <SelectTrigger className="bg-white/60 border-[#d9d1c5] text-[13px] text-[#181512] focus:ring-[#C48C56]/20" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          <SelectValue placeholder="Approximate budget..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minimal">Minimal (under $10k)</SelectItem>
                          <SelectItem value="moderate">Moderate ($10k - $100k)</SelectItem>
                          <SelectItem value="significant">Significant ($100k - $1M)</SelectItem>
                          <SelectItem value="major">Major (over $1M)</SelectItem>
                          <SelectItem value="na">Not applicable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </BookPage>

              {/* ====== STEP 3: Desired Outcome ====== */}
              <BookPage className="bg-[#f4f0e9] p-0 overflow-hidden">
                <div className="h-full flex flex-col p-7 sm:p-9 overflow-y-auto">
                  <SectionBadge number="03" label="Desired Outcome" />
                  <PageTitle>
                    What does success
                    <br />
                    <span className="italic text-[#2F5D50]">look like?</span>
                  </PageTitle>

                  <p className="text-[12px] leading-6 text-[#8a8178] font-light mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Clear outcomes anchor the causal analysis and prevent scope drift.
                  </p>

                  <div className="flex-1 space-y-4">
                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="pred-desiredOutcome">Desired Outcome</FieldLabel>
                      <StyledTextarea
                        id="pred-desiredOutcome"
                        placeholder="Describe what the ideal result looks like..."
                        value={form.desiredOutcome}
                        onChange={(e) => updateField("desiredOutcome", e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="pred-successMetrics">Success Metrics</FieldLabel>
                      <StyledInput
                        id="pred-successMetrics"
                        placeholder="e.g., 20% revenue increase, 50% faster delivery"
                        value={form.successMetrics}
                        onChange={(e) => updateField("successMetrics", e.target.value)}
                      />
                    </div>

                    <Separator className="bg-[#d9d1c5]" />

                    <div className="space-y-1.5">
                      <FieldLabel>Decision Timeframe</FieldLabel>
                      <Select value={form.timeframe} onValueChange={(v) => updateField("timeframe", v)}>
                        <SelectTrigger className="bg-white/60 border-[#d9d1c5] text-[13px] text-[#181512] focus:ring-[#C48C56]/20" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          <SelectValue placeholder="When should results materialize?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate (1-4 weeks)</SelectItem>
                          <SelectItem value="short">Short-term (1-3 months)</SelectItem>
                          <SelectItem value="medium">Medium-term (3-12 months)</SelectItem>
                          <SelectItem value="long">Long-term (1+ years)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <FieldLabel>Risk Tolerance</FieldLabel>
                      <Select value={form.riskTolerance} onValueChange={(v) => updateField("riskTolerance", v)}>
                        <SelectTrigger className="bg-white/60 border-[#d9d1c5] text-[13px] text-[#181512] focus:ring-[#C48C56]/20" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          <SelectValue placeholder="How much risk can you accept?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conservative">Conservative -- minimize risk</SelectItem>
                          <SelectItem value="balanced">Balanced -- calculated risks</SelectItem>
                          <SelectItem value="aggressive">Aggressive -- high risk, high reward</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#d9d1c5] mt-3">
                    <p className="text-[11px] text-[#8a8178] italic" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      The clearer your success criteria, the more precise the analysis.
                    </p>
                  </div>
                </div>
              </BookPage>

              {/* ====== STEP 4: Options & Alternatives ====== */}
              <BookPage className="bg-[#f4f0e9] p-0 overflow-hidden">
                <div className="h-full flex flex-col p-7 sm:p-9 overflow-y-auto">
                  <SectionBadge number="04" label="Options &amp; Alternatives" />
                  <PageTitle>
                    What paths are
                    <br />
                    <span className="italic text-[#C48C56]">on the table?</span>
                  </PageTitle>

                  <p className="text-[12px] leading-6 text-[#8a8178] font-light mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    List the options you are considering. The AI will score each one.
                  </p>

                  <div className="flex-1 space-y-4">
                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="pred-optionA">Option A (primary)</FieldLabel>
                      <StyledTextarea
                        id="pred-optionA"
                        placeholder="Describe the first option..."
                        value={form.optionA}
                        onChange={(e) => updateField("optionA", e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="pred-optionB">Option B (alternative)</FieldLabel>
                      <StyledTextarea
                        id="pred-optionB"
                        placeholder="Describe an alternative approach..."
                        value={form.optionB}
                        onChange={(e) => updateField("optionB", e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="pred-optionC">Option C (creative / unconventional)</FieldLabel>
                      <StyledTextarea
                        id="pred-optionC"
                        placeholder="Is there a third way? Think outside the box..."
                        value={form.optionC}
                        onChange={(e) => updateField("optionC", e.target.value)}
                        rows={2}
                      />
                    </div>

                    <Separator className="bg-[#d9d1c5]" />

                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="pred-additionalContext">Additional Context</FieldLabel>
                      <StyledTextarea
                        id="pred-additionalContext"
                        placeholder="Anything else relevant -- past attempts, competitor moves, gut feeling..."
                        value={form.additionalContext}
                        onChange={(e) => updateField("additionalContext", e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              </BookPage>

              {/* ====== STEP 5: Causal Factors ====== */}
              <BookPage className="bg-[#f4f0e9] p-0 overflow-hidden">
                <div className="h-full flex flex-col p-7 sm:p-9 overflow-y-auto">
                  <SectionBadge number="05" label="Causal Factors" />
                  <PageTitle>
                    What forces shape
                    <br />
                    <span className="italic text-[#2F5D50]">the outcome?</span>
                  </PageTitle>

                  <p className="text-[12px] leading-6 text-[#8a8178] font-light mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Identify the external variables that could influence which option succeeds.
                  </p>

                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <FieldLabel>External Factors</FieldLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {EXTERNAL_FACTORS_OPTIONS.map((ef) => (
                          <CheckboxField
                            key={ef}
                            id={`pred-ef-${ef.replace(/\s/g, "-")}`}
                            label={ef}
                            checked={form.externalFactors.includes(ef)}
                            onCheckedChange={() => toggleArrayItem("externalFactors", ef)}
                          />
                        ))}
                      </div>
                    </div>

                    <Separator className="bg-[#d9d1c5]" />

                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="pred-dependencies">Dependencies</FieldLabel>
                      <StyledInput
                        id="pred-dependencies"
                        placeholder="What must happen first or in parallel?"
                        value={form.dependencies}
                        onChange={(e) => updateField("dependencies", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="pred-assumptions">Key Assumptions</FieldLabel>
                      <StyledInput
                        id="pred-assumptions"
                        placeholder="What are you assuming to be true?"
                        value={form.assumptions}
                        onChange={(e) => updateField("assumptions", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <FieldLabel>Reversibility</FieldLabel>
                      <Select value={form.reversibility} onValueChange={(v) => updateField("reversibility", v)}>
                        <SelectTrigger className="bg-white/60 border-[#d9d1c5] text-[13px] text-[#181512] focus:ring-[#C48C56]/20" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          <SelectValue placeholder="Can this decision be undone?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fully">Fully reversible</SelectItem>
                          <SelectItem value="partially">Partially reversible</SelectItem>
                          <SelectItem value="irreversible">Irreversible / one-way door</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </BookPage>

              {/* ====== STEP 6: Values & Priorities ====== */}
              <BookPage className="bg-[#f4f0e9] p-0 overflow-hidden">
                <div className="h-full flex flex-col p-7 sm:p-9 overflow-y-auto">
                  <SectionBadge number="06" label="Values &amp; Priorities" />
                  <PageTitle>
                    What matters most
                    <br />
                    <span className="italic text-[#C48C56]">to you?</span>
                  </PageTitle>

                  <p className="text-[12px] leading-6 text-[#8a8178] font-light mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Your priorities act as weights in the causal model, tilting the analysis toward what you value.
                  </p>

                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <FieldLabel>Top Priorities (select up to 4)</FieldLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {PRIORITY_OPTIONS.map((pr) => (
                          <CheckboxField
                            key={pr}
                            id={`pred-pr-${pr.replace(/\s/g, "-")}`}
                            label={pr}
                            checked={form.priorities.includes(pr)}
                            onCheckedChange={() => {
                              if (form.priorities.includes(pr) || form.priorities.length < 4) {
                                toggleArrayItem("priorities", pr);
                              }
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    <Separator className="bg-[#d9d1c5]" />

                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="pred-ethicalConsiderations">Ethical Considerations</FieldLabel>
                      <StyledInput
                        id="pred-ethicalConsiderations"
                        placeholder="Any ethical dimensions to consider?"
                        value={form.ethicalConsiderations}
                        onChange={(e) => updateField("ethicalConsiderations", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="pred-longTermVision">Long-Term Vision</FieldLabel>
                      <StyledInput
                        id="pred-longTermVision"
                        placeholder="Where do you want to be in 3-5 years?"
                        value={form.longTermVision}
                        onChange={(e) => updateField("longTermVision", e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="pred-dealBreakers">Deal Breakers</FieldLabel>
                      <StyledInput
                        id="pred-dealBreakers"
                        placeholder="What would make any option unacceptable?"
                        value={form.dealBreakers}
                        onChange={(e) => updateField("dealBreakers", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Submit CTA */}
                  <div className="pt-4 mt-2">
                    <button
                      onClick={handleSubmit}
                      className="w-full flex items-center justify-center gap-2 bg-[#2F5D50] text-[#F2EFEA] px-6 py-3 rounded-lg text-[13px] font-medium transition-all hover:bg-[#264a40] active:scale-[0.98]"
                      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10 21h4" strokeLinecap="round" />
                      </svg>
                      Generate Causal Analysis
                    </button>
                  </div>
                </div>
              </BookPage>

              {/* ====== DEEP DIVE PAGE (always rendered, adapts content) ====== */}
              <BookPage className="bg-[#f4f0e9] p-0 overflow-hidden">
                <div className="h-full flex flex-col p-7 sm:p-9 overflow-y-auto">
                  <SectionBadge number="06+" label="Deep Dive" />
                  <PageTitle>
                    {needsExtraDetail ? (
                      <>
                        Your context suggests
                        <br />
                        <span className="italic text-[#C48C56]">deeper analysis.</span>
                      </>
                    ) : (
                      <>
                        Strengthen your
                        <br />
                        <span className="italic text-[#C48C56]">decision model.</span>
                      </>
                    )}
                  </PageTitle>

                  <div className="bg-[#C48C56]/10 border border-[#C48C56]/20 rounded-lg px-4 py-3 mb-4">
                    <p className="text-[12px] leading-6 text-[#5f5851] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {deepDiveMessage}
                    </p>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="pred-deepDiveDoNothing">What happens if you do nothing?</FieldLabel>
                      <StyledTextarea
                        id="pred-deepDiveDoNothing"
                        placeholder="Describe the status quo trajectory..."
                        value={form.deepDiveDoNothing}
                        onChange={(e) => updateField("deepDiveDoNothing", e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="pred-deepDiveWorstCase">Worst realistic outcome</FieldLabel>
                      <StyledTextarea
                        id="pred-deepDiveWorstCase"
                        placeholder="What is the worst-case you could live with?"
                        value={form.deepDiveWorstCase}
                        onChange={(e) => updateField("deepDiveWorstCase", e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="pred-deepDiveReference">Who else has faced a similar decision?</FieldLabel>
                      <StyledInput
                        id="pred-deepDiveReference"
                        placeholder="Reference points -- competitors, case studies, mentors..."
                        value={form.deepDiveReference}
                        onChange={(e) => updateField("deepDiveReference", e.target.value)}
                      />
                    </div>

                    <Separator className="bg-[#d9d1c5]" />

                    <p className="text-[11px] text-[#8a8178] italic" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      This additional context strengthens the causal model. Flip to see your analysis.
                    </p>
                  </div>
                </div>
              </BookPage>

              {/* ====== ANALYSIS PAGE 1: Causal Insights ====== */}
              <BookPage className="bg-[#181512] text-[#F2EFEA] p-0 overflow-hidden">
                <div className="h-full flex flex-col p-7 sm:p-9 overflow-y-auto">
                  <div className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <span className="inline-block h-[5px] w-[5px] rounded-full bg-[#C48C56]" />
                    R1 &mdash; Causal Analysis
                  </div>
                  <h2
                    className="text-[1.5rem] sm:text-[1.8rem] leading-[1.05] tracking-[-0.03em] text-[#F2EFEA] mb-4"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300 }}
                  >
                    Key causal
                    <br />
                    <span className="italic text-[#2F5D50]">insights.</span>
                  </h2>

                  {!submitted ? (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-[14px] text-[#F2EFEA]/40 text-center font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Complete the form and submit to see your analysis.
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 space-y-4 overflow-y-auto">
                      <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[#C48C56] mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          Decision
                        </p>
                        <p className="text-[13px] leading-6 text-[#F2EFEA]/80 font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {form.decisionTitle || "Untitled decision"}
                        </p>
                      </div>

                      <div className="bg-[#2F5D50]/15 border border-[#2F5D50]/20 rounded-lg px-4 py-3">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[#2F5D50] mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          Category Insight
                        </p>
                        <p className="text-[12px] leading-6 text-[#F2EFEA]/70 font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {analysis.categoryAdvice}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[#C48C56] mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          Causal Pathways Identified
                        </p>
                        <div className="space-y-2">
                          {analysis.causalFactors.map((cf, i) => (
                            <div key={i} className="flex gap-2.5">
                              <div className="flex-shrink-0 mt-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#C48C56]" />
                              </div>
                              <p className="text-[12px] leading-6 text-[#F2EFEA]/65 font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                {cf}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          Timing
                        </p>
                        <p className="text-[12px] leading-6 text-[#F2EFEA]/65 font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {analysis.urgencyNote}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </BookPage>

              {/* ====== ANALYSIS PAGE 2: Option Scoring ====== */}
              <BookPage className="bg-[#181512] text-[#F2EFEA] p-0 overflow-hidden">
                <div className="h-full flex flex-col p-7 sm:p-9 overflow-y-auto">
                  <div className="inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-[#8a8178] mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    <span className="inline-block h-[5px] w-[5px] rounded-full bg-[#C48C56]" />
                    R2 &mdash; Option Scoring
                  </div>
                  <h2
                    className="text-[1.5rem] sm:text-[1.8rem] leading-[1.05] tracking-[-0.03em] text-[#F2EFEA] mb-4"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300 }}
                  >
                    Scored options &amp;
                    <br />
                    <span className="italic text-[#C48C56]">risk assessment.</span>
                  </h2>

                  {!submitted ? (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-[14px] text-[#F2EFEA]/40 text-center font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Submit the form to see option scores.
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 space-y-3 overflow-y-auto">
                      {analysis.optionInsights.map((opt, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] uppercase tracking-[0.14em] text-[#C48C56]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                              {opt.label}
                            </p>
                            <span
                              className="text-[18px] font-light text-[#2F5D50]"
                              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                            >
                              {opt.score}
                            </span>
                          </div>
                          <p className="text-[11px] leading-5 text-[#F2EFEA]/60 font-light mb-2 line-clamp-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {opt.value}
                          </p>
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${opt.score}%`,
                                background: opt.score >= 70 ? "#2F5D50" : opt.score >= 50 ? "#C48C56" : "#8a8178",
                              }}
                            />
                          </div>
                        </div>
                      ))}

                      <Separator className="bg-white/10" />

                      <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8178]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            Risk Level
                          </p>
                          <span
                            className={`text-[12px] font-medium px-2 py-0.5 rounded-full ${
                              analysis.riskLevel === "High"
                                ? "bg-red-500/20 text-red-300"
                                : analysis.riskLevel === "Low"
                                ? "bg-[#2F5D50]/20 text-[#2F5D50]"
                                : "bg-[#C48C56]/20 text-[#C48C56]"
                            }`}
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                          >
                            {analysis.riskLevel}
                          </span>
                        </div>
                        <p className="text-[12px] leading-6 text-[#F2EFEA]/65 font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {analysis.riskNote}
                        </p>
                      </div>

                      {analysis.topOption && (
                        <div className="bg-[#2F5D50]/15 border border-[#2F5D50]/25 rounded-lg px-4 py-3">
                          <p className="text-[10px] uppercase tracking-[0.14em] text-[#2F5D50] mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            AI Recommendation
                          </p>
                          <p className="text-[12px] leading-6 text-[#F2EFEA]/80 font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            Based on your priorities and context, <strong className="text-[#2F5D50]">{analysis.topOption.label}</strong> scores
                            highest at {analysis.topOption.score}/100. Consider this as your primary path forward.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </BookPage>

              {/* ====== BACK COVER ====== */}
              <BookPage className="bg-[#181512] text-[#F2EFEA] p-0 overflow-hidden">
                <div className="relative w-full h-full flex flex-col justify-between" style={{ minHeight: "100%" }}>
                  <div className="absolute inset-0 bg-gradient-to-tl from-[#2F5D50]/15 via-[#181512] to-[#181512]" />
                  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

                  <div className="relative z-10 flex flex-col justify-between h-full p-8 sm:p-10">
                    <div>
                      <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[#2F5D50]/60 mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        <span className="inline-block h-[5px] w-[5px] rounded-full bg-[#2F5D50]" />
                        Analysis Complete
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                      <h1
                        className="text-[2.2rem] sm:text-[2.8rem] leading-[0.94] tracking-[-0.04em] text-[#F2EFEA] mb-6"
                        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300 }}
                      >
                        Every great decision
                        <br />
                        starts with a clear
                        <br />
                        <span className="italic text-[#2F5D50]">understanding.</span>
                      </h1>
                      <p className="text-[13px] leading-7 text-[#F2EFEA]/40 max-w-[28ch] font-light" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        Return to refine your inputs anytime.
                        The causal model updates in real time
                        as your understanding evolves.
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-[#F2EFEA]/25 tracking-wide" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        AI Agent Predictor by Lexity
                      </p>
                      <div className="flex items-center gap-1.5">
                        <div className="h-[1px] w-8 bg-[#2F5D50]/30" />
                        <span className="text-[10px] text-[#2F5D50]/50">End</span>
                      </div>
                    </div>
                  </div>
                </div>
              </BookPage>
            </HTMLFlipBook>
          </div>

          {/* Navigation controls */}
          <div className="flex items-center justify-center gap-8 mt-8">
            <button
              onClick={goPrev}
              disabled={currentPage <= 0}
              className="group flex items-center gap-2 text-[12px] text-[#5f5851] hover:text-[#2F5D50] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Previous
            </button>

            <div className="flex items-center gap-3">
              <span
                className="text-[11px] text-[#8a8178] tabular-nums"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {currentPage + 1} / {totalPages}
              </span>
              <div className="w-24 h-[2px] bg-[#d9d1c5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2F5D50] rounded-full transition-all duration-500"
                  style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={goNext}
              disabled={currentPage >= totalPages - 1}
              className="group flex items-center gap-2 text-[12px] text-[#5f5851] hover:text-[#2F5D50] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Next
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <p className="text-[11px] text-[#8a8178]/60 mt-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Fill out each page, then flip to the analysis. Click corners or use buttons to navigate.
          </p>
        </div>
      </div>

      <style jsx global>{`
        .predictor-page-content {
          background: #f4f0e9;
          box-shadow: inset 0 0 30px rgba(0,0,0,0.03);
        }
      `}</style>
    </section>
  );
}
