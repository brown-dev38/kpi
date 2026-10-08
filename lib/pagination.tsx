"use client";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Label } from "@/components/ui/label";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const PaginationComponent = ({
  data,
  current,
}: {
  data: { totalPages: number; start: number; end: number; total: number };
  current: number;
}) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const pageRange = 5;
  const half = Math.floor(pageRange / 2);

  let startPage = current - half;
  let endPage = current + half;

  if (startPage < 1) {
    startPage = 1;
    endPage = Math.min(pageRange, data?.totalPages);
  }

  if (endPage > data?.totalPages) {
    endPage = data?.totalPages;
    startPage = Math.max(1, data?.totalPages - pageRange + 1);
  }

  const handlePage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page == 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="w-full flex flex-col sm:flex-row gap-4 px-5">
      <div className="flex w-full justify-center sm:justify-start">
        <Label>
          รายการ {data?.start} - {data?.end} จาก {data?.total} รายการ
        </Label>
      </div>

      <Pagination className="w-full sm:w-auto sm:ml-auto text-sm">
        <PaginationContent>
          {current > 1 && (
            <>
              <PaginationItem>
                <PaginationLink
                  aria-label="ไปหน้าแรก"
                  title="หน้าแรก"
                  onClick={() => handlePage(1)}
                >
                  <ChevronsLeft />
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => {
                    if (current <= 1) return;
                    handlePage(current - 1);
                  }}
                />
              </PaginationItem>
            </>
          )}

          {Array.from(
            { length: endPage - startPage + 1 },
            (_, index) => startPage + index
          ).map((p) => (
            <PaginationItem key={p}>
              <PaginationLink
                isActive={p === current}
                aria-label={`ไปหน้าที่ ${p}`}
                onClick={() => handlePage(p)}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ))}

          {current != data?.totalPages && data?.totalPages !== 0 && (
            <>
              <PaginationItem>
                <PaginationNext
                  onClick={() => {
                    if (current >= data?.totalPages) return;
                    handlePage(current + 1);
                  }}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink
                  aria-label="ไปหน้าสุดท้าย"
                  title="หน้าสุดท้าย"
                  onClick={() => handlePage(data?.totalPages)}
                >
                  <ChevronsRight />
                </PaginationLink>
              </PaginationItem>
            </>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
};
