# Paints the promotional stills to PNG. Usage: python3 art.py <out_dir> [name ...]
import base64, os, sys, time
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(sys.argv[1]); os.makedirs(OUT, exist_ok=True)
ONLY = sys.argv[2:]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--allow-file-access-from-files"])
    pg = b.new_page()
    pg.on("pageerror", lambda e: print("PAGE ERROR:", e))
    pg.goto("file://" + os.path.join(HERE, "art.html"))
    pg.wait_for_function("document.title === 'ready'")
    for i, name in enumerate(pg.evaluate("ART.list")):
        if ONLY and name not in ONLY: continue
        t = time.time()
        d = pg.evaluate(f"ART.paint('{name}')")
        open(os.path.join(OUT, f"{i+1:02d}-{name}.png"), "wb").write(base64.b64decode(d.split(",")[1]))
        print(name, f"{time.time()-t:.1f}s")
    b.close()
