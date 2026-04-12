/**
 * Favicon 交互库 - 核心文件
 * 功能：视频播放、摄像头监控、游戏
 * @author a552422934
 * @version 0.4.3
 */

import "./game.js";

const SIDE = 32;
const KEY_MAP = {
  'ArrowLeft': 'left', 'ArrowUp': 'up', 'ArrowRight': 'right', 'ArrowDown': 'down',
  37: 'left', 38: 'up', 39: 'right', 40: 'down',
};

/**
 * 设置页面 favicon
 * @param {HTMLCanvasElement} canvas - 包含最新画面的 Canvas 实例
 */
function setFavico(canvas) {
  const url = canvas.toDataURL('image/png');
  const head = document.querySelector('head');
  // 查找已有的 icon link 标签
  let icons = Array.from(head.querySelectorAll('link')).filter(link => (link.getAttribute('rel') || '').includes('icon'));

  if (icons.length) {
    // 更新已有的 favicon
    icons.forEach(icon => icon.setAttribute('href', url));
  } else {
    // 如果没有则新建并挂载到 head
    const icon = Object.assign(document.createElement('link'), { rel: 'icon', href: url });
    head.appendChild(icon);
  }
}

/**
 * 清理所有实例
 */
function cleanupAll() {
  [window.__faviconInstances, window.__gameInstances].forEach(instances => {
    if (instances) {
      Object.values(instances).forEach(inst => inst?.cleanup?.());
      // 对游戏实例仅清理 current 指针，其他实例清理整个对象
      if (instances === window.__gameInstances) instances.current = null;
      else Object.keys(instances).forEach(key => delete instances[key]);
    }
  });
  document.title = 'Favicon';
}

/**
 * 等待模块加载
 * @param {Function} checkFn - 检查条件函数
 * @param {Function} callback - 条件满足后的回调函数
 * @param {number} retries - 最大重试次数，默认 50 次 (约 5 秒)
 */
function waitFor(checkFn, callback, retries = 50) {
  if (checkFn()) return callback();
  if (retries <= 0) return console.error("模块加载超时");
  setTimeout(() => waitFor(checkFn, callback, retries - 1), 100);
}

window.KEY_MAP = KEY_MAP;
window.setFavico = setFavico;
window.SIDE = SIDE;

/**
 * 图标核心类，负责处理视频流、摄像头流，并渲染至 Favicon
 */
class Icon {
  constructor() {
    // 将当前实例挂载到全局，方便统一管理和清理
    window.__faviconInstances = { icon: this };

    this.canvas = Object.assign(document.createElement("canvas"), { width: SIDE, height: SIDE });
    // 针对高频读取场景优化 Context
    this.ctx = this.canvas.getContext("2d", {willReadFrequently: true });
    this._keydownHandler = e => this.handleKeydown(e);
    this.frameInterval = 100; // 帧间隔时间（100ms 约等于 10fps，适合 favicon）
    this.lastFrame = 0; // 记录上一帧的时间戳
    this.filterMode = 'none'; // 滤镜模式：'none' | 'sepia' | 'grayscale' | 'invert' | 'contrast' | 'brightness'
  }

  /**
   * 初始化视频流
   * @param {string} url - 视频播放地址
   */
  async initVideo(url) {
    this.video = Object.assign(document.createElement("video"), {
      controls: true, crossOrigin: "anonymous", autoplay: true, volume: 0.5, src: url
    });
    // document.body.appendChild(this.video);

    return new Promise((resolve, reject) => {
      // 监听视频数据加载完成
      this.video.onloadeddata = () => {
        this.video.ontimeupdate = () => {
          if (Date.now() - this.lastFrame >= this.frameInterval) {
            this.videoToImageByFilter();
            this.updateProgress();
            this.lastFrame = Date.now();
          }
        };
        // 绑定键盘快捷键控制视频
        document.addEventListener("keydown", this._keydownHandler);
        resolve();
      };
      this.video.onerror = () => reject(new Error("视频加载失败"));
      setTimeout(() => this.video && this.video.readyState < 2 && reject(new Error("加载超时")), 10000);
    });
  }

  /**
   * 初始化本地摄像头流
   */
  async initCam() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("浏览器不支持摄像头");
    this.video = Object.assign(document.createElement("video"), { autoplay: true, muted: true, playsInline: true });
    // document.body.appendChild(this.video);

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      } catch (err) {
        // 修复：刷新页面时摄像头硬件锁尚未释放导致的 NotReadableError (黑屏报错)
        if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          await new Promise(r => setTimeout(r, 800)); // 等待硬件释放
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        } else {
          throw err;
        }
      }

      // 防御性检查：防止等待摄像头期间触发了 cleanup 导致 video 为 null 报错崩溃
      if (!this.video) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      this.video.srcObject = stream;
      this.video.play().catch(e => console.warn("播放失败:", e)); // 显式播放，防止卡在黑屏初始帧

      const loop = (ts) => {
        if (!this.video) return;
        if (ts - this.lastFrame >= this.frameInterval) {
          if (this.video.readyState >= 2) this.videoToImageByFilter();
          this.lastFrame = ts;
        }
        requestAnimationFrame(loop);
      };
        this.video.onloadeddata = () => {
          document.addEventListener("keydown", this._keydownHandler);
          requestAnimationFrame(loop);
        };
    } catch (e) {
      if (this.video) this.video.remove();
      if (e.name === 'NotReadableError' || e.name === 'TrackStartError' || e.message === 'Could not start video source') {
        throw new Error("无法启动摄像头。请确保：\n1. 摄像头未被其他程序(如微信/会议软件)占用\n2. 已关闭其他使用摄像头的浏览器标签页\n排查后请重试！");
      }
      throw e;
    }
  }

  /**
   * 键盘事件处理，用于控制视频进度、音量和滤镜
   * @param {KeyboardEvent} e 
   */
  handleKeydown(e) {
    if (!this.video) return;
    
    // 数字键 1-6 切换滤镜模式
    if (e.key >= '1' && e.key <= '6') {
      const filters = ['none', 'sepia', 'grayscale', 'invert', 'contrast', 'brightness'];
      this.filterMode = filters[parseInt(e.key) - 1];
      console.log(`🎨 滤镜切换为: ${this.filterMode}`);
      
      // 在标题栏显示当前滤镜
      const filterNames = {
        'none': '无滤镜',
        'sepia': '复古',
        'grayscale': '灰度',
        'invert': '反色',
        'contrast': '高对比',
        'brightness': '增亮'
      };
      document.title = `滤镜: ${filterNames[this.filterMode]} (按1-6切换)`;
      
      // 立即触发一次渲染以显示效果
      if (this.video.readyState >= 2) {
        this.videoToImageByFilter();
      }
      return;
    }

    const dir = KEY_MAP[e.code] || KEY_MAP[e.keyCode];
    if (!dir) return;
    e.preventDefault();
    if (dir === 'left') this.video.currentTime -= 5;
    if (dir === 'right') this.video.currentTime += 5;
    if (dir === 'up') this.video.volume = Math.min(this.video.volume + 0.1, 1);
    if (dir === 'down') this.video.volume = Math.max(this.video.volume - 0.1, 0);
  }

  /**
   * 直接绘制视频画面到 Favicon（无滤镜）
   */
  draw() {
    this.ctx.clearRect(0, 0, SIDE, SIDE);
    this.ctx.drawImage(this.video, 0, 0, SIDE, SIDE);
    setFavico(this.canvas);
  }

  /**
   * 应用指定的滤镜效果
   * @param {ImageData} imgData - 图像数据
   * @returns {ImageData} 处理后的图像数据
   */
  applyFilter(imgData) {
    const d = imgData.data;
    
    switch (this.filterMode) {
      case 'sepia': {
        // Sepia (复古/老照片) 滤镜
        for (let i = 0; i < d.length; i += 4) {
          let r = d[i], g = d[i+1], b = d[i+2];
          d[i]   = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
          d[i+1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
          d[i+2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        }
        break;
      }
        
      case 'grayscale': {
        // 灰度滤镜 - 使用亮度公式
        for (let i = 0; i < d.length; i += 4) {
          let gray = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
          d[i] = d[i+1] = d[i+2] = gray;
        }
        break;
      }
        
      case 'invert': {
        // 反色滤镜
        for (let i = 0; i < d.length; i += 4) {
          d[i] = 255 - d[i];
          d[i+1] = 255 - d[i+1];
          d[i+2] = 255 - d[i+2];
        }
        break;
      }
        
      case 'contrast': {
        // 高对比度滤镜 (增加 50% 对比度)
        const factor = (259 * (128 + 50)) / (255 * (259 - 50));
        for (let i = 0; i < d.length; i += 4) {
          d[i] = Math.min(255, Math.max(0, factor * (d[i] - 128) + 128));
          d[i+1] = Math.min(255, Math.max(0, factor * (d[i+1] - 128) + 128));
          d[i+2] = Math.min(255, Math.max(0, factor * (d[i+2] - 128) + 128));
        }
        break;
      }
        
      case 'brightness': {
        // 亮度增强滤镜 (增加 30%)
        for (let i = 0; i < d.length; i += 4) {
          d[i] = Math.min(255, d[i] * 1.3);
          d[i+1] = Math.min(255, d[i+1] * 1.3);
          d[i+2] = Math.min(255, d[i+2] * 1.3);
        }
        break;
      }
        
      case 'none':
      default:
        // 无滤镜，保持原样
        break;
    }
    
    return imgData;
  }

  /**
   * 带有滤镜效果的视频渲染
   * 提取画面像素数据，经过滤镜转换后再推送到 Favicon
   */
  videoToImageByFilter() {
    if (!this.video) return;
    this.ctx.drawImage(this.video, 0, 0, SIDE, SIDE);
    const imgData = this.ctx.getImageData(0, 0, SIDE, SIDE);
    
    // 应用选定的滤镜
    this.applyFilter(imgData);
    
    this.ctx.putImageData(imgData, 0, 0);
    setFavico(this.canvas);
  }

  /**
   * 更新网页 Title 为当前视频播放进度
   */
  updateProgress() {
    const { currentTime: c, duration: d } = this.video;
    if (d > 0) {
      const fmt = s => new Date(s * 1000).toISOString().substr(14, 5);
      document.title = `${fmt(c)} / ${fmt(d)} (${((c/d)*100).toFixed(1)}%)`;
    }
  }

  /**
   * 销毁并清理事件和媒体流
   */
  cleanup() {
    document.removeEventListener("keydown", this._keydownHandler);
    if (this.video) {
      if (this.video.srcObject) this.video.srcObject.getTracks().forEach(t => t.stop());
      this.video.pause();
      this.video.remove();
      this.video = null;
    }
  }
}

/**
 * Favicon 挂件初始化入口
 * @param {string} type - 'video' | 'camera' | 'game'
 */
function initFavicon(type) {
  cleanupAll();
  if (type === "video") {
    const url = prompt('请输入视频地址：', 'cxk.mp4');
    if (url) new Icon().initVideo(url).catch(e => alert(e.message));
  } else if (type === "camera") {
    new Icon().initCam().catch(e => alert(e.message));
  } else if ( type === "game") {
    waitFor(() => typeof switchGame !== "undefined", () => switchGame(1));
  }
}

window.__initFavicon = initFavicon;
if (window.ictype) initFavicon(window.ictype);
