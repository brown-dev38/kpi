"use client";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { SearchIcon, X } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function Search({ search }: { search: string }) {
  const [value, setValue] = useState(search);

  const searchParmas = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParmas);
    params.set("search", encodeURIComponent(value));
    params.set("page", "1");
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, 800);

  const handleClear = async () => {
    setValue("");
    const params = new URLSearchParams(searchParmas);
    params.delete("page");
    params.delete("search");
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex justify-end">
      <InputGroup className="w-50">
        <InputGroupInput
          placeholder="ค้นหา..."
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            handleSearch(e.target.value);
          }}
        />
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InputGroupButton onClick={handleClear}>
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>{" "}
    </div>
  );
}
