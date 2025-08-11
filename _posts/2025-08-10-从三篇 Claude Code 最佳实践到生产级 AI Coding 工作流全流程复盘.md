---
title: [折腾日记1]从三篇 Claude Code 最佳实践到生产级 AI Coding 工作流全流程复盘
author: DHKun
date: 2025-08-10 20:49 +0800
repo: https://github.com/DHKun/zen-tasks
categories: [折腾日记]
tags: [AI, 自动化]
---

> 本文是我学习三篇 Claude Code 最佳实践文章后的成果验证。显而易见的是结果挺失败的，跟着cursor做了一下午，花费了很多功夫但是感觉还是一头雾水，所以就让cursor跑了一个全流程复盘，留着以后再对照学习。
>
> 参考文章：
> - [【万字长文】 最强 AI Coding：Claude Code 最佳实践](https://mp.weixin.qq.com/s/M3xA7zTBCv8HXVL9XjOBNA)（基础理念、Hooks、上下文工程）
> - [Claude Code 进阶篇（上）：社区 8 个实用技巧](https://mp.weixin.qq.com/s?__biz=MzkzODk3MTIwMQ==&mid=2247485317&idx=1&sn=1c9f9c06f3e598e9aaf6e5a93c629c57&chksm=c2f95eabf58ed7bd1b667e23f5526dfd89b995f693e8a8f829f4663bbc9a6ec47f5d3fed8767&cur_album_id=4002626452603682821&scene=189#wechat_redirect)（权限、MCP、性能与就近测试）
> - [Claude Code 进阶篇（下）：高级自动化与企业应用](https://mp.weixin.qq.com/s?__biz=MzkzODk3MTIwMQ==&mid=2247485343&idx=1&sn=59b29052eaad4ed4d5fed9b3bebdd3de&chksm=c2f95eb1f58ed7a74be9a0138a0f538f784273de06372857887a8b3b09b96d04735cb1fc161b&cur_album_id=4002626452603682821&scene=189#wechat_redirect)（多代理、Context Engineering、TDD Guard）

仓库地址：`https://github.com/DHKun/zen-tasks`

---

## 0. 目标与环境
- 目标：把“上下文工程 + Hooks 自动化 + TDD + CI/CD + 安全与依赖治理 + 多代理并发协作”串成闭环。
- 环境：
  - Windows 11，PowerShell 5.1
  - Node 20+，npm 10+
  - Git，GitHub 账号（Actions 权限打开）
  - 可选：Codecov 账户（拿到 `CODECOV_TOKEN`）

---

## 1. 新项目初始化（Vite + React + TS）
- 创建：

```powershell
npx --yes create-vite@latest zen-tasks -- --template react-ts
```

- 安装依赖：

```powershell
npm --prefix .\zen-tasks install
```

- 初始化 Git：

```powershell
cd .\zen-tasks
git init
```

---

## 2. 测试体系（Vitest + Testing Library）
- 安装：

```powershell
npm install -D vitest @types/node jsdom @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

- `vite.config.ts`（使用 vitest/config，开启测试与覆盖率门禁）示例：

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      lines: 80,
      functions: 80,
      branches: 70,
      statements: 80,
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
    },
  },
});
```

- `src/test/setup.ts`（清理与断言扩展）：

```ts
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());
```

- 运行：

```powershell
npm run test
```

---

## 3. CLAUDE 记忆与 Hooks（最小可用）
- 根级 `CLAUDE.md` 内容建议：
  - 技术栈、运行命令、代码规范（命名/提交前检查）、测试策略（工具与覆盖率阈值）、注意事项（敏感路径不可改）。
- `.claude/settings.toml`（最小 3 钩子）示例：

```toml
[[hooks]]
event = "PreToolUse"
[hooks.matcher]
tool_name = "edit_file"
file_paths = ["src/production/**/*", "infra/**/*", ".env*", "scripts/deploy/**"]
command = "echo 'Blocked by policy' && exit 2"

[[hooks]]
event = "PostToolUse"
[hooks.matcher]
tool_name = "edit_file"
file_paths = ["src/**/*.ts", "src/**/*.tsx"]
command = "node scripts/claude/format-changed.cjs && npm run test:related"

[[hooks]]
event = "Stop"
run_in_background = true
[hooks.matcher]
tool_name = "edit_file"
file_paths = ["src/**/*.ts", "tests/**/*.ts"]
command = "npm test || (echo 'Tests failed. Run npm test locally, fix failing specs, then retry.' && exit 2)"

[[hooks]]
event = "Notification"
[hooks.matcher]
command = "node scripts/claude/notify.cjs"
```

---

## 4. 按 TDD 实现小功能链
- 4.1 校验（validation）
  - 需求：非空、≤100 字符
  - 实现：`src/features/tasks/validation.ts`
  - 测试：`src/features/tasks/validation.test.ts`
- 4.2 表单（TaskForm）
  - 需求：显示错误、合法提交清空输入
  - 实现：`src/features/tasks/TaskForm.tsx`
  - 测试：`src/features/tasks/TaskForm.test.tsx`
- 4.3 列表（TaskList）
  - 需求：勾选切换完成，完成显示删除线
  - 实现：`src/features/tasks/TaskList.tsx`
  - 测试：`src/features/tasks/TaskList.test.tsx`
- 4.4 集成（App）
  - 需求：添加任务、切换完成
  - 实现：`src/App.tsx`
  - 测试：`src/App.test.tsx`
- 4.5 持久化（localStorage）
  - 模块：`src/features/tasks/storage.ts`/`storage.test.ts`
  - 接入：在 `App.tsx` 用 `useEffect(() => saveTasks(tasks), [tasks])`

> 关键选择：在 React 渲染中避免副作用写入，使用 `useEffect`；测试用 JSDOM 提供 DOM 环境。

---

## 5. 改动就近测试 & 自动格式化（PostToolUse）
- 相关测试选择器：`scripts/claude/related-tests.cjs`

```js
const { execSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { join, dirname, extname, basename } = require('node:path');
const cwd = process.cwd();
const envPaths = process.env.CLAUDE_FILE_PATHS || '';

function toCandidateTests(srcPath) {
  const ext = extname(srcPath);
  const base = basename(srcPath, ext);
  const dir  = dirname(srcPath);
  const maybe = [join(dir, `${base}.test${ext}`), join(dir, `${base}.spec${ext}`)];
  return maybe.filter((p) => existsSync(p));
}

(function main(){
  const changed = envPaths.split(/\s+/).map(s=>s.trim()).filter(Boolean);
  const tests = new Set();
  for (const p of changed) for (const t of toCandidateTests(p)) tests.add(t);
  if (tests.size === 0) return execSync('npm test --', { stdio:'inherit', cwd });
  const args = Array.from(tests).map(t=>`"${t}"`).join(' ');
  execSync(`npm test -- ${args}`, { stdio:'inherit', cwd });
})();
```

- 改动格式化：`scripts/claude/format-changed.cjs`

```js
const { execSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');
const cwd = process.cwd();
const envPaths = process.env.CLAUDE_FILE_PATHS || '';

const uniq = (a)=>Array.from(new Set(a));
const filterExists = (fs)=>fs.filter(f=>existsSync(path.resolve(cwd,f)));

(function main(){
  const changed = envPaths.split(/\s+/).map(s=>s.trim()).filter(Boolean);
  const existing = filterExists(uniq(changed));
  if (existing.length === 0) return;
  const tsFiles = existing.filter(f=>/\.(ts|tsx)$/.test(f));
  execSync(`npx prettier --log-level warn --write ${existing.map(f=>`"${f}"`).join(' ')}`, { stdio:'inherit', cwd });
  if (tsFiles.length>0) execSync(`npx eslint --fix ${tsFiles.map(f=>`"${f}"`).join(' ')}`, { stdio:'inherit', cwd });
})();
```

- 手动触发相关测试（PowerShell）：

```powershell
$env:CLAUDE_FILE_PATHS='src\features\tasks\TaskForm.tsx'
npm run test:related
```

---

## 6. Stop/Notification Hooks（失败阻断与提示/本地通知）
- Stop：结束前跑全量测试，不通过则 `exit 2` 并打印“如何修复”。
- Notification：`scripts/claude/notify.cjs` 输出提示（可替换为 Slack Webhook）。

---

## 7. 质量闸门（Husky、Prettier、ESLint、覆盖率门禁）
- Husky 初始化：`npx husky-init` 自动创建 `.husky/pre-commit`
- 修改 `.husky/pre-commit`：

```sh
npx lint-staged && npm test
```

- Prettier（`.prettierrc.json`）与 lint-staged（`.lintstagedrc.json`）：

```json
{"singleQuote": true, "semi": true, "trailingComma": "es5", "printWidth": 100}
```

```json
{"*.{ts,tsx,js,jsx,json,md,css}":["prettier --write","eslint --fix"]}
```

- 覆盖率门禁：已在 `vite.config.ts` 设置（lines/functions/statements ≥ 80%、branches ≥ 70%）

---

## 8. CI/CD（测试构建、Codecov、徽章自动替换、Release）
- CI（`.github/workflows/ci.yml`）关键步骤：
  - `npm ci`
  - `npm test`（产出 `coverage/lcov.info`）
  - `codecov/codecov-action@v4` 上传覆盖率（仓库 Secrets 配置 `CODECOV_TOKEN`）
  - `npm run -s build`
  - `scripts/ci/update-badges.cjs` 自动把 README 中 `OWNER/REPO` 替换为当前仓库
- Release（`.github/workflows/release.yml`）：
  - 仅 main 分支触发；semantic-release 依据 Conventional Commits 决定版本号与 CHANGELOG 内容
- Commit 规范（commitlint + Husky `commit-msg`）：
  - 例：`feat: add build info utility with tests`
  - 违反规范会被拒绝提交

---

## 9. 安全与依赖治理（Dependabot、CodeQL、Gitleaks）
- Dependabot：每周创建 npm / actions 升级 PR
- CodeQL：JS/TS 代码安全分析
- Gitleaks：凭据与敏感信息扫描（通过 `.gitleaks.toml` 忽略产物如 coverage/dist）
- 风格与换行：`.editorconfig`/`.gitattributes` 统一 LF、编码、缩进

---

## 10. 多代理并发（git worktree 脚本）
- 脚本：`scripts/worktree.ps1`

```powershell
param([Parameter(Mandatory=$true)][string]$Name,[Parameter(Mandatory=$true)][string]$Base='main')
git worktree add -b $Name ../zen-tasks-$Name $Base
# 回收：git worktree remove ../zen-tasks-$Name
```

- 用法：给每个 SubAgent 分配独立工作区（互不干扰），完成任务后回收。

---

## 11. PR 演示流（小功能 + 规范提交 + CI 检查）
- 新增 `getBuildInfo()`（`src/utils/buildInfo.ts`/`.test.ts`）
- 创建分支并提交：

```powershell
git checkout -b feat/build-info
git add .
git commit -m "feat: add build info utility with tests"
git push -u origin feat/build-info
```

- 打开 PR：`https://github.com/DHKun/zen-tasks/pull/new/feat/build-info`
- 合并后：Release 自动发版并更新 CHANGELOG，CI 上传覆盖率并更新 README 徽章

---

## 12. Windows PowerShell 踩坑与修复
- CRLF/LF 警告：使用 `.gitattributes` 与 `.editorconfig` 统一 LF
- Node ESM 与脚本：项目 `"type":"module"` 时，工具脚本用 `.cjs`，避免 `require` 报错
- Vitest 选项：不支持 `--watchAll`（Jest 专用）
- 测试隔离：`setup.ts` 中 `afterEach(cleanup)`

---

## 13. 与三篇文章的“理念→落地”映射表
- 万字最佳实践：
  - CLAUDE.md / 目录级 claude.md → 记忆与上下文工程
  - Hooks 四阶段（Pre/Post/Notification/Stop）→ 自动化与守护
  - TDD-first → 我用“先测后实现”的红绿循环搭小功能链
  - 最小权限与敏感目录硬阻断 → PreToolUse Hook
- 进阶上篇：
  - MCP 与上下文工程 → 结构化记忆与 RIGHT（Retrieve/Integrate/Generate/Harmonize/Track）
  - 性能与大项目治理 → “改动就近测试”、索引/摘要化思路（我用 related-tests.cjs）
  - VS Code/CLI 技巧 → 这里落地到 CLI（PowerShell 差异、脚本化）
- 进阶下篇：
  - 多代理并行 → git worktree 脚本 + 分支隔离
  - Context Engineering → 分层 claude.md 与节律化项目总结（文档节）
  - TDD Guard 思想 → Stop Hook 阶段强制测试与失败阻断

---

## 14. 常见问题（FAQ）
- 提交被拒：`commitlint` 不通过
  - 用 Conventional Commits，如 `feat: ...`、`fix: ...`
- 脚本 `require` 报错（ESM 项目）
  - 把工具脚本改为 `.cjs`，或切 CommonJS 项目
- `Unknown option --watchAll`（Vitest）
  - 移除；这是 Jest 的选项
- 相关测试没触发
  - 检查是否正确设置 `$env:CLAUDE_FILE_PATHS`；或直接跑全量 `npm test`
- Codecov 徽章不显示
  - 仓库 Secrets 添加 `CODECOV_TOKEN`；等一次 CI 完成

---

## 15. 关键文件与脚本索引（含示例）
- 记忆/规范：`CLAUDE.md`、`src/components/claude.md`、`src/api/claude.md`
- Hooks：`.claude/settings.toml`
- 测试：`vite.config.ts`、`src/test/setup.ts`
- 质量：`.husky/pre-commit`、`.husky/commit-msg`、`.lintstagedrc.json`、`.prettierrc.json`、`eslint.config.js`
- CI/CD：`.github/workflows/ci.yml`、`release.yml`、`scripts/ci/update-badges.cjs`
- 安全：`dependabot.yml`、`codeql.yml`、`gitleaks.yml`、`.gitleaks.toml`
- 并发：`scripts/worktree.ps1`
- Claude：`scripts/claude/related-tests.cjs`、`scripts/claude/format-changed.cjs`、`scripts/claude/notify.cjs`

> 提示：若文件在你本地被误删，可从 Git 历史恢复；CI 会在缺失关键文件时失败提醒。

---

## 16. 一键复刻指南
1) 复制 `.claude/`、`scripts/`、`.husky/`、`.github/`、`.gitleaks.toml`、`.editorconfig`、`.gitattributes` 与相关配置文件到你的仓库
2) 修改 `CLAUDE.md` 与分层 `claude.md`
3) 把 README 中徽章 `OWNER/REPO` 替换为你的仓库（或复用 `update-badges.cjs`）
4) 仓库 Secrets 添加 `CODECOV_TOKEN`
5) 新开分支做一个小功能，按 TDD 提交 PR，验证 CI/Release 全绿

---

## 17. 结语
- 工具换一家都能复用的，是“工程约束与流程”：
  - 记忆与上下文工程（CLAUDE.md）
  - 自动化守护（Hooks）
  - 质量闸门（TDD/覆盖率/提交规范）
  - 可持续（依赖与安全治理、CI/CD）
  - 并发协作（worktree 多工作区 + SubAgent）
- 最后：先让流水线“跑起来”，再不断打磨细节（格式、规则、通知、发布），这是最符合 ROI 的路径。
