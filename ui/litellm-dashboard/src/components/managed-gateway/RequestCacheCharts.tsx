"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cacheChartRows, type CacheHistorySeries, type CacheChartMetric } from "@/lib/http/requestCacheHistory";
import { auditTime } from "@/lib/http/managedGateway";
import { useCopy } from "./locale";

const panels = [
  { metric: "entries", title: "cacheInventoryTrend", unit: "cacheEntriesUnit" },
  { metric: "hit", title: "cacheHitTrend", unit: "cacheLookupsUnit" },
  { metric: "hit_ratio", title: "cacheRatioTrend", unit: "cachePercentUnit" },
] as const;

export default function RequestCacheCharts({
  series,
  bucketSeconds,
}: {
  series: readonly CacheHistorySeries[];
  bucketSeconds: number;
}) {
  const t = useCopy();
  const config = {
    yuntu: { label: t("yuntu"), color: "var(--chart-1)" },
    feigua: { label: t("cacheFeigua"), color: "var(--chart-2)" },
  };
  const tick = (value: number) => auditTime(new Date(value).toISOString()).slice(5, 16);
  function chart(metric: CacheChartMetric, title: string) {
    const data = cacheChartRows(series, metric);
    if (!data.some((point) => point.yuntu !== null || point.feigua !== null)) {
      return (
        <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">{t("cacheHistoryEmpty")}</p>
      );
    }
    return (
      <ChartContainer config={config} className="h-56 w-full" aria-label={title}>
        <LineChart data={data} accessibilityLayer margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={tick}
            minTickGap={42}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            width={45}
            domain={metric === "hit_ratio" ? [0, 100] : [0, "auto"]}
            allowDecimals={metric === "hit_ratio"}
            tickLine={false}
            axisLine={false}
          />
          <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => tick(Number(value))} />} />
          {series.map((item) => (
            <Line
              key={item.platform}
              dataKey={item.platform}
              type="linear"
              stroke={`var(--color-${item.platform})`}
              strokeWidth={2}
              strokeDasharray={item.platform === "feigua" ? "5 3" : undefined}
              connectNulls={false}
              dot={data.filter((point) => point[item.platform] !== null).length === 1 ? { r: 3 } : false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ChartContainer>
    );
  }
  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-3">
      {panels.map(({ metric, title, unit }) => (
        <Card key={metric} className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">{t(title)}</CardTitle>
            <CardDescription>
              {t(unit)} · {bucketSeconds / 60} {t("cacheMinutesPerPoint")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chart(metric, t(title))}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
              {series.map((item) => (
                <span key={item.platform} className="inline-flex items-center gap-2">
                  <svg width="20" height="8" aria-hidden="true">
                    <line
                      x1="0"
                      x2="20"
                      y1="4"
                      y2="4"
                      stroke={item.platform === "yuntu" ? "var(--chart-1)" : "var(--chart-2)"}
                      strokeWidth="2"
                      strokeDasharray={item.platform === "feigua" ? "5 3" : undefined}
                    />
                  </svg>
                  {config[item.platform].label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
