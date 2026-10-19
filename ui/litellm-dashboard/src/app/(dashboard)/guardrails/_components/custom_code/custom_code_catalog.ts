import { t as translateUi } from "@/i18n";
export const CODE_TEMPLATES = {
  empty: {
    name: "Empty Template",
    code: `async def apply_guardrail(inputs, request_data, input_type):
    # inputs: {texts, images, tools, tool_calls, structured_messages, model}
    # request_data: {model, user_id, team_id, end_user_id, metadata}
    # input_type: "request" or "response"
    return allow()`,
  },
  blockSSN: {
    name: "Block SSN",
    code: `def apply_guardrail(inputs, request_data, input_type):
    for text in inputs["texts"]:
        if regex_match(text, r"\\d{3}-\\d{2}-\\d{4}"):
            return block("SSN detected")
    return allow()`,
  },
  redactEmail: {
    name: "Redact Emails",
    code: `def apply_guardrail(inputs, request_data, input_type):
    pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
    modified = []
    for text in inputs["texts"]:
        modified.append(regex_replace(text, pattern, "[EMAIL REDACTED]"))
    return modify(texts=modified)`,
  },
  blockSQL: {
    name: "Block SQL Injection",
    code: `def apply_guardrail(inputs, request_data, input_type):
    if input_type != "request":
        return allow()
    for text in inputs["texts"]:
        if contains_code_language(text, ["sql"]):
            return block("SQL code not allowed")
    return allow()`,
  },
  validateJSON: {
    name: "Validate JSON",
    code: `def apply_guardrail(inputs, request_data, input_type):
    if input_type != "response":
        return allow()
    
    schema = {"type": "object", "required": ["name", "value"]}
    
    for text in inputs["texts"]:
        obj = json_parse(text)
        if obj is None:
            return block("Invalid JSON response")
        if not json_schema_valid(obj, schema):
            return block("Response missing required fields")
    return allow()`,
  },
  externalAPI: {
    name: "External API Check (async)",
    code: `async def apply_guardrail(inputs, request_data, input_type):
    # Call an external moderation API (async for non-blocking)
    for text in inputs["texts"]:
        response = await http_post(
            "https://api.example.com/moderate",
            body={"text": text, "user_id": request_data["user_id"]},
            headers={"Authorization": "Bearer YOUR_API_KEY"},
            timeout=10
        )
        
        if not response["success"]:
            # API call failed, allow by default or block
            return allow()
        
        if response["body"].get("flagged"):
            return block(response["body"].get("reason", "Content flagged"))
    
    return allow()`,
  },
};

export const PRIMITIVES = {
  "Return Values": [
    { name: "allow()", desc: "Let request/response through" },
    { name: "block(reason)", desc: "Reject with message" },
    { name: "flag(reason, metadata={})", desc: "Let through, record a non-blocking violation" },
    { name: "modify(texts=[], images=[], tool_calls=[])", desc: "Transform content" },
  ],
  "HTTP Requests (async)": [
    { name: "await http_request(url, method, headers, body)", desc: "Make async HTTP request" },
    { name: "await http_get(url, headers)", desc: "Async GET request" },
    { name: "await http_post(url, body, headers)", desc: "Async POST request" },
  ],
  "Regex Functions": [
    { name: "regex_match(text, pattern)", desc: "Returns True if pattern found" },
    { name: "regex_replace(text, pattern, replacement)", desc: "Replace all matches" },
    { name: "regex_find_all(text, pattern)", desc: "Return list of matches" },
  ],
  "JSON Functions": [
    { name: "json_parse(text)", desc: "Parse JSON string, returns None on error" },
    { name: "json_stringify(obj)", desc: "Convert to JSON string" },
    { name: "json_schema_valid(obj, schema)", desc: "Validate against JSON schema" },
  ],
  "URL Functions": [
    { name: "extract_urls(text)", desc: "Extract all URLs from text" },
    { name: "is_valid_url(url)", desc: "Check if URL is valid" },
    { name: "all_urls_valid(text)", desc: "Check all URLs in text are valid" },
  ],
  "Code Detection": [
    { name: "detect_code(text)", desc: "Returns True if code detected" },
    { name: "detect_code_languages(text)", desc: "Returns list of detected languages" },
    { name: 'contains_code_language(text, ["sql"])', desc: "Check for specific languages" },
  ],
  "Text Utilities": [
    { name: "contains(text, substring)", desc: "Check if substring exists" },
    { name: "contains_any(text, [substr1, substr2])", desc: "Check if any substring exists" },
    { name: "word_count(text)", desc: "Count words" },
    { name: "char_count(text)", desc: "Count characters" },
    { name: "lower(text) / upper(text) / trim(text)", desc: "String transforms" },
  ],
};

export const MODE_OPTIONS = [
  {
    value: "pre_call",
    get label() {
      return translateUi("ui.80c0d24848c165f7");
    },
  },
  {
    value: "post_call",
    get label() {
      return translateUi("ui.19aae42ce4b3e791");
    },
  },
  {
    value: "during_call",
    get label() {
      return translateUi("ui.c9d3d15259daa54a");
    },
  },
  { value: "logging_only", label: "logging_only" },
  {
    value: "pre_mcp_call",
    get label() {
      return translateUi("ui.c9f3b56997704941");
    },
  },
  {
    value: "post_mcp_call",
    get label() {
      return translateUi("ui.2b1b422337384fa0");
    },
  },
  {
    value: "during_mcp_call",
    get label() {
      return translateUi("ui.ebe196e2ab42d013");
    },
  },
];

export const TEMPLATE_ITEMS = Object.entries(CODE_TEMPLATES).map(([key, template]) => ({
  value: key,
  get label() {
    return template.name;
  },
}));

export type ModeOption = (typeof MODE_OPTIONS)[number];

export const MODE_OPTION_BY_VALUE: Record<string, ModeOption> = Object.fromEntries(
  MODE_OPTIONS.map((option) => [option.value, option]),
);
