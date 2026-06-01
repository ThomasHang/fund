/**
 * 基金 API 调用模块
 * 使用天天基金网的 JSONP 接口获取基金估值数据
 */

const FundAPI = {
    /**
     * 获取基金实时估值
     * @param {string} fundCode - 基金代码
     * @returns {Promise} 基金数据
     */
    getFundEstimate(fundCode) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            const timeout = setTimeout(() => {
                cleanup();
                reject(new Error('请求超时'));
            }, 10000);

            function cleanup() {
                clearTimeout(timeout);
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            }

            // API 使用固定的回调名 jsonpgz
            window.jsonpgz = function(data) {
                cleanup();
                resolve(data);
            };

            script.src = `https://fundgz.1234567.com.cn/js/${fundCode}.js?rt=${Date.now()}`;
            script.onerror = function() {
                cleanup();
                reject(new Error('网络错误'));
            };

            document.head.appendChild(script);
        });
    },

    /**
     * 批量获取基金估值（串行请求，避免回调冲突）
     * @param {Array} fundCodes - 基金代码数组
     * @returns {Promise} 基金数据数组
     */
    async getBatchFundEstimate(fundCodes) {
        const results = [];

        for (const code of fundCodes) {
            try {
                const data = await this.getFundEstimate(code);
                results.push(data);
            } catch (error) {
                results.push({
                    fundcode: code,
                    name: '获取失败',
                    error: true
                });
            }
        }

        return results;
    }
};
