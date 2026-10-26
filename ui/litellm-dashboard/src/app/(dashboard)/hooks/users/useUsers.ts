import { userGetInfoV2, userListCall, UserInfo, UserInfoV2Response, UserListResponse } from "@/components/networking";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createQueryKeys } from "../common/queryKeysFactory";
import { canListUsers } from "@/utils/roles";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";

const infiniteUsersKeys = createQueryKeys("infiniteUsers");
const userLookupKeys = createQueryKeys("userLookup");

const DEFAULT_PAGE_SIZE = 50;

export const useInfiniteUsers = (pageSize: number = DEFAULT_PAGE_SIZE, searchEmail?: string) => {
  const { accessToken, userRole } = useAuthorized();
  return useInfiniteQuery<UserListResponse>({
    queryKey: infiniteUsersKeys.list({
      filters: {
        pageSize,
        ...(searchEmail && { searchEmail }),
      },
    }),
    queryFn: async ({ pageParam }) => {
      return await userListCall(
        accessToken!,
        null, // userIDs
        pageParam as number, // page
        pageSize, // page_size
        searchEmail || null, // userEmail
      );
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: Boolean(accessToken) && canListUsers(userRole),
  });
};

const USER_LIST_MAX_PAGE_SIZE = 100;

const useUserLabelLookup = (userIds: readonly string[], preferName: boolean) => {
  const { accessToken, userRole, userId } = useAuthorized();
  const distinctIds = Array.from(new Set(userIds.filter((id) => id !== ""))).sort();
  return useQuery<Record<string, string>>({
    queryKey: userLookupKeys.list({
      filters: { ids: JSON.stringify(distinctIds), label: preferName ? "name" : "email", userId, userRole },
    }),
    queryFn: async () => {
      const batches = Array.from({ length: Math.ceil(distinctIds.length / USER_LIST_MAX_PAGE_SIZE) }, (_, index) =>
        distinctIds.slice(index * USER_LIST_MAX_PAGE_SIZE, (index + 1) * USER_LIST_MAX_PAGE_SIZE),
      );
      const responses = await Promise.all(
        batches.map(async (ids) =>
          ids.length === 1
            ? { users: [await userGetInfoV2(accessToken!, ids[0])] }
            : userListCall(accessToken!, ids, 1, ids.length),
        ),
      );
      const requestedIds = new Set(distinctIds);
      return Object.fromEntries(
        responses
          .flatMap<UserInfo | UserInfoV2Response>((response) => response.users)
          .flatMap((user) => {
            if (!requestedIds.has(user.user_id)) return [];
            const label = (preferName ? user.user_alias?.trim() : undefined) || user.user_email?.trim();
            return label ? [[user.user_id, label]] : [];
          }),
      );
    },
    enabled: Boolean(accessToken) && distinctIds.length > 0 && canListUsers(userRole),
  });
};

export const useUserEmailLookup = (userIds: readonly string[]) => useUserLabelLookup(userIds, false);

export const useUserDisplayLookup = (userIds: readonly string[]) => useUserLabelLookup(userIds, true);

export const useUserLookup = (userId: string | null) => {
  const { accessToken, userRole, userId: currentUserId } = useAuthorized();
  return useQuery<UserInfoV2Response | null>({
    queryKey: [...userLookupKeys.detail(userId ?? ""), currentUserId, userRole],
    queryFn: async () => {
      const user = await userGetInfoV2(accessToken!, userId!);
      return user.user_id === userId ? user : null;
    },
    enabled: Boolean(accessToken) && Boolean(userId) && canListUsers(userRole),
  });
};
