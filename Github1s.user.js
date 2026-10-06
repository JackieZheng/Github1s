// ==UserScript==
// @name         Github1s
// @namespace    https://github.com/JackieZheng/Github1s
// @version      1.9
// @description  One second to read GitHub code with VS Code.
// @author       JackieZheng
// @match        https://github.com/*/*
// @supportURL   https://github.com/JackieZheng/Github1s/issues
// @icon         https://github1s.com/favicon.ico
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    GM_addStyle(`
        anchored-position { display: none !important; }
        anchored-position[class$="popover-open"] { display: block !important; }
        .github1s-custom-btn { margin-right: 4px; }
    `);

    const buttons = [
        { text: 'Github1s', host: 'github1s.com' },
        { text: 'GitMcp', host: 'gitmcp.io' },
        { text: 'GitDiagram', host: 'gitdiagram.com' }
    ];

    function createButton({ text, host }) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'btn btn-sm btn-primary github1s-custom-btn';
        a.textContent = text;
        a.href = '#';
        li.appendChild(a);

        li.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(top.location.href.replace('github.com', host), '_blank', 'noopener');
        });
        return li;
    }

    function findToolbar() {
        // 1) 首选：GitHub 长期稳定的公共 class（实测 2026 仍用，非混淆，比任何 module class 都稳）
        let toolbar = document.querySelector('ul.pagehead-actions');

        // 2) 兼容新版重构页面（若未来 pagehead-actions 退役）
        if (!toolbar) {
            toolbar =
                document.querySelector('[data-testid="repository-actions"]') ||
                document.querySelector('[data-testid="repo-actions"]') ||
                document.querySelector('[data-testid="repo-header-actions"]');
        }

        // 3) 通过 Star 链接向上找容器（路由约定稳定）
        if (!toolbar) {
            const starBtn =
                document.querySelector('a[href$="/stargazers"]') ||
                document.querySelector('a[href*="/stargazers"]');
            if (starBtn) toolbar = starBtn.closest('ul');
        }

        // 4) 通过 Fork 链接向上找容器
        if (!toolbar) {
            const forkBtn = document.querySelector('a[href$="/fork"]');
            if (forkBtn) toolbar = forkBtn.closest('ul');
        }

        return toolbar;
    }

    function inject() {
        const toolbar = findToolbar();
        if (!toolbar) return false;

        // 防止重复注入（SPA 局部刷新时会再次触发）
        if (toolbar.querySelector('.github1s-custom-btn')) return true;

        const firstLi = toolbar.querySelector(':scope > li');
        // 倒序插入，使最终顺序与 buttons 数组一致，且都位于原第一个按钮之前（即最前面）
        for (let i = buttons.length - 1; i >= 0; i--) {
            toolbar.insertBefore(createButton(buttons[i]), firstLi);
        }
        return true;
    }

    // 持续监听：GitHub 用 Turbo / React 做水合与软导航，会整体替换 action bar 节点，
    // 旧按钮随之消失。观察器不再 disconnect——inject 内部已做去重（.github1s-custom-btn
    // 已存在则跳过），实现幂等；用 requestAnimationFrame 节流避免频繁回调影响性能。
    let scheduled = false;
    function scheduleInject() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => {
            scheduled = false;
            inject();
        });
    }

    // 观察 <html> 而非 <body>：软导航时 <body> 会被整体替换，观察 <html> 才能捕获该变化
    const observer = new MutationObserver(scheduleInject);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    // 软导航 / 浏览器前进后退时强制重注入
    document.addEventListener('turbo:render', scheduleInject);
    window.addEventListener('popstate', scheduleInject);

    inject();
})();
