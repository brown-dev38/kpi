"use client";

import { useState } from "react";
import {
  IndicatorGroup,
  ViewToggle,
  type DashboardView,
  type HistoryEntry,
  type IndicatorItem,
} from "@/app/kpi/dashboard/_components/indicator-group";

export function CategoryDashboard({
  items,
  historyMap,
  year,
  mainid,
  domain,
  mainName,
}: {
  items: IndicatorItem[];
  historyMap: Record<string, HistoryEntry>;
  year: number;
  mainid: string;
  domain?: string;
  mainName: string;
}) {
  const [view, setView] = useState<DashboardView>("graph");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <ViewToggle view={view} onChange={setView} />
      </div>
      <IndicatorGroup
        items={items}
        historyMap={historyMap}
        view={view}
        year={year}
        mainid={mainid}
        domain={domain}
        mainName={mainName}
      />
    </div>
  );
}
