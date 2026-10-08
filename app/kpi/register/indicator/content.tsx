"use client";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  fetchDataIndicator,
  fetchDataIndicatorByMain,
  fetchDataIndicatorDetail,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import KpiRegisterIndicatorIndicator from "./indicator";
import KpiRegisterIndicatorDetail from "./detail";
import { Badge } from "@/components/ui/badge";

type Main = {
  mainid: number;
  kpiMain: { name: string } | null;
  unansweredCount: number;
};

type Indicator = {
  id: number;
  name: string;
  isAnswered: boolean;
};

type Detail = {
  name: string;
  resource: string;
  period: string;
  condition: string;
  target: number;
  unit: string;
  dividend: string;
  divisor: string;
  answers: {
    semester: number;
    programid: number;
    programName: string;
    dividend: number | null;
    divisor: number | null;
  }[];
  kpiMain: {
    name: string;
  } | null;
  kpiSub: {
    name: string;
  } | null;
  kpiIndicatorGuide: {
    id: number;
    name: string;
  }[];
  kpiIndicatorRefs: {
    id: number;
    name: string;
    url: string;
  }[];
  kpiIndicatorUser: {
    programid: number;
    program: { name: string };
    staff: {
      id: number;
      first_name: string | null;
      last_name: string | null;
    } | null;
  }[];
};

export default function KpiRegisterIndicatorContent() {
  const searchParams = useSearchParams();
  const year = Number(searchParams.get("year"));
  const [selectedMain, setSelectedMain] = useState<number>(0);
  const [main, setMain] = useState<Main[]>([]);
  const [indicator, setIndicator] = useState<Indicator[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);

  const [selectedIndicator, setSelectedIndicator] = useState<number>(0);
  // const [selectedIndicatorDetail, setSelectedIndicatorDetail] =
  //   useState<number>(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingIndicator, setLoadingIndicator] = useState<boolean>(false);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  useEffect(() => {
    setSelectedMain(0);
    setSelectedIndicator(0);
    setIndicator([]);
    setDetail(null);
    setLoading(true);
    fetchDataIndicator(year || undefined).then((data) => {
      setMain(data);
      setLoading(false);
    });
  }, [year]);

  const handleSelectMain = async (mainid: number) => {
    setSelectedMain(mainid);
    setLoadingIndicator(true);
    const res = await fetchDataIndicatorByMain(mainid, year || undefined);
    setIndicator(res);
    setSelectedIndicator(0);
    setLoadingIndicator(false);
  };

  const handleSelectIndicator = async (indicatorid: number) => {
    setSelectedIndicator(indicatorid);
    setLoadingDetail(true);
    const res = await fetchDataIndicatorDetail(indicatorid, year);
    setDetail(res);
    setLoadingDetail(false);
  };

  const handleAnswered = async () => {
    const [updatedMain, updatedIndicators] = await Promise.all([
      fetchDataIndicator(year || undefined),
      selectedMain > 0
        ? fetchDataIndicatorByMain(selectedMain, year || undefined)
        : Promise.resolve([]),
    ]);
    setMain(updatedMain);
    setIndicator(updatedIndicators);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_3fr] gap-4 p-4">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between gap-2">
          <Label>หัวข้อหลัก</Label>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedMain(0);
              setSelectedIndicator(0);
            }}
          >
            <Trash2 />
          </Button>
        </div>
        {loading && main.length === 0
          ? Array.from({ length: 5 }).map((x, index) => (
              <div key={index}>
                <Skeleton className="h-10 w-full" />
              </div>
            ))
          : main.map((x) => (
              <div key={x.mainid}>
                <Button
                  type="button"
                  variant={selectedMain === x.mainid ? "default" : "ghost"}
                  className="h-full w-full text-left justify-start whitespace-normal"
                  onClick={() => handleSelectMain(x.mainid)}
                >
                  <span className="flex-1 text-left">{x.kpiMain?.name}</span>
                  {x.unansweredCount > 0 && (
                    <Badge variant="destructive">{x.unansweredCount}</Badge>
                  )}
                </Button>
                <Separator />
              </div>
            ))}
      </div>
      <div className="flex flex-col gap-2">
        {selectedMain > 0 &&
          (loadingIndicator ? (
            Array.from({ length: 5 }).map((x, index) => (
              <div key={index}>
                <Skeleton className="h-10 w-full" />
              </div>
            ))
          ) : (
            <KpiRegisterIndicatorIndicator
              data={indicator}
              selectedIndicator={selectedIndicator}
              setSelectedIndicator={setSelectedIndicator}
              handleSelectIndicator={handleSelectIndicator}
            />
          ))}
      </div>
      <div className="flex flex-col gap-2">
        {selectedIndicator > 0 &&
          (loadingDetail ? (
            Array.from({ length: 5 }).map((x, index) => (
              <div key={index}>
                <Skeleton className="h-10 w-full" />
              </div>
            ))
          ) : (
            <KpiRegisterIndicatorDetail
              data={detail}
              indicator={selectedIndicator}
              setSelectedIndicator={setSelectedIndicator}
              onAnswered={handleAnswered}
            />
          ))}
      </div>
    </div>
  );
}
