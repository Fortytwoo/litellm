import { t as translateUi } from "@/i18n";
export type ModelViewType = "groups" | "individual";

const MODEL_VIEW_OPTIONS: readonly { value: ModelViewType; label: string }[] = [
  {
    value: "groups",
    get label() {
      return translateUi("ui.dbff03874de84d83");
    },
  },
  {
    value: "individual",
    get label() {
      return translateUi("ui.f732ed651c49a494");
    },
  },
];

interface ModelViewToggleProps {
  value: ModelViewType;
  onChange: (value: ModelViewType) => void;
}

export default function ModelViewToggle({ value, onChange }: ModelViewToggleProps) {
  return (
    <div className="flex bg-muted rounded-lg p-1">
      {MODEL_VIEW_OPTIONS.map((option) => (
        <button
          key={option.value}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            value === option.value ? "bg-card shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
