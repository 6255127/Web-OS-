        // DOM Elements
        const uploadZone = document.getElementById('upload-zone');
        const manualZone = document.getElementById('manual-zone');
        const fileInput = document.getElementById('file-input');
        const imgPreview = document.getElementById('image-preview');
        const previewContainer = document.getElementById('preview-container');
        const uploadPrompt = document.getElementById('upload-prompt');
        const paletteContainer = document.getElementById('palette-container');
        const featuresGrid = document.getElementById('features-grid');
        const swatchesWrapper = document.getElementById('swatches-wrapper');
        const roleAssignments = document.getElementById('role-assignments');
        const contrastMatrix = document.getElementById('contrast-matrix');
        const fontPairings = document.getElementById('font-pairings');
        const themeSlides = document.getElementById('theme-slides');
        const moodTag = document.getElementById('mood-tag');
        const moodText = document.getElementById('mood-text');
        const moodIcon = document.getElementById('mood-icon');
        const historyGrid = document.getElementById('history-grid');

        let currentColors = [];
        let currentRoles = {};
        let currentMood = "";

        // --- Core Algorithm: K-Means Clustering ---
        function extractPalette(img) {
            const maxDim = 200;
            let w = img.naturalWidth, h = img.naturalHeight;
            if (w > maxDim || h > maxDim) {
                if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
                else { w = Math.round(w * maxDim / h); h = maxDim; }
            }

            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const data = ctx.getImageData(0, 0, w, h).data;

            const pixels = [];
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] < 128) continue;
                pixels.push([data[i], data[i + 1], data[i + 2]]);
            }

            if (pixels.length === 0) return;

            const k = 6;
            let centroids = [];
            for (let i = 0; i < k; i++) centroids.push(pixels[Math.floor(Math.random() * pixels.length)]);

            let assignments = new Array(pixels.length);
            let converged = false;
            let iterations = 0;

            while (!converged && iterations < 15) {
                for (let i = 0; i < pixels.length; i++) {
                    const p = pixels[i];
                    let minDist = Infinity, bestK = 0;
                    for (let j = 0; j < k; j++) {
                        const c = centroids[j];
                        const dist = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
                        if (dist < minDist) { minDist = dist; bestK = j; }
                    }
                    assignments[i] = bestK;
                }

                const newCentroids = Array(k).fill(0).map(() => [0, 0, 0]);
                const counts = Array(k).fill(0);
                for (let i = 0; i < pixels.length; i++) {
                    const c = assignments[i];
                    newCentroids[c][0] += pixels[i][0];
                    newCentroids[c][1] += pixels[i][1];
                    newCentroids[c][2] += pixels[i][2];
                    counts[c]++;
                }

                converged = true;
                for (let j = 0; j < k; j++) {
                    if (counts[j] === 0) {
                        newCentroids[j] = pixels[Math.floor(Math.random() * pixels.length)];
                        converged = false;
                    } else {
                        newCentroids[j][0] = Math.round(newCentroids[j][0] / counts[j]);
                        newCentroids[j][1] = Math.round(newCentroids[j][1] / counts[j]);
                        newCentroids[j][2] = Math.round(newCentroids[j][2] / counts[j]);
                        if (newCentroids[j][0] !== centroids[j][0] || newCentroids[j][1] !== centroids[j][1] || newCentroids[j][2] !== centroids[j][2]) converged = false;
                    }
                }
                centroids = newCentroids;
                iterations++;
            }

            const counts = Array(k).fill(0);
            for (let i = 0; i < pixels.length; i++) counts[assignments[i]]++;
            
            let results = centroids.map((c, i) => ({
                rgb: c, count: counts[i], pct: counts[i] / pixels.length
            })).sort((a, b) => b.count - a.count);

            processColors(results);
        }

        // --- Color Math & Conversions ---
        function rgbToHex(r, g, b) {
            return "#" + [r, g, b].map(x => {
                const hex = x.toString(16).toUpperCase();
                return hex.length === 1 ? '0' + hex : hex;
            }).join('');
        }
        function hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0,0,0];
        }
        function rgbToHsl(r, g, b) {
            r /= 255; g /= 255; b /= 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;
            if (max === min) { h = s = 0; } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
        }
        function hslToRgb(h, s, l) {
            h /= 360; s /= 100; l /= 100;
            let r, g, b;
            if (s === 0) { r = g = b = l; } else {
                const hue2rgb = (p, q, t) => {
                    if (t < 0) t += 1; if (t > 1) t -= 1;
                    if (t < 1/6) return p + (q - p) * 6 * t;
                    if (t < 1/2) return q;
                    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                    return p;
                };
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }
            return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        }

        function getLuminance(r, g, b) {
            const a = [r, g, b].map(v => {
                v /= 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
        }

        function getContrast(lum1, lum2) {
            return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
        }

        // --- Processing & UI Updates ---
        function processColors(rawColors) {
            currentColors = rawColors.map(c => {
                const [r, g, b] = c.rgb;
                const hex = rgbToHex(r, g, b);
                return { r, g, b, hex, hsl: rgbToHsl(r, g, b), luma: getLuminance(r, g, b), pct: c.pct || (1/rawColors.length) };
            });

            // Filter duplicates
            const unique = [];
            for(const c of currentColors) {
                let dup = false;
                for(const u of unique) {
                    if (Math.abs(c.r-u.r) + Math.abs(c.g-u.g) + Math.abs(c.b-u.b) < 30) { dup = true; u.pct += c.pct; break; }
                }
                if (!dup) unique.push(c);
            }
            currentColors = unique.sort((a,b)=>b.pct - a.pct);

            assignRoles();
            calculateMood();
            renderSwatches();
            renderRoles();
            renderContrastMatrix();
            renderFontPairings();
            renderThemeSlides();
            
            paletteContainer.style.display = 'flex';
            featuresGrid.style.display = 'grid';
            
            if (document.getElementById('btn-mode-image').classList.contains('active')) {
                saveToHistory(imgPreview.src, currentColors);
            }
        }

        function assignRoles() {
            const byLuma = [...currentColors].sort((a, b) => b.luma - a.luma);
            const bySat = [...currentColors].sort((a, b) => b.hsl[1] - a.hsl[1]);
            const byDom = [...currentColors];

            const isDarkTheme = currentColors.reduce((s, c) => s + (c.luma * c.pct), 0) < 0.3;
            let bg, text, accent, primary, secondary;

            if (isDarkTheme) { bg = byLuma[byLuma.length - 1]; text = byLuma[0]; }
            else { bg = byLuma[0]; text = byLuma[byLuma.length - 1]; }

            accent = bySat[0];
            if (accent === bg || accent === text) accent = bySat.length > 1 ? bySat[1] : accent;

            let available = byDom.filter(c => c !== bg && c !== text && c !== accent);
            if (available.length > 0) {
                primary = available[0];
                secondary = available.length > 1 ? available[1] : primary;
            } else { primary = text; secondary = bg; }

            currentRoles = { Background: bg, Text: text, Primary: primary, Secondary: secondary, Accent: accent };

            document.documentElement.style.setProperty('--theme-bg', bg.hex);
            document.documentElement.style.setProperty('--theme-text', text.hex);
            document.documentElement.style.setProperty('--theme-primary', primary.hex);
            document.documentElement.style.setProperty('--theme-secondary', secondary.hex);
            document.documentElement.style.setProperty('--theme-accent', accent.hex);
        }

        function calculateMood() {
            let avgH = 0, avgS = 0, avgL = 0;
            currentColors.forEach(c => { avgH += c.hsl[0] * c.pct; avgS += c.hsl[1] * c.pct; avgL += c.hsl[2] * c.pct; });

            let tempText = "", icon = "âœ¨";
            if (avgS > 60) { tempText += "Vibrant & "; icon = "ðŸ”¥"; }
            else if (avgS < 30) { tempText += "Muted & "; icon = "ðŸŒ«ï¸"; }
            else { tempText += "Balanced & "; icon = "âš–ï¸"; }

            if (avgL > 70) tempText += "Airy";
            else if (avgL < 30) { tempText += "Moody"; icon = "ðŸŒ™"; }
            else {
                if (avgH < 60 || avgH > 300) tempText += "Warm";
                else if (avgH > 120 && avgH < 240) { tempText += "Cool"; icon = "ðŸ§Š"; }
                else tempText += "Natural";
            }

            currentMood = tempText;
            moodText.textContent = tempText;
            moodIcon.textContent = icon;
            moodTag.classList.add('visible');
        }

        function renderSwatches() {
            swatchesWrapper.innerHTML = '';
            currentColors.forEach((c, idx) => {
                const col = document.createElement('div');
                col.className = 'swatch-col';
                col.style.flexGrow = Math.max(1, Math.round(c.pct * 10));
                
                const textColor = c.luma > 0.5 ? '#000' : '#FFF';
                col.innerHTML = `
                    <div class="swatch-color" style="background-color: ${c.hex}"></div>
                    <div class="swatch-percent" style="color: ${textColor}">${Math.round(c.pct * 100)}%</div>
                    <div class="swatch-info">
                        <div class="copyable" onclick="copyToClipboard('${c.hex}')">HEX: ${c.hex}</div>
                        <div class="copyable" onclick="copyToClipboard('rgb(${c.r}, ${c.g}, ${c.b})')">RGB: ${c.r}, ${c.g}, ${c.b}</div>
                        <div class="copyable" onclick="copyToClipboard('hsl(${c.hsl[0]}, ${c.hsl[1]}%, ${c.hsl[2]}%)')">HSL: ${c.hsl[0]}, ${c.hsl[1]}%, ${c.hsl[2]}%</div>
                    </div>
                `;
                col.style.opacity = '0';
                col.style.transform = 'translateY(20px)';
                swatchesWrapper.appendChild(col);
                setTimeout(() => {
                    col.style.transition = 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
                    col.style.opacity = '1'; col.style.transform = 'translateY(0)';
                }, idx * 100);
            });
        }

        function renderRoles() {
            roleAssignments.innerHTML = '';
            for (const [role, color] of Object.entries(currentRoles)) {
                const row = document.createElement('div');
                row.className = 'role-row';
                row.innerHTML = `
                    <span class="role-label">${role}</span>
                    <div class="role-color-box">
                        <span style="font-family:monospace; font-size:12px; color:var(--text-secondary)">${color.hex}</span>
                        <div class="role-color-swatch" style="background-color: ${color.hex}"></div>
                    </div>
                `;
                roleAssignments.appendChild(row);
            }
        }

        function renderContrastMatrix() {
            contrastMatrix.innerHTML = '';
            contrastMatrix.appendChild(document.createElement('div'));
            currentColors.slice(0, 5).forEach(c => {
                const h = document.createElement('div');
                h.className = 'matrix-header'; h.textContent = c.hex;
                contrastMatrix.appendChild(h);
            });

            currentColors.slice(0, 5).forEach(bg => {
                const rh = document.createElement('div');
                rh.className = 'matrix-header'; rh.style.display = 'flex'; rh.style.alignItems = 'center'; rh.style.justifyContent = 'flex-end'; rh.textContent = bg.hex;
                contrastMatrix.appendChild(rh);

                currentColors.slice(0, 5).forEach(fg => {
                    const cell = document.createElement('div');
                    cell.className = 'matrix-cell';
                    cell.style.backgroundColor = bg.hex; cell.style.color = fg.hex;
                    
                    if (bg.hex === fg.hex) { cell.innerHTML = '-'; } 
                    else {
                        const cr = getContrast(bg.luma, fg.luma);
                        let cls = 'fail', icon = 'âœ•';
                        if (cr >= 7) { cls = 'pass-aaa'; icon = 'âœ“âœ“'; }
                        else if (cr >= 4.5) { cls = 'pass-aa'; icon = 'âœ“'; }
                        cell.classList.add(cls);
                        cell.innerHTML = `<span>${icon}</span>${cr.toFixed(1)}`;
                    }
                    contrastMatrix.appendChild(cell);
                });
            });
        }

        function renderFontPairings() {
            fontPairings.innerHTML = '';
            const pairs = [];
            if (currentMood.includes('Vibrant') || currentMood.includes('Warm')) {
                pairs.push({ h: 'Playfair Display', p: 'Source Sans Pro', link: 'family=Playfair+Display:wght@700&family=Source+Sans+Pro' });
                pairs.push({ h: 'Montserrat', p: 'Lato', link: 'family=Montserrat:wght@700&family=Lato' });
            } else if (currentMood.includes('Muted') || currentMood.includes('Cool')) {
                pairs.push({ h: 'Merriweather', p: 'Nunito', link: 'family=Merriweather:wght@700&family=Nunito' });
                pairs.push({ h: 'Roboto Slab', p: 'Open Sans', link: 'family=Roboto+Slab:wght@700&family=Open+Sans' });
            } else {
                pairs.push({ h: 'Plus Jakarta Sans', p: 'Inter', link: 'family=Inter:wght@400;500&family=Plus+Jakarta+Sans:wght@700' });
                pairs.push({ h: 'Montserrat', p: 'Open Sans', link: 'family=Montserrat:wght@700&family=Open+Sans' });
            }

            pairs.forEach(pair => {
                const div = document.createElement('div');
                div.className = 'font-pair';
                div.innerHTML = `
                    <h4 style="font-family: '${pair.h}', serif">${pair.h}</h4>
                    <p style="font-family: '${pair.p}', sans-serif">Combined with ${pair.p} for body text. This creates a balanced, highly legible hierarchy that matches your palette's tone.</p>
                    <button class="font-copy" onclick="copyToClipboard('@import url(\\'https://fonts.googleapis.com/css2?${pair.link}&display=swap\\');')">Copy Import</button>
                `;
                fontPairings.appendChild(div);
            });
        }

        function renderThemeSlides() {
            themeSlides.innerHTML = '';
            const bg = currentRoles.Background.hex;
            const text = currentRoles.Text.hex;
            const primary = currentRoles.Primary.hex;
            const accent = currentRoles.Accent.hex;

            // Title Slide
            themeSlides.innerHTML += `
                <div class="slide" style="background: ${primary}; color: ${bg}; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                    <div class="slide-title" style="color: ${bg}">Presentation Title</div>
                    <div class="slide-text" style="color: ${bg}">Subtitle or Presenter Name</div>
                </div>
            `;
            // Content Slide
            themeSlides.innerHTML += `
                <div class="slide" style="background: ${bg}; color: ${text};">
                    <div class="slide-title" style="color: ${primary}">Key Concept</div>
                    <div style="width: 20px; height: 3px; background: ${accent}; margin-bottom: 8px;"></div>
                    <div class="slide-text">â€¢ First important point<br>â€¢ Second detailed metric<br>â€¢ Concluding thought</div>
                </div>
            `;
            // Accent Slide
            themeSlides.innerHTML += `
                <div class="slide" style="background: ${accent}; color: ${text}; display: flex; align-items: center; justify-content: center;">
                    <div class="slide-title" style="font-size: 20px;">Big Impact Statistic</div>
                </div>
            `;
        }

        // --- Export Functions ---
        function copyToClipboard(text) { navigator.clipboard.writeText(text).then(() => showToast(`Copied!`)); }
        function showToast(msg) {
            const toast = document.getElementById('toast'); toast.textContent = msg;
            toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2000);
        }

        function exportCSS() {
            let css = `:root {\n`;
            currentColors.forEach((c, i) => css += `  --color-${i+1}: ${c.hex};\n`);
            css += `\n  /* Smart Roles */\n`;
            for (const [role, color] of Object.entries(currentRoles)) css += `  --theme-${role.toLowerCase()}: ${color.hex};\n`;
            css += `}`;
            downloadBlob(css, 'paletteforge.css', 'text/css');
        }

        function exportJSON() {
            const data = {
                colors: currentColors.map(c => ({ hex: c.hex, rgb: `rgb(${c.r}, ${c.g}, ${c.b})`, hsl: `hsl(${c.hsl[0]}, ${c.hsl[1]}%, ${c.hsl[2]}%)` })),
                roles: Object.fromEntries(Object.entries(currentRoles).map(([k,v]) => [k, v.hex]))
            };
            downloadBlob(JSON.stringify(data, null, 2), 'paletteforge.json', 'application/json');
        }

        function exportHexList() { copyToClipboard(currentColors.map(c => c.hex).join(', ')); }

        function exportPNGCard() {
            const canvas = document.createElement('canvas');
            canvas.width = 800; canvas.height = 400; const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#121620'; ctx.fillRect(0, 0, 800, 400);
            ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 24px Inter'; ctx.fillText('PaletteForge Export', 40, 50);
            const swatchW = (800 - 80) / currentColors.length;
            currentColors.forEach((c, i) => {
                const x = 40 + (i * swatchW);
                ctx.fillStyle = c.hex; ctx.fillRect(x, 80, swatchW - 10, 200);
                ctx.fillStyle = '#94A3B8'; ctx.font = '16px monospace'; ctx.fillText(c.hex, x, 310);
            });
            const link = document.createElement('a'); link.download = 'paletteforge.png';
            link.href = canvas.toDataURL('image/png'); link.click();
        }

        function downloadBlob(content, filename, contentType) {
            const blob = new Blob([content], { type: contentType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
        }

        // --- History ---
        function saveToHistory(imgSrc, colors) {
            if (!imgSrc.startsWith('data:')) return;
            let history = JSON.parse(localStorage.getItem('pf_history') || '[]');
            history.unshift({ img: imgSrc, hexes: colors.map(c => c.hex).slice(0,4) });
            if (history.length > 6) history.pop();
            localStorage.setItem('pf_history', JSON.stringify(history));
            loadHistory();
        }

        function loadHistory() {
            const history = JSON.parse(localStorage.getItem('pf_history') || '[]');
            historyGrid.innerHTML = '';
            if(history.length === 0) { historyGrid.innerHTML = '<div style="color:var(--text-secondary); font-size:12px; grid-column:1/-1;">No history yet.</div>'; return; }
            history.forEach(item => {
                const div = document.createElement('div'); div.className = 'history-item';
                div.innerHTML = `<img src="${item.img}" alt="History item">`;
                div.onclick = () => { setMode('image'); loadFromHistory(item.img); };
                historyGrid.appendChild(div);
            });
        }

        function loadFromHistory(src) {
            imgPreview.src = src; previewContainer.style.display = 'block'; uploadPrompt.style.display = 'none';
            setTimeout(() => extractPalette(imgPreview), 50);
        }
        function clearHistory() { localStorage.removeItem('pf_history'); loadHistory(); }

        // --- UI Modes & Interactions ---
        function setMode(mode) {
            document.getElementById('btn-mode-image').classList.remove('active');
            document.getElementById('btn-mode-manual').classList.remove('active');
            document.getElementById(`btn-mode-${mode}`).classList.add('active');
            
            paletteContainer.style.display = 'none';
            featuresGrid.style.display = 'none';
            moodTag.classList.remove('visible');

            if (mode === 'image') {
                uploadZone.style.display = 'flex';
                manualZone.style.display = 'none';
            } else {
                uploadZone.style.display = 'none';
                manualZone.style.display = 'block';
                document.getElementById('hex-input').focus();
            }
        }

        uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
        uploadZone.addEventListener('dragleave', e => { e.preventDefault(); uploadZone.classList.remove('dragover'); });
        uploadZone.addEventListener('drop', e => {
            e.preventDefault(); uploadZone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        });
        fileInput.addEventListener('change', e => { if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]); });

        function handleFile(file) {
            if (!file.type.startsWith('image/')) { showToast("Please upload an image file"); return; }
            const reader = new FileReader();
            reader.onload = e => {
                imgPreview.src = e.target.result; previewContainer.style.display = 'block'; uploadPrompt.style.display = 'none';
                paletteContainer.style.display = 'none'; featuresGrid.style.display = 'none'; moodTag.classList.remove('visible');
                imgPreview.onload = () => extractPalette(imgPreview);
            };
            reader.readAsDataURL(file);
        }

        // --- Manual Mode Harmonies ---
        function handleManualInput(e) {
            let hex = e.target.value;
            if (!hex.startsWith('#')) { hex = '#' + hex; e.target.value = hex; }
            if (hex.length === 7) {
                const rgb = hexToRgb(hex);
                const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
                generateHarmonies(hsl, hex);
                
                // create a mock rawColors array to feed into processColors to show the full dashboard!
                let rawColors = [];
                // Add base
                rawColors.push({ rgb: rgb, pct: 0.3 });
                // Add some variations (analogous / complement) to make a palette
                const c1 = hslToRgb((hsl[0] + 30) % 360, hsl[1], hsl[2]);
                const c2 = hslToRgb((hsl[0] - 30 + 360) % 360, hsl[1], hsl[2]);
                const c3 = hslToRgb((hsl[0] + 180) % 360, hsl[1], hsl[2]);
                const c4 = hslToRgb(hsl[0], hsl[1], Math.max(0, hsl[2] - 30));
                const c5 = hslToRgb(hsl[0], hsl[1], Math.min(100, hsl[2] + 30));
                rawColors.push({ rgb: c1, pct: 0.2 });
                rawColors.push({ rgb: c2, pct: 0.15 });
                rawColors.push({ rgb: c3, pct: 0.15 });
                rawColors.push({ rgb: c4, pct: 0.1 });
                rawColors.push({ rgb: c5, pct: 0.1 });
                processColors(rawColors);
            }
        }

        function generateHarmonies(baseHsl, baseHex) {
            document.getElementById('harmonies-container').style.display = 'flex';
            const h = baseHsl[0], s = baseHsl[1], l = baseHsl[2];

            const renderHarmony = (id, label, hsls) => {
                const el = document.getElementById(id);
                let html = `<div class="harmony-label">${label}</div><div class="harmony-swatches">`;
                hsls.forEach(c => {
                    const rgb = hslToRgb(c[0], c[1], c[2]);
                    const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
                    html += `<div class="h-swatch" style="background:${hex}" title="${hex}" onclick="copyToClipboard('${hex}')"></div>`;
                });
                html += `</div>`;
                el.innerHTML = html;
            };

            // Complementary (180)
            renderHarmony('harm-complementary', 'Complementary', [baseHsl, [(h + 180) % 360, s, l]]);
            // Analogous (+30, -30)
            renderHarmony('harm-analogous', 'Analogous', [[(h - 30 + 360) % 360, s, l], baseHsl, [(h + 30) % 360, s, l]]);
            // Triadic (+120, +240)
            renderHarmony('harm-triadic', 'Triadic', [baseHsl, [(h + 120) % 360, s, l], [(h + 240) % 360, s, l]]);
            // Split (+150, +210)
            renderHarmony('harm-split', 'Split-Comp', [baseHsl, [(h + 150) % 360, s, l], [(h + 210) % 360, s, l]]);
        }

        loadHistory();
