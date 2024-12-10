'use strict';

(async () => {
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
                    reel.addEventListener('timeupdate', () => {
                        const curr = reel.currentTime;
                        bar.style.width = `${(curr / dur) * 100}%`;
                        timeNode.textContent = Utils.formatTime(curr);
                    });

                    barBoxContainer.addEventListener('click', (e) => {
                        const newTime = ((e.clientX - barBoxContainer.getBoundingClientRect().left) / barBoxContainer.offsetWidth) * dur
                        reel.currentTime = newTime;
                        bar.style.width = `${(newTime / dur) * 100}%`;
                        timeNode.textContent = Utils.formatTime(newTime);
                    });
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