"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  fetchFiscalYears,
  fetchDataAdmin,
  fetchDataAdminDetail,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import KpiRegisterAdminDetail from "./detail";
import { Badge } from "@/components/ui/badge";

type FiscalYear = { id: number; year: number; unansweredCount: number };

type Indicator = {
  id: number;
  name: string;
  isAnswered: boolean;
};

type Detail = Awaited<ReturnType<typeof fetchDataAdminDetail>>;

export default function KpiRegisterAdminContent() {
  const searchParams = useSearchParams();
  const yearParam = Number(searchParams.get("year") ?? 0);
  const mainParam = Number(searchParams.get("main") ?? 0) || undefined;

  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(0);

  const [indicator, setIndicator] = useState<Indicator[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [selectedIndicator, setSelectedIndicator] = useState<number>(0);

  const [loadingYears, setLoadingYears] = useState<boolean>(true);
  const [loadingIndicator, setLoadingIndicator] = useState<boolean>(false);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  useEffect(() => {
    setSelectedYear(0);
    setIndicator([]);
    setDetail(null);
    setSelectedIndicator(0);
    setLoadingYears(true);
    fetchFiscalYears(mainParam).then((data) => {
      setFiscalYears(data);
      setLoadingYears(false);
      if (yearParam > 0 && data.some((fy) => fy.year === yearParam)) {
        handleSelectYear(String(yearParam));
      }
    });
  }, [mainParam]);

  const handleSelectYear = async (yearStr: string) => {
    const year = Number(yearStr);
    setSelectedYear(year);
    setSelectedIndicator(0);
    setDetail(null);
    setLoadingIndicator(true);
    const res = await fetchDataAdmin(year, mainParam);
    setIndicator(res);
    setLoadingIndicator(false);
  };

  const handleSelectIndicator = async (indicatorid: number) => {
    setSelectedIndicator(indicatorid);
    setLoadingDetail(true);
    const res = await fetchDataAdminDetail(indicatorid, selectedYear);
    setDetail(res);
    setLoadingDetail(false);
  };

  const handleAnswered = async () => {
    if (selectedYear > 0) {
      const updated = await fetchDataAdmin(selectedYear, mainParam);
      setIndicator(updated);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-4">
        <Label>ปีงบประมาณ</Label>
        {loadingYears ? (
          <Skeleton className="h-10 w-48" />
        ) : (
          <Select
            value={selectedYear > 0 ? String(selectedYear) : ""}
            onValueChange={handleSelectYear}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="เลือกปีงบประมาณ" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>ปีงบประมาณ</SelectLabel>
                {fiscalYears.map((fy) => (
                  <SelectItem key={fy.id} value={String(fy.year)}>
                    <div className="flex items-center justify-between w-full gap-2">
                      <span>{fy.year}</span>
                      {fy.unansweredCount > 0 && (
                        <Badge variant="destructive">
                          {fy.unansweredCount}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedYear > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_3fr] gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between gap-2">
              <Label>ตัวชี้วัด</Label>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedIndicator(0);
                  setDetail(null);
                }}
              >
                <Trash2 />
              </Button>
            </div>
            {loadingIndicator
              ? Array.from({ length: 5 }).map((_, index) => (
                  <div key={index}>
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))
              : indicator.map((x) => (
                  <div key={x.id}>
                    <Button
                      type="button"
                      variant={selectedIndicator === x.id ? "default" : "ghost"}
                      className="h-full w-full text-left justify-start whitespace-normal"
                      onClick={() => handleSelectIndicator(x.id)}
                    >
                      <span className="flex-1 text-left">{x.name}</span>
                      {!x.isAnswered && (
                        <Badge variant="destructive">ยังไม่ลง</Badge>
                      )}
                    </Button>
                    <Separator />
                  </div>
                ))}
          </div>

          <div className="flex flex-col gap-2">
            {selectedIndicator > 0 &&
              (loadingDetail ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index}>
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))
              ) : (
                <KpiRegisterAdminDetail
                  data={detail}
                  fiscalYear={selectedYear}
                  main={selectedIndicator}
                  indicator={selectedIndicator}
                  setSelectedIndicator={setSelectedIndicator}
                  onAnswered={handleAnswered}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
