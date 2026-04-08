# CLAUDE.md

本文件为Claude Code（claude.ai/code）处理此代码库中的代码提供指导。

## 项目概述

Favicon 是一个有趣的 JavaScript 库，可在浏览器 favicon 中创建交互式内容。它允许用户在 favicon（网站图标）中播放视频、使用摄像头监控、玩贪食蛇游戏等，旨在为用户提供一种“摸鱼”工具。

## 常用命令

由于这是一个纯 JavaScript 项目，没有构建系统，开发主要涉及：

1. **运行演示**：直接在浏览器中打开 `index.html` 文件
2. **测试功能**：
   - 点击“视频”链接：在 favicon 中播放视频，使用方向键控制进度和音量
   - 点击“摄像头”链接：在 favicon 中显示摄像头画面，带怀旧滤镜
   - 点击“贪食蛇”链接：在 favicon 中玩贪食蛇游戏
3. **开发服务器**：可使用任何静态文件服务器，如 `python -m http.server` 或 `npx serve`

## 代码架构

### 核心文件
- **[icon.js](icon.js)**：主库文件，包含所有功能
- **[index.html](index.html)**：演示页面
- **[demo.md](demo.md)**：详细的使用说明和实现原理

### 主要组件

1. **全局函数 `setFavico(canvas)`**：
   - 将 canvas 内容转换为 data URL 并设置为页面 favicon
   - 支持检测和更新现有的 favicon 链接

2. **`Icon` 类**（视频和摄像头功能）：
   - `initVideo(url)`：初始化视频播放器
   - `initCam()`：初始化摄像头
   - `videoToImage()`：将视频帧渲染到 favicon
   - `videoToImageByFilter()`：应用滤镜（怀旧、灰色等）并渲染
   - 键盘控制：方向键控制视频进度和音量

3. **`Snake` 类**（贪食蛇游戏）：
   - `init()`：初始化游戏
   - `move()`：处理蛇的移动逻辑
   - `setFood()`：随机放置食物
   - `drawCanvas()`：渲染游戏到 favicon
   - 使用 localStorage 保存最高分

4. **全局配置**：
   - 通过 `window.ictype` 设置功能类型：`'video'`、`'camera'`、`'snake'`
   - 通过 `window.vurl` 设置自定义视频 URL（可选）

### 关键技术
- **Canvas API**：所有视觉效果通过 `<canvas>` 实现
- **WebRTC**：摄像头访问
- **Favicon 动态更新**：通过修改 `<link rel="icon">` 的 href
- **键盘事件**：方向键控制视频和游戏

## 开发指南

### 添加新功能
1. 在 `icon.js` 中添加新的类或扩展现有类
2. 如果需要新的全局类型，更新文件末尾的条件判断
3. 在 `index.html` 中添加测试链接
4. 在 `demo.md` 中添加文档

### 代码风格
- 使用 ES6 类语法
- 变量和函数使用 camelCase
- 中文注释（项目主要面向中文用户）

### 测试注意事项
- 摄像头功能需要 HTTPS 环境或 localhost
- 视频功能需要处理跨域资源（CORS）
- 贪食蛇游戏使用 localStorage 存储最高分

### 扩展思路
项目提到可以进一步扩展的功能：
- 俄罗斯方块、坦克大战等其他 30×30 像素游戏
- 人脸识别（检测老板或笑容）
- 更多滤镜效果

## 部署和使用

### CDN 使用
```html
<script src="https://cdn.jsdelivr.net/gh/a552422934/Favicon@0.1/icon.js"></script>
```

### 自定义使用
```javascript
// 视频模式
window.ictype = 'video';
window.vurl = '你的视频URL'; // 可选，默认为演示视频

// 摄像头模式  
window.ictype = 'camera';

// 贪食蛇模式
window.ictype = 'snake';

// 然后加载 icon.js
```

### 项目地址
- GitHub: https://github.com/a552422934/Favicon
- 演示视频和图片存储在阿里云 OSS