# MCP 请求缓存原生页面交付

## 生产验收补充：2026-10-24

主代理已将原生页面发布到正式入口 `https://mcp-service.midi.lizhijian.xyz/ui/gateway-request-cache/`，并使用原有 Chrome 登录会话完成验收。UI 源码仍为 `7c86ceee72cb20299a6542ba3e076d10eba23a56`，850 个静态文件 hash 全部匹配交付 manifest，没有重新构建前端

第四个 AI 入口 BFF 镜像为 `sha256:b6fd90914243048acb413b8f6bc6fbd4b1677502669e45d7b66c166609c0ceef`。本线程已独立只读回读 `ai-gateway-e2e-gateway-1`，结果为该 image ID、running、healthy，实际 `MCP_CONSOLE_REACT_ROOT` 仍为 `/app/e2e/ui`

主代理确认真实导航、十条来源策略及 48 小时有效期、五条商品分析规则筛选、详情与 Escape、刷新、窄屏以及浏览器 console 零 warning/error 均通过。仅替换 Gateway，保留原有四文件 BFF 补丁范围外逻辑和 132 个其他容器的 ID/image，现有会话延续，无强杀。浏览器与容器保留结论来源为主代理对话 `01a16816-7e98-7e50-a15b-c32e28642972` 的生产验收回报，完整 MCP 发布回执由主代理整理

本 UI 任务的生产发布与已登录页面验收已通过；真实业务缓存命中仍为 `not_run`。以下保留原交付与发布方案记录，其中版本化静态目录仅为候选方案示例，本次实际根目录以以上只读回读为准

## 原始源码交付

源码提交 `7c86ceee72cb20299a6542ba3e076d10eba23a56`，分支 `litellm_request_cache_admin_20261024`，父提交为线上前端标记的 `222d68212e23e31c154c5df58e5cb6b85b950a71`。相对该基线仅改动十个 UI、语言与测试文件，未引入后续文案修正，也未修改依赖、模型配置或 Python 服务

入口位于现有「MCP 服务 / 请求缓存」，路径 `/ui/gateway-request-cache/`，沿用原生 React 页面布局，不跳转旧控制台。通过已有 `gateway()` 客户端读取同源 `GET /admin/api/request-cache`，继续使用 HttpOnly 会话，不传模型 Key、身份签名或 owner 查询参数。页面要求 `services.read`，后端仍负责最终会话和工具范围检查

策略与工具关系直接读取返回数组，不硬编码数量或一对一关系。未采集与零分别显示，配置、readiness 和 backend 健康分别展示。来源 HTTP 缓存、本地类目字典、保存快照和签名解析保持独立口径。刷新或权限变化后关闭旧规则详情，401/403 清除可见数据，受限工具范围不展示进程总量或容量。轮询间隔读取后端值，页面不可见时暂停

## 验证

`npm ci --ignore-scripts --no-audit --no-fund` 使用现有 lockfile，未升级依赖。五个专项文件的 Vitest 共 20 项通过，涵盖同源 Cookie 请求、schema 校验、动态多工具关联、未知与零、过期采样、详情刷新关闭、受限范围、503 保留旧值、403 清屏和无管理权限时不读取缓存 API

`npm run typecheck`、改动文件 ESLint 和 Prettier 通过。`NEXT_PUBLIC_MANAGED_GATEWAY=1 npm run build` 成功生成 67 个静态页面，包含新路由。构建有一条既有 AVIF 图像元数据警告，相关图像不在本次 diff 中

本地使用同一 ReactConsole 静态导出适配器及其 CSP，通过实际 `/ui/gateway-services/` 导航到新页面。签名会话、外围原生元信息及 runtime 指标为合成验收数据。1440×1100 与 390×844 通过导航、十项来源规则、服务端新增共享工具关联、初始中文筛选值、详情、后台刷新关闭详情、局部失败旧值标识、零分母、403 清屏、受限范围和模拟不可见时暂停轮询。正常控制台无 warning/error、无 pageerror，撤权测试中的 403 是预期结果

验证日志和截图位于 `%TEMP%/litellm-request-cache-20261024/`，浏览器回执为 `native-browser-qa.json`。生产已登录页面由发布方使用现有会话验收，本线程未切换生产或发起真实业务取数

## 静态产物

完整 `out` 目录位于 `G:/project/code/litellm-worktrees/request-cache-admin-20261024/ui/litellm-dashboard/out`

归档：`C:/Users/fortytwo/Downloads/litellm-request-cache-ui-7c86ceee72cb.tar.gz`

SHA-256：`b26c6243ff002ceb40ba0ad219dea3ad1ee4cfc99fae5140524ffacd48f3572c`

逐文件清单：`C:/Users/fortytwo/Downloads/litellm-request-cache-ui-7c86ceee72cb.manifest.json`，校验边车为同名前缀 `.sha256`。归档大小 7105926 bytes，包含 850 个导出文件和根目录 manifest，所有归档文件均已重新读取并逐一匹配 SHA-256。导出目录树指纹为 `c1895512729402a02bf637de050a632ee0e9738e65ee28c8818e59108ab33e26`

manifest 在 `out` 外，不应作为前端静态文件发布。它记录源码、构建基线、逐文件大小/hash、验证范围和浏览器结果。文件 mode 为 0644，目录 mode 为 0755，便于保持既有非 root 运行用户

## 线上基线的只读采样

容器 `ai-gateway-e2e-gateway-1`，镜像 tag `managed-gateway-e2e:cny-222d68212e23`，实际 image ID 为 `sha256:00cea76699d9c2af90b990538cf4d9fe034967e9e3b299473728519d6faf557c`

镜像 label `io.mediec.console.revision` 为 `222d68212e23e31c154c5df58e5cb6b85b950a71`。`MCP_CONSOLE_REACT_ROOT=/app/e2e/ui`，UI 没有独立 bind mount。Entrypoint 为 `python -m mcp_gateway.server`，Cmd 为 null。不能靠更新独立 LiteLLM 镜像使该 UI 生效

Compose project 为 `ai-gateway-e2e`，工作目录 `/mnt/BaseService/mediec-ai-gateway-e2e`，现有配置顺序为 `compose.yml`、`compose.gateway.yml`、`compose.business.private.json`，目标 service 为 `gateway`。私有配置和状态挂载继续由原发布流程持有，不能在日志或文档中展开其环境值

## 最小镜像范围与切换

发布方负责将实际 AI 入口 BFF 的只读 API 增量与本 UI 合成同一候选。仅更新另一个 MCP 聚合 Gateway 不会让此同源入口自动具备新 handler。必须保留 AI 入口已有 React、SSO、native 模型路由、生命周期、会话和授权增强，不整文件覆盖它的历史实现

前端 overlay 以发布方已经准备并通过检查的完整 AI BFF image ID 为基础，复制完整导出到新的版本目录，保持原 entrypoint、运行用户和所有非 UI 配置。不运行依赖安装，不修改原容器文件，不使用 `docker cp` 原地发布

```dockerfile
ARG APPROVED_BFF_BASE
FROM ${APPROVED_BFF_BASE}
COPY out/ /app/e2e/ui-request-cache-7c86ceee72cb/
LABEL io.mediec.console.revision="7c86ceee72cb20299a6542ba3e076d10eba23a56"
```

追加的 Compose override 只指向已验证候选 image ID，并切换静态目录，其他服务和配置沿用当前叠加文件。使用新目录可避免新旧静态导出混装，旧目录也可保留供 UI 回退

```yaml
services:
  gateway:
    image: ${REQUEST_CACHE_UI_IMAGE:?set the verified local candidate image ID}
    environment:
      MCP_CONSOLE_REACT_ROOT: /app/e2e/ui-request-cache-7c86ceee72cb
```

候选安装检查应以既有运行用户读取完整 manifest，核对全部导出文件和新路由；确认最终 BFF 在同源路径提供新 API，并回读实际生效的静态根目录。不要仅以 HTML 存在或镜像构建成功替代页面交互验收

无需重建或重启 LiteLLM、PostgreSQL、Redis、FRP，也不改变模型配置。需要切换的是承载静态 UI 的 Gateway。该 Gateway 也转发模型流，不能把前端更新等同于无在途影响的文件替换。此 UI 产物不提供在途计数器，发布方必须使用已验证的生命周期观测；healthy、完成日志或单纯 TCP 连接数不能证明请求已全部结束

root 已选定的切换方式是在停止前即时确认在途为零，随后使用 `docker stop --time=-1 ai-gateway-e2e-gateway-1` 等待自然退出，旧进程未退出前不启动占用相同端口的新 Gateway。存在活动请求或观测不明时保持旧 Gateway，不执行切换。无限等待不提供应用层永不丢流的额外保证，具体生命周期行为仍以候选检查和发布负责人回读为准

旧 Gateway 正常退出后，发布方按原配置顺序加上该 override，仅执行目标 service 的范围启动

```sh
docker-compose -p ai-gateway-e2e \
  -f compose.yml -f compose.gateway.yml -f compose.business.private.json \
  -f compose.request-cache-ui.yml up -d --no-deps --no-build gateway
```

上线后确认 Gateway 健康、实际 image ID、静态根目录和资源 hash，再使用现有同源登录会话完成「服务目录 → 请求缓存 → 刷新、筛选、详情」及窄屏验收。MCP 的 Yuntu、Feigua 和聚合 Gateway 生产基线由主代理独立维护，不随 UI 切换回旧版本

## 回退

UI 单独回退可使用发布方记录的预 UI BFF 候选 image ID 和旧静态目录，保留新只读 API；若需整入口回退，则恢复切换前保存的完整 image ID 与对应静态根目录。仍按在途排空和自然退出流程操作，仅启动 `gateway`。会话/授权存储、模型数据库、Key、Redis 和三个 MCP runtime 均保持，不回退到旧缓存策略或清空任何状态
