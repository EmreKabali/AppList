"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type FilterType = "all" | "active" | "expiring" | "approved";

const filters: { value: FilterType; label: string }[] = [
  { value: "all", label: "Tumu" },
  { value: "active", label: "Aktif" },
  { value: "expiring", label: "Yakinda Bitecek" },
  { value: "approved", label: "Onaylanan" },
];

export function FilterTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilter = (searchParams.get("filter") as FilterType) || "all";

  const handleFilterClick = useCallback(
    (filter: FilterType) => {
      const params = new URLSearchParams(searchParams.toString());
      if (filter === "all") {
        params.delete("filter");
      } else {
        params.set("filter", filter);
      }
      const query = params.toString();
      router.push(query ? `/?${query}` : "/");
    },
    [router, searchParams]
  );

  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => handleFilterClick(filter.value)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeFilter === filter.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
