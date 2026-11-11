# Rebuilds ../content.js from the game's dialogue JSON so the test page can load it
# from file:// (browsers block fetch() of local JSON).
# Usage: python3 make_content.py ../../../src/content/ch1/dialogue.json
import json, os, sys
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", "..", "..", "src", "content", "ch1", "dialogue.json")
d = json.load(open(src, encoding="utf-8"))
here = os.path.dirname(os.path.abspath(__file__))
path = os.path.join(here, "..", "content.js")
text = open(path, encoding="utf-8").read()
proto = text[text.index("// prototype-only strings"):]
out = "// Generated from src/content/ch1/dialogue.json by render/make_content.py.\n// Do not edit by hand: fix the JSON and regenerate.\n"
out += "window.TEXT = " + json.dumps(d, ensure_ascii=False, indent=4) + ";\n" + proto
open(path, "w", encoding="utf-8").write(out)
print("content.js updated")
