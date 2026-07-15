// core.js — window manager for Web OS
// handles dragging, resizing, maximize, z-index stacking
// Abdullah, 2025

var zTop = 100;      // goes up every time a window is clicked so the right one is always on top
var isOpen = {};     // tracks which apps are currently open

// list of all windows — add new ones here if you make more apps
var allWindows = [
  'notes','settings','calendar','terminal','focus',
  'palette','music','pixel','calc','weather',
  'tetris','snake','tools','games','media','gallery'
];


function openWin(id) {
  var win = document.getElementById('win-' + id);
  if (!win) return;

  // only set position the first time it opens
  if (!win.classList.contains('open')) {
    // random offset so windows dont all stack perfectly on top of each other
    var jitterX = (Math.random() - 0.5) * 60;
    var jitterY = (Math.random() - 0.5) * 60;

    // default sizes per app — some need more space than others
    if (id === 'palette') { win.style.width = '1000px'; win.style.height = '600px'; }
    else if (id === 'calc')    { win.style.width = '300px';  win.style.height = '440px'; }
    else if (id === 'tetris')  { win.style.width = '400px';  win.style.height = '610px'; }
    else if (id === 'snake')   { win.style.width = '550px';  win.style.height = '460px'; }
    else if (id === 'gallery') { win.style.width = '600px';  win.style.height = '500px'; }

    var w = parseInt(win.style.width) || 350;
    win.style.left = 'calc(50% - ' + (w / 2) + 'px + ' + jitterX + 'px)';
    win.style.top  = 'calc(45% - 200px + ' + jitterY + 'px)';
  }

  win.classList.add('open');
  bringFront(win);
  isOpen[id] = true;

  // show the little dot under the dock icon
  var dot = document.getElementById('di-' + id);
  if (dot) dot.classList.add('open');
}


function closeWin(id) {
  var win = document.getElementById('win-' + id);
  if (!win) return;
  win.classList.remove('open');
  isOpen[id] = false;

  var dot = document.getElementById('di-' + id);
  if (dot) dot.classList.remove('open');
}


function toggleWin(id) {
  if (isOpen[id]) {
    closeWin(id);
  } else {
    openWin(id);
    // auto-focus the terminal input so you can start typing immediately
    if (id === 'terminal') {
      setTimeout(function() { document.getElementById('term-in').focus(); }, 40);
    }
  }
}


// push clicked window to front by bumping its z-index
function bringFront(win) {
  zTop++;
  win.style.zIndex = zTop;
  // topbar and dock always stay above everything
  document.getElementById('topbar').style.zIndex = 9000;
  document.getElementById('dock').style.zIndex   = 8999;
}


// wire up all windows: click to focus, drag to move, double-click titlebar to maximize
allWindows.forEach(function(id) {
  var win    = document.getElementById('win-' + id);
  var handle = document.getElementById('th-' + id);
  if (!win || !handle) return;

  win.addEventListener('mousedown', function() { bringFront(win); });

  makeDraggable(win, handle);
  makeResizable(win);

  handle.addEventListener('dblclick', function(e) {
    if (e.target.tagName !== 'BUTTON') toggleMaximize(id);
  });

  // wire max button if it doesnt already have an onclick
  var maxBtn = win.querySelector('.tb-max');
  if (maxBtn && !maxBtn.onclick) {
    maxBtn.onclick = function() { toggleMaximize(id); };
  }
});


// drag a window by its titlebar
function makeDraggable(win, handle) {
  var startMouseX, startMouseY, startWinLeft, startWinTop;

  handle.addEventListener('mousedown', function(e) {
    if (e.target.tagName === 'BUTTON') return; // dont drag when clicking close/min/max
    if (win.classList.contains('maximized')) return; // dont drag when maximized
    e.preventDefault();

    var rect   = win.getBoundingClientRect();
    startMouseX  = e.clientX;
    startMouseY  = e.clientY;
    startWinLeft = rect.left;
    startWinTop  = rect.top;

    bringFront(win);

    function onMouseMove(e) {
      win.style.left = (startWinLeft + e.clientX - startMouseX) + 'px';
      win.style.top  = (startWinTop  + e.clientY - startMouseY) + 'px';
    }

    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}


// add resize handles to all 8 edges/corners of a window
function makeResizable(win) {
  // 8 handles: corners and edges
  var handles = [
    { cls: 'resize-n',  cursor: 'n-resize',  edges: ['n'] },
    { cls: 'resize-s',  cursor: 's-resize',  edges: ['s'] },
    { cls: 'resize-e',  cursor: 'e-resize',  edges: ['e'] },
    { cls: 'resize-w',  cursor: 'w-resize',  edges: ['w'] },
    { cls: 'resize-nw', cursor: 'nw-resize', edges: ['n','w'] },
    { cls: 'resize-ne', cursor: 'ne-resize', edges: ['n','e'] },
    { cls: 'resize-sw', cursor: 'sw-resize', edges: ['s','w'] },
    { cls: 'resize-se', cursor: 'se-resize', edges: ['s','e'] },
  ];

  handles.forEach(function(h) {
    var el = document.createElement('div');
    el.className   = 'resize-handle ' + h.cls;
    el.style.cursor = h.cursor;
    win.appendChild(el);

    el.addEventListener('mousedown', function(e) {
      if (win.classList.contains('maximized')) return;
      e.preventDefault();
      e.stopPropagation();
      bringFront(win);

      var startX    = e.clientX;
      var startY    = e.clientY;
      var rect      = win.getBoundingClientRect();
      var startW    = rect.width;
      var startH    = rect.height;
      var startLeft = rect.left;
      var startTop  = rect.top;
      var minW      = 240;
      var minH      = 160;

      function onMove(e) {
        var dx = e.clientX - startX;
        var dy = e.clientY - startY;
        var newW = startW, newH = startH, newLeft = startLeft, newTop = startTop;

        if (h.edges.includes('e')) newW = Math.max(minW, startW + dx);
        if (h.edges.includes('s')) newH = Math.max(minH, startH + dy);
        if (h.edges.includes('w')) {
          newW    = Math.max(minW, startW - dx);
          newLeft = startLeft + (startW - newW);
        }
        if (h.edges.includes('n')) {
          newH   = Math.max(minH, startH - dy);
          newTop = startTop + (startH - newH);
        }

        win.style.width  = newW + 'px';
        win.style.height = newH + 'px';
        win.style.left   = newLeft + 'px';
        win.style.top    = newTop  + 'px';
      }

      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  });
}


// double click titlebar to go fullscreen, double click again to restore
function toggleMaximize(id) {
  var win = document.getElementById('win-' + id);
  if (!win) return;

  if (win.classList.contains('maximized')) {
    win.classList.remove('maximized');
    win.style.width  = win._savedW    || '';
    win.style.height = win._savedH    || '';
    win.style.top    = win._savedTop  || '';
    win.style.left   = win._savedLeft || '';
  } else {
    // save current size/pos so we can restore it later
    win._savedW    = win.style.width;
    win._savedH    = win.style.height;
    win._savedTop  = win.style.top;
    win._savedLeft = win.style.left;

    win.classList.add('maximized');
    win.style.top    = '38px';
    win.style.left   = '0px';
    win.style.width  = '100vw';
    win.style.height = 'calc(100vh - 38px)';
  }

  bringFront(win);
}