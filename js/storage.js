/**
 * 本地存储管理模块
 * 管理收藏的基金列表
 */

const Storage = {
    STORAGE_KEY: 'fund_watchlist',

    /**
     * 获取收藏列表
     * @returns {Array} 基金代码数组
     */
    getWatchlist() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('读取收藏列表失败:', e);
            return [];
        }
    },

    /**
     * 添加基金到收藏
     * @param {string} fundCode - 基金代码
     * @returns {boolean} 是否添加成功
     */
    addToWatchlist(fundCode) {
        try {
            const list = this.getWatchlist();
            if (!list.includes(fundCode)) {
                list.push(fundCode);
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
            }
            return true;
        } catch (e) {
            console.error('添加收藏失败:', e);
            return false;
        }
    },

    /**
     * 从收藏中移除基金
     * @param {string} fundCode - 基金代码
     * @returns {boolean} 是否移除成功
     */
    removeFromWatchlist(fundCode) {
        try {
            let list = this.getWatchlist();
            list = list.filter(code => code !== fundCode);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
            return true;
        } catch (e) {
            console.error('移除收藏失败:', e);
            return false;
        }
    },

    /**
     * 检查基金是否已收藏
     * @param {string} fundCode - 基金代码
     * @returns {boolean} 是否已收藏
     */
    isInWatchlist(fundCode) {
        return this.getWatchlist().includes(fundCode);
    }
};
