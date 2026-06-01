/**
 * 主应用逻辑模块
 */

const App = {
    // 自动刷新定时器
    refreshTimer: null,
    // 刷新间隔（毫秒）
    REFRESH_INTERVAL: 30000,

    /**
     * 初始化应用
     */
    init() {
        this.bindEvents();
        this.loadWatchlist();
        this.startAutoRefresh();
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 搜索按钮
        document.getElementById('searchBtn').addEventListener('click', () => this.searchFund());
        // 搜索输入框回车
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchFund();
        });
        // 刷新按钮
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadWatchlist());
    },

    /**
     * 搜索基金
     */
    async searchFund() {
        const input = document.getElementById('searchInput');
        const fundCode = input.value.trim();

        if (!fundCode) {
            this.showToast('请输入基金代码');
            return;
        }

        const resultDiv = document.getElementById('searchResult');
        resultDiv.innerHTML = '<div class="loading">查询中...</div>';

        try {
            const data = await FundAPI.getFundEstimate(fundCode);
            this.renderSearchResult(data);
        } catch (error) {
            resultDiv.innerHTML = `<div class="error">查询失败: ${error.message}</div>`;
        }
    },

    /**
     * 渲染搜索结果
     */
    renderSearchResult(data) {
        const resultDiv = document.getElementById('searchResult');
        const isWatched = Storage.isInWatchlist(data.fundcode);

        const changeClass = parseFloat(data.gszzl) >= 0 ? 'up' : 'down';
        const changeSign = parseFloat(data.gszzl) >= 0 ? '+' : '';

        resultDiv.innerHTML = `
            <div class="fund-card search-result-card">
                <div class="fund-header">
                    <span class="fund-code">${data.fundcode}</span>
                    <span class="fund-name">${data.name}</span>
                    <button class="btn-watchlist ${isWatched ? 'watched' : ''}"
                            onclick="App.toggleWatchlist('${data.fundcode}')">
                        ${isWatched ? '已收藏' : '+ 收藏'}
                    </button>
                </div>
                <div class="fund-body">
                    <div class="fund-nav">
                        <div class="nav-item">
                            <span class="nav-label">最新净值</span>
                            <span class="nav-value">${data.dwjz}</span>
                        </div>
                        <div class="nav-item">
                            <span class="nav-label">估算净值</span>
                            <span class="nav-value">${data.gsz}</span>
                        </div>
                        <div class="nav-item">
                            <span class="nav-label">估算涨跌</span>
                            <span class="nav-value ${changeClass}">${changeSign}${data.gszzl}%</span>
                        </div>
                    </div>
                    <div class="fund-time">
                        净值日期: ${data.jzrq} | 估值时间: ${data.gztime}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * 切换收藏状态
     */
    toggleWatchlist(fundCode) {
        if (Storage.isInWatchlist(fundCode)) {
            Storage.removeFromWatchlist(fundCode);
            this.showToast('已取消收藏');
        } else {
            Storage.addToWatchlist(fundCode);
            this.showToast('已添加到收藏');
        }
        // 只更新按钮状态，不重新搜索
        this.updateWatchlistButton(fundCode);
        // 刷新收藏列表
        this.loadWatchlist();
    },

    /**
     * 更新收藏按钮状态
     */
    updateWatchlistButton(fundCode) {
        const btns = document.querySelectorAll('.btn-watchlist');
        btns.forEach(btn => {
            if (btn.onclick && btn.onclick.toString().includes(fundCode)) {
                const isWatched = Storage.isInWatchlist(fundCode);
                btn.className = `btn-watchlist ${isWatched ? 'watched' : ''}`;
                btn.textContent = isWatched ? '已收藏' : '+ 收藏';
            }
        });
    },

    /**
     * 加载收藏列表
     */
    async loadWatchlist() {
        const watchlist = Storage.getWatchlist();
        const container = document.getElementById('watchlist');

        if (watchlist.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <div class="empty-text">还没有收藏的基金</div>
                    <div class="empty-hint">搜索基金代码后点击"收藏"添加</div>
                </div>
            `;
            return;
        }

        container.innerHTML = '<div class="loading">加载中...</div>';

        try {
            const funds = await FundAPI.getBatchFundEstimate(watchlist);
            this.renderWatchlist(funds);
        } catch (error) {
            container.innerHTML = `<div class="error">加载失败: ${error.message}</div>`;
        }
    },

    /**
     * 渲染收藏列表
     */
    renderWatchlist(funds) {
        const container = document.getElementById('watchlist');

        container.innerHTML = funds.map(fund => {
            if (fund.error) {
                return `
                    <div class="fund-card error-card">
                        <div class="fund-header">
                            <span class="fund-code">${fund.fundcode}</span>
                            <span class="fund-name">数据获取失败</span>
                            <button class="btn-remove" onclick="App.removeFund('${fund.fundcode}')">删除</button>
                        </div>
                    </div>
                `;
            }

            const changeClass = parseFloat(fund.gszzl) >= 0 ? 'up' : 'down';
            const changeSign = parseFloat(fund.gszzl) >= 0 ? '+' : '';

            return `
                <div class="fund-card">
                    <div class="fund-header">
                        <span class="fund-code">${fund.fundcode}</span>
                        <span class="fund-name">${fund.name}</span>
                        <button class="btn-remove" onclick="App.removeFund('${fund.fundcode}')">删除</button>
                    </div>
                    <div class="fund-body">
                        <div class="fund-nav">
                            <div class="nav-item">
                                <span class="nav-label">最新净值</span>
                                <span class="nav-value">${fund.dwjz}</span>
                            </div>
                            <div class="nav-item">
                                <span class="nav-label">估算净值</span>
                                <span class="nav-value">${fund.gsz}</span>
                            </div>
                            <div class="nav-item">
                                <span class="nav-label">估算涨跌</span>
                                <span class="nav-value ${changeClass}">${changeSign}${fund.gszzl}%</span>
                            </div>
                        </div>
                        <div class="fund-time">
                            净值日期: ${fund.jzrq} | 估值时间: ${fund.gztime}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * 从收藏中移除基金
     */
    removeFund(fundCode) {
        if (confirm('确定要从收藏中移除吗？')) {
            Storage.removeFromWatchlist(fundCode);
            this.loadWatchlist();
            this.showToast('已移除');
        }
    },

    /**
     * 开始自动刷新
     */
    startAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        this.refreshTimer = setInterval(() => {
            this.loadWatchlist();
        }, this.REFRESH_INTERVAL);
    },

    /**
     * 显示提示消息
     */
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 2000);
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
