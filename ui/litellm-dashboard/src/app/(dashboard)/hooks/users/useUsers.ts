import { userGetInfoV2, userListCall, UserInfo, UserInfoV2Response, UserListResponse } from "@/components/networking";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createQueryKeys } from "../common/queryKeysFactory";
import { canListUsers } from "@/utils/roles";
import { userDisplayLabel } from "@/utils/userDisplay";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";

const infiniteUsersKeys = createQueryKeys("infiniteUsers");
const userLookupKeys = createQueryKeys("userLookup");

const DEFAULT_PAGE_SIZE = 50;

export const useInfiniteUsers = (pageSize: number = DEFAULT_PAGE_SIZE, search?: string, enabled: boolean = true) => {
  const { accessToken, userRole, userId } = useAuthorized();
  return useInfiniteQuery<UserListResponse>({
    queryKey: infiniteUsersKeys.list({
      filters: {
        pageSize,
        userId,
        userRole,
        ...(search && { search }),
      },
    }),
    queryFn: async ({ pageParam }) => {
      return await userListCall(
        accessToken!,
        null, // userIDs
        pageParam as number, // page
        pageSize, // page_size
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        search || null,
      );
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: enabled && Boolean(accessToken) && canListUsers(userRole),
  });
};

const USER_LIST_MAX_PAGE_SIZE = 100;

const useUserLabelLookup = (userIds: readonly string[], preferName: boolean) => {
  const { accessToken, userRole, userId } = useAuthorized();
  const distinctIds = Array.from(
    new Set(userIds.filter((id) => id !== "" && (canListUsers(userRole) || id === userId))),
  ).sort();
  return useQuery<Record<string, string>>({
    queryKey: userLookupKeys.list({
      filters: { ids: JSON.stringify(distinctIds), label: preferName ? "name" : "email", userId, userRole },
    }),
    queryFn: async () => {
      const batches = Array.from({ length: Math.ceil(distinctIds.length / USER_LIST_MAX_PAGE_SIZE) }, (_, index) =>
        distinctIds.slice(index * USER_LIST_MAX_PAGE_SIZE, (index + 1) * USER_LIST_MAX_PAGE_SIZE),
      );
      const responses = await Promise.allSettled(
        batches.map(async (ids) =>
          ids.length === 1
            ? { users: [await userGetInfoV2(accessToken!, ids[0])] }
            : userListCall(accessToken!, ids, 1, ids.length),
        ),
      );
      const successful = responses.flatMap((response) => (response.status === "fulfilled" ? [response.value] : []));
      if (successful.length === 0) {
        const failure = responses.find((response) => response.status === "rejected");
        if (failure?.status === "rejected") throw failure.reason;
      }
      const requestedIds = new Set(distinctIds);
      return Object.fromEntries(
        successful
          .flatMap<UserInfo | UserInfoV2Response>((response) => response.users)
          .flatMap((user) => {
            if (!requestedIds.has(user.user_id)) return [];
            const label = preferName ? userDisplayLabel({ ...user, user_id: null }) : user.user_email?.trim();
            return label ? [[user.user_id, label]] : [];
          }),
      );
    },
    enabled: Boolean(accessToken) && distinctIds.length > 0,
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
    enabled: Boolean(accessToken) && Boolean(userId) && (canListUsers(userRole) || userId === currentUserId),
  });
};
