/**
 * 游戏模块 - 提供游戏基类和具体游戏实现
 * @author a552422934
 * @version 0.2
 */

// 导入工具函数
import { KEY_MAP, setFavico } from './utils.js';

// 全局游戏实例注册表
window.__gameInstances = window.__gameInstances || {};

/**
 * 游戏基类 - 所有游戏的父类
 * 提供通用的游戏功能和接口
 */
class Game {
  constructor() {
    this.SIDE = 32; // favicon 边长32px
    this.canvas = null;
    this._keydownHandler = null;
    this.timer = null;
    
    // 清理旧实例
    if (window.__gameInstances.current) {
      window.__gameInstances.current.cleanup();
    }
    
    // 注册当前实例
    window.__gameInstances.current = this;
  }

  /**
   * 初始化游戏画布（不添加到页面中）
   */
  initCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = this.SIDE;
  }

  /**
   * 设置页面标题
   * @param {string} title - 标题文本
   */
  setTitle(title) {
    document.title = title;
  }

  /**
   * 将 canvas 设置为 favicon
   */
  setFavico() {
    setFavico(this.canvas);
  }

  /**
   * 初始化游戏（子类必须实现）
   */
  init() {
    throw new Error('Game.init() must be implemented by subclass');
  }

  /**
   * 清理游戏资源（子类可以重写）
   */
  cleanup() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    if (this._keydownHandler) {
      document.removeEventListener('keydown', this._keydownHandler);
      this._keydownHandler = null;
    }

    document.title = 'Free IT Videos & ProgramHub';
    console.log('Game cleaned up');
  }
}

/**
 * 贪食蛇游戏类
 * 继承自 Game 基类
 */
class SnakeGame extends Game {
  constructor() {
    super();
    
    // 游戏参数
    this.LINE_WIDTH = 1; // 边框宽度 1px
    this.SIZE = 3; // 一个数据点的像素值
    this.WIDTH = 10; // 游戏空间是10个 (32-2)/3
    
    this.score = 0; // 当前得分
    this.max = localStorage.getItem('max_score') || 0; // 最高分
    
    this.directions = {
      'left': { x: -1, y: 0 },
      'up': { x: 0, y: -1 },
      'right': { x: 1, y: 0 },
      'down': { x: 0, y: 1 },
    };
    
    this._keydownHandler = this.handleKeydown.bind(this);
    
    this.initCanvas();
  }

  /**
   * 初始化游戏网格
   */
  initGrid() {
    this.grid = [];
    while (this.grid.length < this.WIDTH) {
      this.grid.push(new Array(this.WIDTH).fill(0));
    }
  }

  /**
   * 初始化小蛇
   */
  initSnake() {
    this.snake = [];
    let y = 4;
    let x = 0;
    let snakeLength = 3;
    
    while (snakeLength > 0) {
      this.snake.push({ x: x, y: y });
      this.grid[y][x] = '1';
      snakeLength--;
      x++;
    }
    
    this.current = this.directions.right;
  }

  /**
   * 绑定游戏事件
   */
  bindEvents() {
    document.addEventListener('keydown', this._keydownHandler);
    
    this.timer = setInterval(() => {
      this.move();
    }, 170);
  }

  /**
   * 处理键盘按键事件
   * @param {KeyboardEvent} event - 键盘事件
   */
  handleKeydown(event) {
    const code = event.code;
    const keyCode = event.keyCode;
    let direction = KEY_MAP[code] || KEY_MAP[keyCode];
    
    if (direction) {
      event.preventDefault();
      this.current = this.directions[direction];
    }
  }

  /**
   * 设置页面标题显示分数
   */
  setTitle() {
    super.setTitle(`得分:${this.score}  最高分:${this.max}`);
  }

  /**
   * 小蛇移动逻辑
   */
  move() {
    const head = this.snake[this.snake.length - 1];
    const tail = this.snake[0];
    const nextX = head.x + this.current.x;
    const nextY = head.y + this.current.y;

    // 判断是否出界
    const isOut = nextX < 0 || nextX >= this.WIDTH || nextY < 0 || nextY >= this.WIDTH;
    if (isOut) {
      this.resetGame();
      return;
    }

    // 判断是否撞到自己
    const isSelf = (this.grid[nextY][nextX]) == '1' && !(nextX === tail.x && nextY === tail.y);
    if (isSelf) {
      this.resetGame();
      return;
    }

    // 判断是否吃到食物
    const isFood = this.grid[nextY][nextX] == '2';
    if (!isFood) {
      this.snake.shift();
      this.grid[tail.y][tail.x] = 0;
    } else {
      this.setFood();
      this.score++;
      this.setTitle();
    }

    this.snake.push({ x: nextX, y: nextY });
    this.grid[nextY][nextX] = '1';
    this.drawCanvas();
  }

  /**
   * 随机放置食物
   */
  setFood() {
    while (true) {
      const x = Math.floor(Math.random() * this.WIDTH);
      const y = Math.floor(Math.random() * this.WIDTH);
      
      if (this.grid[y][x] == '1') {
        continue;
      } else {
        this.grid[y][x] = '2';
        break;
      }
    }
  }

  /**
   * 绘制游戏画面
   */
  drawCanvas() {
    const context = this.canvas.getContext('2d');
    context.clearRect(0, 0, this.SIDE, this.SIDE);
    context.strokeStyle = 'green';
    context.lineWidth = this.LINE_WIDTH;
    context.fillStyle = "red";
    context.strokeRect(0, 0, this.SIDE, this.SIDE);

    this.grid.forEach((row, y) => {
      row.forEach((g, x) => {
        if (g !== 0) {
          context.fillRect(
            this.LINE_WIDTH + x * this.SIZE,
            this.LINE_WIDTH + y * this.SIZE,
            this.SIZE,
            this.SIZE
          );
        }
      });
    });
    
    this.setFavico();
  }

  /**
   * 重置游戏
   */
  resetGame() {
    if (this.score > this.max) {
      localStorage.setItem('max_score', this.score);
      this.max = this.score;
      this.score = 0;
    }
    
    this.setTitle();
    this.initGrid();
    this.initSnake();
    this.setFood();
    this.drawCanvas();
  }

  /**
   * 初始化贪食蛇游戏
   */
  init() {
    this.initGrid();
    this.initSnake();
    this.setFood();
    this.drawCanvas();
    this.bindEvents();
  }

  /**
   * 清理游戏资源
   */
  cleanup() {
    super.cleanup();
    console.log('Snake game cleaned up');
  }
}

// 导出游戏类
window.Game = Game;
window.SnakeGame = SnakeGame;
