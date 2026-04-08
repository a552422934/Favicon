/**
 * 主文件 - 在浏览器 favicon 中创建交互式内容
 * 功能包括：视频播放、摄像头监控
 * @author a552422934
 * @version 0.3
 */

// 导入工具函数和游戏模块
import {
  KEY_MAP,
  setFavico,
  formatTime,
} from "./utils.js";
import "./game.js";

// 全局实例注册表，用于清理旧实例
window.__faviconInstances = window.__faviconInstances || {};

// 清理旧实例
function cleanupOldInstances() {
  if (window.__faviconInstances.icon) {
    try {
      window.__faviconInstances.icon.cleanup();
    } catch (e) {
      console.error("清理图标实例失败：", e);
    }
    delete window.__faviconInstances.icon;
  }
}

/**
 * Icon 类 - 视频和摄像头功能
 * 负责处理视频播放、摄像头捕获和滤镜应用
 */
class Icon {
  /**
   * 构造函数，初始化画布和参数
   */
  constructor() {
    this.width = 0;
    this.SIDE = 32; // favicon 边长32px

    // 清理旧实例
    if (window.__faviconInstances.icon) {
      window.__faviconInstances.icon.cleanup();
    }

    // 注册当前实例
    window.__faviconInstances.icon = this;

    // 事件监听器引用
    this._keydownHandler = this.handleKeydown.bind(this);
    this.video = null;
    this.canvas = null;
    this.canvasFilter = null;

    // 节流控制
    this.lastFrameTime = 0;
    this.frameInterval = 100; // 每100ms更新一次（10fps）
    this.lastCameraFrame = 0;
    this.cameraFrameInterval = 100; // 摄像头10fps

    this.initCanvas();
    this.initFilterCanvas();
  }
  /**
   * 初始化主画布（用于视频帧捕获）
   */
  initCanvas() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.canvas.height = this.SIDE;
    // 优化：设置 willReadFrequently 以提高频繁读取的性能
    this.canvasContext = this.canvas.getContext("2d", {
      willReadFrequently: true,
    });
    // document.body.appendChild(this.canvas) // 调试时可取消注释
  }
  /**
   * 初始化滤镜画布（用于滤镜效果处理）
   */
  initFilterCanvas() {
    this.canvasFilter = document.createElement("canvas");
    this.canvasFilter.width = this.canvasFilter.height = this.SIDE;
    // 优化：设置 willReadFrequently 以提高频繁读取的性能
    this.canvasFilterContext = this.canvasFilter.getContext("2d", {
      willReadFrequently: true,
    });
    // document.body.appendChild(this.canvasFilter) // 调试时可取消注释
  }
  /**
   * 初始化视频播放器
   * @param {string} url - 视频URL，如果未提供则使用CDN上的默认视频
   * @returns {Promise<void>}
   * @throws {Error} 视频加载失败时抛出错误
   */
  initVideo(url) {
    return new Promise((resolve, reject) => {
      const videoUrl =
        url || "https://cdn.jsdelivr.net/gh/a552422934/Favicon@main/lol.mp4";

      try {
        let video = document.createElement("video");
        video.width = this.width;
        video.controls = "controls";
        video.crossOrigin = "anonymous";
        video.autoplay = "autoplay";
        video.volume = 0.5;
        video.preload = "auto";

        const loadTimeout = setTimeout(() => {
          if (video.readyState < video.HAVE_CURRENT_DATA) {
            this.handleVideoError(videoUrl, reject, video, "视频加载超时");
          }
        }, 10000);
        
        video.onloadeddata = () => {
          clearTimeout(loadTimeout);
          console.log("视频加载成功，时长：", video.duration, "秒");
          resolve();
        };

        video.onerror = (error) => {
          clearTimeout(loadTimeout);
          console.error("视频加载错误：", error);
          this.handleVideoError(videoUrl, reject, video);
        };

        video.src = videoUrl;
        document.body.appendChild(video);

        this.video = video;
        this.bindVideoEvents();
        this.bindKeyboardEvents();

        if (video.readyState >= video.HAVE_CURRENT_DATA) {
          clearTimeout(loadTimeout);
          console.log("视频已缓存，时长：", video.duration, "秒");
          resolve();
        }
      } catch (error) {
        console.error("视频初始化异常：", error);
        this.handleVideoError(
          videoUrl,
          reject,
          null,
          `视频初始化失败：${error.message}`,
        );
      }
    });
  }

  /**
   * 处理视频错误
   * @param {string} videoUrl - 视频URL
   * @param {Function} reject - Promise的reject函数
   * @param {HTMLVideoElement} [video] - 视频元素（可选，用于清理）
   * @param {string} [customMessage] - 自定义错误信息
   */
  handleVideoError(videoUrl, reject, video = null, customMessage) {
    let errorMessage = customMessage || "视频加载失败";

    if (
      videoUrl === "https://cdn.jsdelivr.net/gh/a552422934/Favicon@main/lol.mp4"
    ) {
      errorMessage = `默认视频文件无法访问。请检查网络连接，或通过 window.vurl 指定其他视频URL。`;
    } else if (videoUrl.startsWith("http")) {
      errorMessage = `无法加载视频：${videoUrl}。可能是跨域(CORS)问题，请确保视频服务器允许跨域访问。`;
    } else {
      errorMessage = `无法加载视频：${videoUrl}`;
    }

    if (video) {
      video.onerror = null;
      video.onloadeddata = null;

      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }

      if (this.video === video) {
        this.video = null;
      }
    }

    // 错误信息通过 console.error 输出
    console.error(errorMessage);
    reject(new Error(errorMessage));
  }
  /**
   * 绑定键盘控制事件
   * 方向键控制视频：
   * - 左/右：快退/快进5秒
   * - 上/下：增加/减少音量0.1
   */
  bindKeyboardEvents() {
    // 添加键盘事件监听器
    document.addEventListener("keydown", this._keydownHandler);
  }

  /**
   * 处理键盘按键事件
   * @param {KeyboardEvent} event - 键盘事件
   */
  handleKeydown(event) {
    if (!this.video) return;

    const directions = {
      left: () =>
        (this.video.currentTime = Math.max(this.video.currentTime - 5, 0)),
      right: () =>
        (this.video.currentTime = Math.min(
          this.video.currentTime + 5,
          this.video.duration || Infinity,
        )),
      up: () => (this.video.volume = Math.min(this.video.volume + 0.1, 1.0)),
      down: () => (this.video.volume = Math.max(this.video.volume - 0.1, 0.0)),
    };

    const code = event.code;
    const keyCode = event.keyCode;
    let direction = KEY_MAP[code] || KEY_MAP[keyCode];

    if (direction) {
      event.preventDefault();
      directions[direction]();
    }
  }
  /**
   * 绑定视频事件监听器
   * 监听视频播放时间更新，实时更新 favicon 和进度显示
   */
  bindVideoEvents() {
    this.video.addEventListener(
      "timeupdate",
      () => {
        const now = Date.now();
        if (now - this.lastFrameTime >= this.frameInterval) {
          this.videoToImage();
          this.showProgress();
          this.lastFrameTime = now;
        }
      },
      false,
    );
  }
  /**
   * 格式化时间（秒 → MM:SS）
   * @param {number} second - 秒数
   * @returns {string} 格式化的时间字符串（如 01:30）
   */
  formatTime(second) {
    const m = Math.floor(second / 60) + "";
    const s = parseInt(second % 60) + "";
    return m.padStart(2, "0") + ":" + s.padStart(2, "0");
  }
  /**
   * 显示视频播放进度
   */
  showProgress() {
    // 进度显示功能已移除，如需使用请在调用方实现
  }
  /**
   * 将当前视频帧捕获并设置为 favicon
   */
  videoToImage() {
    if (!this.video || !this.canvasContext) {
      return;
    }

    try {
      this.canvasContext.clearRect(0, 0, this.SIDE, this.SIDE);
      this.canvasContext.drawImage(this.video, 0, 0, this.SIDE, this.SIDE);
      setFavico(this.canvas);
    } catch (e) {
      console.error("绘制视频帧失败：", e);
    }
  }
  /**
   * 应用滤镜并将视频帧设置为 favicon
   * 支持多种滤镜效果（当前使用怀旧滤镜）：
   * - 灰色滤镜、反色滤镜、黑白滤镜、黄色滤镜（注释中）
   * - 怀旧滤镜（当前启用）
   */
  videoToImageByFilter() {
    if (!this.video || !this.canvasContext || !this.canvasFilterContext) {
      return;
    }

    try {
      this.canvasContext.clearRect(0, 0, this.SIDE, this.SIDE);
      this.canvasContext.drawImage(this.video, 0, 0, this.SIDE, this.SIDE);

      var imgdata = this.canvasContext.getImageData(0, 0, this.SIDE, this.SIDE);

      // for(var i=0;i<imgdata.data.length;i += 4){
      // 灰色滤镜
      //计算获取单位元素的RBG然后取平均值 然后复制给自身得到灰色的图像
      // var avg =  (imgdata.data[i]+ imgdata.data[i+1]+ imgdata.data[i+2])/3
      // imgdata.data[i] = imgdata.data[i+1] =imgdata.data[i+2] =avg

      // 反色滤镜
      //将所有的RGB值重新赋值（底片效果 = 255 - 当前的RGB值）
      // imgdata.data[i] =255-imgdata.data[i];
      // imgdata.data[i+1] =255-imgdata.data[i+1];
      // imgdata.data[i+2] =255-imgdata.data[i+2];

      // 黑白滤镜
      // var avg =  (imgdata.data[i]+ imgdata.data[i+1]+ imgdata.data[i+2])/3;
      // imgdata.data[i] =avg>128 ? 255 :0;
      // imgdata.data[i+1] =avg>128 ? 255 :0;
      // imgdata.data[i+2] =avg>128 ? 255 :0;

      //黄色滤镜的算法：红色通道值和绿色通道值增加50（红色+绿色 = 黄色）
      // var r = imgdata.data[i] +50;
      // var g = imgdata.data[i+1] +50
      // //注：当前值大于255时将其赋值255
      // imgdata.data[i] = r > 255 ? 255 : r;
      // imgdata.data[i+1] = g > 255 ? 255 : g;
      // }

      // 怀旧滤镜（复古效果）
      // 使用线性变换公式调整RGB值，产生暖色调效果
      for (var i = 0; i < imgdata.height * imgdata.width; i++) {
        var r = imgdata.data[i * 4],
          g = imgdata.data[i * 4 + 1],
          b = imgdata.data[i * 4 + 2];

        var newR = 0.393 * r + 0.769 * g + 0.189 * b;
        var newG = 0.349 * r + 0.686 * g + 0.168 * b;
        var newB = 0.272 * r + 0.534 * g + 0.131 * b;
        var rgbArr = [newR, newG, newB].map((e) => {
          return e < 0 ? 0 : e > 255 ? 255 : e;
        });
        [
          imgdata.data[i * 4],
          imgdata.data[i * 4 + 1],
          imgdata.data[i * 4 + 2],
        ] = rgbArr;
      }

      this.canvasFilterContext.putImageData(imgdata, 0, 0);
      setFavico(this.canvasFilter);
    } catch (e) {
      console.error("应用视频滤镜失败：", e);
    }
  }
  /**
   * 初始化摄像头
   * 使用 WebRTC 获取摄像头访问权限，实时应用滤镜并显示在 favicon 中
   * @returns {Promise<void>}
   * @throws {Error} 摄像头访问失败时抛出错误
   */
  async initCam() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "您的浏览器不支持摄像头功能。请使用最新版本的 Chrome、Firefox 或 Edge。",
        );
      }

      const isLocalhost =
        location.hostname === "localhost" || location.hostname === "127.0.0.1";
      const isHttps = location.protocol === "https:";

      if (!isHttps && !isLocalhost) {
        throw new Error(
          "摄像头功能需要 HTTPS 环境或 localhost。当前页面协议为：" +
            location.protocol,
        );
      }

      let video = document.createElement("video");
      video.width = this.width;
      video.autoplay = "autoplay";
      document.body.appendChild(video);
      this.video = video;

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
        });

        this.video.srcObject = mediaStream;

        this.video.onerror = (error) => {
          console.error("摄像头视频错误：", error);
          showError("摄像头视频流错误，请检查摄像头是否正常工作。");
        };

        // 使用 requestAnimationFrame 并限制帧率
        const updateFrame = (timestamp) => {
          if (!this.video || !this.video.srcObject) return;

          if (timestamp - this.lastCameraFrame >= this.cameraFrameInterval) {
            if (this.video.readyState >= this.video.HAVE_CURRENT_DATA) {
              this.videoToImageByFilter();
            }
            this.lastCameraFrame = timestamp;
          }

          requestAnimationFrame(updateFrame);
        };

        this.video.addEventListener(
          "loadeddata",
          () => {
            requestAnimationFrame(updateFrame);
          },
          { once: true }
        );

        console.log("摄像头初始化成功");
        return true;
      } catch (getUserMediaError) {
        if (this.video && this.video.parentNode) {
          this.video.parentNode.removeChild(this.video);
        }
        this.video = null;

        let errorMessage = "无法访问摄像头：";

        if (getUserMediaError.name === "NotAllowedError") {
          errorMessage +=
            "用户拒绝了摄像头权限请求。请刷新页面并允许摄像头访问。";
        } else if (getUserMediaError.name === "NotFoundError") {
          errorMessage += "未找到可用的摄像头设备。";
        } else if (getUserMediaError.name === "NotReadableError") {
          errorMessage += "摄像头设备被其他应用程序占用或无法访问。";
        } else if (getUserMediaError.name === "OverconstrainedError") {
          errorMessage += "无法满足摄像头参数要求。";
        } else {
          errorMessage += getUserMediaError.message || "未知错误。";
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("摄像头初始化失败：", error);
      showError(error.message);
      throw error;
    }
  }

  /**
   * 清理资源
   * 移除事件监听器、停止视频流、移除DOM元素
   */
  cleanup() {
    if (this._isCleaningUp !== undefined) {
      this._isCleaningUp = true;
    }
    if (this._updateFrameActive !== undefined) {
      this._updateFrameActive = false;
    }

    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }

    if (this._keydownHandler) {
      document.removeEventListener("keydown", this._keydownHandler);
      this._keydownHandler = null;
    }

    if (this.video) {
      try {
        this.video.onerror = null;
        this.video.onloadeddata = null;
        this.video.ontimeupdate = null;

        if (this.video.srcObject) {
          const tracks = this.video.srcObject.getTracks();
          tracks.forEach((track) => track.stop());
        }

        this.video.pause();
        this.video.src = "";
        this.video.srcObject = null;

        if (this.video.parentNode) {
          this.video.parentNode.removeChild(this.video);
        }
      } catch (e) {
        console.error("清理视频元素失败：", e);
      }

      this.video = null;
    }

    if (this.canvas && this.canvas.parentNode) {
      try {
        this.canvas.parentNode.removeChild(this.canvas);
      } catch (e) {
        console.error("移除主画布失败：", e);
      }
    }

    if (this.canvasFilter && this.canvasFilter.parentNode) {
      try {
        this.canvasFilter.parentNode.removeChild(this.canvasFilter);
      } catch (e) {
        console.error("移除滤镜画布失败：", e);
      }
    }

    // 标题恢复功能已移除，如需使用请在调用方实现
    console.log("Icon instance cleaned up");
  }
}

/**
 * 自动初始化逻辑
 * 根据全局变量 window.ictype 的值自动初始化相应功能：
 * - 'video': 视频播放模式（可通过 window.vurl 指定视频URL）
 * - 'camera': 摄像头模式
 * - 'snake': 贪食蛇游戏模式（自动加载 game.js）
 */

// 等待 game.js 加载完成后再初始化游戏
function waitForGameModule(callback, maxRetries = 50) {
  let retries = 0;
  const checkInterval = setInterval(() => {
    if (typeof SnakeGame !== "undefined") {
      clearInterval(checkInterval);
      callback();
    } else {
      retries++;
      if (retries >= maxRetries) {
        clearInterval(checkInterval);
        console.error("游戏模块加载超时！");
      }
    }
  }, 100);
}

if (window.ictype === "video") {
  try {
    var m = new Icon();
    m.initVideo(window.vurl).catch((error) => {
      console.error("视频初始化失败：", error);
      if (window.__faviconInstances.icon) {
        showError("视频加载失败：" + (error.message || "未知错误"));
      }
    });
  } catch (error) {
    console.error("视频模式初始化异常：", error);
  }
} else if (window.ictype === "camera") {
  try {
    var m = new Icon();
    m.initCam().catch((error) => {
      console.error("摄像头初始化失败：", error);
    });
  } catch (error) {
    console.error("摄像头模式初始化异常：", error);
  }
} else if (window.ictype === "snake") {
  // 贪食蛇游戏模式 - 等待 game.js 加载完成后初始化
  waitForGameModule(() => {
    try {
      var game = new SnakeGame();
      game.init();
    } catch (error) {
      console.error("贪食蛇游戏初始化异常：", error);
    }
  });
}
