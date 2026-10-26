export interface UserIdentityLabel {
  readonly user_id?: string | null;
  readonly user_alias?: string | null;
  readonly user_email?: string | null;
}

export const userDisplayLabel = (user: UserIdentityLabel): string =>
  user.user_alias?.trim() || user.user_email?.trim() || user.user_id || "";

export const userSelectionLabel = (user: UserIdentityLabel): string => {
  const label = userDisplayLabel(user);
  return user.user_id && label !== user.user_id ? `${label} (${user.user_id})` : label;
};
