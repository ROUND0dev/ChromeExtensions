const LIST_SVG_PATH = `
  <g><path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z"></path></g>
`;

const COMMUNITY_SVG_PATH = `<g><path d="M7.5 7c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5-4.5-2.015-4.5-4.5zm6 0c0-0.828-0.672-1.5-1.5-1.5s-1.5 0.672-1.5 1.5 0.672 1.5 1.5 1.5 1.5-0.672 1.5-1.5zM21 21v-2c0-2.761-2.239-5-5-5H8c-2.761 0-5 2.239-5 5v2h2v-2c0-1.657 1.343-3 3-3h8c1.657 0 3 1.343 3 3v2h2z"></path></g>`;

let myScreenName = null;

function getScreenName() {
    if (myScreenName) return myScreenName;
    const profileLink = document.querySelector('a[data-testid="AppTabBar_Profile_Link"]');
    if (profileLink) {
        myScreenName = profileLink.getAttribute('href').replace('/', '');
        return myScreenName;
    }
    return null;
}

// ヘッダー（フォロー中）を注入する関数
function injectFollowingHeader() {
    const currentPath = window.location.pathname;
    if (currentPath !== '/home' && currentPath !== '/') return;

    const headerContainer = document.querySelector('[data-testid="primaryColumn"]');
    if (headerContainer && !document.getElementById('custom-following-header')) {
        const container = document.createElement('div');
        container.id = 'custom-following-header';
        
        container.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 12px 0;
            background-color: transparent;
            border-bottom: 1px solid rgb(56, 68, 77);
            position: relative;
        `;

        // クリックイベント用のラッパーを作成
        const clickWrapper = document.createElement('div');
        clickWrapper.style.cssText = `
            display: flex;
            align-items: center;
            cursor: pointer;
            padding: 4px 12px;
            border-radius: 9999px;
            transition: background-color 0.2s;
        `;

        clickWrapper.innerHTML = `
            <span style="font-size: 17px; font-weight: 800; color: #e7e9ea;">フォロー中</span>
            <span id="header-arrow" style="margin-left: 4px; font-size: 14px; color: #71767b; transform: translateY(1px);">▼</span>
        `;

        // ホバーエフェクト
        clickWrapper.onmouseover = () => clickWrapper.style.backgroundColor = 'rgba(231, 233, 234, 0.1)';
        clickWrapper.onmouseout = () => clickWrapper.style.backgroundColor = 'transparent';

        // クリック時の挙動
        clickWrapper.onclick = (e) => {
            const realFollowingTab = Array.from(document.querySelectorAll('[role="tab"]'))
                .find(tab => tab.innerText.includes('フォロー中') || tab.innerText.includes('Following'));
            
            if (realFollowingTab) {
                realFollowingTab.click();
            }
        };

        container.appendChild(clickWrapper);
        headerContainer.prepend(container);
    }
}

function injectCommunityToMoreMenu() {
    const screenName = getScreenName();
    if (!screenName) return;

    const menu = document.querySelector('[data-testid="Dropdown"]');
    if (menu && !menu.querySelector('#my-custom-community-link')) {
        const originalItem = menu.querySelector('a[href="/settings"]');
        if (originalItem) {
            const newItem = originalItem.cloneNode(true);
            newItem.id = 'my-custom-community-link';
            newItem.setAttribute('href', `/${screenName}/communities`);
            
            const textSpan = newItem.querySelector('span');
            if (textSpan) textSpan.textContent = 'コミュニティ';
            
            const svg = newItem.querySelector('svg');
            if (svg) svg.innerHTML = COMMUNITY_SVG_PATH;

            menu.prepend(newItem);
        }
    }
}

function mainLoop() {
    const currentPath = window.location.pathname;
    if (currentPath === '/home' || currentPath === '/') {
        // 公式タブを「フォロー中」にするロジック
        const allTabs = Array.from(document.querySelectorAll('[role="tab"]'));
        const followingTab = allTabs.find(tab => 
            tab.innerText.includes('フォロー中') || tab.innerText.includes('Following')
        );

        if (followingTab && followingTab.getAttribute('aria-selected') === 'false') {
            followingTab.click();
        }
        
        // 新しいヘッダーの注入
        injectFollowingHeader();
        document.body.classList.add('hide-tabs');
    } else {
        document.body.classList.remove('hide-tabs');
    }

    const screenName = getScreenName();
    if (screenName) {
        const commBtn = document.querySelector('nav a[href$="/premium_sign_up"]:not([data-is-custom-link="true"])');
        if (commBtn) {
            chrome.storage.sync.get(['targetListId'], (result) => {
                const listId = result.targetListId;
                let listLink = "";
                if (listId) {
                    listLink = `https://x.com/i/lists/${listId}`;
                } else {
                    listLink = `https://x.com/${screenName}/lists`;
                }
                const svg = commBtn.querySelector('svg');
                if (svg && !svg.dataset.modified) {
                    svg.innerHTML = LIST_SVG_PATH;
                    svg.dataset.modified = "true";
                }
                commBtn.setAttribute('href', listLink);
                commBtn.setAttribute('aria-label', 'リスト');
                commBtn.onclick = (e) => {
                    e.preventDefault();
                    // 既にそのURLにいる場合はリロードを防ぐ
                    if (window.location.href !== listLink) {
                    window.location.href = listLink;
                    }
                }
            });
        }
        // もっと見るからコミュニティを表示するための関数（仕様変更により現在呼び出す必要なし）
        //injectCommunityToMoreMenu();
    }
}

const observer = new MutationObserver(mainLoop);
observer.observe(document.body, { childList: true, subtree: true });
mainLoop();