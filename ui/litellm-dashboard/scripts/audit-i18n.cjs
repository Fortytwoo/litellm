const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const cp = require("node:child_process");

const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2).filter((arg) => arg !== "--check");
const reference = args[1];
const locales = Object.fromEntries(
  ["en", "zh"].map((locale) => [
    locale,
    JSON.parse(
      reference
        ? cp.execFileSync("git", ["show", reference + ":ui/litellm-dashboard/src/i18n/locales/" + locale + ".json"], {
            cwd: root,
            encoding: "utf8",
          })
        : fs.readFileSync(path.join(root, "src/i18n/locales", locale + ".json"), "utf8"),
    ),
  ]),
);
const flatten = (object, prefix = "") =>
  Object.entries(object).flatMap(([key, value]) =>
    typeof value === "string" ? [[prefix + key, value]] : flatten(value, prefix + key + "."),
  );
const english = Object.fromEntries(flatten(locales.en));
const chinese = Object.fromEntries(flatten(locales.zh));
const attributes = new Set([
  "label",
  "title",
  "description",
  "placeholder",
  "searchPlaceholder",
  "header",
  "ui_label",
  "okText",
  "cancelText",
  "tooltip",
  "emptyText",
  "aria-label",
  "message",
  "hint",
  "info",
  "subtitle",
  "helperText",
  "emptyDescription",
  "validationMessage",
  "error",
  "children",
  "alt",
  "aria-description",
  "caption",
  "subLabel",
  "emptyMessage",
  "loadingText",
  "errorMessage",
  "noOptionsText",
  "helpText",
  "successMessage",
  "buttonText",
  "confirmText",
  "buttonLabel",
  "text",
  "subtext",
  "noDataMessage",
  "loadingMessage",
  "totalLabel",
  "footnote",
  "triggerLabel",
  "buttonTitle",
  "emptyStateText",
  "emptyStateDescription",
  "emptyStateTitle",
  "errorText",
  "successText",
  "headerTitle",
  "headerDescription",
]);
const changed = reference
  ? new Set(
      cp.execFileSync("git", ["diff", "--name-only", reference], { cwd: root, encoding: "utf8" }).trim().split("\n"),
    )
  : new Set();
const retained =
  /^(?:API|JSON|LLM|MCP|SDK|SSO|OAuth|OIDC|URL|ID|JWT|HTTP|HTTPS|SQL|S3|Redis|OpenAI|Anthropic|LiteLLM|English|Token|Tokens|TTFT|TPM|RPM|UTC|OK|N\/A|GitHub|Slack|Langfuse|Datadog|Prometheus|Grafana|Lens|PostgreSQL|Bedrock|Azure|Google|Vertex AI|AWS|GCP|Azure OpenAI|Amazon Bedrock|Ctrl K)$/i;
const human = (text) =>
  (/[a-zA-Z]{2}/.test(text) || /\be\.g\./i.test(text)) &&
  !retained.test(text) &&
  !/^(?:https?:\/\/|\/[\w/]|[a-z]+[-_]\w+$)/.test(text);
const candidates = [];
const translated = [];
const exceptionFile = path.join(root, "src/i18n/sourceExceptions.json");
const exceptions = !reference && fs.existsSync(exceptionFile) ? JSON.parse(fs.readFileSync(exceptionFile, "utf8")) : [];
const scopeFor = (node, ast) => {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (
      (ts.isVariableDeclaration(parent) || ts.isFunctionDeclaration(parent) || ts.isMethodDeclaration(parent)) &&
      parent.name
    )
      return parent.name.getText(ast);
  }
  return "module";
};
function* files(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* files(file);
    else if (
      /\.tsx?$/.test(file) &&
      !/(?:\.test[.-]|\.spec\.|\.cases\.|\.d\.ts$|__tests__|__mocks__|__fixtures__|[\\/]i18n[\\/])/.test(file)
    )
      yield file;
  }
}
for (const file of files(path.join(root, "src"))) {
  const repoPath = "ui/litellm-dashboard/" + path.relative(root, file).replaceAll("\\", "/");
  const source = changed.has(repoPath)
    ? cp.execFileSync("git", ["show", reference + ":" + repoPath], { cwd: root, encoding: "utf8" })
    : fs.readFileSync(file, "utf8");
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const relative = path.relative(root, file).replaceAll("\\", "/");
  const managedTranslators = new Set();
  function findManagedTranslators(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      node.initializer.expression.getText(ast) === "useCopy"
    )
      managedTranslators.add(node.name.text);
    ts.forEachChild(node, findManagedTranslators);
  }
  findManagedTranslators(ast);
  const record = (node, text, kind) => ({
    file: relative,
    start: node.getStart(ast),
    end: node.end,
    line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1,
    text,
    kind,
    scope: scopeFor(node, ast),
  });
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      /^(?:t|uiT|translateUi|translateText|gatewayText)$/.test(node.expression.getText(ast)) &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    )
      translated.push(
        record(
          node,
          (managedTranslators.has(node.expression.getText(ast)) || node.expression.getText(ast) === "gatewayText"
            ? "managed."
            : "") + node.arguments[0].text,
          node.expression.getText(ast) === "translateText" ? "display-lookup" : "translation",
        ),
      );
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(ast) === "LocalizedText")
      translated.push(record(node, node.getText(ast), "translation"));
    if (
      ts.isJsxText(node) ||
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateExpression(node)
    ) {
      const text = ts.isJsxText(node)
        ? node.getText(ast).replace(/\s+/g, " ").trim()
        : ts.isTemplateExpression(node)
          ? node.getText(ast)
          : node.text;
      let visible = ts.isJsxText(node);
      for (let child = node, parent = node.parent; parent && !visible; child = parent, parent = parent.parent) {
        if (ts.isJsxAttribute(parent)) {
          visible =
            attributes.has(parent.name.getText(ast)) ||
            ["content", "body", "detail"].includes(parent.name.getText(ast));
          break;
        }
        if (ts.isPropertyAssignment(parent)) {
          visible = attributes.has(parent.name.getText(ast).replace(/["']/g, ""));
          break;
        }
        if (ts.isJsxExpression(parent)) {
          visible =
            !ts.isJsxAttribute(parent.parent) ||
            attributes.has(parent.parent.name.getText(ast)) ||
            ["content", "body", "detail"].includes(parent.parent.name.getText(ast));
          break;
        }
        if (ts.isCallExpression(parent)) {
          visible =
            /(?:toast|notification|message|NotificationManager)\.(?:error|success|warning|warn|info|loading)|^(?:toast|alert|confirm)$/.test(
              parent.expression.getText(ast),
            );
          break;
        }
        if (
          (ts.isConditionalExpression(parent) && parent.condition !== child) ||
          ts.isParenthesizedExpression(parent) ||
          ts.isArrayLiteralExpression(parent) ||
          (ts.isBinaryExpression(parent) &&
            parent.left !== child &&
            [ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.PlusToken].includes(
              parent.operatorToken.kind,
            ))
        )
          continue;
        break;
      }
      const prose = ts.isTemplateExpression(node)
        ? node.head.text + node.templateSpans.map((span) => span.literal.text).join("")
        : text;
      const inRawBlock = (function blocked(parent) {
        if (!parent) return false;
        if (ts.isJsxElement(parent) && ["pre", "code"].includes(parent.openingElement.tagName.getText(ast)))
          return true;
        return blocked(parent.parent);
      })(node.parent);
      if (visible && human(prose) && !inRawBlock && !/^ui\.[a-f0-9]+$/.test(text))
        candidates.push(record(node, text, ts.isTemplateExpression(node) ? "dynamic" : "literal"));
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
}
const groups = {};
const group = (file) =>
  file.includes("/logs/")
    ? "audit"
    : file.includes("/users/") || /user_(?:edit|info)|user_dashboard/.test(file)
      ? "users"
      : file.includes("/chat/") || file.includes("/lens/")
        ? "chat-and-lens"
        : file.includes("/ui/") || file.includes("/shared/") || /leftnav|NavigationItems|navbar/.test(file)
          ? "shared"
          : "other-admin";
for (const [items, field] of [
  [translated, "translated_sites"],
  [candidates, "english_candidates"],
])
  for (const item of items) {
    const name = group(item.file);
    groups[name] ??= { translated_sites: 0, english_candidates: 0 };
    groups[name][field]++;
  }
const report = {
  definition:
    "AST heuristic over JSX text, display properties, direct conditional display values and notifications. Candidates require human review; excludes raw code blocks, tests, API values and selected technical terms. This is source coverage, not full runtime translation coverage.",
  dictionary: {
    english: Object.keys(english).length,
    chinese: Object.keys(chinese).length,
    missing_chinese: Object.keys(english).filter(
      (key) => chinese[key] === undefined || (chinese[key] === "" && !key.startsWith("inflections.")),
    ),
    extra_chinese: Object.keys(chinese).filter((key) => !english[key]),
    unchanged: Object.entries(english)
      .filter(([key, value]) => chinese[key] === value)
      .map(([key, text]) => ({ key, text })),
    placeholder_mismatches: Object.entries(english)
      .filter(
        ([key, value]) =>
          JSON.stringify((value.match(/\{\{\w+\}\}/g) || []).sort()) !==
          JSON.stringify((chinese[key]?.match(/\{\{\w+\}\}/g) || []).sort()),
      )
      .map(([key]) => key),
  },
  translated_sites: translated.length,
  missing_referenced_keys: [
    ...new Set(
      translated
        .filter((site) => site.kind === "translation" && !site.text.startsWith("<") && !english[site.text])
        .map((site) => site.text),
    ),
  ],
  english_candidates: candidates.length,
  reviewed_exceptions: candidates.filter((item) =>
    exceptions.some((entry) => entry.file === item.file && entry.text === item.text && entry.scope === item.scope),
  ),
  untranslated_candidates: candidates.filter(
    (item) =>
      !exceptions.some((entry) => entry.file === item.file && entry.text === item.text && entry.scope === item.scope),
  ),
  stale_exceptions: exceptions.filter(
    (entry) =>
      !candidates.some((item) => entry.file === item.file && entry.text === item.text && entry.scope === item.scope),
  ),
  groups,
  candidates,
};
const output = args[0];
if (output) fs.writeFileSync(output, JSON.stringify(report, null, 2));
console.log(
  JSON.stringify(
    {
      ...report,
      dictionary: { ...report.dictionary, unchanged: report.dictionary.unchanged.length },
      candidates: undefined,
      reviewed_exceptions: report.reviewed_exceptions.length,
    },
    null,
    2,
  ),
);
if (
  process.argv.includes("--check") &&
  (report.dictionary.missing_chinese.length ||
    report.dictionary.extra_chinese.length ||
    report.dictionary.placeholder_mismatches.length ||
    report.missing_referenced_keys.length ||
    report.untranslated_candidates.length ||
    report.stale_exceptions.length)
)
  process.exitCode = 1;
