import { t as translateUi } from "@/i18n";
export interface PermissionInfo {
  method: string;
  endpoint: string;
  description: string;
  route: string;
}

/**
 * Map of permission endpoint patterns to their descriptions
 */
export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  get "/auto_router/manage"() {
    return translateUi("ui.d3db5e0d94185ec6");
  },
  get "/key/generate"() {
    return translateUi("ui.8503a9114f8df542");
  },
  get "/key/service-account/generate"() {
    return translateUi("ui.fa92a7944f8db741");
  },
  get "/key/update"() {
    return translateUi("ui.ef8e36fdd450bddc");
  },
  get "/key/delete"() {
    return translateUi("ui.90fc2336e6f84b49");
  },
  get "/key/info"() {
    return translateUi("ui.1a197ad58c7f160b");
  },
  get "/key/regenerate"() {
    return translateUi("ui.e2b9ff1e85543980");
  },
  get "/key/{key_id}/regenerate"() {
    return translateUi("ui.e2b9ff1e85543980");
  },
  get "/key/list"() {
    return translateUi("ui.887926875abea5e5");
  },
  get "/key/block"() {
    return translateUi("ui.6b0572d9d58f120f");
  },
  get "/key/unblock"() {
    return translateUi("ui.e899db60c24d7d12");
  },
  get "/key/access_group_assignment"() {
    return translateUi("ui.0418a46d43557ae1");
  },
  get "/team/daily/activity"() {
    return translateUi("ui.68fc9e8cf41d6b4e");
  },
  get "/spend/logs"() {
    return translateUi("ui.d9351c80d897af52");
  },
};

/**
 * Determines the HTTP method for a given permission endpoint
 */
export const getMethodForEndpoint = (endpoint: string): string => {
  if (
    endpoint.includes("/info") ||
    endpoint.includes("/list") ||
    endpoint.includes("/activity") ||
    endpoint === "/spend/logs"
  ) {
    return "GET";
  }
  return "POST";
};

/**
 * Parses a permission string into a structured PermissionInfo object
 */
export const getPermissionInfo = (permission: string): PermissionInfo => {
  const method = getMethodForEndpoint(permission);
  const endpoint = permission;

  // Find exact match or fallback to default description
  let description = PERMISSION_DESCRIPTIONS[permission];

  // If no exact match, try to find a partial match based on patterns
  if (!description) {
    for (const [pattern, desc] of Object.entries(PERMISSION_DESCRIPTIONS)) {
      if (permission.includes(pattern)) {
        description = desc;
        break;
      }
    }
  }

  // Fallback if no match found
  if (!description) {
    description = `Access ${permission}`;
  }

  return {
    method,
    endpoint,
    description,
    route: permission,
  };
};
