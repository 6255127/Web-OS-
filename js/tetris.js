
// tetris.js - pixel tetris game for Web OS
// ok so i watched a youtube vid on this and then
// rewrote it from scratch. classic stuff.


var tetris = (function() {

  // the grid is 10 wide, 20 tall -- standard tetris size
  var COLS = 10;
  var ROWS = 20;
  var BLOCK = 28; // px per cell, makes it look chunky and pixel-y

  // colours for each piece type, doing it retro style
  var COLORS = [
    null,
    '#FF0D72', // I
    '#0DC2FF', // J
    '#0DFF72', // L
    '#F538FF', // O
    '#FF8E0D', // S
    '#FFE138', // T
    '#3877FF', // Z
  ];

  // tetromino shapes -- each is a 2d array of 1s and 0s
  // 1 = filled, 0 = empty
  var PIECES = [
    // I piece (long boi)
    [[1,1,1,1]],
    // J piece
    [[2,0,0],[2,2,2]],
    // L piece
    [[0,0,3],[3,3,3]],
    // O piece (the square, easiest piece)
    [[4,4],[4,4]],
    // S piece
    [[0,5,5],[5,5,0]],
    // T piece
    [[0,6,0],[6,6,6]],
    // Z piece
    [[7,7,0],[0,7,7]],
  ];

  var canvas, ctx;
  var board, piece, pieceX, pieceY;
  var score, level, lines;
  var gameLoop, dropInterval;
  var gameOver = false;
  var paused = false;

  // initialise (or restart) the whole game
  function init() {
    canvas = document.getElementById('tetris-canvas');
    if (!canvas) return; // window not open yet, chill
    ctx = canvas.getContext('2d');
    
    // make the canvas the right size
    canvas.width  = COLS * BLOCK;
    canvas.height = ROWS * BLOCK;

    board = createBoard();
    score = 0;
    level = 1;
    lines = 0;
    gameOver = false;
    paused = false;
    dropInterval = 800; // ms between drops, gets faster as level goes up

    spawnPiece();
    updateUI();
    
    // clear old loop if restarting
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(tick, dropInterval);
    onResize();
  }

  // create empty board (2d array of 0s)
  function createBoard() {
    var b = [];
    for (var r = 0; r < ROWS; r++) {
      b.push(new Array(COLS).fill(0));
    }
    return b;
  }

  // pick a random piece and put it at the top center
  function spawnPiece() {
    var idx = Math.floor(Math.random() * PIECES.length);
    piece = PIECES[idx].map(function(row) { return row.slice(); });
    pieceX = Math.floor(COLS / 2) - Math.floor(piece[0].length / 2);
    pieceY = 0;

    // if it spawns and immediately collides, game over man
    if (collides(piece, pieceX, pieceY)) {
      gameOver = true;
      clearInterval(gameLoop);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '14px monospace';
      ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 10);
      ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 35);
    }
  }

  // check if piece position is valid (no overlap, no out of bounds)
  function collides(p, px, py) {
    for (var r = 0; r < p.length; r++) {
      for (var c = 0; c < p[r].length; c++) {
        if (!p[r][c]) continue;
        var nx = px + c;
        var ny = py + r;
        if (nx < 0 || nx >= COLS) return true; // hit side wall
        if (ny >= ROWS) return true;            // hit bottom
        if (ny >= 0 && board[ny][nx]) return true; // hit another block
      }
    }
    return false;
  }

  // lock the current piece into the board
  function lockPiece() {
    for (var r = 0; r < piece.length; r++) {
      for (var c = 0; c < piece[r].length; c++) {
        if (!piece[r][c]) continue;
        var ny = pieceY + r;
        var nx = pieceX + c;
        if (ny >= 0) board[ny][nx] = piece[r][c];
      }
    }
    clearLines();
    spawnPiece();
  }

  // check for complete rows and remove them
  // this is the satisfying part lol
  function clearLines() {
    var cleared = 0;
    for (var r = ROWS - 1; r >= 0; r--) {
      if (board[r].every(function(cell) { return cell !== 0; })) {
        board.splice(r, 1);
        board.unshift(new Array(COLS).fill(0));
        cleared++;
        r++; // re-check same row index
      }
    }

    if (cleared > 0) {
      // classic scoring: more lines at once = more points
      var pts = [0, 100, 300, 500, 800];
      score += (pts[cleared] || 800) * level;
      lines += cleared;
      level = Math.floor(lines / 10) + 1;
      
      // speed up as level increases, down to 100ms minimum
      dropInterval = Math.max(100, 800 - (level - 1) * 70);
      clearInterval(gameLoop);
      gameLoop = setInterval(tick, dropInterval);
      
      updateUI();
    }
  }

  // rotate a piece 90 degrees clockwise
  // this took me forever to figure out lol
  function rotatePiece(p) {
    var rows = p.length;
    var cols = p[0].length;
    var rotated = [];
    for (var c = 0; c < cols; c++) {
      rotated.push([]);
      for (var r = rows - 1; r >= 0; r--) {
        rotated[c].push(p[r][c]);
      }
    }
    return rotated;
  }

  // one game tick = piece drops one row
  function tick() {
    if (paused || gameOver) return;
    if (!collides(piece, pieceX, pieceY + 1)) {
      pieceY++;
    } else {
      lockPiece();
    }
    draw();
  }

  // draw everything onto the canvas
  function draw() {
    if (!ctx) return;
    
    // clear background with dark color
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // draw the grid dots (subtle background grid)
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        ctx.fillRect(c * BLOCK + BLOCK/2 - 1, r * BLOCK + BLOCK/2 - 1, 2, 2);
      }
    }

    // draw locked blocks on the board
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (board[r][c]) {
          drawBlock(c, r, COLORS[board[r][c]]);
        }
      }
    }

    // draw ghost piece (shows where it'll land)
    var ghostY = pieceY;
    while (!collides(piece, pieceX, ghostY + 1)) ghostY++;
    if (ghostY !== pieceY) {
      for (var r = 0; r < piece.length; r++) {
        for (var c = 0; c < piece[r].length; c++) {
          if (!piece[r][c]) continue;
          var gx = (pieceX + c) * BLOCK;
          var gy = (ghostY + r) * BLOCK;
          ctx.strokeStyle = COLORS[piece[r][c]];
          ctx.globalAlpha = 0.25;
          ctx.strokeRect(gx + 1, gy + 1, BLOCK - 2, BLOCK - 2);
          ctx.globalAlpha = 1;
        }
      }
    }

    // draw the current falling piece
    for (var r = 0; r < piece.length; r++) {
      for (var c = 0; c < piece[r].length; c++) {
        if (piece[r][c]) {
          drawBlock(pieceX + c, pieceY + r, COLORS[piece[r][c]]);
        }
      }
    }
  }

  // draw a single pixel-y square block
  function drawBlock(x, y, color) {
    var px = x * BLOCK;
    var py = y * BLOCK;
    
    // main block color
    ctx.fillStyle = color;
    ctx.fillRect(px + 1, py + 1, BLOCK - 2, BLOCK - 2);
    
    // light edge (top/left) for that fake 3d pixel look
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(px + 1, py + 1, BLOCK - 2, 3);
    ctx.fillRect(px + 1, py + 1, 3, BLOCK - 2);
    
    // dark edge (bottom/right)
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(px + 1, py + BLOCK - 4, BLOCK - 2, 3);
    ctx.fillRect(px + BLOCK - 4, py + 1, 3, BLOCK - 2);
  }

  // update the score/level display outside the canvas
  function updateUI() {
    var el = document.getElementById('tetris-score');
    if (el) el.textContent = score;
    var lv = document.getElementById('tetris-level');
    if (lv) lv.textContent = level;
    var ln = document.getElementById('tetris-lines');
    if (ln) ln.textContent = lines;
  }

  // keyboard controls -- only active when tetris window is open
  function handleKey(e) {
    // only handle if tetris is open
    if (!document.getElementById('win-tetris').classList.contains('open')) return;
    if (gameOver) {
      if (e.key === 'r' || e.key === 'R') init(); // restart on R
      return;
    }
    
    switch(e.key) {
      case 'ArrowLeft':
        if (!collides(piece, pieceX - 1, pieceY)) { pieceX--; draw(); }
        e.preventDefault();
        break;
      case 'ArrowRight':
        if (!collides(piece, pieceX + 1, pieceY)) { pieceX++; draw(); }
        e.preventDefault();
        break;
      case 'ArrowDown':
        // soft drop - move down one row
        if (!collides(piece, pieceX, pieceY + 1)) { pieceY++; draw(); }
        else lockPiece(), draw();
        e.preventDefault();
        break;
      case 'ArrowUp':
      case 'x':
      case 'X':
        // rotate!
        var rotated = rotatePiece(piece);
        // wall kick - try left/right if rotation doesn't fit
        if (!collides(rotated, pieceX, pieceY)) {
          piece = rotated;
        } else if (!collides(rotated, pieceX - 1, pieceY)) {
          piece = rotated; pieceX--;
        } else if (!collides(rotated, pieceX + 1, pieceY)) {
          piece = rotated; pieceX++;
        }
        draw();
        e.preventDefault();
        break;
      case ' ':
        // hard drop - slam it to the bottom
        while (!collides(piece, pieceX, pieceY + 1)) {
          pieceY++;
          score += 2; // bonus points for hard dropping
        }
        lockPiece();
        draw();
        updateUI();
        e.preventDefault();
        break;
      case 'p':
      case 'P':
        paused = !paused;
        if (!paused) draw();
        break;
      case 'r':
      case 'R':
        init();
        break;
    }
  }

  function onResize() {
    var win = document.getElementById('win-tetris');
    if (!win || !canvas) return;
    var body = win.querySelector('.win-body > div');
    if (!body) return;
    var availW = body.clientWidth - 32;
    var availH = body.clientHeight - 32;
    BLOCK = Math.max(14, Math.min(Math.floor(availW / COLS), Math.floor(availH / ROWS)));
    canvas.width = COLS * BLOCK;
    canvas.height = ROWS * BLOCK;
    draw();
  }

  // expose public stuff
  return {
    init: init,
    handleKey: handleKey,
    onResize: onResize
  };
})();

// hook up the keyboard when the page loads
document.addEventListener('keydown', tetris.handleKey);
