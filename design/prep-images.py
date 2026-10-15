# re-encodes the LinguaFlow artwork for embedding (webp q58): desktop 1000w, mobile 720w -> tmp/lf-d.webp, tmp/lf-m.webp
# Source: ./vendor/linguaflow-shot.jpg. Output is relative to this file, not the cwd.
from PIL import Image
import os
here = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(here, 'vendor', 'linguaflow-shot.jpg')
im = Image.open(src).convert('RGB')
# the source is 1200x668: keep the artwork band (drops the slide's feature cards below it)
CROP_Y, CROP_W, CROP_H = 22, 1200, 456
crop = im.crop((0, CROP_Y, CROP_W, CROP_Y + CROP_H))
out = os.path.join(here, 'tmp')
os.makedirs(out, exist_ok=True)
for name, w in (('lf-d', 1000), ('lf-m', 720)):
    c = crop.resize((w, round(w * CROP_H / CROP_W)), Image.LANCZOS)
    f = os.path.join(out, f'{name}.webp')
    c.save(f, 'WEBP', quality=58, method=6)
    print(name, c.size, os.path.getsize(f))
