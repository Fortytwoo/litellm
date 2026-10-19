# Native dashboard staging acceptance

The existing fork at `559c9da30017` is the base. The integration extends its native dashboard routes and navigation. The independent entry is `https://mcp-service.midi.lizhijian.xyz:19450/admin`, which opens `/ui/home/`. It now runs the actual business gateway with the existing upstreams and shared business authorization store. The production entry and 19449 dashboard were not replaced

Real business readback returned two healthy upstream services, 92 tools, seven Feishu members, two departments and four platform accounts. The current operator retained one existing account grant. The native tool-test button executed `account_list` and returned 15 real authorized brand-context rows with `status=success`, `data_status=available` and no MCP error. The temporary lease was released. Permission, account registry, grants, defaults and platform-login records were unchanged; account contexts, resource coverage and audit records changed as expected from the read

The secondary gateway reads the existing department snapshot without synchronizing Feishu and has its own durable lease-finalization queue. Console sessions, native model storage and encrypted model delivery remain independent. The current real user's native key owner was reconciled to the production subject identifier, preserving the key, spend, limits and model list. No real provider call or report export was added. Changes submitted through the business permission pages now affect the shared store

Final browser checks covered all five business management pages without JavaScript errors or failed requests. Clicking semantic search returned 20 real tools after correcting its submit action. Anonymous pages redirected to central login, anonymous APIs returned HTTP 401, and browser storage contained no personal model key

The current operator completed real central Feishu login. The isolated Harness application used its dedicated client and callback on port 3083, reused the central browser login, received its explicit model catalog and completed a streamed conversation. The renderer received no personal model key

Browser acceptance covered native home, deployed models, Virtual Keys, model insights, usage and request logs. Native Playground Chat completed a streamed DeepSeek reply without entering a key. The business routes passed service display, nested tool arguments and inline results, stable candidate import for test account number 4, department authorization save and audit pagination

Personal key rotation through the native dashboard preserved spend and budget and left one personal key. Model grant revocation immediately denied the Playground catalog with HTTP 403, restoration returned HTTP 200, and Harness completed another conversation after rotation. Two synthetic member browser contexts confirmed separate model catalogs, denied administrative model access and denied another member's user information. These synthetic identities are not a second real Feishu user

The real provider acceptance issued 11 upstream HTTP requests. Eight completed, and three early Messages stream attempts failed before the transport setting was corrected. Conservative spending reservations totaled USD 0.0624495, below the approved USD 1 ceiling. The durable gate limits the whole run to 12 requests and 256 output tokens per request. No retry or fallback was used. The last two requests completed a function tool call and its result round trip

The earlier business UI checks used synthetic data; the real readbacks above supersede those checks for service, directory, account and read-only brand-context access. Platform login, permission mutation, quota-consuming reports, a second real Feishu user and full production cutover were not executed. The isolated Harness test process was closed before this follow-up; its earlier streamed acceptance is retained, and no fresh Harness conversation is claimed

Local evidence includes a successful 66-route production build, focused HTTP transport and native model table tests, the managed Chat integration test and browser readbacks. Private screenshots, credentials, cookies and raw identity records remain outside Git
