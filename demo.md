## 安装

```html
<script src="https://cdn.jsdelivr.net/gh/a552422934/Favicon@0.1/icon.js" ></script >
```

## 看视频

支持视频进度条，上下左右控制视频音量和前进后退

![](https://a3403.oss-cn-shanghai.aliyuncs.com/typora/01-video.gif)

```js
    var m = new Icon()
    m.initVideo('http://image.shengxinjing.cn/moyu/video/ji.mp4')
```

## 摄像头

支持摄像头功能，新增了简单的怀旧滤镜

![](https://a3403.oss-cn-shanghai.aliyuncs.com/typora/02-cam.gif)

```js
var m = new Icon()
m.initCam()
```

![](https://a3403.oss-cn-shanghai.aliyuncs.com/typora/02-cam-filter.gif)

怀旧滤镜

![](https://a3403.oss-cn-shanghai.aliyuncs.com/typora/02-cam-filter2.gif)

## 贪食蛇

上下左右，title显示分数和记录

```js
var s = new Snake()
s.init()
```

![](https://a3403.oss-cn-shanghai.aliyuncs.com/typora/03-snake.gif)

## 音量和视频控制

document监听键盘事件，针对上下左右做不同的处理

```javascript
const DIRECTION = {
    37:'left',
    // 上
    38:'up',
    // 右
    39:'right',
    // 下
    40:'down',
}
```

```javascript
const directions = {
  left: ()=> this.video.currentTime-=5,
  right: ()=> this.video.currentTime+=5,
  up: ()=> this.video.volume+=0.1,
  down: ()=> this.video.volume-=0.1,
}
document.onkeydown = (event)=> {
  // 左上右下 37 38 39 40
  let key = event.keyCode
  if(key in DIRECTION){
    directions[DIRECTION[key]]()
  }
}
```



## 视频进度条

根据currentTime和duration 可以得到视频的播放事件和总时长

再根据这边文章[Animating URLs with Javascript and Emojis](https://matthewrayfield.com/articles/animating-urls-with-javascript-and-emojis/)的启发，用emoji做个图形进度条

```javascript
    formatTime(second){
        const m = Math.floor(second/60) + ''
        const s = parseInt(second%60) + ''
        return m.padStart(2,'0')+":"+s.padStart(2,'0')
    }
    showProgress(){
        const current = this.video.currentTime
        const total = this.video.duration
        const per = Math.floor((current/total)*4)
        console.log((current/total).toFixed(2))
        const p = ['🌑', '🌒', '🌓', '🌔', '🌝'][per]
        document.title = `${p}${this.formatTime(current)}/${this.formatTime(total)}`
    }
```



## 摄像头

用webrtc实现， 可以监控身后有没有老板
后续考虑看看加个人脸识别，识别老板 或者自己笑得过于开心，都发个提醒

```javascript
let video = document.createElement('video')
video.width=this.width
video.autoplay="autoplay"
document.body.appendChild(video)
this.video = video
const mediaStream =  await navigator.mediaDevices.getUserMedia({video:true}) // webrtc
this.video.srcObject = mediaStream

this.video.addEventListener('timeupdate',()=>{
  this.videoToImageByFilter()
},false)
```

## 滤镜

如果你用这个来直播，虽然小了点，但是也可以考虑加一个滤镜，原理也很简单，canvas获取图片像素颜色值，对需要的滤镜，找到公式设置一下就行，比如灰色滤镜，计算获取单位元素的RBG然后取平均值 然后复制给自身得到灰色的图像

```javascript
const context = this.canvas.getContext('2d')
context.clearRect(0, 0, this.SIDE, this.SIDE)
context.drawImage(this.video, 0, 0, this.SIDE, this.SIDE)

//获取ImageData的属性：width，height，data（包含 R G B A 四个值）；
var imgdata = context.getImageData(0,0,this.SIDE,this.SIDE)

for(var i=0;i<imgdata.data.length;i += 4){
  // 灰色滤镜
  // 计算获取单位元素的RBG然后取平均值 然后复制给自身得到灰色的图像
  var avg =  (imgdata.data[i]+ imgdata.data[i+1]+ imgdata.data[i+2])/3
  imgdata.data[i] = imgdata.data[i+1] =imgdata.data[i+2] =avg   
}


this.canvasFilter.getContext('2d').putImageData(imgdata,0,0);
setFavico(this.canvasFilter)
```



```javascript
// 怀旧滤镜
const context = this.canvas.getContext('2d')
context.clearRect(0, 0, this.SIDE, this.SIDE)
context.drawImage(this.video, 0, 0, this.SIDE, this.SIDE)

//获取ImageData的属性：width，height，data（包含 R G B A 四个值）；
var imgdata = context.getImageData(0,0,this.SIDE,this.SIDE)
for(var i = 0; i < imgdata.height * imgdata.width; i++) {
  var r = imgdata.data[i*4],
      g = imgdata.data[i*4+1],
      b = imgdata.data[i*4+2];

  var newR = (0.393 * r + 0.769 * g + 0.189 * b);
  var newG = (0.349 * r + 0.686 * g + 0.168 * b);
  var newB = (0.272 * r + 0.534 * g + 0.131 * b);
  var rgbArr = [newR, newG, newB].map((e) => {
    return e < 0 ? 0 : e > 255 ? 255 : e;
  });
  [imgdata.data[i*4], imgdata.data[i*4+1], imgdata.data[i*4+2]] = rgbArr;
}
this.canvasFilter.getContext('2d').putImageData(imgdata,0,0);
setFavico(this.canvasFilter)
```



## 贪食蛇

其实32*32像素，还是可以实现很多有意思的功能，1px变量后，还有30px可以发挥，基本边长是2和3像素的点课件， 我们最多可以有15的边长可以发挥，比如贪食蛇，俄罗斯方块，有兴趣的可以挑战坦克大战，推箱子

贪食蛇原理就是canvas里游戏，然后渲染favicon，新建一个类

```javascript
class Snake {
	constructor(){
        // 15*15
        this.SIDE = 32 // favcion边长32px
        this.LINE_WIDTH = 1 // 1px
        this.SIZE = 3 // 一个数据点的像素值
        this.WIDTH =10 // 游戏空间是10个  (32-2)/3

        this.initCanvas()
    }
	initCanvas(){
		this.canvas = document.createElement('canvas')
        this.canvas.width = this.canvas.height = this.SIDE
    }
	initGrid(){
		this.grid = []
		while(this.grid.length<this.WIDTH){
			this.grid.push(new Array(this.WIDTH).fill(0))
		}
	}
}
```

### 初始化

新建好网格后，我们规定0是初始值，小蛇占的位置，就是1，食物是2

小蛇初始长度是3，在左侧居中，

```javascript
// 初始化小蛇蛇
initSnake(){
  this.snake = []

  // 初始值长度是3 处置位置在左侧中间
  let y = 4
  let x = 0
  let snakeLength = 3
  while(snakeLength>0){
    this.snake.push({x:x,y:y})
    this.grid[y][x] = '1'
    snakeLength--
    x++
  }
  // 小蛇的初始方向是右边
  this.current = this.directions.right
}
```

我们console.table一下this.grid

### 渲染网格

我们需要把网格渲染到canvas里 先把canvas放在body里，方便调试
方法和很粗暴，只是个玩具，就不考虑渲染的优化了，直接遍历网格，每次都重新渲染即可


```javascript

initCanvas(){
	this.canvas = document.createElement('canvas')
    this.canvas.width = this.canvas.height = this.SIDE
    document.body.appendChild(this.canvas)
}

drawCanvas(){
	// 32*32 四周变量1px，所以中间是30*30， 用15*15的格子，每个格子2px
    var context = this.canvas.getContext('2d')  //getContext() 方法可返回一个对象  
    context.clearRect(0,0,this.SIDE,this.SIDE)
    context.strokeStyle = 'green'
    context.lineWidth = this.LINE_WIDTH
  	context.fillStyle = "red"  // 设置或返回用于填充绘画的颜色、渐变或模式              
	context.strokeRect(0, 0, this.SIDE, this.SIDE)
	
	this.grid.forEach((row,y)=>{
		row.forEach((g,x)=>{
			if(g!==0){
				// 食物或者是蛇
				context.fillRect(this.LINE_WIDTH+x*this.SIZE,this.LINE_WIDTH+y*this.SIZE,this.SIZE,this.SIZE)  // x轴 y轴 宽 和 高 ,绘制“被填充”的矩形  
				
			}
		})
    })
    setFavico(this.canvas)
}
```



### 放食物
这个没啥说的，随机一个坐标，然后位置落在小蛇上，就重新随机，否则就设置成2 画出来也用红色
然后直接把canvas截个图，放在favicon上就可以

```javascript
// 放吃的
setFood(){
	while(true){
		const x = Math.floor(Math.random()* this.WIDTH)
		const y = Math.floor(Math.random()* this.WIDTH)
		if(this.grid[y][x]=='1'){
			continue
		}else{
			//食物是2
			this.grid[y][x]='2'
			break
		}
	}
}

```

### 移动
有上下左右四个方向可以移动，这里偷个懒 单纯的根据方向和蛇头的位置，判断下一个蛇头在的点，然后根据是否吃掉食物，决定尾巴是不是掐掉一个尖即可，比较简单
1. 下一个蛇头在的位置，如果超出网格，或者是小蛇自己，游戏结束，统计分数放在localstorage里
2. setInterval定时移动就可以，根据方向

```javascript
this.directions = {
	// 左
	'left':{x:-1,y:0},
	// 上
	'up':{x:0,y:-1},
	// 右
	'right':{x:1,y:0},
	// 下
	'down':{x:0,y:1},
}

```

```javascript
move(){	
	// 1. 根据方向，计算出下一个蛇头所在位置
	// 蛇头设为
	const head = this.snake[this.snake.length-1]
	const tail = this.snake[0]
	const nextX = head.x+this.current.x
	const nextY = head.y+this.current.y

	// 2. 判断蛇头是不是出界  是不是碰见自己个了 如果是屁股尖就碰不到
    const isOut = nextX<0||nextX>=this.WIDTH||nextY<0||nextY>=this.WIDTH
    if(isOut){
        this.initGame()
		return 
    }

	const isSelf = (this.grid[nextY][nextX]) =='1' && !(nextX === tail.x && nextY === tail.y)

	if(isSelf){
        this.initGame()
		return 
	}

    const isFood = this.grid[nextY][nextX]=='2' // 食物是2
    if(!isFood){
        // 所谓蛇向前走，就是把尾巴去掉， 新增nextX和Y
        // 去尾巴 有食物的时候不用去尾
        this.snake.shift()
        this.grid[tail.y][tail.x] = 0
    }else{
        // 食物吃掉了，在放一个
        this.setFood()
        // 加一份
        this.score++
        this.setTitle()
    }

	// 新增头部
	this.snake.push({x:nextX,y:nextY})
    this.grid[nextY][nextX] = '1'
    this.drawCanvas()
}

```




## 后续

基本功能也就这些了，自己摸鱼够用了，这样就可以开3个tab
* 1号tab看小视频
* 2号tab开摄像头，防止后面班主任
* 3号tab玩贪食蛇
其实30 * 30像素可以做的东西还挺多，比如俄罗斯方块，魔塔，坦克大战，都是能放下的，有兴趣的可以试试

代码地址： https://github.com/a552422934/Favicon

