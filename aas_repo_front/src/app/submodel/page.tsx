"use client";

import React, { useState, useCallback } from "react";
import useSWR from "swr";
import { getModelList, getCodeList } from "@/api/index";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/AuthContext";
import { Layers } from "lucide-react";
import {
  ResourceListShell,
  ResourceCard,
  ResourceRow,
  type ViewType,
  type CategoryItem,
} from "@/components/feature/shared/ResourceListShell";

const PAGE_SIZE = 24;

export default function SubmodelPage() {
  const { isAuthenticated } = useAuth();

  const [inputValue, setInputValue]         = useState("");
  const [searchKey, setSearchKey]           = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [view, setView]                     = useState<ViewType>("grid");
  const [page, setPage]                     = useState(1);

  const { data: rawCategories = [] } = useSWR(
    isAuthenticated ? "categories-submodel" : null,
    () => getCodeList("category")
  );

  const categories: CategoryItem[] = (rawCategories as any[]).map((c) => ({
    id: String(c.category_seq ?? c.id),
    label: c.category_name ?? c.text,
  }));

  const searchParams: Record<string, string> = {};
  if (searchKey) searchParams.searchKey = searchKey;
  if (activeCategory !== "all") searchParams.category_seq = activeCategory;

  const { data: modelData, isLoading, error } = useSWR(
    isAuthenticated ? ["submodel-list", page, searchKey, activeCategory] : null,
    () => getModelList({ modelType: "submodel", pageNumber: page, pageSize: PAGE_SIZE, searchParams })
  );

  const models: any[] = Array.isArray(modelData)
    ? modelData
    : Array.isArray(modelData?.list) ? modelData.list : [];
  const totalCount: number = modelData?.totalCount ?? modelData?.total ?? models.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleSearch = useCallback(() => {
    setSearchKey(inputValue);
    setPage(1);
  }, [inputValue]);

  const handleCategory = (val: string) => {
    setActiveCategory(val);
    setPage(1);
  };

  return (
    <ResourceListShell
      title="Submodel Templates"
      subtitle={isLoading ? "Loading..." : `${totalCount} templates available`}
      searchValue={inputValue}
      onSearchChange={setInputValue}
      onSearchSubmit={handleSearch}
      categories={categories}
      activeCategory={activeCategory}
      onCategoryChange={handleCategory}
      totalCount={totalCount}
      view={view}
      views={["grid", "list"]}
      onViewChange={setView}
      resultText={
        <>
          {searchKey && <span className="text-zinc-900 font-medium">&quot;{searchKey}&quot; · </span>}
          {isLoading ? "Loading..." : `${models.length} of ${totalCount}`}
        </>
      }
      page={page}
      totalPages={totalPages}
      onPageChange={setPage}
      isLoading={isLoading}
      isEmpty={!isLoading && models.length === 0}
      error={error}
      errorText="Failed to load templates. Please check your connection and try again."
      emptyIcon={Layers}
      emptyTitle="No templates found"
    >
      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((model) => (
            <ResourceCard
              key={model.submodel_seq}
              href={ROUTES.SUBMODEL.VIEW(model.submodel_seq)}
              icon={Layers}
              title={model.submodel_name}
              description={model.description}
              category={model.category_name}
              status={model.status}
              statusLabel={model.status_nm ?? model.status}
              metaId={model.submodel_semantic_id}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          {models.map((model) => (
            <ResourceRow
              key={model.submodel_seq}
              href={ROUTES.SUBMODEL.VIEW(model.submodel_seq)}
              icon={Layers}
              title={model.submodel_name}
              description={model.description}
              category={model.category_name}
              status={model.status}
              statusLabel={model.status_nm ?? model.status}
            />
          ))}
        </div>
      )}
    </ResourceListShell>
  );
}
