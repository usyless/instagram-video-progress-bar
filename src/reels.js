'use strict';

(async () => {
    const Settings = await getSettings();
    let holding = false;

    class Video {
        static addProgressBar(reel) {
            let duration = reel.duration || 1;
            const updaters = [];

            const barBoxContainer = document.createElement('div');
            barBoxContainer.classList.add('usy-progress-bar-container');

            const bar = document.createElement('div');
            bar.classList.add('usy-progress-bar');
            if (!Settings.preferences.show_bar) bar.classList.add('usy-progress-bar-hidden');
            barBoxContainer.appendChild(bar);
            updaters.push((time) => bar.style.width = `${(time / duration) * 100}%`);

            if (Settings.preferences.show_time) {
                const time = document.createElement('div');
                time.classList.add('usy-time-count');
                const timeNode = document.createTextNode(Utils.formatTime(0));
                const durNode = document.createTextNode(Utils.formatTime(duration));
                time.append(timeNode, document.createTextNode(' / '), durNode);
                barBoxContainer.appendChild(time);
                updaters.push((time) => {
                    timeNode.textContent = Utils.formatTime(time);
                    durNode.textContent = Utils.formatTime(duration);
                });
            }

            reel.after(barBoxContainer);

            const updateBar = () => {
                duration = reel.duration;
                const time = reel.currentTime;
                for (const u of updaters) u(time);
                if (!holding) bar.classList.remove('usy-holding');
            }

            reel.addEventListener('timeupdate', updateBar);

            const updateBarFromMouse = (e) => {
                const newTime = Math.max(0, Math.min(((e.clientX - barBoxContainer.getBoundingClientRect().left) / barBoxContainer.offsetWidth) * duration, duration));
                reel.currentTime = newTime;
                updateBar(newTime);
            }

            let pauseTimeout = null, paused = false;
            const pauseReel = reel.pause.bind(reel);
            const moveListener = (e) => {
                e.preventDefault();
                updateBarFromMouse(e);
            }
            const stopHold = (e) => {
                e.preventDefault();
                clearTimeout(pauseTimeout);
                document.removeEventListener('pointermove', moveListener);
                if (!paused) reel.play();
                updateBarFromMouse(e);
                holding = false;
            }
            barBoxContainer.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                document.removeEventListener('pointermove', moveListener);
                document.removeEventListener('pointerup', stopHold);
                paused = reel.paused;
                if (!paused) pauseTimeout = setTimeout(pauseReel, 150);
                bar.classList.add('usy-holding');
                holding = true;
                updateBarFromMouse(e);
                document.addEventListener('pointerup', stopHold, {once: true});
                document.addEventListener('pointermove', moveListener);
            });

            updateBar();
        }

        static addProgressBars() {
            for (const reel of document.body.querySelectorAll('video:not([usy-progress-bar])')) {
                reel.setAttribute('usy-progress-bar', '');
                Video.addProgressBar(reel);
            }
        }

        static ClearAll() {
            for (const reel of document.body.querySelectorAll('video[usy-progress-bar]')) {
                reel.parentElement.querySelector('div.usy-progress-bar-container')?.remove();
                reel.removeAttribute('usy-progress-bar');
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
        Video.ClearAll();
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

    chrome.storage.onChanged.addListener(async (_, namespace) => {
        if (namespace === 'local') {
            await Settings.loadSettings();
            Video.ClearAll();
        }
    });

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