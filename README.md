# Favicon - 在浏览器 Favicon 中创造交互式内容

[![GitHub](https://img.shields.io/github/stars/a552422934/Favicon?style=social)](https://github.com/a552422934/Favicon) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Favicon** 是一个有趣的 JavaScript 库，允许你在浏览器的 favicon（网站图标）中创建动态交互式内容。它可以将视频播放、摄像头监控、小游戏等嵌入到小小的 favicon 中，为用户提供一种独特的"摸鱼"体验。

## ✨ 特性亮点

- 🎥 **视频播放**：在 favicon 中播放视频，支持键盘控制进度和音量
- 📹 **摄像头监控**：实时显示摄像头画面，支持多种滤镜效果
- 🎮 **游戏模式**：内置贪吃蛇与打砖块两款经典游戏，支持快捷键无缝切换，记录最高分
- 🎨 **多种滤镜**：支持灰色、反色、黑白、怀旧等多种滤镜效果
- 🔖 **书签栏快捷启动**：拖拽书签到浏览器书签栏，即可在任意网页快速启动功能
- 📱 **纯前端实现**：无需后端，基于 HTML5 Canvas 和 WebRTC

## 🚀 快速开始

### 方式一：书签栏快捷启动（推荐）⭐

打开 [在线演示页](https://a552422934.github.io/Favicon/)，将下方的功能按钮拖拽到浏览器书签栏：

- 📺 **视频模式**：点击任意网页即可在 favicon 中播放视频
- 📷 **摄像头模式**：点击任意网页即可开启摄像头监控
- 🎮 **游戏模式**：点击任意网页即可开始玩游戏

这种方式最方便，可以在任何网页上快速启动功能！

###  方式二：CDN 引入

```html
<script src="https://cdn.jsdelivr.net/gh/a552422934/Favicon@1.2.0/icon.js"></script>
```

## 📖 使用指南

### 视频播放模式

注意：加载后会弹出输入框让用户输入视频地址，不输入则使用默认视频

**键盘控制**：

- **← / →**：快退/快进 5 秒
- **↑ / ↓**：增加/减少音量 10%

![](img/01-video.gif)

### 摄像头模式

摄像头会自动开启并显示画面，按数字键可切换不同的滤镜效果：
- **1-6**：切换不同滤镜（包括灰色、反色、黑白、怀旧等）

![](img/02-cam.gif)
![](img/02-cam-filter.gif)

### 游戏模式

游戏模式包含两款经典游戏，可以通过键盘数字键无缝切换：

#### 🐍 贪吃蛇游戏
**游戏规则**：

- 使用方向键控制蛇的移动
- 吃到食物增加分数
- 撞到边界或自己游戏结束
- 最高分保存在 localStorage 中

#### 🧱 打砖块游戏
**游戏规则**：
- 使用 ← / → 方向键控制挡板移动
- 反弹小球击碎所有砖块
- 球触底则游戏结束
- 根据击球位置产生不同的反弹角度
- 最高分保存在 localStorage 中

**游戏切换**：
- **按 1**：切换到贪吃蛇游戏
- **按 2**：切换到打砖块游戏

![](img/03-snake.gif)

## 🔧 详细配置

### 全局配置变量
| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `window.ictype` | string | - | 必需：`'video'`、`'camera'` 或 `'game'` |

### API 参考

#### Icon 类
```javascript
const icon = new Icon();

// 初始化视频播放器
icon.initVideo(url); // url: 视频URL，可选

// 初始化摄像头
icon.initCam(); // 异步方法，返回 Promise

// 应用滤镜
icon.videoToImageByFilter();
```

#### SnakeGame 类
```javascript
const snakeGame = new SnakeGame();

// 初始化游戏
snakeGame.init();

// 手动移动（通常由定时器自动调用）
snakeGame.move();

// 设置食物
snakeGame.setFood();
```

#### BreakoutGame 类
```javascript
const breakoutGame = new BreakoutGame();

// 初始化游戏
breakoutGame.init();

// 处理按键事件
breakoutGame.handleKey(event, isDown);
```

### 书签栏脚本原理
书签栏中的脚本会检测是否已加载 Favicon 库，如果未加载则动态注入 CDN 脚本，然后初始化指定模式。这使得你可以在任何网页上使用这些功能。

## 📁 项目结构

```
Favicon/
├── icon.js              # 主文件 - 核心功能模块
├── game.js              # 游戏模块 - 贪吃蛇和打砖块
├── index.html           # 演示页面
├── README.md            # 说明文件
├── favicon.ico          # favicon 图标
├── img/                 # 演示动图
│   ├── 01-video.gif
│   ├── 02-cam.gif
│   ├── 02-cam-filter.gif
│   └── 03-snake.gif
├── CHANGELOG.md         # 更新日志
└── .gitignore           # Git 忽略文件
```

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

### 开发注意事项
- 保持代码简洁，使用中文注释
- 确保所有功能在主流浏览器中正常工作
- 添加新功能时更新 README.md 和 CHANGELOG.md
- 遵循现有的代码风格

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- 来源：[iconjs](https://github.com/shengxinjing/iconjs)，[Animating URLs with Javascript and Emojis](https://matthewrayfield.com/articles/animating-urls-with-javascript-and-emojis/)
- 感谢所有贡献者和使用者

## 📞 联系方式

- GitHub: [@a552422934](https://github.com/a552422934)
- 项目地址: [https://github.com/a552422934/Favicon](https://github.com/a552422934/Favicon)

---

**温馨提示**：本工具旨在提供有趣的开发体验，请在合理合法的范围内使用。摸鱼虽好，可不要耽误正事哦~ 😉

<p align="center">
  <sub>Made with ❤️ by a552422934</sub>
</p>
