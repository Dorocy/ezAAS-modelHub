"use client";

import { useRef, useState } from "react";
import { getCodeList } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import SearchBox from "@/components/SearchBox";
import CategoryCombobox from "@/components/CategoryCombobox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

export default function AASSearchBar() {
  const router = useRouter();
  const [modelType, setModelType] = useState<"aasmodel" | "submodel">("aasmodel");

  const [searchState, setSearchState] = useState({
    category_seq: "",
    searchKey: "",
  });

  const searchRef = useRef({ searchKey: "" });

  const handleSearch = () => {
    const route =
      modelType === "aasmodel" ? ROUTES.AASMODEL.LIST : ROUTES.SUBMODEL.LIST;
    const query = new URLSearchParams({
      title: searchRef.current.searchKey,
      category_seq: searchState.category_seq,
    }).toString();
    router.push(`${route}?${query}`);
  };

  return (
    <SearchBox onSearch={handleSearch}>
      {/* Model type selector */}
      <Select
        value={modelType}
        onValueChange={(value) => {
          setModelType(value as "aasmodel" | "submodel");
          setSearchState((prev) => ({ ...prev, category_seq: "" }));
        }}
      >
        <SelectTrigger className="h-9 w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="aasmodel">AAS Template</SelectItem>
            <SelectItem value="submodel">SubModel Template</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Category (Mantine combobox — 이후 Phase에서 shadcn Combobox로 교체 예정) */}
      <div className="w-52">
        <CategoryCombobox
          className="border-0"
          code={modelType === "aasmodel" ? "aas_category" : "sm_category"}
          value={searchState.category_seq}
          setValue={(value: string) =>
            setSearchState((prev) => ({
              ...prev,
              category_seq: value ?? "",
              searchKey: searchRef.current.searchKey,
            }))
          }
        />
      </div>

      {/* Keyword search */}
      <div className="relative flex-1 min-w-52">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          className="pl-9"
          placeholder="Keyword Search"
          onChange={(e) => {
            searchRef.current.searchKey = e.target.value;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
        />
      </div>
    </SearchBox>
  );
}
