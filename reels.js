'use strict';

(async () => {
    const Settings = await getSettings();
    let holding = false;

    class Video {
        static addProgressBar(reel) {
            const dur = reel.duration;
            const updaters = [];

            const barBoxContainer = document.createElement('div');
            barBoxContainer.classList.add('usy-progress-bar-container');

            const bar = document.createElement('div');
            bar.classList.add('usy-progress-bar');
            if (!Settings.preferences.show_bar) bar.classList.add('usy-progress-bar-hidden');
            barBoxContainer.appendChild(bar);
            updaters.push((time) => bar.style.width = `${(time / dur) * 100}%`);

            if (Settings.preferences.show_time) {
                const time = document.createElement('div');
                time.classList.add('usy-time-count');
                const timeNode = document.createTextNode(Utils.formatTime(0));
                time.append(timeNode, document.createTextNode(' / '),
                    document.createTextNode(Utils.formatTime(dur)));
                barBoxContainer.appendChild(time);
                updaters.push((time) => timeNode.textContent = Utils.formatTime(time));
            }

            reel.after(barBoxContainer);

            const updateBar = (time) => {
                for (const u of updaters) u(time);
                if (!holding) bar.classList.remove('usy-holding');
            }

            reel.addEventListener('timeupdate', () => updateBar(reel.currentTime));

            const updateBarFromMouse = (e) => {
                const newTime = Math.max(0, Math.min(((e.clientX - barBoxContainer.getBoundingClientRect().left) / barBoxContainer.offsetWidth) * dur, dur));
                reel.currentTime = newTime;
                updateBar(newTime);
            }

            let pauseTimeout = null, paused = false;
            const pauseReel = reel.pause.bind(reel);
            barBoxContainer.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                paused = reel.paused;
                if (!paused) pauseTimeout = setTimeout(pauseReel, 150);
                bar.classList.add('usy-holding');
                holding = true;
                updateBarFromMouse(e);
            });
            barBoxContainer.addEventListener('pointermove', (e) => {
                if (holding) {
                    e.preventDefault();
                    updateBarFromMouse(e);
                }
            });
            const stopHold = (e) => {
                if (holding) {
                    e.preventDefault();
                    clearTimeout(pauseTimeout);
                    if (!paused) reel.play();
                    updateBarFromMouse(e);
                    holding = false;
                }
            }
            barBoxContainer.addEventListener('pointerup', stopHold);
            barBoxContainer.addEventListener('pointerleave', stopHold);
        }

        static addProgressBars() {
            for (const reel of document.body.querySelectorAll('video:not([usy-progress-bar])')) {
                reel.setAttribute('usy-progress-bar', '');
                if (reel.readyState === 4) Video.addProgressBar(reel);
                else reel.addEventListener('loadeddata', () => Video.addProgressBar(reel));
            }
        }
    }

    class Utils {
        static formatTime(time) {
            time = parseInt(time);
            return `${Math.floor(time / 60).toString()}:${(time % 60).toString().padStart(2, '0')}`;
        }
    }

    {
        let lastUpdate = performance.now(), updateTimer = null;
        const updateFunc = Video.addProgressBars, updateTime = 500;
        const observerSettings = {subtree: true, childList: true};
        const observer = new MutationObserver((_, o) => {
            o.disconnect();
            clearTimeout(updateTimer);
            if (performance.now() - lastUpdate > updateTime) updateFunc();
            else updateTimer = setTimeout(updateFunc, updateTime);
            lastUpdate = performance.now();
            o.observe(document.body, observerSettings);
        });
        observer.observe(document.body, observerSettings);
    }

    async function getSettings() { // Setting handling
        class Settings {
            preferences = {
                show_time: false,
                show_bar: true,
            }

            async loadSettings() {
                const data = await chrome.storage.local.get(), settings = ['preferences'];
                for (const setting of settings) for (const s in this[setting]) this[setting][s] = data[s] ?? this[setting][s];
            }
        }

        const set = new Settings();
        await set.loadSettings();
        return set;
    }
})();