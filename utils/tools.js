const fs = require('fs');
const path = require('path');

// 自动获取Vite项目的端口（支持默认值和自定义配置）
const getVitePort = () => {
    // Vite配置文件的可能路径
    const viteConfigPaths = [
        'vite.config.js',
        'vite.config.mjs',
        'vite.config.ts', // TypeScript版本
    ];

    // 1. 查找项目中是否存在Vite配置文件
    let configPath = null;
    for (const path of viteConfigPaths) {
        if (fs.existsSync(path)) {
            configPath = path;
            break;
        }
    }

    // 2. 如果没有配置文件，使用Vite默认端口（开发环境5173）
    if (!configPath) {
        console.log('🔍 未找到Vite配置文件，使用默认端口5173');
        return 5173;
    }

    // 3. 如果有配置文件，尝试解析端口（处理ES Module和CommonJS两种格式）
    try {
        // 读取配置文件内容（不直接require，避免TypeScript或ES Module解析问题）
        const configContent = fs.readFileSync(configPath, 'utf8');

        // 正则匹配server.port配置（支持各种写法）
        // 例如：server: { port: 8080 } 或 server.port = 8080
        const portMatch = configContent.match(/server\s*:\s*\{\s*port\s*:\s*(\d+)\s*\}/)
            || configContent.match(/server\.port\s*=\s*(\d+)/);

        if (portMatch && portMatch[1]) {
            // 找到用户自定义端口
            const port = Number(portMatch[1]);
            console.log(`🔍 从Vite配置中获取到端口：${port}`);
            return port;
        } else {
            // 配置文件中没有指定port，使用Vite默认端口
            console.log('🔍 Vite配置中未指定端口，使用默认端口5173');
            return 5173;
        }
    } catch (e) {
        // 解析失败时（如TypeScript语法无法直接解析），降级使用默认端口
        console.log('⚠️ 解析Vite配置文件失败，使用默认端口5173');
        return 5173;
    }
};
module.exports = {
    getVitePort,
}
