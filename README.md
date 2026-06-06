# AI Social Survival

给中国留学生的真实英语社交场景练习。当前版本是可公开邀请测试用户的 Web Beta。

## 产品现在解决什么

- `练习模式`：显示表达方向、逐轮判断依据和建议。
- `挑战模式`：隐藏答案与逐轮反馈，结束后统一复盘。
- 8 个奥克兰高频场景，按日常、学业、工作、居住分类筛选。
- 每轮检查四项：沟通目标、回应相关、关系影响、表达自然。
- 无关回答不会悄悄推进剧情，角色会先追问澄清。
- 历史、连续练习和表达收藏默认只保存在用户设备上。
- 可选在线 AI 负责更自由的角色回复；未配置 AI 时，本地教练模式仍可完整运行。
- 语音输入使用浏览器 Web Speech API，不保存录音。

评分是透明的教练估算，不是 CEFR、IELTS、PTE 或正式能力等级。

## 本地运行

```powershell
node local-server.mjs
```

打开：

```text
http://127.0.0.1:4177
```

Windows 也可以运行：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\open-in-chrome.ps1
```

直接打开 `index.html` 也能体验本地模式，但 `file://` 页面通常无法稳定使用麦克风、Service Worker、反馈提交和在线 AI。

## 可选在线 AI

浏览器永远不会拿到 API 密钥。服务端只在同时配置以下变量时启用在线 AI：

```text
AI_ENDPOINT=https://your-provider.example/v1/chat/completions
AI_API_KEY=server-side-secret
AI_MODEL=model-name
```

接口需要兼容常见的 chat-completions 请求和 `choices[0].message.content` 响应格式。未配置时，`/api/status` 会明确返回本地教练模式。

DeepSeek 可用以下服务端变量接入：

```text
AI_ENDPOINT=https://api.deepseek.com/chat/completions
AI_API_KEY=your-deepseek-api-key
AI_MODEL=deepseek-v4-flash
AI_THINKING=disabled
AI_TURN_RATE_LIMIT_PER_MINUTE=18
```

`AI_THINKING` 是可选项；只在目标供应商支持 DeepSeek/OpenAI 兼容的 thinking 参数时使用。为了角色扮演回复更快、更短，公开测试默认建议先用 `disabled`。
`AI_TURN_RATE_LIMIT_PER_MINUTE` 用来控制同一访问来源每分钟最多触发多少次真实 AI 回复，公开测试阶段建议先保守一点。

## 数据与隐私

- 对话、历史和收藏默认保存在浏览器本机。
- 只有页面显示“在线 AI”时，当前一轮文字和场景信息才会发送到配置的 AI 服务。
- 反馈只在用户主动提交时发送。
- 只有用户在首页主动勾选同意时，产品事件才会发送；事件包含匿名测试编号、来源参数、设备类型、场景、模式、用时、结局和教练估算分数，不包含对话正文、录音、姓名、邮箱或手机号。
- 反馈与事件记录保存在 `data/`，该目录已被 Git 忽略。
- Render 免费服务的文件系统会在重启或重新部署后丢失写入数据。正式收集测试数据前，需要给服务挂载持久磁盘并把 `DATA_DIRECTORY` 指到挂载目录，或改接正式数据库。

## 朋友测试数据

分享链接时可以加来源参数，方便区分渠道：

```text
https://ai-social-survival.onrender.com/?src=friend_wechat
https://ai-social-survival.onrender.com/?src=xiaohongshu_test
```

测试者勾选首页的数据同意后，服务端会把匿名事件写入 `data/events.ndjson`。查看本地报告：

```powershell
npm run report
```

部署环境可以设置 `ADMIN_TOKEN`，然后用受保护接口读取 JSON 报告：

```powershell
Invoke-RestMethod -Uri "https://your-domain.example/api/admin/report" -Headers @{ Authorization = "Bearer YOUR_ADMIN_TOKEN" }
```

公开测试前应再次核对 [privacy.html](privacy.html) 与实际部署方式完全一致。

## 自动测试

```powershell
node --check app.js
node --check local-server.mjs
node tests/smoke-test.mjs
node tests/interaction-test.mjs
node tests/rubric-test.mjs
node tests/ui-test.mjs
node tests/production-test.mjs
node tests/journey-test.mjs
node tests/accessibility-test.mjs
node tests/server-test.mjs
```

测试覆盖：

- 无关回答触发澄清而不是自动通关；
- 实际措辞影响关系分；
- 8 个场景、32 轮规则与全部语气方向；
- 练习与挑战模式；
- 16 次完整练习旅程；
- 模拟语音输入；
- 透明结果页；
- 场景筛选、本机历史、连续练习、收藏、分享与离线反馈；
- 正式资源、安全响应头、反馈接口和在线 AI 未配置时的回退。

自动测试不能替代 Chrome、Edge、Safari 和真实手机上的麦克风测试。

## 部署

项目无第三方运行依赖，可以直接部署 Node 服务，也提供 `Dockerfile`。

生产环境必须：

- 使用 HTTPS；
- 将 `HOST` 设置为 `0.0.0.0`；
- 为 `data/` 配置持久存储，或替换为正式数据库；
- 对在线 AI 设置服务端预算、速率限制与内容安全策略；
- 核对隐私政策、AI 服务商数据处理条款和删除流程。

## 当前发布阶段

这版适合发给首批测试用户，不适合立即收费或直接包装成 App Store 应用。下一项产品验证不是“再加多少功能”，而是至少 10 位目标用户是否会完成两个场景，并愿意在一周内再次使用。
