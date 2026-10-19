"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { apiClient } from "@/components/networking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LOG_ID_QUERY_PARAM } from "@/components/logs/request/logDetailRouting";
import type { paths } from "@/lib/http/schema";
import { formatNumberWithCommas } from "@/utils/dataUtils";
import { uiHref } from "@/utils/uiHref";
import { usd } from "./costOptimizationUtils";
import { benchmarksWindow as activityWindow } from "./useAutoRouterBenchmarks";
import type { DateRange } from "./useDailyActivityRange";

const REQUESTS_PATH = "/cost_optimization/prompt_caching/requests";
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
type RequestsEndpoint = paths[typeof REQUESTS_PATH]["get"];
type RequestsResponse = RequestsEndpoint["responses"][200]["content"]["application/json"];
type RequestsQuery = NonNullable<RequestsEndpoint["parameters"]["query"]>;
type RequestFilter = NonNullable<RequestsQuery["filter"]>;
type RequestCursor = RequestsResponse["next_cursor"];

interface PromptCachingRequestsTableProps {
  accessToken: string;
  dateValue: DateRange;
}

export default function PromptCachingRequestsTable({ accessToken, dateValue }: PromptCachingRequestsTableProps) {
  const { t: uiT } = useDashboardLanguage();

  const [filter, setFilter] = useState<RequestFilter>("all");
  const [pageSize, setPageSize] = useState(10);
  const window = activityWindow(dateValue, new Date());
  const startDate = window.start_date ? `${window.start_date}T00:00:00.000Z` : "";
  const endDate = window.end_date ? `${window.end_date}T23:59:59.999Z` : "";
  const scope = JSON.stringify([accessToken, startDate, endDate, filter, pageSize]);
  const [pagination, setPagination] = useState<{ scope: string; cursors: readonly RequestCursor[] }>({
    scope,
    cursors: [null],
  });
  const cursors = pagination.scope === scope ? pagination.cursors : [null];
  const cursor = cursors.at(-1);
  const page = cursors.length;

  if (pagination.scope !== scope) {
    setPagination({ scope, cursors: [null] });
  }

  const enabled = Boolean(accessToken && startDate && endDate);
  const query: RequestsQuery = {
    start_date: startDate,
    end_date: endDate,
    filter,
    page_size: pageSize,
    cursor_start_time: cursor?.start_time,
    cursor_request_id: cursor?.request_id,
  };
  const queryOptions: UseQueryOptions<RequestsResponse> = {
    queryKey: [REQUESTS_PATH, accessToken, query],
    queryFn: ({ signal }) => apiClient.get<RequestsResponse>(REQUESTS_PATH, { accessToken, query, signal }),
    enabled,
    retry: false,
  };
  const requests = useQuery(queryOptions);
  const nextCursor = requests.data?.next_cursor;

  const changeFilter = (value: unknown) => {
    if (value === "all" || value === "injected" || value === "hits") {
      setFilter(value);
    }
  };

  return (
    <Card>
      <CardHeader className="gap-3">
        <div>
          <CardTitle>{uiT("ui.ef7bfaa883c386bf")}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{uiT("ui.1cdfdc6300b08d68")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{uiT("ui.47eab4ac7e578fa5")}</p>
        </div>
        <Tabs value={filter} onValueChange={changeFilter}>
          <TabsList aria-label={uiT("ui.235f3385a8c262af")}>
            <TabsTrigger value="all">{uiT("ui.97f1a6a20ff5dce7")}</TabsTrigger>
            <TabsTrigger value="injected">{uiT("ui.7108cae9c538")}</TabsTrigger>
            <TabsTrigger value="hits">{uiT("ui.afce0ac33adb8ce6")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {!enabled && <p className="py-8 text-center text-muted-foreground">{uiT("ui.f146d8d0745ddce2")}</p>}
        {enabled && requests.isPending && (
          <p role="status" className="py-8 text-center text-muted-foreground">
            {uiT("ui.d9d83c66de31d281")}
          </p>
        )}
        {enabled && requests.isError && (
          <div role="alert" className="flex items-center justify-center gap-3 py-8">
            <p>{uiT("ui.050ec41757ba3b37")}</p>
            <Button variant="outline" onClick={() => void requests.refetch()} disabled={requests.isFetching}>
              {uiT("ui.942087cc2d41e013")}
            </Button>
          </div>
        )}
        {enabled && requests.isSuccess && (
          <>
            {requests.data.requests.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">{uiT("ui.5a0232dd6310b0a1")}</p>
            ) : (
              <Table aria-label={uiT("ui.ef7bfaa883c386bf")}>
                <TableHeader>
                  <TableRow>
                    <TableHead>{uiT("ui.59f03d642b41")}</TableHead>
                    <TableHead>{uiT("ui.5e2c614c23f0")}</TableHead>
                    <TableHead>{uiT("ui.306eff8da17852d1")}</TableHead>
                    <TableHead className="text-right">{uiT("ui.b233917fdc9b8496")}</TableHead>
                    <TableHead className="text-right">{uiT("ui.cdc296c9c1f598d0")}</TableHead>
                    <TableHead className="text-right">{uiT("ui.7bd390d2716935af")}</TableHead>
                    <TableHead className="text-right">{uiT("ui.b9807dd80a431d88")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.data.requests.map((request) => (
                    <TableRow key={request.request_id}>
                      <TableCell>
                        <Link
                          href={uiHref(`logs?${new URLSearchParams({ [LOG_ID_QUERY_PARAM]: request.request_id })}`)}
                          className="block max-w-40 truncate text-primary underline underline-offset-2"
                          title={request.request_id}
                        >
                          {request.request_id}
                        </Link>
                        <time dateTime={request.start_time} className="mt-1 block text-xs text-muted-foreground">
                          {new Date(request.start_time).toLocaleString()}
                        </time>
                      </TableCell>
                      <TableCell>
                        <span className="block max-w-36 truncate" title={request.model}>
                          {request.model}
                        </span>
                      </TableCell>
                      <TableCell>
                        {request.gateway_injected ? uiT("ui.c7175fa7a0db0d3c") : uiT("ui.b37c7879f6c359f6")}
                      </TableCell>
                      <TableCell className="text-right">{formatNumberWithCommas(request.cache_read_tokens)}</TableCell>
                      <TableCell className="text-right">
                        {formatNumberWithCommas(request.cache_creation_tokens)}
                      </TableCell>
                      <TableCell className="text-right">{usd(request.spend)}</TableCell>
                      <TableCell className="text-right">
                        {request.net_savings === null ? uiT("ui.ca184496974204a0") : usd(request.net_savings)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{uiT("ui.141b69f95916")}</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    if (typeof value === "string") {
                      setPageSize(Number(value));
                    }
                  }}
                >
                  <SelectTrigger size="sm" aria-label={uiT("ui.141b69f95916")} className="w-[4.5rem]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground tabular-nums">
                  {uiT("ui.0a30a815d67d7dd2")} {page}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={uiT("ui.2865e0f438b4")}
                    disabled={page === 1}
                    onClick={() => setPagination({ scope, cursors: cursors.slice(0, -1) })}
                  >
                    <ChevronLeft />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={uiT("ui.7e021afbf6ac")}
                    disabled={!requests.data.has_more || !nextCursor}
                    onClick={() => nextCursor && setPagination({ scope, cursors: [...cursors, nextCursor] })}
                  >
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
