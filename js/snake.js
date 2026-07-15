
// snake.js - because a OS isn't a OS without snake
// totally human-made, probably has some bugs but it works lol


var snakeGame = (function() {
  var canvas, ctx;
  var gridSize = 20; // size of each block in pixels
  var tileCountX = 20;
  var tileCountY = 20;
  var snake = [];
  var apple = {};
  var velocity = {x: 0, y: 0};
  var nextVelocity = {x: 0, y: 0};
  var score = 0;
  var loop = null;
  var gameOver = false;
  
  function init() {
    canvas = document.getElementById('snake-canvas');
    if (!canvas) return; // not open yet? okay
    ctx = canvas.getContext('2d');
    
    // adjust canvas size based on tile count
    canvas.width = gridSize * tileCountX;
    canvas.height = gridSize * tileCountY;
    
    reset();
    
    // bind keys if not already done
    if (!snakeGame._keysBound) {
      document.addEventListener('keydown', handleKey);
      snakeGame._keysBound = true;
    }
  }
  
  function reset() {
    snake = [
      {x: 10, y: 10},
      {x: 10, y: 11},
      {x: 10, y: 12}
    ];
    velocity = {x: 0, y: -1}; // start moving up
    nextVelocity = {x: 0, y: -1};
    score = 0;
    gameOver = false;
    updateScore();
    placeApple();
    
    if (loop) clearInterval(loop);
    // pretty fast cause i hate slow snake games
    loop = setInterval(tick, 100); 
  }
  
  function placeApple() {
    apple = {
      x: Math.floor(Math.random() * tileCountX),
      y: Math.floor(Math.random() * tileCountY)
    };
    // dont place apple ON the snake (thats just cruel)
    for (var i = 0; i < snake.length; i++) {
      if (snake[i].x === apple.x && snake[i].y === apple.y) {
        placeApple();
        return;
      }
    }
  }
  
  function tick() {
    if (gameOver) return;
    
    velocity = nextVelocity;
    
    // calc new head pos
    var head = {
      x: snake[0].x + velocity.x,
      y: snake[0].y + velocity.y
    };
    
    // check walls (die if hit)
    if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
      return die();
    }
    
    // check self (don't eat yourself!)
    for (var i = 0; i < snake.length; i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) {
        return die();
      }
    }
    
    snake.unshift(head); // add new head
    
    // check if ate apple
    if (head.x === apple.x && head.y === apple.y) {
      score += 10;
      updateScore();
      placeApple(); 
    } else {
      snake.pop(); // remove tail if no apple eaten
    }
    
    draw();
  }
  
  function die() {
    gameOver = true;
    clearInterval(loop);
    
    // draw death screen
    draw();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#fff';
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 10);
    ctx.font = '14px monospace';
    ctx.fillText('Score: ' + score, canvas.width/2, canvas.height/2 + 20);
    ctx.fillText('Press SPACE to restart', canvas.width/2, canvas.height/2 + 45);
  }
  
  function draw() {
    // bg
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // subtle grid pattern cause it looks cool
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (var x=0; x<tileCountX; x++) {
      for (var y=0; y<tileCountY; y++) {
        ctx.fillRect(x*gridSize+1, y*gridSize+1, gridSize-2, gridSize-2);
      }
    }
    
    // draw snake
    for (var i = 0; i < snake.length; i++) {
      // head is slightly lighter green than body
      ctx.fillStyle = i === 0 ? '#0DFF72' : '#00c354';
      ctx.fillRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize-1, gridSize-1);
    }
    
    // draw apple
    ctx.fillStyle = '#FF0D72';
    // make apple slightly smaller so it looks round-ish
    ctx.beginPath();
    ctx.arc(
      apple.x * gridSize + gridSize/2, 
      apple.y * gridSize + gridSize/2, 
      gridSize/2 - 2, 
      0, Math.PI*2
    );
    ctx.fill();
  }
  
  function updateScore() {
    var el = document.getElementById('snake-score');
    if (el) el.textContent = score;
  }
  
  function handleKey(e) {
    // only play if window is open
    var win = document.getElementById('win-snake');
    if (!win || !win.classList.contains('open')) return;
    
    if (gameOver) {
      if (e.key === ' ' || e.key === 'r' || e.key === 'R') {
        reset();
      }
      return;
    }
    
    // don't let snake reverse directly into itself (prevent immediate death)
    if ((e.key === 'ArrowLeft' || e.key === 'a') && velocity.x !== 1) {
      nextVelocity = {x: -1, y: 0}; e.preventDefault();
    } else if ((e.key === 'ArrowRight' || e.key === 'd') && velocity.x !== -1) {
      nextVelocity = {x: 1, y: 0}; e.preventDefault();
    } else if ((e.key === 'ArrowUp' || e.key === 'w') && velocity.y !== 1) {
      nextVelocity = {x: 0, y: -1}; e.preventDefault();
    } else if ((e.key === 'ArrowDown' || e.key === 's') && velocity.y !== -1) {
      nextVelocity = {x: 0, y: 1}; e.preventDefault();
    }
  }
  
  function onResize() {
    var win = document.getElementById('win-snake');
    if (!win || !canvas) return;
    var body = win.querySelector('.win-body > div');
    if (!body) return;
    var size = Math.min(body.clientWidth - 32, body.clientHeight - 32);
    gridSize = Math.max(10, Math.floor(size / tileCountX));
    canvas.width = gridSize * tileCountX;
    canvas.height = gridSize * tileCountY;
    draw();
  }

  return { init: init, onResize: onResize };
})();
