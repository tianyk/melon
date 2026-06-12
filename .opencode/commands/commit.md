---
description: 自动完成一次规范的 Git 提交
agent: build
---

你是一名经验丰富的软件工程师。

你的任务是自动完成一次高质量的 Git 提交。

执行原则：

- 尽可能自主决策；
- 不要向用户提问；
- 不要要求用户确认；
- 本命令执行完成后，应直接产生一次 commit；
- 除非发现严重风险，否则不要中断流程；
- 严禁执行 git push。

请严格按照以下步骤执行。

## 第一步：检查是否存在可提交内容

检查当前 Git 工作区状态。

如果不存在以下任意内容：

- staged changes
- unstaged changes
- untracked files

则停止执行，并输出：

当前没有可提交的改动。

## 第二步：纳入所有改动

执行等价于：

git add -A

本次提交范围包括：

- 已暂存文件；
- 未暂存文件；
- 未跟踪文件。

## 第三步：风险检查

在提交前检查本次改动。

如果发现以下内容，则立即停止提交：

- API Key；
- Access Token；
- Secret；
- Password；
- Private Key；
- .env 文件；
- 证书文件；
- node_modules；
- dist、build 等编译产物；
- 大型二进制文件；
- 明显的临时文件；
- 调试专用代码；
- 大量注释掉的代码。

调试代码包括：

- debugger；
- console.log（仅保留明显用于调试的场景）。

如果发现上述风险：

输出风险说明；

停止执行；

不要生成 commit。

## 第四步：分析改动

分析本次 diff。

总结：

- 本次改动的核心目的；
- 涉及的模块；
- 主要修改内容；
- 潜在影响。

不要简单罗列文件名。

## 第五步：生成 Commit Message

必须遵循 Conventional Commits 规范。

格式：

<type>(<scope>): <中文摘要>

type 只能从以下类型中选择：

- feat：新增功能；
- fix：问题修复；
- refactor：代码重构；
- perf：性能优化；
- docs：文档修改；
- style：代码格式调整；
- test：测试相关；
- build：构建或依赖修改；
- ci：持续集成相关；
- chore：杂项维护；
- revert：回滚提交。

scope 要求：

- 使用英文小写；
- 优先选择主要业务模块；
- 尽可能准确。

例如：

- live
- task
- api
- ui
- auth
- config
- deps

中文摘要要求：

- 必须使用中文；
- 准确描述改动目的；
- 使用动宾结构；
- 不超过 50 个中文字符；
- 禁止使用以下表达：

  - 修改代码；
  - 优化逻辑；
  - 更新文件；
  - 修复问题；
  - 日常维护。

对于复杂改动，需要生成 body。

body 要求：

- 使用中文；
- 使用 bullet list；
- 说明做了什么；
- 必要时说明为什么这样做；
- 不写实现细节流水账；
- 不夸大收益。

示例：

refactor(task): 统一复合任务校验入口

- 抽离公共校验流程，减少重复判断
- 将差异逻辑收敛到独立策略中
- 保持现有业务流程与接口结构不变

## 第六步：自动执行质量检查

自动识别项目类型。

包管理器优先级：

1. pnpm；
2. yarn；
3. npm。

执行规则：

如果存在 typecheck：

执行 typecheck。

如果存在 lint：

执行 lint。

如果存在 test：

执行 test。

如果不存在对应脚本，则跳过。

如果任何检查失败：

输出失败原因；

停止提交；

不要执行 git commit。

## 第七步：执行提交

执行：

git add -A

如果存在 body：

git commit -m "<subject>" -m "<body>"

否则：

git commit -m "<subject>"

不要执行 git push。

## 第八步：输出结果

提交成功后输出：

### Commit Success

Commit Hash：

<hash>

Commit Message：

<完整 commit message>

本次提交摘要：

- 改动目的；
- 涉及模块；
- 核心变更。

质量检查结果：

- typecheck：通过 / 跳过；
- lint：通过 / 跳过；
- test：通过 / 跳过。

最后输出：

当前工作区已清理完成。