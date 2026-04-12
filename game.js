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
    clearTimeout(this.timeout);
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
      clearInterval(this.timer);
      this.timeout = setTimeout(() => this.init(), 1000);
      return; // 撞毁后等待1秒重新开始
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
    document.title = `得分:${this.score} 最高:${this.max} (按1/2切换游戏)`;
    window.setFavico(this.canvas);
  }
}

window.SnakeGame = SnakeGame;

/**
 * 打砖块游戏子类
 */
class BreakoutGame extends Game {
  constructor() {
    super();
    this.paddle = { w: 12, h: 2, x: 10, y: 29 };
    this.ball = { x: 16, y: 27, dx: 1.2, dy: -1.2, r: 1.5 };
    this.bricks = [];
    this.rows = 4;
    this.cols = 5;
    this.keys = { left: false, right: false };
  }

  init() {
    this.cleanup();
    this.score = 0;
    this.max = localStorage.getItem('breakout_max_score') || 0;
    
    // 初始化拍子和球
    this.paddle.x = 10;
    this.ball = { x: 16, y: 27, dx: 1.2, dy: -1.2, r: 1.5 };
    
    // 初始化砖块阵列
    this.bricks = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.bricks.push({ x: 1 + c * 6, y: 2 + r * 4, w: 5, h: 2, status: 1 });
      }
    }
    
    this.keys.left = this.keys.right = false;
    
    this._keydownHandler = e => this.handleKey(e, true);
    this._keyupHandler = e => this.handleKey(e, false);
    document.addEventListener('keydown', this._keydownHandler);
    document.addEventListener('keyup', this._keyupHandler);
    
    this.timer = setInterval(() => this.move(), 50); // 约20帧，保证小球平滑
    this.draw();
  }

  // 重写 cleanup 增加 keyup 监听的清除
  cleanup() {
    super.cleanup();
    if (this._keydownHandler) document.removeEventListener('keydown', this._keydownHandler);
    if (this._keyupHandler) document.removeEventListener('keyup', this._keyupHandler);
  }

  handleKey(e, isDown) {
    const dir = window.KEY_MAP[e.code] || window.KEY_MAP[e.keyCode];
    if (dir === 'left') { e.preventDefault(); this.keys.left = isDown; }
    if (dir === 'right') { e.preventDefault(); this.keys.right = isDown; }
  }

  move() {
    if (this.keys.left && this.paddle.x > 0) this.paddle.x -= 2;
    if (this.keys.right && this.paddle.x < this.SIDE - this.paddle.w) this.paddle.x += 2;
    
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;
    
    // 墙壁碰撞检测
    if (this.ball.x - this.ball.r < 0 || this.ball.x + this.ball.r > this.SIDE) {
      this.ball.dx = -this.ball.dx;
      if (this.ball.x - this.ball.r < 0) this.ball.x = this.ball.r;
      if (this.ball.x + this.ball.r > this.SIDE) this.ball.x = this.SIDE - this.ball.r;
    }
    if (this.ball.y - this.ball.r < 0) {
      this.ball.dy = -this.ball.dy;
      this.ball.y = this.ball.r;
    } else if (this.ball.y + this.ball.r > this.SIDE) {
      // 触底，游戏结束
      if (this.score > this.max) localStorage.setItem('breakout_max_score', this.max = this.score);
      clearInterval(this.timer);
      this.timeout = setTimeout(() => this.init(), 1000);
      return;
    }
    
    // 拍子碰撞检测
    if (this.ball.dy > 0 && this.ball.y + this.ball.r >= this.paddle.y && 
        this.ball.x >= this.paddle.x - 1 && this.ball.x <= this.paddle.x + this.paddle.w + 1) {
      this.ball.dy = -this.ball.dy;
      const hitX = this.ball.x - (this.paddle.x + this.paddle.w / 2);
      this.ball.dx = hitX * 0.25; // 根据击球位置产生不同的反弹角度
      this.ball.y = this.paddle.y - this.ball.r;
    }
    
    // 砖块碰撞检测
    let hit = false;
    for (let i = 0; i < this.bricks.length; i++) {
      let b = this.bricks[i];
      if (b.status === 1 && this.ball.x + this.ball.r > b.x && this.ball.x - this.ball.r < b.x + b.w && 
          this.ball.y + this.ball.r > b.y && this.ball.y - this.ball.r < b.y + b.h) {
        this.ball.dy = -this.ball.dy;
        b.status = 0;
        this.score++;
        hit = true;
        break; // 每次循环最多击碎一块
      }
    }
    
    if (hit && this.score === this.rows * this.cols) {
      if (this.score > this.max) localStorage.setItem('breakout_max_score', this.max = this.score);
      clearInterval(this.timer);
      this.timeout = setTimeout(() => this.init(), 1000);
      return; // 赢了等待1秒重新开始
    }
    this.draw();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.SIDE, this.SIDE);
    
    // 拍子(蓝色), 球(红色), 砖块(橙色)
    this.ctx.fillStyle = '#00f'; this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h);
    this.ctx.fillStyle = '#f00'; this.ctx.beginPath(); this.ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2); this.ctx.fill();
    this.ctx.fillStyle = '#f90'; this.bricks.forEach(b => { if (b.status === 1) this.ctx.fillRect(b.x, b.y, b.w, b.h); });
    
    document.title = `得分:${this.score} 最高:${this.max}`;
    window.setFavico(this.canvas);
  }
}

window.BreakoutGame = BreakoutGame;

/**
 * 全局游戏控制与切换逻辑
 */
window.switchGame = (index) => {
  if (index === 1) new SnakeGame().init();
  else if (index === 2) new BreakoutGame().init();
};

// 监听键盘 1 和 2 切换游戏
document.addEventListener('keydown', (e) => {
  // 仅在当前处于游戏模式时生效
  if (window.__gameInstances && window.__gameInstances.current) {
    if (e.key === '1') window.switchGame(1);
    else if (e.key === '2') window.switchGame(2);
  }
});
