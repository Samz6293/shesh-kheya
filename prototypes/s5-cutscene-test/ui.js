// The text layer: dialogue with a Bengali-safe typewriter, the choice menu,
// key hints with a progress bar, and the debug read-out.
// It is plain HTML over the canvas and the videos, so the same text works on both.

const $ = sel => document.querySelector(sel);

// New here: Intl.Segmenter splits text into what a reader sees as single letters
// (graphemes), so conjuncts like "ন্ধ" never appear half-typed. Docs: MDN, Intl.Segmenter
const segmenter = new Intl.Segmenter("bn", { granularity: "grapheme" });

const UI = {
    typing: null,
    waiting: null,

    // show one line. hold: wait for click/Enter. dur: hide by itself after dur seconds.
    say(beatId, index, { hold = true, dur = 3 } = {}) {
        const line = TEXT.beats[beatId]?.[index];
        if (!line) throw new Error(`Unknown line: ${beatId}[${index}]`);

        const box = $("#dialogue");
        const speaker = TEXT.speakers[line.speaker];
        box.querySelector(".dialogue-name").textContent = speaker.bn;
        const sub = box.querySelector(".dialogue-sub");
        sub.textContent = line.en;
        sub.classList.remove("on");
        box.classList.remove("hidden");

        const letters = [...segmenter.segment(line.sy)].map(s => s.segment);
        const out = box.querySelector(".dialogue-line");
        out.textContent = "";
        clearInterval(this.typing);
        let i = 0;
        return new Promise(resolve => {
            const finishTyping = () => {
                clearInterval(this.typing);
                this.typing = null;
                out.textContent = line.sy;
                sub.classList.add("on");
            };
            this.typing = setInterval(() => {
                out.textContent += letters[i++];
                if (i >= letters.length) finishTyping();
            }, 38);

            if (hold) {
                // first click finishes the line, the next one moves on
                this.waiting = () => {
                    if (this.typing) return finishTyping();
                    this.waiting = null;
                    this.hideLine();
                    resolve();
                };
            }
            else {
                setTimeout(() => { finishTyping(); this.hideLine(); resolve(); }, dur * 1000);
            }
        });
    },

    hideLine() {
        clearInterval(this.typing);
        this.typing = null;
        $("#dialogue").classList.add("hidden");
    },

    advance() {
        if (this.waiting) this.waiting();
    },

    // two or more options; resolves with the chosen id
    choose(options) {
        const box = $("#choice");
        box.innerHTML = "";
        box.classList.remove("hidden");
        return new Promise(resolve => {
            const pick = id => {
                box.classList.add("hidden");
                document.removeEventListener("keydown", onKey);
                resolve(id);
            };
            const onKey = e => {
                const n = Number(e.key) - 1;
                if (options[n]) pick(options[n].id);
            };
            options.forEach((o, i) => {
                const b = document.createElement("button");
                b.innerHTML = `${i + 1}. ${o.text.sy}<small>${o.text.en}</small>`;
                b.addEventListener("click", () => pick(o.id));
                box.appendChild(b);
            });
            document.addEventListener("keydown", onKey);
        });
    },

    hint(text, withBar = false) {
        const box = $("#hint");
        box.querySelector(".hint-text").textContent = text.sy;
        box.querySelector(".hint-bar").classList.toggle("on", withBar);
        box.classList.remove("hidden");
    },

    hintProgress(p) {
        $("#hint .hint-fill").style.width = `${Math.min(100, p * 100)}%`;
    },

    hideHint() {
        $("#hint").classList.add("hidden");
    },

    hud(lines) {
        $("#hud").textContent = lines.join("\n");
    },
};
