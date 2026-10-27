# 请求缓存概览与趋势

原生入口 `/ui/gateway-request-cache/` 新增缓存概览，显示未到期缓存条数、缓存数据大小、已记录命中、未命中、跳过、合并等待、异常事件、命中率和有效采样分钟数。运行进程配置移入可展开详情，原有规则搜索和政策详情继续保留

三组折线图分别显示缓存存量、命中次数和命中率，支持两平台对比和最近24小时、7天、30天窗口。时间为北京时间，时间范围和平台由 nuqs 保存到 URL，图表沿用现有 shadcn Chart 与 Recharts 并按需加载，不增加依赖。大屏并排三个图，手机按顺序排列，提供最近12个时间点的数值表和键盘访问

同源 HttpOnly 会话通过 `GET /admin/api/request-cache` 获取实时状态，通过 `GET /admin/api/request-cache-history?window=...` 获取历史。历史读取失败保留实时状态，历史采样过期有提示，401或403清除整页旧数据。两个响应权限范围不一致时采用更严格的范围，全局统计、容量和历史序列一起隐藏

缺失点保持为空，不连线，不补零。命中率由后端按照命中除以命中加未命中计算，零分母显示未知。初始 Redis 存量只涵盖升级后跟踪的条目并明确标注，条目数不表示当前身份可复用的请求数，也不推算节省的 HTTP 请求数

本地验证完成：相关6个测试文件26项通过，生产 typecheck、改动文件 ESLint/Prettier 和 `NEXT_PUBLIC_MANAGED_GATEWAY=1 npm run build` 通过。完整静态导出生成67页；已有构建中的 AVIF 元数据提示与本次修改无关

使用生产静态适配器、真实签名合成身份和持久化 SQLite 合成采样验证原生导航、三个图和六条序列、URL窗口和刷新保留、平台过滤、数值表、详情与Escape、历史503保留实时状态、历史403整页清空和受限范围隐藏统计。1440x1100和390x844通过，手机文档宽度390，无横向溢出。正常状态无console warning/error和pageerror；故障阶段仅有预期503与403资源提示

Browser plugin not available，按 frontend-testing-debugging Skill 使用现有 Playwright，未增加浏览器依赖。临时证据位于 `C:/Users/fortytwo/AppData/Local/Temp/request-cache-trends-20261024/`，主回执为 `native-browser-qa.json`，截图为 `desktop.png`、`mobile.png`

后端实现位于 `G:/project/code/yuntu-mcp-worktrees/request-cache-trends-20261024`，设计与存储边界见该仓库 `docs/request-cache-trends-20261024.md`。本轮未更新生产容器，未执行真实业务取数；发布必须同时纳入来源 runtime、网关/BFF 历史接口及原生静态文件，历史从启用采集时开始积累
