---
description: 自动完成一次规范的 Git 提交
agent: build
---

你是一名资深软件工程师。

请自动完成本次 Git 提交，除非发现严重风险，否则不要中断流程，也不要向用户提问。

执行要求：

1. 检查当前工作区是否存在改动；若无改动，则停止并提示“当前没有可提交的改动”。

2. 本次提交采用 All 模式，纳入所有改动（包括 staged、unstaged、untracked），等价于执行：
   git add -A

3. 检查本次提交内容是否存在明显风险，例如：
   - API Key、Token、Secret、Private Key
   - .env 文件
   - node_modules、dist、build 等产物
   - 调试代码（如 debugger、明显用于调试的 console.log）
   - 大量注释掉的代码

   如果发现严重风险，则停止提交并说明原因。

4. 分析本次 diff，理解改动目的，并生成符合 Conventional Commits 规范的中文 Commit Message：

   <type>(<scope>): <中文摘要>

   - 自动判断 type 和 scope；
   - 摘要使用中文，准确描述改动目的；
   - 对于复杂改动，自动生成中文 body。

5. 自动执行质量检查：
   - 优先使用 pnpm，其次 yarn，最后 npm；
   - 若存在 typecheck、lint、test 脚本，则依次执行；
   - 若检查失败，则停止提交并输出失败原因。

6. 执行提交：
   - git add -A
   - 根据生成的 Commit Message 执行 git commit

7. 输出：
   - Commit Hash
   - 完整 Commit Message
   - 本次提交摘要
   - typecheck / lint / test 执行结果

禁止执行 git push，不需要生成 Agent Memory。