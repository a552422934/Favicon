/**
 * 游戏模块 - 贪食蛇高效实现
 */

window.__gameInstances = window.__gameInstances || {};

/**
 * 游戏基础类，负责 Canvas 初始化以及游戏实例生命周期管理
 */
class Game {
  constructor() {
    this.SIDE = window.SIDE || 32;
    window.__gameInstances.current?.cleanup();
    window.__gameInstances.current = this;
    this.canvas = Object.assign(document.createElement('canvas'), { width: this.SIDE, height: this.SIDE });
    this.ctx = this.canvas.getContext('2d');
  }

  // 统一的清理机制，防止定时器或事件监听内存泄漏
  cleanup() {
    clearInterval(this.timer);
    if (this._handler) document.removeEventListener('keydown', this._handler);
  }
}

/**
 * 贪吃蛇游戏子类
 */
class SnakeGame extends Game {
  constructor() {
    super();
    // W: 网格的维度大小 (比如 10x10 的地图)
    // S: 单个网格的像素大小 (3px)
    // L: 边缘留白 / 偏移量 (1px)
    this.W = 10; this.S = 3; this.L = 1;
    this.directions = { left: {x:-1, y:0}, up: {x:0, y:-1}, right: {x:1, y:0}, down: {x:0, y:1} };
  }

  init() {
    this.cleanup();
    this.score = 0;
    this.max = localStorage.getItem('max_score') || 0;
    
    // 初始化 10x10 二维数组网格，0: 空白, 1: 蛇身, 2: 食物
    this.grid = Array.from({length: this.W}, () => new Array(this.W).fill(0));
    // 初始化蛇身体，默认长度为 3，向右移动
    this.snake = [{x:0, y:4}, {x:1, y:4}, {x:2, y:4}];
    this.snake.forEach(p => this.grid[p.y][p.x] = 1);
    this.curr = this.directions.right;
    this.setFood();
    this._handler = e => {
      const dir = window.KEY_MAP[e.code] || window.KEY_MAP[e.keyCode];
      if (dir) { e.preventDefault(); this.curr = this.directions[dir]; }
    };
    document.addEventListener('keydown', this._handler);
    this.timer = setInterval(() => this.move(), 170);
    this.draw();
  }

  /**
   * 在地图的空闲位置随机生成食物
   */
  setFood() {
    let x, y;
    do { x = Math.floor(Math.random()*this.W); y = Math.floor(Math.random()*this.W); }
    while (this.grid[y][x]);
    this.grid[y][x] = 2;
  }

  /**
   * 核心逻辑：每一帧移动蛇的位置并检测碰撞
   */
  move() {
    const head = this.snake[this.snake.length-1];
    const next = { x: head.x + this.curr.x, y: head.y + this.curr.y };

    // 检测是否撞墙或撞到自己
    if (next.x<0 || next.x>=this.W || next.y<0 || next.y>=this.W || this.grid[next.y][next.x] === 1) {
      if (this.score > this.max) localStorage.setItem('max_score', this.max = this.score);
      return this.init(); // 撞毁后自动重新开始
    }

    const eaten = this.grid[next.y][next.x] === 2;
    if (!eaten) {
      // 如果没吃到食物，移除蛇尾
      const tail = this.snake.shift();
      this.grid[tail.y][tail.x] = 0;
    } else {
      // 吃到食物，分数增加，并重新生成食物
      this.score++;
      this.setFood();
    }
    // 更新新蛇头位置
    this.snake.push(next);
    this.grid[next.y][next.x] = 1;
    this.draw();
  }

  // 渲染游戏画面并输出到 Favicon
  draw() {
    this.ctx.clearRect(0, 0, this.SIDE, this.SIDE);
    this.ctx.strokeStyle = 'green';
    this.ctx.strokeRect(0, 0, this.SIDE, this.SIDE);
    this.ctx.fillStyle = 'red';
    this.grid.forEach((row, y) => row.forEach((v, x) => v &&
      this.ctx.fillRect(this.L + x*this.S, this.L + y*this.S, this.S, this.S)));
    document.title = `得分:${this.score} 最高:${this.max}`;
    window.setFavico(this.canvas);
  }
}

window.SnakeGame = SnakeGame;
