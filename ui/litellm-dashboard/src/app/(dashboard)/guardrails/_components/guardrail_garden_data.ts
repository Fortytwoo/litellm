import { t as translateUi } from "@/i18n";
import { Providers, providerLogoMap } from "@/components/provider_info_helpers";
import { guardrailLogoMap } from "./guardrail_info_helpers";

export interface GuardrailCardInfo {
  id: string;
  name: string;
  description: string;
  category: "litellm" | "decision_model" | "partner";
  subcategory?: string;
  logo: string;
  tags: string[];
  eval?: {
    f1: number;
    precision: number;
    recall: number;
    testCases: number;
    latency: string;
  };
  providerKey?: string;
}

const litellmContentFilterLogo = guardrailLogoMap["LiteLLM Content Filter"];

export const LITELLM_CONTENT_FILTER_CARDS: GuardrailCardInfo[] = [
  {
    id: "cf_denied_financial",
    name: "Denied Financial Advice",
    get description() {
      return translateUi("ui.26c2c3d7dacef41b");
    },
    category: "litellm",
    subcategory: "Content Category",
    logo: litellmContentFilterLogo,
    tags: ["Content Category", "Topic Blocker"],
    eval: {
      f1: 100.0,
      precision: 100.0,
      recall: 100.0,
      testCases: 207,
      latency: "<0.1ms",
    },
  },
  {
    id: "cf_denied_insults",
    name: "Insults & Personal Attacks",
    get description() {
      return translateUi("ui.36b516d9f1ff3ab1");
    },
    category: "litellm",
    subcategory: "Content Category",
    logo: litellmContentFilterLogo,
    tags: ["Content Category", "Topic Blocker"],
    eval: {
      f1: 100.0,
      precision: 100.0,
      recall: 100.0,
      testCases: 299,
      latency: "<0.1ms",
    },
  },
  {
    id: "cf_denied_legal",
    name: "Denied Legal Advice",
    get description() {
      return translateUi("ui.02ce385ba94291a8");
    },
    category: "litellm",
    subcategory: "Content Category",
    logo: litellmContentFilterLogo,
    tags: ["Content Category", "Topic Blocker"],
  },
  {
    id: "cf_denied_medical",
    name: "Denied Medical Advice",
    get description() {
      return translateUi("ui.0ed792cd1c7ba162");
    },
    category: "litellm",
    subcategory: "Content Category",
    logo: litellmContentFilterLogo,
    tags: ["Content Category", "Topic Blocker"],
  },
  {
    id: "cf_harmful_violence",
    name: "Harmful Violence",
    get description() {
      return translateUi("ui.83f9595f2731bed3");
    },
    category: "litellm",
    subcategory: "Content Category",
    logo: litellmContentFilterLogo,
    tags: ["Content Category", "Safety"],
  },
  {
    id: "cf_harmful_self_harm",
    name: "Harmful Self-Harm",
    get description() {
      return translateUi("ui.6058fdaf63b52957");
    },
    category: "litellm",
    subcategory: "Content Category",
    logo: litellmContentFilterLogo,
    tags: ["Content Category", "Safety"],
  },
  {
    id: "cf_harmful_child_safety",
    name: "Harmful Child Safety",
    get description() {
      return translateUi("ui.6178ff67a12c84b2");
    },
    category: "litellm",
    subcategory: "Content Category",
    logo: litellmContentFilterLogo,
    tags: ["Content Category", "Safety"],
  },
  {
    id: "cf_harmful_illegal_weapons",
    name: "Harmful Illegal Weapons",
    get description() {
      return translateUi("ui.dd6168b7f385c29b");
    },
    category: "litellm",
    subcategory: "Content Category",
    logo: litellmContentFilterLogo,
    tags: ["Content Category", "Safety"],
  },
  {
    id: "cf_bias_gender",
    name: "Bias: Gender",
    get description() {
      return translateUi("ui.9ef00a0abc2e9462");
    },
    category: "litellm",
    subcategory: "Content Category",
    logo: litellmContentFilterLogo,
    tags: ["Content Category", "Bias"],
  },
  {
    id: "cf_bias_racial",
    name: "Bias: Racial",
    get description() {
      return translateUi("ui.ad331ab67a35397c");
    },
    category: "litellm",
    subcategory: "Content Category",
    logo: litellmContentFilterLogo,
    tags: ["Content Category", "Bias"],
  },
  {
    id: "cf_bias_religious",
    name: "Bias: Religious",
    get description() {
      return translateUi("ui.501c5aa90e307d19");
    },
    category: "litellm",
    subcategory: "Content Category",
    logo: litellmContentFilterLogo,
    tags: ["Content Category", "Bias"],
  },
  {
    id: "cf_bias_sexual_orientation",
    name: "Bias: Sexual Orientation",
    get description() {
      return translateUi("ui.53f23d6b1796c956");
    },
    category: "litellm",
    subcategory: "Content Category",
    logo: litellmContentFilterLogo,
    tags: ["Content Category", "Bias"],
  },
  {
    id: "cf_prompt_injection_jailbreak",
    name: "Prompt Injection: Jailbreak",
    get description() {
      return translateUi("ui.789aef6d9f88013a");
    },
    category: "litellm",
    subcategory: "Content Category",
    logo: litellmContentFilterLogo,
    tags: ["Content Category", "Prompt Injection"],
  },
  {
    id: "cf_prompt_injection_data_exfil",
    name: "Prompt Injection: Data Exfiltration",
    get description() {
      return translateUi("ui.bf8de8d617acd7f5");
    },
    category: "litellm",
    subcategory: "Content Category",
    logo: litellmContentFilterLogo,
    tags: ["Content Category", "Prompt Injection"],
  },
  {
    id: "cf_prompt_injection_sql",
    name: "Prompt Injection: SQL",
    get description() {
      return translateUi("ui.5e12507851417fdc");
    },
    category: "litellm",
    subcategory: "Content Category",
    logo: litellmContentFilterLogo,
    tags: ["Content Category", "Prompt Injection"],
  },
  {
    id: "cf_prompt_injection_malicious_code",
    name: "Prompt Injection: Malicious Code",
    get description() {
      return translateUi("ui.1aee6e41035b2e59");
    },
    category: "litellm",
    subcategory: "Content Category",
    logo: litellmContentFilterLogo,
    tags: ["Content Category", "Prompt Injection"],
  },
  {
    id: "cf_prompt_injection_system_prompt",
    name: "Prompt Injection: System Prompt",
    get description() {
      return translateUi("ui.897b2f0ac2d114dd");
    },
    category: "litellm",
    subcategory: "Content Category",
    logo: litellmContentFilterLogo,
    tags: ["Content Category", "Prompt Injection"],
  },
  {
    id: "cf_toxic_abuse",
    name: "Toxic & Abusive Language",
    get description() {
      return translateUi("ui.f240a22eb784798a");
    },
    category: "litellm",
    subcategory: "Content Category",
    logo: litellmContentFilterLogo,
    tags: ["Content Category", "Toxicity"],
  },
  {
    id: "cf_patterns",
    name: "Pattern Matching",
    get description() {
      return translateUi("ui.b58e5b1ae70c5495");
    },
    category: "litellm",
    subcategory: "Patterns",
    logo: litellmContentFilterLogo,
    tags: ["PII", "Regex", "Data Protection"],
  },
  {
    id: "cf_keywords",
    name: "Keyword Blocking",
    get description() {
      return translateUi("ui.6e4c32e89eda8233");
    },
    category: "litellm",
    subcategory: "Keywords",
    logo: litellmContentFilterLogo,
    tags: ["Keywords", "Blocklist"],
  },
  {
    id: "block_code_execution",
    name: "Block Code Execution",
    get description() {
      return translateUi("ui.200714d23df28c07");
    },
    category: "litellm",
    subcategory: "Code Safety",
    logo: litellmContentFilterLogo,
    tags: ["Code", "Safety", "Prompt Injection"],
  },
  {
    id: "cf_competitor_intent",
    name: "Competitor Name Blocking",
    get description() {
      return translateUi("ui.4067f119b7d25a5a");
    },
    category: "litellm",
    subcategory: "Content Category",
    logo: litellmContentFilterLogo,
    tags: ["Content Category", "Competitor", "Topic Blocker"],
  },
];

export const DECISION_MODEL_CARDS: GuardrailCardInfo[] = [
  {
    id: "dm_typesafe_jev",
    name: "TypeSafe Jev",
    get description() {
      return translateUi("ui.5ba39f89f939663f");
    },
    category: "decision_model",
    logo: providerLogoMap[Providers.TypeSafe] ?? "",
    tags: ["Decision Model", "TypeSafe", "Prompt Injection"],
    providerKey: "DecisionModel",
  },
  {
    id: "dm_perplexity",
    name: "Perplexity Decision",
    get description() {
      return translateUi("ui.a817d16998274a85");
    },
    category: "decision_model",
    logo: providerLogoMap[Providers.Perplexity] ?? "",
    tags: ["Decision Model", "Perplexity"],
    providerKey: "DecisionModel",
  },
  {
    id: "dm_microsoft",
    name: "Microsoft Decision Model",
    get description() {
      return translateUi("ui.da789f858bfc7ea6");
    },
    category: "decision_model",
    logo: providerLogoMap[Providers.Azure_AI_Studio] ?? "",
    tags: ["Decision Model", "Microsoft"],
    providerKey: "DecisionModel",
  },
  {
    id: "dm_openai",
    name: "OpenAI Decision Model",
    get description() {
      return translateUi("ui.a60d9d737e2dbb0a");
    },
    category: "decision_model",
    logo: providerLogoMap[Providers.OpenAI] ?? "",
    tags: ["Decision Model", "OpenAI"],
    providerKey: "DecisionModel",
  },
  {
    id: "dm_databricks",
    name: "Databricks Decision Model",
    get description() {
      return translateUi("ui.f92e2681560cda81");
    },
    category: "decision_model",
    logo: providerLogoMap[Providers.Databricks] ?? "",
    tags: ["Decision Model", "Databricks"],
    providerKey: "DecisionModel",
  },
];

export const PARTNER_GUARDRAIL_CARDS: GuardrailCardInfo[] = [
  {
    id: "presidio",
    name: "Presidio PII",
    get description() {
      return translateUi("ui.d005ba961277c5e0");
    },
    category: "partner",
    logo: guardrailLogoMap["Presidio PII"],
    tags: ["PII", "Microsoft"],
    providerKey: "PresidioPII",
  },
  {
    id: "bedrock",
    name: "Bedrock Guardrail",
    get description() {
      return translateUi("ui.4481032f1fc827a7");
    },
    category: "partner",
    logo: guardrailLogoMap["Bedrock Guardrail"],
    tags: ["AWS", "Content Safety"],
    providerKey: "Bedrock",
  },
  {
    id: "lakera",
    name: "Lakera",
    get description() {
      return translateUi("ui.c4a2c7d1e7dd5bbd");
    },
    category: "partner",
    logo: guardrailLogoMap["Lakera"],
    tags: ["Security", "Prompt Injection"],
    providerKey: "Lakera",
  },
  {
    id: "openai_moderation",
    name: "OpenAI Moderation",
    get description() {
      return translateUi("ui.411b3534c40bb079");
    },
    category: "partner",
    logo: guardrailLogoMap["OpenAI Moderation"],
    tags: ["Content Moderation", "OpenAI"],
  },
  {
    id: "google_model_armor",
    name: "Google Cloud Model Armor",
    get description() {
      return translateUi("ui.057ff62b8b5c0297");
    },
    category: "partner",
    logo: guardrailLogoMap["Google Cloud Model Armor"],
    tags: ["Google Cloud", "Safety"],
  },
  {
    id: "guardrails_ai",
    name: "Guardrails AI",
    get description() {
      return translateUi("ui.354c68206342dd11");
    },
    category: "partner",
    logo: guardrailLogoMap["Guardrails AI"],
    tags: ["Open Source", "Validation"],
  },
  {
    id: "zscaler",
    name: "Zscaler AI Guard",
    get description() {
      return translateUi("ui.928ef14040b7576e");
    },
    category: "partner",
    logo: guardrailLogoMap["Zscaler AI Guard"],
    tags: ["Enterprise", "Security"],
  },
  {
    id: "panw",
    name: "PANW Prisma AIRS",
    get description() {
      return translateUi("ui.7437cf70415877f1");
    },
    category: "partner",
    logo: guardrailLogoMap["PANW Prisma AIRS"],
    tags: ["Enterprise", "Security"],
  },
  {
    id: "cisco_ai_defense",
    name: "Cisco AI Defense",
    get description() {
      return translateUi("ui.84363c469371e7e8");
    },
    category: "partner",
    logo: guardrailLogoMap["Cisco AI Defense"],
    tags: ["Enterprise", "Security", "Prompt Injection", "PII"],
    providerKey: "CiscoAiDefense",
  },
  {
    id: "noma",
    name: "Noma Security",
    get description() {
      return translateUi("ui.3536a4fedec96385");
    },
    category: "partner",
    logo: guardrailLogoMap["Noma Security"],
    tags: ["Security", "Threat Detection"],
  },
  {
    id: "aporia",
    name: "Aporia AI",
    get description() {
      return translateUi("ui.1e65bf4d4872b5cf");
    },
    category: "partner",
    logo: guardrailLogoMap["Aporia AI"],
    tags: ["Hallucination", "Policy"],
  },
  {
    id: "aim",
    name: "AIM Guardrail",
    get description() {
      return translateUi("ui.739ab6d32b52a597");
    },
    category: "partner",
    logo: guardrailLogoMap["AIM Guardrail"],
    tags: ["Security", "Threat Detection"],
  },
  {
    id: "cato_networks",
    name: "Cato Networks Guardrail",
    get description() {
      return translateUi("ui.de91c7cc59ec0b01");
    },
    category: "partner",
    logo: guardrailLogoMap["Cato Networks Guardrail"],
    tags: ["Security", "Threat Detection"],
  },
  {
    id: "prompt_security",
    name: "Prompt Security",
    get description() {
      return translateUi("ui.afb89584f8923e0a");
    },
    category: "partner",
    logo: guardrailLogoMap["Prompt Security"],
    tags: ["Prompt Injection", "Security"],
  },
  {
    id: "lasso",
    name: "Lasso Guardrail",
    get description() {
      return translateUi("ui.2b9c8ff39c747a56");
    },
    category: "partner",
    logo: guardrailLogoMap["Lasso Guardrail"],
    tags: ["Content Moderation"],
  },
  {
    id: "pangea",
    name: "Pangea Guardrail",
    get description() {
      return translateUi("ui.f7b03355f9c544ed");
    },
    category: "partner",
    logo: guardrailLogoMap["Pangea Guardrail"],
    tags: ["Compliance", "Security"],
  },
  {
    id: "enkryptai",
    name: "EnkryptAI",
    get description() {
      return translateUi("ui.36a3cf2bfb18a1b7");
    },
    category: "partner",
    logo: guardrailLogoMap["EnkryptAI"],
    tags: ["Enterprise", "Governance"],
  },
  {
    id: "javelin",
    name: "Javelin Guardrails",
    get description() {
      return translateUi("ui.9b3c7ff5d0e43df4");
    },
    category: "partner",
    logo: guardrailLogoMap["Javelin Guardrails"],
    tags: ["Gateway", "Security"],
  },
  {
    id: "pillar",
    name: "Pillar Guardrail",
    get description() {
      return translateUi("ui.6e1d611004bbef6b");
    },
    category: "partner",
    logo: guardrailLogoMap["Pillar Guardrail"],
    tags: ["Monitoring", "Safety"],
  },
  {
    id: "akto",
    name: "Akto Guardrail",
    get description() {
      return translateUi("ui.7f0bbea5ac457e9b");
    },
    category: "partner",
    logo: guardrailLogoMap["Akto"],
    tags: ["Security", "Safety", "Monitoring"],
  },
  {
    id: "promptguard",
    name: "PromptGuard",
    get description() {
      return translateUi("ui.3ea8e780413baea4");
    },
    category: "partner",
    logo: guardrailLogoMap["PromptGuard"],
    tags: ["Security", "Prompt Injection", "PII"],
    providerKey: "Promptguard",
    eval: {
      f1: 94.9,
      precision: 100.0,
      recall: 90.4,
      testCases: 5384,
      latency: "~150ms",
    },
  },
  {
    id: "xecguard",
    name: "XecGuard",
    get description() {
      return translateUi("ui.f0e40d83ee0444b1");
    },
    category: "partner",
    logo: guardrailLogoMap["XecGuard"],
    tags: ["Security", "Policy", "Grounding", "RAG"],
    providerKey: "Xecguard",
  },
  {
    id: "deepkeep",
    name: "DeepKeep AI Firewall",
    get description() {
      return translateUi("ui.f9edb2078b1c9ab5");
    },
    category: "partner",
    logo: guardrailLogoMap["DeepKeep AI Firewall"],
    tags: ["Security", "Prompt Injection", "PII", "Firewall"],
    providerKey: "Deepkeep",
  },
  {
    id: "repelloai",
    name: "RepelloAI Argus",
    get description() {
      return translateUi("ui.a614644e2e96db0e");
    },
    category: "partner",
    logo: guardrailLogoMap["RepelloAI Argus"],
    tags: ["Security", "Policy", "Prompt Injection"],
    providerKey: "Repelloai",
  },
  {
    id: "straiker",
    name: "Straiker",
    get description() {
      return translateUi("ui.5f4a047a69654b21");
    },
    category: "partner",
    logo: guardrailLogoMap["Straiker"],
    tags: ["Agentic", "Prompt Injection", "Tool Misuse", "MCP", "Skills"],
    providerKey: "Straiker",
  },
  {
    id: "alice",
    name: "Alice",
    get description() {
      return translateUi("ui.ede30447d7e346ba");
    },
    category: "partner",
    logo: guardrailLogoMap["Alice"],
    tags: ["Content Moderation", "Prompt Injection", "PII", "Policy"],
    providerKey: "Alice",
  },
  {
    id: "agent_365",
    name: "Microsoft Agent 365",
    get description() {
      return translateUi("ui.3812c87905bd9e69");
    },
    category: "partner",
    logo: guardrailLogoMap["Microsoft Agent 365"],
    tags: ["Agentic", "MCP", "Tool Misuse", "Observability"],
    providerKey: "Agent365",
  },
  {
    id: "llm_shield_proxy",
    name: "LLM Shield Proxy",
    get description() {
      return translateUi("ui.b75e48b1057f56f9");
    },
    category: "partner",
    logo: guardrailLogoMap["LLM Shield Proxy"],
    tags: ["PII", "Data Privacy", "Compliance", "Streaming"],
    providerKey: "LLM Shield Proxy",
  },
  {
    id: "conduct",
    name: "Conduct Guard",
    get description() {
      return translateUi("ui.656cb7120eed9e75");
    },
    category: "partner",
    logo: guardrailLogoMap["Conduct Guard"],
    tags: ["Security", "Prompt Injection", "PII", "Policy"],
    providerKey: "Conduct",
  },
];

export const ALL_CARDS = [...LITELLM_CONTENT_FILTER_CARDS, ...DECISION_MODEL_CARDS, ...PARTNER_GUARDRAIL_CARDS];
