#!/usr/bin/env node
const { execSync } = require('child_process');
const { getVitePort } = require('./utils/tools');
const bannerMain = require('./utils/bannerMain');
const fs = require('fs');
const path = require('path');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const dependencies = pkg.dependencies || {};
let projectType = '';
if (dependencies.vue) {
  projectType = 'Vue';
} else if (dependencies.react) {
  projectType = 'React';
} else {
  projectType = 'Other';
}
// 检查是否在项目根目录（有package.json）
const checkProjectRoot = () => {
  if (!fs.existsSync('package.json')) {
    console.error('❌ 错误：请在项目根目录运行（需有package.json）');
    process.exit(1);
  }
  console.log('✅ 确认在项目根目录');
};

// 安装Electron及相关依赖
const installDependencies = () => {
  console.log('📦 开始安装Electron及依赖...');
  try {
    // 安装核心依赖
    execSync('npm install electron --save-dev', { stdio: 'inherit' });
    execSync('npm install electron-is-dev --save', { stdio: 'inherit' });
    console.log('✅ 依赖安装完成');
  } catch (error) {
    console.error('❌ 依赖安装失败：', error.message);
    process.exit(1);
  }
};

// 创建Electron主进程文件
const createMainProcessFile = () => {


  const mainContent = `${bannerMain}`;

  // 创建预加载脚本（空文件，用于后续扩展）
  const preloadContent = `// 预加载脚本示例
// 可以在这里定义渲染进程需要的API
window.addEventListener('DOMContentLoaded', () => {
  // 示例：暴露版本信息给前端
  window.electron = {
    version: process.versions.electron
  };
});
`;

  try {
    // 创建electron目录
    if (!fs.existsSync('electron')) {
      fs.mkdirSync('electron');
    }

    // 写入主进程文件
    fs.writeFileSync('electron/background.js', mainContent);
    fs.writeFileSync('electron/electron-preload.js', preloadContent);
    console.log('✅ 已创建Electron主进程文件');
  } catch (error) {
    console.error('❌ 创建文件失败：', error.message);
    process.exit(1);
  }
};

// 修改package.json，添加启动脚本
const updatePackageJson = () => {
  try {
    const pkgPath = path.join(process.cwd(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    // 添加Electron启动脚本
    pkg.scripts = {
      ...pkg.scripts,
      "electron:start": "electron ./electron/background.js",
      "electron:dev": "concurrently \"npm start\" \"wait-on http://localhost:3000 && electron ./electron/background.js\""
    };

    // 安装concurrently和wait-on（开发依赖）
    console.log('📦 安装开发辅助工具...');
    execSync('npm install concurrently wait-on --save-dev', { stdio: 'inherit' });

    // 保存修改
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log('✅ 已更新package.json，添加启动脚本');
  } catch (error) {
    console.error('❌ 更新package.json失败：', error.message);
    process.exit(1);
  }
};
// 检测项目类型（Vue/React）并调整配置
const detectProjectType = () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = pkg.dependencies || {};

  if (dependencies.vue) {
    console.log('🔍 检测到Vue项目，自动调整配置...');
    // 修改Electron主进程中的端口和路径（Vue默认8080端口）
    const mainPath = 'electron/background.js';
    let content = fs.readFileSync(mainPath, 'utf8');
    content = content.replace('http://localhost:3000', 'http://localhost:8080');
    content = content.replace('../build/index.html', 'dist/index.html');
    fs.writeFileSync(mainPath, content);

    // 更新脚本中的启动命令
    const pkgPath = 'package.json';
    let pkgContent = fs.readFileSync(pkgPath, 'utf8');
    pkgContent = pkgContent.replace('"npm start"', '"npm run serve"');
    pkgContent = pkgContent.replace('wait-on http://localhost:3000', 'wait-on http://localhost:8080');
    fs.writeFileSync(pkgPath, pkgContent);
  } else if (dependencies.react) {
    console.log('🔍 检测到React项目，配置已适配');
  } else {
    console.log('🔍 未检测到Vue/React，使用默认配置');
  }
};

// 显示使用帮助
const showHelp = () => {
  console.log('\n🎉 Electron 配置完成！可用命令：');
  console.log('  - 开发模式（带热重载）: npm run electron:dev');
  console.log('  - 直接启动Electron: npm run electron:start');
  console.log('\n注意：开发模式会同时启动你的Web服务器和Electron');
};

// 主流程
const main = () => {
  console.log('🚀 开始配置Electron环境...');
  checkProjectRoot();
  installDependencies();
  createMainProcessFile();
  updatePackageJson();
  detectProjectType();
  showHelp();
  console.log('\n✨ 所有操作完成！');
};

// 执行主流程
main();
