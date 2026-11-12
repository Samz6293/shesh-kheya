# Paints the portrait cover, with and without the title. Usage: python3 cover.py <out_dir>
import base64, os, sys
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(sys.argv[1]); os.makedirs(OUT, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get("CHROME") or None, args=["--allow-file-access-from-files"])
    pg = b.new_page()
    pg.on("pageerror", lambda e: print("PAGE ERROR:", e))
    pg.goto("file://" + os.path.join(HERE, "art.html"))
    pg.wait_for_function("document.title === 'ready'")
    for title, name in [(True, "cover.png"), (False, "cover-clean.png")]:
        d = pg.evaluate(f"COVER.paint({'true' if title else 'false'})")
        open(os.path.join(OUT, name), "wb").write(base64.b64decode(d.split(",")[1]))
        print("saved", name)
    b.close()
