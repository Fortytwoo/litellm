"use client";
import { translateText } from "@/i18n";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { GuardrailCardInfo, ALL_CARDS } from "./guardrail_garden_data";
import GuardrailCard from "./guardrail_garden_card";
import GuardrailDetailView from "./guardrail_garden_detail";

interface GuardrailGardenProps {
  accessToken: string | null;
  onGuardrailCreated: () => void;
}

const GuardrailGarden: React.FC<GuardrailGardenProps> = ({ accessToken, onGuardrailCreated }) => {
  const { t: uiT } = useDashboardLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState<GuardrailCardInfo | null>(null);
  const [showAllLitellm, setShowAllLitellm] = useState(false);
  const CARDS_PER_ROW = 5;
  const VISIBLE_ROWS = 2;

  const filteredCards = ALL_CARDS.filter((card) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchesName = card.name.toLowerCase().includes(q) || translateText(card.name).toLowerCase().includes(q);
    return (
      matchesName || card.description.toLowerCase().includes(q) || card.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const litellmCards = filteredCards.filter((c) => c.category === "litellm");
  const decisionModelCards = filteredCards.filter((c) => c.category === "decision_model");
  const partnerCards = filteredCards.filter((c) => c.category === "partner");

  if (selectedCard) {
    return (
      <GuardrailDetailView
        card={selectedCard}
        onBack={() => setSelectedCard(null)}
        accessToken={accessToken}
        onGuardrailCreated={onGuardrailCreated}
      />
    );
  }

  return (
    <div>
      <div className="mb-6">
        <InputGroup>
          <InputGroupAddon>
            <Search className="size-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder={uiT("ui.26c8ec48ebcd0322")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
      </div>

      <section className="mb-10" aria-labelledby="guardrail-garden-litellm">
        <div className="mb-1 flex items-center justify-between">
          <h2 id="guardrail-garden-litellm" className="m-0 text-xl font-semibold text-foreground">
            {uiT("ui.40374e449c5c1646")}
          </h2>
          <span
            className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-primary"
            onClick={() => setShowAllLitellm(!showAllLitellm)}
          >
            {showAllLitellm ? (
              <>{uiT("ui.94ea9b1d33a0")}</>
            ) : (
              <>
                <ArrowRight className="size-3" />
                {uiT("ui.ca352b1834121400", { v0: String(litellmCards.length) })}
              </>
            )}
          </span>
        </div>
        <p className="mt-1 mb-5 text-[13px] text-muted-foreground">{uiT("ui.a4d97e763e13a78d")}</p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {(showAllLitellm ? litellmCards : litellmCards.slice(0, CARDS_PER_ROW * VISIBLE_ROWS)).map((card) => (
            <GuardrailCard key={card.id} card={card} onClick={() => setSelectedCard(card)} />
          ))}
        </div>
      </section>

      <section className="mb-10" aria-labelledby="guardrail-garden-decision-model">
        <h2 id="guardrail-garden-decision-model" className="mt-0 mb-1 text-xl font-semibold text-foreground">
          {uiT("ui.9aa9d2dad8ea2a17")}
        </h2>
        <p className="mt-1 mb-5 text-[13px] text-muted-foreground">{uiT("ui.54357c0090e6de19")}</p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {decisionModelCards.map((card) => (
            <GuardrailCard key={card.id} card={card} onClick={() => setSelectedCard(card)} />
          ))}
        </div>
      </section>

      <section className="mb-10" aria-labelledby="guardrail-garden-partner">
        <h2 id="guardrail-garden-partner" className="mt-0 mb-1 text-xl font-semibold text-foreground">
          {uiT("ui.5dfaeea31cca1fd6")}
        </h2>
        <p className="mt-1 mb-5 text-[13px] text-muted-foreground">{uiT("ui.c8a77059a6ab5805")}</p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {partnerCards.map((card) => (
            <GuardrailCard key={card.id} card={card} onClick={() => setSelectedCard(card)} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default GuardrailGarden;
