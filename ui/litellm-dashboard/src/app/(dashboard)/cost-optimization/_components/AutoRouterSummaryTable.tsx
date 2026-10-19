"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { groupKey, groupLabel, pctLabel, type AutoRouterBenchmarkGroup } from "./autoRouterBenchmarks";
import { usd } from "./costOptimizationUtils";

interface AutoRouterSummaryTableProps {
  groups: readonly AutoRouterBenchmarkGroup[];
  selectedGroup: AutoRouterBenchmarkGroup | null;
}

export default function AutoRouterSummaryTable({ groups, selectedGroup }: AutoRouterSummaryTableProps) {
  const { t: uiT } = useDashboardLanguage();

  const visibleGroups = selectedGroup ? [selectedGroup] : groups;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{uiT("ui.cec9116878df850b")}</CardTitle>
        <CardDescription>{uiT("ui.52ad3a49c9405ab6")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table aria-label={uiT("ui.cec9116878df850b")}>
          <TableHeader>
            <TableRow>
              <TableHead>{uiT("ui.f753726e29c3e279")}</TableHead>
              <TableHead className="text-right whitespace-normal">{uiT("ui.affa7a77989383e0")}</TableHead>
              <TableHead className="text-right whitespace-normal">{uiT("ui.d1eed3356642ca8c")}</TableHead>
              <TableHead className="text-right whitespace-normal">{uiT("ui.e74169336302a9b7")}</TableHead>
              <TableHead className="text-right whitespace-normal">{uiT("ui.8346c28e56edce00")}</TableHead>
              <TableHead className="text-right">{uiT("ui.86cc220ef89e2def")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {uiT("ui.d0aefe6849335348")}
                </TableCell>
              </TableRow>
            ) : (
              visibleGroups.map((group) => (
                <TableRow key={groupKey(group)}>
                  <TableCell className="font-medium">{groupLabel(group, groups)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {group.total_tokens == null ? uiT("ui.ca184496974204a0") : group.total_tokens.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{usd(group.spend)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {group.total_tokens != null && group.total_tokens > 0
                      ? usd((group.spend * 1_000_000) / group.total_tokens)
                      : uiT("ui.ca184496974204a0")}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {group.saved_spend == null ? uiT("ui.ca184496974204a0") : usd(group.saved_spend)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {group.saved_pct == null ? uiT("ui.ca184496974204a0") : pctLabel(group.saved_pct)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <p className="mt-3 text-xs text-muted-foreground">{uiT("ui.185aab60145f4ec0")}</p>
      </CardContent>
    </Card>
  );
}
