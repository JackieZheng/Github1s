// ==UserScript==
// @name         Github1s
// @namespace    https://github.com/JackieZheng/Github1s
// @version      1.11
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

        /* 下拉容器：只占一个按钮宽度，不再撑宽操作栏 */
        .github1s-wrap { position: relative; display: inline-block; margin-right: 4px; }
        .github1s-main {
            border-top-right-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
            margin-right: 0 !important;
        }
        .github1s-caret {
            border-top-left-radius: 0 !important;
            border-bottom-left-radius: 0 !important;
            margin-left: -1px !important;
            width: 22px;
        }
        .github1s-menu {
            position: absolute;
            top: 100%;
            left: 0;
            z-index: 100;
            margin: 4px 0 0;
            padding: 4px 0;
            list-style: none;
            background: #fff;
            border: 1px solid #d0d7de;
            border-radius: 6px;
            box-shadow: 0 8px 24px rgba(140,149,159,.2);
            min-width: 150px;
        }
        .github1s-menu li > a {
            display: block;
            padding: 4px 14px;
            color: #24292f;
            font-size: 12px;
            line-height: 20px;
            white-space: nowrap;
            text-decoration: none;
            cursor: pointer;
        }
        .github1s-menu li > a:hover { background: #f6f8fa; color: #0969da; }
    `);

    const buttons = [
        { text: 'Github1s', host: 'github1s.com' },
        { text: 'GitMcp', host: 'gitmcp.io' },
        { text: 'GitDiagram', host: 'gitdiagram.com' },
        { text: 'DeepWiki', host: 'deepwiki.com' },
        { text: 'Zread', host: 'zread.ai' },
        { text: 'GitIngest', host: 'gitingest.com' }
    ];

    function openHost(host) {
        window.open(top.location.href.replace('github.com', host), '_blank', 'noopener');
    }

    // 单个下拉按钮：主按钮 = 默认项(Github1s)，箭头展开全部镜像站
    function createDropdown() {
        const li = document.createElement('li');
        li.className = 'github1s-wrap';

        const main = document.createElement('button');
        main.type = 'button';
        main.className = 'btn btn-sm btn-primary github1s-main';
        main.textContent = buttons[0].text;
        main.addEventListener('click', () => {
            openHost(buttons[0].host);
            menu.hidden = true;
        });

        const caret = document.createElement('button');
        caret.type = 'button';
        caret.className = 'btn btn-sm btn-primary github1s-caret';
        caret.setAttribute('aria-label', '更多镜像站');
        caret.textContent = '▾';

        const menu = document.createElement('ul');
        menu.className = 'github1s-menu';
        menu.hidden = true;
        buttons.forEach(({ text, host }) => {
            const mi = document.createElement('li');
            const a = document.createElement('a');
            a.textContent = text;
            a.href = '#';
            a.addEventListener('click', (e) => {
                e.preventDefault();
                openHost(host);
                menu.hidden = true;
            });
            mi.appendChild(a);
            menu.appendChild(mi);
        });

        caret.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            menu.hidden = !menu.hidden;
        });

        li.appendChild(main);
        li.appendChild(caret);
        li.appendChild(menu);
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
        if (toolbar.querySelector('.github1s-wrap')) return true;

        const firstLi = toolbar.querySelector(':scope > li');
        // 只注入一个下拉按钮，位于原第一个按钮之前（最前面）
        toolbar.insertBefore(createDropdown(), firstLi);
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

    // 点击页面其它地方时关闭已展开的下拉菜单（只注册一次）
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.github1s-wrap')) {
            document.querySelectorAll('.github1s-menu:not([hidden])').forEach((m) => { m.hidden = true; });
        }
    });

    inject();
})();
