// The debug read-out (top-left). Shown with `?debug` in the address or the
// backtick key. Anything can add a line; lines are functions, so they always
// show the current value. Developer tool: its labels are not game text.

export default class Debug {
    private lines: (() => string)[] = [];
    private isOn: boolean;

    constructor(private el: HTMLElement) {
        this.isOn = new URLSearchParams(location.search).has("debug");
        el.classList.toggle("on", this.isOn);
    }

    // returns a function that removes the line again (for scene-only lines)
    add(line: () => string): () => void {
        this.lines.push(line);
        return () => {
            this.lines = this.lines.filter((l) => l !== line);
        };
    }

    toggle(): void {
        this.isOn = !this.isOn;
        this.el.classList.toggle("on", this.isOn);
    }

    // called every frame by the loop
    refresh(): void {
        if (!this.isOn) return;
        this.el.textContent = this.lines.map((line) => line()).join("\n");
    }
}
