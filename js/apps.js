// apps.js — all app logic for Web OS
// written by Abdullah, grade 12, Qatar
// every app in one file: calc, notes, wallpapers, weather, calendar, terminal, focus, music, pixel art


/* ---- calculator ---- */

var calcDisplay = document.getElementById('calc-display');
var calcExpr = '';

function calcPress(val) {
  if (val === 'C') {
    calcExpr = '';
    calcDisplay.innerText = '0';
    return;
  }

  if (val === '=') {
    try {
      // new Function instead of eval — safer for basic math
      var result = new Function('return ' + calcExpr)();
      if (result === Infinity || isNaN(result)) throw new Error('bad');
      // fix 0.1+0.2 floating point nonsense
      result = Math.round(result * 1e8) / 1e8;
      calcDisplay.innerText = String(result).substring(0, 14);
      calcExpr = String(result);
    } catch(e) {
      calcDisplay.innerText = 'Error';
      calcExpr = '';
    }
    return;
  }

  calcExpr += val;
  calcDisplay.innerText = calcExpr;
}


/* ---- notes ---- */

var notesBox  = document.getElementById('notes-textarea');
var notesInfo = document.getElementById('notes-bar');

notesBox.value = localStorage.getItem('webos_notes') || '';

notesBox.addEventListener('input', function() {
  localStorage.setItem('webos_notes', notesBox.value);
  var time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  notesInfo.textContent = 'saved at ' + time + ' · ' + notesBox.value.length + ' chars';
});


/* ---- theme (dark / light) ---- */

var darkMode = localStorage.getItem('webos_theme') === 'dark';

function applyTheme() {
  if (darkMode) {
    document.body.classList.add('dark-theme');
    document.getElementById('theme-toggle-btn').textContent = 'Light Mode';
  } else {
    document.body.classList.remove('dark-theme');
    document.getElementById('theme-toggle-btn').textContent = 'Dark Mode';
  }
}

function toggleTheme() {
  darkMode = !darkMode;
  localStorage.setItem('webos_theme', darkMode ? 'dark' : 'light');
  applyTheme();
  showToast(darkMode ? 'Dark mode on' : 'Light mode on');
}

applyTheme();


/* ---- wallpapers ----
   videos live in media/ folder
   mount fuji is default (index 0) */

var wallpaperList = [
  {
    name: 'Mount Fuji',
    bg: '#1a0a00',
    thumb: 'linear-gradient(135deg, #ff6b35, #f7931e, #cc2936)',
    video: null,
    live: null,
    // we use a nice high-res image from unsplash for the default wallpaper so it looks amazing right away!
    image: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?q=80&w=2560&auto=format&fit=crop'
  }
];

var wpGrid = document.getElementById('wp-grid');

wallpaperList.forEach(function(wp, i) {
  var div = document.createElement('div');
  div.className = 'wp-thumb' + (i === 0 ? ' active' : '');
  div.style.background = wp.thumb;
  div.style.backgroundSize = 'cover';
  div.innerHTML = '<span>' + wp.name + '</span>';
  div.addEventListener('click', function() { applyWallpaper(i); });
  wpGrid.appendChild(div);
});

var wpCanvas  = document.getElementById('live-wp-canvas');
var wpCtx     = wpCanvas.getContext('2d');
var animFrame = null;
var activeWpType = null;

var starList = [], matrixDrops = [];

function startLiveWallpaper(type) {
  wpCanvas.width  = window.innerWidth;
  wpCanvas.height = window.innerHeight;
  activeWpType = type;

  if (type === 'starfield') {
    starList = Array.from({length: 200}, function() {
      return { x: Math.random()*wpCanvas.width, y: Math.random()*wpCanvas.height, z: Math.random()*wpCanvas.width };
    });
  } else if (type === 'matrix') {
    var colCount = Math.floor(wpCanvas.width / 14);
    matrixDrops = [];
    for (var i = 0; i < colCount; i++) matrixDrops[i] = 1;
  }
}

window.addEventListener('resize', function() {
  if (activeWpType) startLiveWallpaper(activeWpType);
});

function drawLiveWallpaper() {
  if (!activeWpType) return;

  if (activeWpType === 'starfield') {
    wpCtx.fillStyle = '#050510';
    wpCtx.fillRect(0, 0, wpCanvas.width, wpCanvas.height);
    wpCtx.fillStyle = '#ffffff';
    var cx = wpCanvas.width/2, cy = wpCanvas.height/2;
    for (var i = 0; i < starList.length; i++) {
      var s = starList[i];
      s.z -= 2;
      if (s.z <= 0) { s.x = Math.random()*wpCanvas.width; s.y = Math.random()*wpCanvas.height; s.z = wpCanvas.width; }
      var sx = (s.x - cx) * (wpCanvas.width/s.z) + cx;
      var sy = (s.y - cy) * (wpCanvas.width/s.z) + cy;
      var r  = (1 - s.z/wpCanvas.width) * 3;
      if (sx>0 && sx<wpCanvas.width && sy>0 && sy<wpCanvas.height) {
        wpCtx.beginPath(); wpCtx.arc(sx, sy, r, 0, Math.PI*2); wpCtx.fill();
      }
    }
  } else if (activeWpType === 'matrix') {
    wpCtx.fillStyle = 'rgba(0,0,0,0.05)';
    wpCtx.fillRect(0, 0, wpCanvas.width, wpCanvas.height);
    wpCtx.fillStyle = '#0F0';
    wpCtx.font = '14px monospace';
    for (var i = 0; i < matrixDrops.length; i++) {
      var ch = String.fromCharCode(Math.floor(Math.random()*128));
      wpCtx.fillText(ch, i*14, matrixDrops[i]*14);
      if (matrixDrops[i]*14 > wpCanvas.height && Math.random() > 0.975) matrixDrops[i] = 0;
      matrixDrops[i]++;
    }
  }

  animFrame = requestAnimationFrame(drawLiveWallpaper);
}

var bgVideo = document.getElementById('live-wp-video');

function applyWallpaper(idx) {
  var wp   = wallpaperList[idx];
  // use a dedicated wallpaper layer div so backdrop-filter on windows
  // doesnt blur the wallpaper itself (that was the blur bug)
  var wpBg = document.getElementById('wp-bg-layer');

  // stop whatever was running before
  if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
  activeWpType = null;

  wpCanvas.style.display = 'none';
  bgVideo.style.display  = 'none';
  bgVideo.pause();
  bgVideo.removeAttribute('src');

  // reset the bg layer
  wpBg.style.backgroundImage    = 'none';
  wpBg.style.backgroundColor    = wp.bg;
  wpBg.style.backgroundSize     = 'cover';
  wpBg.style.backgroundPosition = 'center';

  if (wp.image) {
    // static image — goes on the bg layer, NOT the desktop div
    // this keeps it outside the stacking context that gets blurred by windows
    wpBg.style.backgroundImage = 'url(' + wp.image + ')';

  } else if (wp.video) {
    // timeout so browser releases old video before loading new one
    setTimeout(function() {
      bgVideo.src = wp.video;
      bgVideo.load();
      bgVideo.style.display = 'block';
      bgVideo.play().catch(function() {});
    }, 50);

  } else if (wp.live) {
    wpCanvas.width  = window.innerWidth;
    wpCanvas.height = window.innerHeight;
    wpCanvas.style.display = 'block';
    startLiveWallpaper(wp.live);
    drawLiveWallpaper();
  }

  var thumbs = document.querySelectorAll('.wp-thumb');
  thumbs.forEach(function(t, j) { t.classList.toggle('active', j === idx); });

  localStorage.setItem('webos_wallpaper', idx);
  showToast('Wallpaper: ' + wp.name);
}

function handleVideoWpUpload(e) {
  var file = e.target.files[0];
  if (!file) return;
  var url  = URL.createObjectURL(file);
  var name = file.name.replace(/\.[^/.]+$/, '');
  if (name.length > 14) name = name.substring(0, 14) + '…';
  var newIdx = wallpaperList.length;
  wallpaperList.push({ name: name, bg: '#000', thumb: 'linear-gradient(135deg,#333,#000)', video: url, live: null });
  var div = document.createElement('div');
  div.className = 'wp-thumb';
  div.style.background = 'linear-gradient(135deg,#333,#000)';
  div.innerHTML = '<span>' + name + '</span>';
  div.addEventListener('click', function() { applyWallpaper(newIdx); });
  wpGrid.appendChild(div);
  applyWallpaper(newIdx);
  showToast('Added: ' + name);
}

// always boot with mount fuji (index 0) as default
// user can change it in settings and it saves, but first load = fuji
localStorage.removeItem('webos_wallpaper'); // clear any saved preference so fuji is always first
applyWallpaper(0);


/* ---- weather — Doha, Qatar ----
   lat 25.2854, lng 51.5310
   open-meteo, no api key needed */

async function fetchWeather() {
  var tempEl  = document.getElementById('weather-display');
  var descEl  = document.getElementById('weather-desc');
  var iconEl  = document.getElementById('weather-icon');
  var windEl  = document.getElementById('weather-wind');
  var dirEl   = document.getElementById('weather-dir');
  var humEl   = document.getElementById('weather-hum');
  var presEl  = document.getElementById('weather-pres');
  var feelsEl = document.getElementById('weather-feels');
  var uvEl    = document.getElementById('weather-uv');
  var visEl   = document.getElementById('weather-vis');
  var dewEl   = document.getElementById('weather-dew');

  tempEl.innerText = '--°';
  descEl.innerText = 'fetching…';

  try {
    var res = await fetch(
      'https://api.open-meteo.com/v1/forecast' +
      '?latitude=25.2854&longitude=51.5310' +
      '&current=temperature_2m,apparent_temperature,relative_humidity_2m,' +
      'surface_pressure,wind_speed_10m,wind_direction_10m,weather_code,' +
      'uv_index,visibility,dew_point_2m' +
      '&timezone=Asia%2FQatar&forecast_days=1'
    );
    var data = await res.json();
    var cur  = data.current;

    tempEl.innerText = Math.round(cur.temperature_2m) + '°C';
    if (feelsEl) feelsEl.innerText = 'feels ' + Math.round(cur.apparent_temperature) + '°';
    if (windEl)  windEl.innerText  = cur.wind_speed_10m + ' km/h';
    if (dirEl)   dirEl.innerText   = degToCompass(cur.wind_direction_10m);
    if (humEl)   humEl.innerText   = cur.relative_humidity_2m + '%';
    if (presEl)  presEl.innerText  = Math.round(cur.surface_pressure) + ' hPa';
    if (uvEl)    uvEl.innerText    = cur.uv_index != null ? cur.uv_index.toFixed(1) : '--';
    if (visEl)   visEl.innerText   = cur.visibility != null ? (cur.visibility/1000).toFixed(1) + ' km' : '--';
    if (dewEl)   dewEl.innerText   = cur.dew_point_2m != null ? Math.round(cur.dew_point_2m) + '°' : '--';

    var codes = {
      0:  { icon:'☀️',  text:'Clear sky' },       1:  { icon:'🌤️', text:'Mostly clear' },
      2:  { icon:'⛅',   text:'Partly cloudy' },   3:  { icon:'☁️',  text:'Overcast' },
      45: { icon:'🌫️', text:'Foggy' },            48: { icon:'🌫️', text:'Rime fog' },
      51: { icon:'🌦️', text:'Light drizzle' },    53: { icon:'🌦️', text:'Drizzle' },
      55: { icon:'🌧️', text:'Heavy drizzle' },    61: { icon:'🌧️', text:'Light rain' },
      63: { icon:'🌧️', text:'Rain' },             65: { icon:'🌧️', text:'Heavy rain' },
      71: { icon:'❄️',  text:'Light snow' },       73: { icon:'❄️',  text:'Snow' },
      75: { icon:'❄️',  text:'Heavy snow' },       95: { icon:'⛈️', text:'Thunderstorm' }
    };
    var cond = codes[cur.weather_code] || { icon:'🌍', text:'Unknown' };
    iconEl.innerText = cond.icon;
    descEl.innerText = cond.text;

  } catch(err) {
    tempEl.innerText = 'err';
    descEl.innerText = 'could not fetch';
    console.error('weather error:', err);
  }
}

function degToCompass(deg) {
  var dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg/45) % 8];
}

setTimeout(fetchWeather, 2000);


/* ---- calendar ---- */

var MONTHS   = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
var WEEKDAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

var calEvents = {
  '2026-7-12': ['YSWS submission'],
  '2026-7-15': ['Hackathon'],
  '2026-8-1':  ['Back to school']
};

var calViewDate    = new Date();
var calSelectedKey = null;

function renderCal() {
  var y     = calViewDate.getFullYear();
  var m     = calViewDate.getMonth();
  var today = new Date();
  document.getElementById('cal-label').textContent = MONTHS[m] + ' ' + y;

  var html = WEEKDAYS.map(function(d) { return '<div class="cal-dname">' + d + '</div>'; }).join('');
  var firstDay    = new Date(y, m, 1).getDay();
  var daysInMonth = new Date(y, m+1, 0).getDate();
  var prevDays    = new Date(y, m, 0).getDate();

  for (var p = firstDay-1; p >= 0; p--) html += '<div class="cal-day">' + (prevDays-p) + '</div>';

  for (var d = 1; d <= daysInMonth; d++) {
    var key = y+'-'+(m+1)+'-'+d;
    var cls = 'cal-day cur-month';
    if (d===today.getDate() && m===today.getMonth() && y===today.getFullYear()) cls += ' today';
    if (calSelectedKey===key) cls += ' selected';
    if (calEvents[key]) cls += ' has-event';
    html += '<div class="'+cls+'" onclick="calSelectDay('+y+','+(m+1)+','+d+')">'+d+'</div>';
  }

  var total   = firstDay + daysInMonth;
  var trailer = total%7===0 ? 0 : 7-(total%7);
  for (var n = 1; n <= trailer; n++) html += '<div class="cal-day">'+n+'</div>';

  document.getElementById('cal-grid').innerHTML = html;
  renderCalEvents();
}

function calSelectDay(y, m, d) { calSelectedKey = y+'-'+m+'-'+d; renderCal(); }
function calShift(delta) { calViewDate.setMonth(calViewDate.getMonth()+delta); renderCal(); }

function renderCalEvents() {
  var t   = new Date();
  var key = calSelectedKey || (t.getFullYear()+'-'+(t.getMonth()+1)+'-'+t.getDate());
  var pts = key.split('-');
  document.getElementById('cal-ev-title').textContent = calSelectedKey
    ? pts[2]+' '+MONTHS[parseInt(pts[1])-1] : 'Today';
  var evs  = calEvents[key];
  var list = document.getElementById('cal-ev-list');
  list.innerHTML = evs && evs.length
    ? evs.map(function(e) { return '<div class="cal-event">'+e+'</div>'; }).join('')
    : '<div class="cal-empty">nothing scheduled</div>';
}

renderCal();


/* ---- terminal ---- */

var cmdHistory = [];
var historyPos = -1;

function termPrint(text, cls) {
  var out  = document.getElementById('term-out');
  var line = document.createElement('div');
  line.className   = cls || '';
  line.textContent = text;
  out.appendChild(line);
  out.scrollTop = out.scrollHeight;
}

var commands = {

  help: function() {
    var lines = [
      'commands you can run:',
      '',
      '  help              — this list',
      '  clear             — clear the screen',
      '  ls                — list all apps',
      '  open <app>        — open an app by name',
      '  close <app>       — close an app',
      '  date              — current date and time',
      '  echo <text>       — print something back',
      '  whoami            — your username',
      '  uname             — system info',
      '  weather           — open the weather app',
      '  wp <name>         — change wallpaper (fuji/gargantua/sun/stars/matrix)',
      '  theme <dark/light>— switch theme',
      '  calc <expr>       — quick math (e.g. calc 12*8+4)',
      '  time              — current time only',
      '  uptime            — how long the OS has been running',
      '  history           — show command history',
      '  rm -rf /          — try it',
      '  sudo              — try it',
      '  neofetch          — system info, fancy style',
      '  cowsay <text>     — a cow says something',
      '  fortune           — random quote',
      '  flip              — flip a coin',
      '  roll <n>          — roll an n-sided dice (e.g. roll 20)',
      '  color <hex>       — show a colour swatch',
      '  cls               — same as clear',
    ];
    return lines.join('\n');
  },

  clear: function() { document.getElementById('term-out').innerHTML = ''; return null; },
  cls:   function() { document.getElementById('term-out').innerHTML = ''; return null; },

  ls: function() {
    return [
      'apps:',
      '  notes     calendar  terminal  focus',
      '  palette   music     pixel     calc',
      '  weather   tetris    snake',
      '  tools     games     media     settings',
    ].join('\n');
  },

  open: function(args) {
    var app = args[0];
    if (!app) return 'usage: open <appname>';
    if (allWindows.indexOf(app) === -1) return 'no app called "' + app + '" — try ls';
    openWin(app);
    return 'opening ' + app + '…';
  },

  close: function(args) {
    var app = args[0];
    if (!app) return 'usage: close <appname>';
    if (allWindows.indexOf(app) === -1) return 'no app called "' + app + '"';
    closeWin(app);
    return 'closed ' + app;
  },

  date: function() { return new Date().toString(); },

  time: function() {
    var n = new Date();
    var h = n.getHours(), m = n.getMinutes(), s = n.getSeconds();
    var ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0') + ' ' + ampm;
  },

  echo: function(args) { return args.join(' '); },

  whoami: function() {
    var name = localStorage.getItem('webos_name');
    return name ? name : 'guest  (set your name in Settings)';
  },

  uname: function() {
    return [
      'Web OS 1.0',
      'built with vanilla JS, no frameworks',
      'running in: ' + navigator.userAgent.split(')')[0].split('(')[1],
    ].join('\n');
  },

  weather: function() { openWin('weather'); return 'opening weather…'; },

  // change wallpaper from terminal
  wp: function(args) {
    var name = (args[0] || '').toLowerCase();
    var map  = { fuji:0, gargantua:1, sun:2, stars:3, starfield:3, matrix:4 };
    if (map[name] !== undefined) {
      applyWallpaper(map[name]);
      return 'wallpaper changed';
    }
    return 'options: fuji, gargantua, sun, stars, matrix';
  },

  // switch theme from terminal
  theme: function(args) {
    var t = (args[0] || '').toLowerCase();
    if (t === 'dark') {
      darkMode = true;
      localStorage.setItem('webos_theme', 'dark');
      applyTheme();
      return 'dark mode on';
    } else if (t === 'light') {
      darkMode = false;
      localStorage.setItem('webos_theme', 'light');
      applyTheme();
      return 'light mode on';
    }
    return 'usage: theme dark  or  theme light';
  },

  // quick calculator — no need to open the app
  calc: function(args) {
    var expr = args.join('');
    if (!expr) return 'usage: calc 12*8+4';
    try {
      // only allow safe math characters
      if (!/^[\d\s\+\-\*\/\.\(\)%]+$/.test(expr)) return 'only basic math please';
      var result = new Function('return ' + expr)();
      result = Math.round(result * 1e8) / 1e8;
      return expr + ' = ' + result;
    } catch(e) {
      return 'could not compute: ' + expr;
    }
  },

  uptime: function() {
    // track when the page loaded
    var secs = Math.floor((Date.now() - window._bootTime) / 1000);
    var m    = Math.floor(secs / 60);
    var s    = secs % 60;
    return 'up ' + m + 'm ' + s + 's  (since page load)';
  },

  history: function() {
    if (!cmdHistory.length) return 'no history yet';
    return cmdHistory.slice(0, 20).map(function(c, i) { return '  ' + (i+1) + '  ' + c; }).join('\n');
  },

  // classic easter egg
  'rm': function(args) {
    if (args[0] === '-rf' && args[1] === '/') {
      termPrint('calculating disk usage…', 't-dim');
      termPrint('deleting /', 't-err');
      termPrint('deleting /usr', 't-err');
      termPrint('deleting /home', 't-err');
      setTimeout(function() { termPrint('just kidding lol. this is a browser.', 't-info'); }, 900);
      return null;
    }
    return 'rm: cannot remove: permission denied (and also this is a browser)';
  },

  sudo: function(args) {
    var nice = ['nice try', 'lol no', 'you wish', 'not a real OS bro', 'access denied (this is chrome)'];
    return nice[Math.floor(Math.random() * nice.length)];
  },

  neofetch: function() {
    var name = localStorage.getItem('webos_name') || 'user';
    var secs  = Math.floor((Date.now() - window._bootTime) / 1000);
    return [
      '  ' + name + '@webos',
      '  ----------',
      '  OS:       Web OS 1.0',
      '  Host:     ' + (location.hostname || 'localhost'),
      '  Shell:    websh 1.0',
      '  Browser:  ' + (navigator.userAgent.match(/(Chrome|Firefox|Safari)\/[\d.]+/) || ['unknown'])[0],
      '  Uptime:   ' + Math.floor(secs/60) + 'm ' + (secs%60) + 's',
      '  Theme:    ' + (darkMode ? 'dark' : 'light'),
      '  WP:       ' + (wallpaperList[parseInt(localStorage.getItem('webos_wallpaper') || 0)] || {name:'Mount Fuji'}).name,
    ].join('\n');
  },

  cowsay: function(args) {
    var msg  = args.join(' ') || 'moo';
    var line = '-'.repeat(msg.length + 2);
    var parts = [];
    parts.push(' +' + line + '+');
    parts.push(' | ' + msg + ' |');
    parts.push(' +' + line + '+');
    parts.push('      \\   ^__^');
    parts.push('       \\  (oo)\\_______');
    parts.push('          (__)\\       )\\/\\');
    parts.push('              ||----w |');
    parts.push('              ||     ||');
    return parts.join('\n');
  },

  fortune: function() {
    var quotes = [
      "Any sufficiently advanced technology is indistinguishable from magic. — Clarke",
      "Talk is cheap. Show me the code. — Linus Torvalds",
      "Programs must be written for people to read. — Abelson",
      "The best code is no code at all.",
      "It works on my machine. — every dev ever",
      "sudo make me a sandwich. — xkcd",
      "Real programmers count from 0.",
      "A bug is just a feature you haven't documented yet.",
      "99 bugs in the code... fix one, compile, 127 bugs.",
      "Have you tried turning it off and on again?",
      "There are only 10 types of people: those who understand binary and those who don't.",
      "It's not a bug — it's an undocumented feature.",
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  },

  flip: function() {
    return Math.random() > 0.5 ? 'heads' : 'tails';
  },

  roll: function(args) {
    var sides = parseInt(args[0]) || 6;
    if (sides < 2 || sides > 1000) return 'pick a number between 2 and 1000';
    var result = Math.floor(Math.random() * sides) + 1;
    return 'd' + sides + ' → ' + result;
  },

  // show a small colour swatch inline using a span with background
  color: function(args) {
    var hex = args[0] || '#ff0000';
    if (!hex.startsWith('#')) hex = '#' + hex;
    if (!/^#[0-9a-f]{3,6}$/i.test(hex)) return 'not a valid hex colour';
    // we print it via termPrint with html so use a trick
    var out = document.getElementById('term-out');
    var line = document.createElement('div');
    line.innerHTML = '<span style="display:inline-block;width:14px;height:14px;background:' + hex + ';border-radius:3px;vertical-align:middle;margin-right:6px;border:1px solid rgba(255,255,255,0.2)"></span>' + hex;
    out.appendChild(line);
    out.scrollTop = out.scrollHeight;
    return null; // null = dont print anything else
  },

};

function termKey(e) {
  var input = document.getElementById('term-in');
  if (e.key === 'Enter') {
    var raw = input.value.trim();
    if (!raw) return;
    termPrint('~ % ' + raw, 't-cmd');
    cmdHistory.unshift(raw);
    historyPos  = -1;
    input.value = '';
    var parts = raw.split(/\s+/);
    var cmd   = parts[0].toLowerCase();
    var args  = parts.slice(1);
    if (commands[cmd]) {
      var out = commands[cmd](args);
      if (out != null) termPrint(out, '');
    } else {
      termPrint('command not found: ' + cmd, 't-err');
    }
    return;
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (historyPos < cmdHistory.length-1) input.value = cmdHistory[++historyPos];
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (historyPos > 0) { input.value = cmdHistory[--historyPos]; }
    else { historyPos = -1; input.value = ''; }
  }
}

termPrint('Web OS — type help for commands', 't-info');
termPrint('', '');


/* ---- focus timer ---- */

var timerDurations   = { focus: 25*60, short: 5*60, long: 15*60 };
var timerMode        = 'focus';
var timerTotal       = timerDurations.focus;
var timerLeft        = timerTotal;
var timerRunning     = false;
var timerInterval    = null;
var sessionsFinished = 0;
var RING_LEN         = 2 * Math.PI * 65;

function switchMode(mode) {
  focusStop();
  timerMode  = mode;
  timerTotal = timerDurations[mode];
  timerLeft  = timerTotal;
  ['focus','short','long'].forEach(function(m) {
    document.getElementById('tab-'+m).classList.toggle('active', m===mode);
  });
  var labels  = { focus:'Focus', short:'Short Break', long:'Long Break' };
  var colours = { focus:'var(--text)', short:'#43e97b', long:'#667eea' };
  document.getElementById('focus-mode-label').textContent   = labels[mode];
  document.getElementById('focus-ring').style.stroke        = colours[mode];
  drawTimer();
}

function focusToggle() { timerRunning ? focusStop() : focusStart(); }

function focusStart() {
  if (timerLeft <= 0) focusReset();
  timerRunning = true;
  document.getElementById('focus-main-btn').textContent = 'Pause';
  timerInterval = setInterval(function() {
    timerLeft--;
    drawTimer();
    if (timerLeft <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      document.getElementById('focus-main-btn').textContent = 'Start';
      if (timerMode === 'focus') {
        sessionsFinished = Math.min(sessionsFinished+1, 4);
        drawSessionDots();
        showToast('Focus done! Take a break');
      } else {
        showToast('Break over — back to it');
      }
    }
  }, 1000);
}

function focusStop() {
  clearInterval(timerInterval);
  timerRunning = false;
  document.getElementById('focus-main-btn').textContent = 'Start';
}

function focusReset() { focusStop(); timerLeft = timerTotal; drawTimer(); }

function drawTimer() {
  var mins = Math.floor(timerLeft/60);
  var secs = timerLeft%60;
  document.getElementById('focus-clock').textContent = String(mins).padStart(2,'0')+':'+String(secs).padStart(2,'0');
  var ring = document.getElementById('focus-ring');
  ring.style.strokeDasharray  = RING_LEN;
  ring.style.strokeDashoffset = RING_LEN * (1 - timerLeft/timerTotal);
}

function drawSessionDots() {
  var wrap = document.getElementById('session-dots');
  wrap.innerHTML = '';
  for (var i = 0; i < 4; i++) {
    var dot = document.createElement('div');
    dot.className = 'sdot' + (i < sessionsFinished ? ' done' : '');
    wrap.appendChild(dot);
  }
  document.getElementById('focus-session-num').textContent = Math.min(sessionsFinished+1, 4);
}

drawTimer();
drawSessionDots();


/* ---- music player ---- */

var musicAudio   = document.getElementById('music-audio');
var musicPlaying = false;
var songIndex    = 0;

var songList = [
  { title:'No file loaded', artist:'Upload a file to play', art:'linear-gradient(135deg,#a18cd1,#fbc2eb)', src:'' }
];

function handleMusicUpload(e) {
  var file = e.target.files[0];
  if (!file) return;
  var url  = URL.createObjectURL(file);
  var name = file.name.replace(/\.[^/.]+$/, '');
  songList.unshift({ title:name, artist:'local file', art:'linear-gradient(135deg,#43e97b,#38f9d7)', src:url });
  songIndex = 0;
  if (musicPlaying) musicAudio.pause();
  musicPlaying = false;
  loadSong();
  musicToggle();
  showToast('Loaded: ' + name);
}

function loadSong() {
  var s = songList[songIndex];
  document.getElementById('music-title').textContent   = s.title;
  document.getElementById('music-artist').textContent  = s.artist;
  document.getElementById('music-art').style.background = s.art;
  if (s.src) { musicAudio.src = s.src; }
  else { musicAudio.removeAttribute('src'); musicAudio.load(); }
  updateProgress(0);
}

function musicToggle() {
  musicPlaying = !musicPlaying;
  document.getElementById('music-play-btn').textContent    = musicPlaying ? '⏸' : '▶';
  document.getElementById('music-art').style.transform     = musicPlaying ? 'scale(1.05)' : 'scale(1)';
  if (musicPlaying && songList[songIndex].src) {
    musicAudio.play().catch(function() { showToast('Could not play'); musicPlaying = false; });
  } else if (!musicPlaying && songList[songIndex].src) {
    musicAudio.pause();
  }
}

function musicNext() {
  var was = musicPlaying;
  if (musicPlaying) musicToggle();
  songIndex = (songIndex+1) % songList.length;
  loadSong();
  if (was) musicToggle();
}

function musicPrev() {
  var was = musicPlaying;
  if (musicPlaying) musicToggle();
  songIndex = (songIndex-1+songList.length) % songList.length;
  loadSong();
  if (was) musicToggle();
}

function updateProgress(pct) { document.getElementById('music-progress').style.width = pct + '%'; }

function musicSeek(e) {
  var bar  = document.getElementById('music-progress-bar');
  var rect = bar.getBoundingClientRect();
  var pct  = Math.max(0, Math.min(1, (e.clientX-rect.left)/rect.width));
  if (songList[songIndex].src && musicAudio.duration) musicAudio.currentTime = pct * musicAudio.duration;
  updateProgress(pct*100);
}

musicAudio.addEventListener('timeupdate', function() {
  if (musicAudio.duration) updateProgress((musicAudio.currentTime/musicAudio.duration)*100);
});
musicAudio.addEventListener('ended', musicNext);

loadSong();


/* ---- pixel art ---- */

var pixelTool   = 'draw';
var mouseIsDown = false;

function initPixelGrid() {
  var grid = document.getElementById('pixel-grid');
  grid.innerHTML = '';
  for (var i = 0; i < 256; i++) {
    var cell = document.createElement('div');
    cell.className = 'pixel-cell';
    (function(c) {
      c.addEventListener('mousedown', function(e) { e.preventDefault(); paintCell(c); });
      c.addEventListener('mouseenter', function() { if (mouseIsDown) paintCell(c); });
    })(cell);
    grid.appendChild(cell);
  }
}

document.getElementById('pixel-grid').addEventListener('mousedown', function() { mouseIsDown = true; });
document.addEventListener('mouseup', function() { mouseIsDown = false; });

function setPixelTool(tool) {
  pixelTool = tool;
  document.getElementById('btn-tool-draw').style.background  = tool==='draw'  ? 'var(--text)' : 'rgba(128,128,128,0.15)';
  document.getElementById('btn-tool-draw').style.color       = tool==='draw'  ? 'var(--bg)'   : 'var(--text)';
  document.getElementById('btn-tool-erase').style.background = tool==='erase' ? 'var(--text)' : 'rgba(128,128,128,0.15)';
  document.getElementById('btn-tool-erase').style.color      = tool==='erase' ? 'var(--bg)'   : 'var(--text)';
}

function paintCell(cell) {
  cell.style.backgroundColor = pixelTool==='draw' ? document.getElementById('pixel-color').value : '';
}

function clearPixelGrid() {
  document.querySelectorAll('.pixel-cell').forEach(function(c) { c.style.backgroundColor=''; });
  showToast('Canvas cleared');
}

initPixelGrid();




/* ---- gallery app ---- */

var galleryImages = JSON.parse(localStorage.getItem('webos_gallery') || '[]');

function initGallery() {
  renderGalleryGrid();
}

function handleGalleryUpload(e) {
  var files = Array.from(e.target.files);
  if (!files.length) return;

  // read each file as data URL so it persists in localStorage
  var loaded = 0;
  files.forEach(function(file) {
    if (!file.type.startsWith('image/')) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      galleryImages.unshift({ src: ev.target.result, name: file.name, added: Date.now() });
      loaded++;
      if (loaded === files.length) {
        // save to localStorage — might hit limits with many large images
        try { localStorage.setItem('webos_gallery', JSON.stringify(galleryImages)); }
        catch(e) { showToast('Storage full — images shown but not saved'); }
        renderGalleryGrid();
        showToast('Added ' + loaded + ' image' + (loaded > 1 ? 's' : ''));
      }
    };
    reader.readAsDataURL(file);
  });
}

function renderGalleryGrid() {
  var grid = document.getElementById('gallery-grid');
  if (!grid) return;

  if (!galleryImages.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--muted);padding:40px;font-size:13px;">no images yet — click + to add some</div>';
    return;
  }

  grid.innerHTML = '';
  galleryImages.forEach(function(img, i) {
    var div = document.createElement('div');
    div.className = 'gallery-thumb';
    div.style.backgroundImage = 'url(' + img.src + ')';
    div.onclick = function() { openLightbox(i); };
    grid.appendChild(div);
  });
}

function openLightbox(idx) {
  var lb    = document.getElementById('gallery-lightbox');
  var img   = document.getElementById('gallery-lb-img');
  var label = document.getElementById('gallery-lb-label');
  if (!lb) return;

  lb.dataset.idx = idx;
  img.src = galleryImages[idx].src;
  label.textContent = (idx + 1) + ' / ' + galleryImages.length;
  lb.style.display = 'flex';
}

function closeLightbox() {
  var lb = document.getElementById('gallery-lightbox');
  if (lb) lb.style.display = 'none';
}

function lbNav(dir) {
  var lb  = document.getElementById('gallery-lightbox');
  var idx = parseInt(lb.dataset.idx || 0);
  idx = (idx + dir + galleryImages.length) % galleryImages.length;
  openLightbox(idx);
}

function deleteGalleryImg() {
  var lb  = document.getElementById('gallery-lightbox');
  var idx = parseInt(lb.dataset.idx || 0);
  galleryImages.splice(idx, 1);
  try { localStorage.setItem('webos_gallery', JSON.stringify(galleryImages)); } catch(e) {}
  renderGalleryGrid();
  if (!galleryImages.length) { closeLightbox(); return; }
  openLightbox(Math.min(idx, galleryImages.length - 1));
}

// keyboard navigation in lightbox
document.addEventListener('keydown', function(e) {
  var lb = document.getElementById('gallery-lightbox');
  if (!lb || lb.style.display === 'none') return;
  if (e.key === 'ArrowLeft')  lbNav(-1);
  if (e.key === 'ArrowRight') lbNav(1);
  if (e.key === 'Escape')     closeLightbox();
});

initGallery();

/* ---- clock ---- */

function tickClock() {
  var now  = new Date();
  var h    = now.getHours();
  var m    = now.getMinutes();
  var ampm = h >= 12 ? 'PM' : 'AM';
  var hour = h%12 || 12;
  var mins = String(m).padStart(2,'0');
  
  var timeStr = hour + ':' + mins + ' ' + ampm;
  var shortTimeStr = hour + ':' + mins;
  
  document.getElementById('tb-clock').textContent  = timeStr;
  document.getElementById('lock-time').textContent = shortTimeStr;
  
  var widgetClock = document.getElementById('desktop-widget-clock');
  if (widgetClock) widgetClock.textContent = shortTimeStr;
  
  document.getElementById('lock-date').textContent = now.toLocaleDateString('en-US', {
    weekday:'long', month:'long', day:'numeric'
  });
}

tickClock();
setInterval(tickClock, 1000);

/* ---- desktop clock widget settings ---- */
var clockSettings = JSON.parse(localStorage.getItem('webos_clock') || '{"show":true,"color":"#ffffff","size":80,"opacity":80,"font":"var(--font)"}');

function applyClockSettings() {
  var w = document.getElementById('desktop-widget-clock');
  if (!w) return;
  
  // set fallback for font if missing from older save
  if (!clockSettings.font) clockSettings.font = 'var(--font)';
  
  document.getElementById('clock-toggle').checked = clockSettings.show;
  document.getElementById('clock-color').value    = clockSettings.color;
  document.getElementById('clock-size').value     = clockSettings.size;
  document.getElementById('clock-opacity').value  = clockSettings.opacity;
  document.getElementById('clock-font').value     = clockSettings.font;

  w.style.display    = clockSettings.show ? 'block' : 'none';
  w.style.color      = clockSettings.color;
  w.style.fontSize   = clockSettings.size + 'px';
  w.style.opacity    = clockSettings.opacity / 100;
  w.style.fontFamily = clockSettings.font;
}

window.updateClockSettings = function() {
  clockSettings.show    = document.getElementById('clock-toggle').checked;
  clockSettings.color   = document.getElementById('clock-color').value;
  clockSettings.size    = parseInt(document.getElementById('clock-size').value);
  clockSettings.opacity = parseInt(document.getElementById('clock-opacity').value);
  clockSettings.font    = document.getElementById('clock-font').value;
  
  localStorage.setItem('webos_clock', JSON.stringify(clockSettings));
  applyClockSettings();
};

applyClockSettings();


/* ---- lock screen ---- */

window.enterOS = function() {
  var ls = document.getElementById('lock-screen');
  ls.style.transition    = 'opacity 0.4s ease';
  ls.style.opacity       = '0';
  ls.style.pointerEvents = 'none';
  setTimeout(function() {
    ls.style.display = 'none';
    var desk = document.getElementById('desktop');
    if (desk) { desk.style.display='block'; desk.style.visibility='visible'; }
  }, 450);
};

document.addEventListener('keydown', function(e) {
  var ls = document.getElementById('lock-screen');
  if (ls.style.display!=='none' && ls.style.opacity!=='0' && e.key!=='F5') window.enterOS();
});


/* ---- settings extras ---- */

function saveName() {
  var input = document.getElementById('settings-name-input');
  if (!input) return;
  var name = input.value.trim();
  if (!name) return;
  localStorage.setItem('webos_name', name);
  var lockName = document.getElementById('lock-name');
  if (lockName) lockName.textContent = 'Hey, ' + name;
  showToast('Name saved');
}

function changeFontSize(delta) {
  var cur  = parseInt(localStorage.getItem('webos_font_size') || '14');
  var next = Math.max(11, Math.min(20, cur+delta));
  localStorage.setItem('webos_font_size', next);
  document.body.style.fontSize = next+'px';
  var el = document.getElementById('font-size-display');
  if (el) el.textContent = next+'px';
}

var savedFontSize = localStorage.getItem('webos_font_size');
if (savedFontSize) {
  document.body.style.fontSize = savedFontSize+'px';
  var fsdEl = document.getElementById('font-size-display');
  if (fsdEl) fsdEl.textContent = savedFontSize+'px';
}


/* ---- toast ---- */

function showToast(msg) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(function() { el.classList.remove('show'); }, 2400);
}


/* ---- boot ---- */

function boot() {
  var name = localStorage.getItem('webos_name');
  if (name) {
    var lockNameEl = document.getElementById('lock-name');
    if (lockNameEl) lockNameEl.textContent = 'Hey, ' + name;
    var nameInput = document.getElementById('settings-name-input');
    if (nameInput) nameInput.value = name;
  }
}

// boot animation — runs the loading bar then fades out
function runBootAnimation() {
  var screen = document.getElementById('boot-screen');
  var bar    = document.querySelector('.boot-bar');
  var hint   = document.getElementById('boot-hint');
  if (!screen) { boot(); return; }

  // fake loading steps with timing that feels natural
  var steps = [
    { pct: 15, msg: 'starting up…',      delay: 0   },
    { pct: 35, msg: 'loading apps…',     delay: 380 },
    { pct: 60, msg: 'setting wallpaper…',delay: 700 },
    { pct: 80, msg: 'almost there…',     delay: 1050},
    { pct: 100,msg: 'ready',             delay: 1380},
  ];

  steps.forEach(function(step) {
    setTimeout(function() {
      bar.style.width  = step.pct + '%';
      hint.textContent = step.msg;
    }, step.delay);
  });

  // fade out boot screen after loading finishes
  setTimeout(function() {
    screen.classList.add('fade-out');
    setTimeout(function() {
      screen.style.display = 'none';
      boot(); // restore saved name etc after boot screen is gone
    }, 650);
  }, 1750);
}

runBootAnimation();