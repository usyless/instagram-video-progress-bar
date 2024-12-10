'use strict';

(async () => {
    let holding = false;

    class Reel {
        static addProgressBars() {
            for (const reel of document.body.querySelectorAll('video:not([usy-progress-bar])')) {
                if (reel.readyState === 4) {
                    reel.setAttribute('usy-progress-bar', '');
                    const dur = reel.duration;

                    const barBoxContainer = document.createElement('div');
                    barBoxContainer.classList.add('usy-progress-bar-container');

                    const bar = document.createElement('div');
                    bar.classList.add('usy-progress-bar');

                    const time = document.createElement('div');
                    time.classList.add('usy-time-count');
                    const timeNode = document.createTextNode(Utils.formatTime(0));
                    time.append(timeNode, document.createTextNode(' / '),
                        document.createTextNode(Utils.formatTime(dur)));

                    barBoxContainer.append(bar, time);
                    reel.after(barBoxContainer);

                    const updateBar = (time) => {
                        bar.style.width = `${(time / dur) * 100}%`;
                        timeNode.textContent = Utils.formatTime(time);
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
                        updateBarFromMouse(e);
                        holding = true;
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
                            holding = false;
                            updateBarFromMouse(e);
                        }
                    }
                    barBoxContainer.addEventListener('pointerup', stopHold);
                    barBoxContainer.addEventListener('pointerleave', stopHold);
                }
            }
        }
    }

    class Utils {
        static formatTime(time) {
            time = parseInt(time);
            return `${Math.floor(time / 60).toString().padStart(2, '0')}:${(time % 60).toString().padStart(2, '0')}`;
        }
    }

    setInterval(Reel.addProgressBars, 1000);
})();