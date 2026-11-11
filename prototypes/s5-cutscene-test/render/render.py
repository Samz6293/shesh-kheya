# Renders Scene 5 assets for the test: plate + sprites (PNG) and three cutscenes (MP4).
# Usage: python3 render.py <out_dir> [clip ...]
# Needs: Python with playwright (`pip install playwright` then `playwright install chromium`), ffmpeg on PATH.
# Set CHROME=<path to chrome> to use an installed Chrome instead of Playwright's Chromium.
import base64, os, subprocess, sys, shutil, time
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, ".."))
ONLY = sys.argv[2:]
ASSETS = os.path.join(OUT, "assets")
VIDEO = os.path.join(OUT, "video")
FRAMES = os.path.join(HERE, "_frames")
os.makedirs(ASSETS, exist_ok=True)
os.makedirs(VIDEO, exist_ok=True)

def save(data_url, path):
    with open(path, "wb") as f:
        f.write(base64.b64decode(data_url.split(",", 1)[1]))

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--allow-file-access-from-files"])
    page = browser.new_page(viewport={"width": 1920, "height": 1080})
    page.on("pageerror", lambda e: print("page error:", e))
    page.goto("file://" + os.path.join(HERE, "render.html"))
    page.wait_for_function("document.title === 'ready'")
    t0 = time.time()
    page.evaluate("R.init()")
    print(f"plate painted in {time.time() - t0:.1f}s")

    if not ONLY or "assets" in ONLY:
        save(page.evaluate("R.plate()"), os.path.join(ASSETS, "plate.png"))
        poses = [("rest", "near", 0.5)]
        for side in ("near", "far"):
            for i, pv in enumerate([0, 0.33, 0.66, 1]):
                poses.append((f"{side}_{i}", side, pv))
        for name, side, pv in poses:
            img, refl = page.evaluate(f"R.mitu('{side}', {pv})")
            save(img, os.path.join(ASSETS, f"mitu_{name}.png"))
            save(refl, os.path.join(ASSETS, f"mitu_{name}_refl.png"))
        for i in range(8):
            img, refl = page.evaluate(f"R.kalam({i / 8})")
            save(img, os.path.join(ASSETS, f"kalam_{i}.png"))
            save(refl, os.path.join(ASSETS, f"kalam_{i}_refl.png"))
        print("assets saved")

    durations = page.evaluate("R.durations()")
    for name, dur in durations.items():
        if ONLY and name not in ONLY:
            continue
        shutil.rmtree(FRAMES, ignore_errors=True)
        os.makedirs(FRAMES)
        n = round(dur * 24) + 1          # include the frame at t = duration exactly
        t0 = time.time()
        for i in range(n):
            save(page.evaluate(f"R.frame('{name}', {i})"), os.path.join(FRAMES, f"{i:04d}.jpg"))
        print(f"{name}: {n} frames in {time.time() - t0:.0f}s")
        subprocess.run([
            "ffmpeg", "-y", "-loglevel", "error", "-framerate", "24", "-i", os.path.join(FRAMES, "%04d.jpg"),
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
            "-movflags", "+faststart", "-an", os.path.join(VIDEO, f"{name}.mp4"),
        ], check=True)
        # last frame as a still, for checking the handoff
        shutil.copy(os.path.join(FRAMES, f"{n - 1:04d}.jpg"), os.path.join(HERE, f"_last_{name}.jpg"))
        shutil.copy(os.path.join(FRAMES, "0000.jpg"), os.path.join(HERE, f"_first_{name}.jpg"))
    shutil.rmtree(FRAMES, ignore_errors=True)
    browser.close()
