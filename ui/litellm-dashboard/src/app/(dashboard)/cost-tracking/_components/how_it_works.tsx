"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useState, useMemo } from "react";
import CodeBlock from "@/components/CodeBlock";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const HowItWorks: React.FC = () => {
  const { t: uiT } = useDashboardLanguage();

  const [responseCost, setResponseCost] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");

  const calculatedDiscount = useMemo(() => {
    const cost = parseFloat(responseCost);
    const discount = parseFloat(discountAmount);
    const hasInvalidCost = isNaN(cost) || cost === 0;
    const hasInvalidDiscount = isNaN(discount) || discount === 0;

    if (hasInvalidCost || hasInvalidDiscount) {
      return null;
    }

    const originalCost = cost + discount;
    const discountPercentage = (discount / originalCost) * 100;

    return {
      originalCost: originalCost.toFixed(10),
      finalCost: cost.toFixed(10),
      discountAmount: discount.toFixed(10),
      discountPercentage: discountPercentage.toFixed(2),
    };
  }, [responseCost, discountAmount]);

  return (
    <div className="space-y-4 pt-2">
      <div>
        <h3 className="mb-1 text-sm font-medium text-foreground">{uiT("ui.1b8193c412c1831a")}</h3>
        <p className="text-xs text-muted-foreground">
          {uiT("ui.2762fc8efd02e18c")}{" "}
          <code className="rounded-sm bg-muted px-1.5 py-0.5 text-xs text-foreground">
            final_cost = base_cost × (1 - discount%/100)
          </code>
        </p>
      </div>
      <div>
        <h3 className="mb-1 text-sm font-medium text-foreground">{uiT("ui.d029f87e3d80f8fd")}</h3>
        <p className="text-xs text-muted-foreground">{uiT("ui.e2246bcf57b6b5a8")}</p>
      </div>
      <div>
        <h3 className="mb-1 text-sm font-medium text-foreground">{uiT("ui.3a8b926247c4df13")}</h3>
        <p className="text-xs text-muted-foreground">{uiT("ui.69de7298ab6756d6")}</p>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="mb-2 text-sm font-medium text-foreground">{uiT("ui.1cb9204b28905dfb")}</h3>
        <p className="mb-3 text-xs text-muted-foreground">{uiT("ui.56ca5bf10e2fb2a7")}</p>
        <CodeBlock
          language="bash"
          code={`curl -X POST -i http://your-proxy:4000/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <your-master-key>" \\
  -d '{
    "model": "gemini/gemini-2.5-pro",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`}
        />
        <p className="mb-2 mt-3 text-xs text-muted-foreground">{uiT("ui.a8e32266318e04d0")}</p>
        <div className="space-y-1.5">
          <div className="flex items-start gap-3">
            <code className="whitespace-nowrap rounded-sm bg-muted px-2 py-1 font-mono text-xs text-foreground">
              x-litellm-response-cost
            </code>
            <p className="text-xs text-muted-foreground">{uiT("ui.d879cb1d5bcaed10")}</p>
          </div>
          <div className="flex items-start gap-3">
            <code className="whitespace-nowrap rounded-sm bg-muted px-2 py-1 font-mono text-xs text-foreground">
              x-litellm-response-cost-original
            </code>
            <p className="text-xs text-muted-foreground">{uiT("ui.396c21c3fe7c962b")}</p>
          </div>
          <div className="flex items-start gap-3">
            <code className="whitespace-nowrap rounded-sm bg-muted px-2 py-1 font-mono text-xs text-foreground">
              x-litellm-response-cost-discount-amount
            </code>
            <p className="text-xs text-muted-foreground">{uiT("ui.3acab0ea13feeb8a")}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="mb-3 text-sm font-medium text-foreground">{uiT("ui.0c0a63cf23ba22d1")}</h3>
        <p className="mb-3 text-xs text-muted-foreground">{uiT("ui.12586697e0a08621")}</p>
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="response-cost" className="mb-1 block text-xs">
              {uiT("ui.598fa4a9dbda4eb8")}
            </Label>
            <Input
              id="response-cost"
              placeholder="0.0171938125"
              value={responseCost}
              onChange={(event) => setResponseCost(event.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <Label htmlFor="discount-amount" className="mb-1 block text-xs">
              {uiT("ui.91b53e42d4a9c6b3")}
            </Label>
            <Input
              id="discount-amount"
              placeholder="0.0009049375"
              value={discountAmount}
              onChange={(event) => setDiscountAmount(event.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        {calculatedDiscount && (
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="mb-2 text-sm font-medium text-foreground">{uiT("ui.7646369ececb59c2")}</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{uiT("ui.a584cbe22f182b5a")}</p>
                <code className="font-mono text-xs text-foreground">${calculatedDiscount.originalCost}</code>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{uiT("ui.4ef35972d654b59d")}</p>
                <code className="font-mono text-xs text-foreground">${calculatedDiscount.finalCost}</code>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{uiT("ui.2443bfe02939")}</p>
                <code className="font-mono text-xs text-foreground">${calculatedDiscount.discountAmount}</code>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <p className="text-xs font-semibold text-foreground">{uiT("ui.b4aee4c4dfebdf4c")}</p>
                <p className="text-sm font-bold text-foreground">{calculatedDiscount.discountPercentage}%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HowItWorks;
