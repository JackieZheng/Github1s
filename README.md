# Github1s 油猴脚本 · 仓库页快捷入口

在 GitHub 任意仓库页的操作栏（Pin / Watch / Fork / Star 之前）注入三个自定义按钮，
一键在新标签页打开对应的代码浏览 / AI 辅助镜像站，省去手动改域名的麻烦。

## 功能特性

- **Github1s**：将 `github.com` 替换为 `github1s.com`，用 VS Code 在线读码
- **GitMcp**：将 `github.com` 替换为 `gitmcp.io`，为当前仓库提供 MCP 服务入口
- **GitDiagram**：将 `github.com` 替换为 `gitdiagram.com`，一键生成仓库结构图
- 三个按钮均以新标签页打开，不会离开正在浏览的仓库页
- 自动锚定 GitHub 操作栏，兼容页面重构与 SPA 软导航，按钮不会因局部刷新而消失

## 安装

1. 给浏览器安装 Tampermonkey（或兼容的用户脚本管理器）
2. 打开仓库中的 `Github1s.user.js`，按提示完成安装
   （也可直接访问该文件的 Raw 地址进行安装）

## 兼容性

- 作用范围：匹配 `https://github.com/*/*` 的仓库页
- 选择器策略：优先使用 GitHub 长期稳定的公共容器 `pagehead-actions`，
  当该容器失效时降级到 `data-testid` 与 Star / Fork 路由锚点，
  不依赖会随构建变化的混淆 class
- 持久化策略：通过持续观察 DOM 并监听 `turbo:render` / `popstate`，
  应对 GitHub 的水合与软导航整体替换，按钮始终保留在操作栏最前

## 原理简述

脚本启动后查找仓库页操作栏，在其中第一个按钮之前插入三个 `<li>` 按钮；
每个按钮点击时把当前地址的 `github.com` 替换为目标域名并新开标签页。
由于 GitHub 会用 Turbo / React 重新渲染该区域，脚本采用持续监听 + 去重
（已注入则跳过）的方式保证按钮长期存在。

## 许可证

MIT

## 参考

- 上游 Github1s 项目：https://github.com/conwnet/github1s
