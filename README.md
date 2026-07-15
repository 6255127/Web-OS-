# Web OS

a browser desktop i built for a Hack Club  challenge usinf js and css. This project took a lot of as this was way out of my comfort zone. I read countless articles and endless youtube toturials for this project and it one whole week for me to finish. Eventhough i could have craeted a barebone OS with my [previous skill I instead used this opertunity too learn more about web application and craete something i am proud of.

---

## how to run it

download the zip, open `index.html`. done.

or if you want to clone it:

```bash
git clone https://github.com/yourusername/webos.git
cd webos
open index.html
```

works offline too, except the weather app which  calls an API to work ( open meteo ).

---

## what's in it

apps live in three folders in the dock — Tools, Games, and Media.

**Tools**

- Notes — just a textarea that saves to localStorage as you type. nothing fancy, does the job.
- Terminal — fake shell. actually has some interesting commands in it, not just `echo` and `date`.
- Calculator — basic math, keyboard works too.
- Settings — wallpaper picker, dark/light toggle, font size, your name.

**Games**

- Tetris — proper tetris. ghost piece, wall kicks, hard drop with space bar, speeds up as you clear lines.
- Snake — classic snake. fast enough to actually be fun.
- Pixel Art — 16x16 draw grid. draw and erase tools.

**Tools**

- Focus Timer — 25/5 pomodoro. SVG ring that shrinks as time runs out. tracks sessions.
- Weather — hardcoded to Doha, Qatar( bcz thats where i live and i coul have added other cities but i got lazy). shows temperature, feels like, UV index, wind speed and direction, humidity, pressure, dew point, visibility. uses open-meteo so no API key needed.
- Calendar — month view, navigate months, shows events.
- Music Player — upload your own audio files.

---

## terminal commands

Most of these command are pretty useless and no one is ever gonna use them but it was very easy to add so i added ton.

| command | what it does |
|---------|-------------|
| `help` | full list |
| `open <app>` | open any app by name |
| `close <app>` | close one |
| `wp fuji/stars/matrix/etc` | change wallpaper without touching settings |
| `theme dark` or `theme light` | switch theme from the terminal |
| `calc 12*8+4` | quick math without opening the calculator |
| `neofetch` | system info — name, uptime, browser, current wallpaper, theme |
| `cowsay <text>` | ASCII cow |
| `fortune` | random dev quote |
| `flip` | coin flip |
| `roll 20` | dice roller, any number of sides |
| `color #ff6b35` | shows a little colour swatch inline |
| `uptime` | time since the page loaded |
| `history` | last 20 commands |

---

## wallpapers

Mount fuji wallpaper is deafult with the OS but any desired wallpaper can be added even  live wallpapers.

video files are in `media/`. you can also upload your own video in Settings.

mount fuji static is the default specifically because static images don't need browser autoplay permission, which video wallpapers sometimes get blocked on.

---

## how the windows work

all in `core.js`, around 230 lines.

dragging — `makeDraggable()` records where the mouse was on mousedown, then on every mousemove it sets `el.style.left` and `el.style.top` to original position + how far the mouse moved. stops on mouseup.

resizing — `makeResizable()` attaches 8 invisible divs to every window (4 edges, 4 corners). mousedown on any of them tracks the drag and adjusts width/height/left/top based on which edge is being pulled. minimum size is 240x160 so you can't accidentally collapse a window to a pixel.

maximize — saves the current `width/height/top/left` before going fullscreen so it can restore them. double-clicking the titlebar does the same thing. the saved values live on the window element itself as `_savedW`, `_savedH` etc.

z-index — just a global counter that goes up every time you click a window. dock and topbar are hardcoded higher so they never get buried.

---

## file structure

```
webos/
├── index.html          # everything, all 11 windows are in here
├── css/
│   ├── style.css       # desktop, topbar, dock, windows, dark/light mode
│   ├── apps.css        # calculator buttons, folder icons
│
├── js/
│   ├── core.js         # windowing — drag, resize, maximize, z-index
│   ├── apps.js         # all app logic in one file
│   ├── tetris.js
│   ├── snake.js
│
└── media/
    ├── mount-fuji-static.png   # default wallpaper
```


---

## stuff that's still missing

- pixel art doesn't save when you close the window. one `canvas.toDataURL()` call would fix it, I jsut got lazy agian .
- weather is hardcoded to Doha. should use `navigator.geolocation`.
- music player needs you to upload files. licensing headache if i bundled tracks.
- window corner resize exists but there's no visual indicator showing the resize handles. you have to know to grab the edge.

---
