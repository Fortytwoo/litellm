"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useMemo, useState } from "react";
import { PaginatedSearchSelect } from "@/components/shared/PaginatedSearchSelect";
import type { SearchSelectOption } from "@/components/shared/SearchSelect";
import { useInfiniteUsers, useUserLookup } from "@/app/(dashboard)/hooks/users/useUsers";
import { userSelectionLabel } from "@/utils/userDisplay";

interface UserDropdownProps {
  value?: string | null;
  onChange: (userId: string | null) => void;
  disabled?: boolean;
  pageSize?: number;
  id?: string;
}

export const userOptionLabel = userSelectionLabel;

const UserDropdown: React.FC<UserDropdownProps> = ({ value, onChange, disabled, pageSize = 50, id }) => {
  const { t: uiT } = useDashboardLanguage();

  const [search, setSearch] = useState("");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteUsers(
    pageSize,
    search || undefined,
  );

  const loadedOptions = useMemo<SearchSelectOption[]>(() => {
    const byId = new Map<string, SearchSelectOption>();
    for (const user of (data?.pages ?? []).flatMap((page) => page.users)) {
      if (byId.has(user.user_id)) continue;
      byId.set(user.user_id, { value: user.user_id, label: userOptionLabel(user) });
    }
    return Array.from(byId.values());
  }, [data]);

  const selectedIsLoaded = loadedOptions.some((option) => option.value === value);
  const { data: selectedUser } = useUserLookup(value && !selectedIsLoaded ? value : null);

  const options = useMemo<SearchSelectOption[]>(() => {
    if (!value || selectedIsLoaded || !selectedUser) return loadedOptions;
    return [{ value: selectedUser.user_id, label: userOptionLabel(selectedUser) }, ...loadedOptions];
  }, [value, selectedIsLoaded, selectedUser, loadedOptions]);

  return (
    <div data-testid="user-dropdown">
      <PaginatedSearchSelect
        options={options}
        value={value}
        onValueChange={onChange}
        onSearchChange={setSearch}
        onLoadMore={fetchNextPage}
        hasNextPage={hasNextPage}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        placeholder={uiT("ui.ee590fbaeec4eea3")}
        emptyText={uiT("ui.bf1e104fb3c8")}
        loadingText={uiT("ui.a53ec7ac2a7b8fb1")}
        disabled={disabled}
        inputId={id}
      />
    </div>
  );
};

export default UserDropdown;
