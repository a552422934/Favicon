/**
 * 工具函数模块 - 提供通用工具函数和常量
 * @author a552422934
 * @version 0.1
 */

/**
 * 键盘方向键映射表
 * 支持 event.code 和 event.keyCode 两种方式
 */
export const KEY_MAP = {
  'ArrowLeft': 'left',
  'ArrowUp': 'up',
  'ArrowRight': 'right',
  'ArrowDown': 'down',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
};

/**
 * 设置页面 favicon 为指定 canvas 的内容
 * @param {HTMLCanvasElement} canvas - 要设置为 favicon 的 canvas 元素
 */
export function setFavico(canvas) {
  const url = canvas.toDataURL('image/png');
  let icons = [...document.querySelector('head').querySelectorAll('link')]
    .filter(link => {
      const rel = link.getAttribute('rel') || '';
      return rel.indexOf('icon') > -1;
    });
  
  if (icons.length) {
    icons.forEach(icon => icon.setAttribute('href', url));
  } else {
    const icon = document.createElement('link');
    icon.setAttribute('rel', 'icon');
    icon.setAttribute('href', url);
    document.querySelector('head').appendChild(icon);
  }
}

/**
 * 格式化时间（秒 → MM:SS）
 * @param {number} second - 秒数
 * @returns {string} 格式化的时间字符串（如 01:30）
 */
export function formatTime(second) {
  const m = Math.floor(second / 60) + '';
  const s = parseInt(second % 60) + '';
  return m.padStart(2, '0') + ":" + s.padStart(2, '0');
}

/**
 * 节流函数 - 限制函数执行频率
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间间隔（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 显示错误信息在页面标题或控制台
 * @param {string} message - 错误信息
 * @param {boolean} [showToast=true] - 是否显示 toast 提示
 */
export function showError(message, showToast = true) {
  console.error('Favicon 错误：', message);
  document.title = `❌ ${message.substring(0, 50)}...`;

  if (showToast) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #ffebee;
      color: #c62828;
      padding: 10px 15px;
      border-radius: 4px;
      border: 1px solid #ffcdd2;
      font-family: Arial, sans-serif;
      font-size: 14px;
      z-index: 10000;
      max-width: 300px;
    `;
    errorDiv.textContent = `错误：${message}`;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }
}
