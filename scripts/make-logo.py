"""Builds the vector logo (SVG) for 谷塚駅東口共同駐車場.
Mark: drawn by hand as closed contours (fill-rule evenodd), so the same paths give
the solid logo and the outlined (ink-saving) logo. Wordmark: Noto Sans CJK JP Black outlines.
Run: python3 scripts/make-logo.py  → public/images/*.svg"""
from fontTools.ttLib import TTCollection
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
import os, sys

NAVY = '#003870'
OUT = sys.argv[1] if len(sys.argv) > 1 else 'public/images'

# ---------------------------------------------------------------- mark (viewBox 0 0 290 400)
def ring(cx, cy, r):
    return f'M{cx-r},{cy} A{r},{r} 0 1 0 {cx+r},{cy} A{r},{r} 0 1 0 {cx-r},{cy} Z'

def lamp(cx, cy):
    # white ring (r 24→19) and a white half-ring (r 15→8) inside the navy centre
    return (ring(cx, cy, 24) + ring(cx, cy, 19) +
            f'M{cx-15},{cy+3} A15,15 0 0 1 {cx+15},{cy+3} H{cx+8} A8,8 0 0 0 {cx-8},{cy+3} Z')

MARK = [
    # canopy: elliptical top, straight sides, open-book lower edge meeting at the spine
    'M0,180 V92 A145,92 0 0 1 290,92 V180 C262,154 196,152 153,175 L145,187 L137,175 C94,152 28,154 0,180 Z',
    # letter P (outer contour, then its counter)
    'M106,37 Q106,32 111,32 H160 A34,34 0 0 1 160,100 H125 V131 Q125,136 120,136 H111 Q106,136 106,131 Z',
    'M125,51 H160 A15,15 0 0 1 160,81 H125 Z',
    # car body with roof, two wheels
    'M84,188 H206 Q212,188 216,193 L276,256 Q290,258 290,274 V393 Q290,400 283,400 H225 Q218,400 218,393 V362 '
    'H72 V393 Q72,400 65,400 H7 Q0,400 0,393 V274 Q0,258 14,256 L74,193 Q78,188 84,188 Z',
    # windscreen
    'M88,196 H202 L259,252 H31 Z',
    # headlamps
    lamp(74, 283), lamp(216, 283),
    # bumper line (a U-shaped groove, 6 wide)
    'M20,288 V300 A33,33 0 0 0 53,333 H237 A33,33 0 0 0 270,300 V288 A3,3 0 0 0 264,288 V300 '
    'A27,27 0 0 1 237,327 H53 A27,27 0 0 1 26,300 V288 A3,3 0 0 0 20,288 Z',
]

# ---------------------------------------------------------------- wordmark from font outlines
font = TTCollection('/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc').fonts[0]
gs, cmap = font.getGlyphSet(), font.getBestCmap()

INK = [1e9, 1e9, -1e9, -1e9]  # ink bounds of the whole wordmark (x0, y0, x1, y1)

def glyph(ch, x, y, size):
    """Path for one character with its em box at (x, y), size × size."""
    pen, bp = SVGPathPen(gs), BoundsPen(gs)
    s = size / 1000
    # font units: y up, baseline at 0, em box from -120 to 880
    t = (s, 0, 0, -s, x, y + 880 * s)
    gs[cmap[ord(ch)]].draw(TransformPen(pen, t))
    gs[cmap[ord(ch)]].draw(TransformPen(bp, t))
    b = bp.bounds
    INK[:] = [min(INK[0], b[0]), min(INK[1], b[1]), max(INK[2], b[2]), max(INK[3], b[3])]
    return pen.getCommands()

BIG, SMALL, GAP = 200, 100, 4
word, x = [], 0
for ch in '谷塚駅':
    word.append(glyph(ch, x, 0, BIG)); x += BIG + GAP
for i, ch in enumerate('東口'):
    word.append(glyph(ch, x + i * SMALL, 0, SMALL))
for i, ch in enumerate('共同'):
    word.append(glyph(ch, x + i * SMALL, SMALL, SMALL))
x += 2 * SMALL + GAP
for ch in '駐車場':
    word.append(glyph(ch, x, 0, BIG)); x += BIG + GAP
WORD_W = x - GAP

# ---------------------------------------------------------------- SVG writers
def solid(paths, w, h, color):
    d = ' '.join(paths)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
            f'<path fill="{color}" fill-rule="evenodd" d="{d}"/></svg>\n')

def outline(paths, w, h, color, line):
    # stroke twice the line width, clipped to the shape: the line sits inside the edge,
    # so the outlined logo keeps exactly the same silhouette as the solid one
    d = ' '.join(paths)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
            f'<defs><clipPath id="c"><path clip-rule="evenodd" d="{d}"/></clipPath></defs>'
            f'<path clip-path="url(#c)" fill="none" stroke="{color}" stroke-width="{line * 2}" '
            f'stroke-linejoin="round" d="{d}"/></svg>\n')

CAR_TOP, CAR_BOTTOM, MARK_W = 188, 400, 290
LOCKUP_GAP = 90  # space between the mark and the lettering, in mark units

def lockup(color, line=None, word_line=None):
    """Mark + lettering side by side. The lettering is as tall as the car (roof to tyres)
    and its bottom sits on the same line as the bottom of the tyres."""
    k = (CAR_BOTTOM - CAR_TOP) / (INK[3] - INK[1])
    tx = MARK_W + LOCKUP_GAP - INK[0] * k
    ty = CAR_BOTTOM - INK[3] * k
    w = MARK_W + LOCKUP_GAP + (INK[2] - INK[0]) * k
    m, wd = ' '.join(MARK), ' '.join(word)
    if line is None:
        body = (f'<path fill="{color}" fill-rule="evenodd" d="{m}"/>'
                f'<path transform="translate({tx:.2f},{ty:.2f}) scale({k:.4f})" fill="{color}" fill-rule="evenodd" d="{wd}"/>')
        defs = ''
    else:
        lw = (word_line or line) / k  # printed line width on the lettering, in lettering units
        defs = (f'<defs><clipPath id="m"><path clip-rule="evenodd" d="{m}"/></clipPath>'
                f'<clipPath id="w"><path clip-rule="evenodd" d="{wd}"/></clipPath></defs>')
        body = (f'<path clip-path="url(#m)" fill="none" stroke="{color}" stroke-width="{line * 2}" stroke-linejoin="round" d="{m}"/>'
                f'<g transform="translate({tx:.2f},{ty:.2f}) scale({k:.4f})"><path clip-path="url(#w)" fill="none" '
                f'stroke="{color}" stroke-width="{lw * 2:.2f}" stroke-linejoin="round" d="{wd}"/></g>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} 400" width="{w:.0f}" height="400">'
            + defs + body + '</svg>\n')

files = {
    'logo-mark.svg': solid(MARK, 290, 400, NAVY),
    'logo-mark-white.svg': solid(MARK, 290, 400, '#FFFFFF'),
    'logo-mark-outline.svg': outline(MARK, 290, 400, NAVY, 9),
    'wordmark.svg': solid(word, WORD_W, 200, NAVY),
    'wordmark-white.svg': solid(word, WORD_W, 200, '#FFFFFF'),
    'wordmark-outline.svg': outline(word, WORD_W, 200, NAVY, 5),
    'logo-lockup.svg': lockup(NAVY),
    'logo-lockup-white.svg': lockup('#FFFFFF'),
    'logo-lockup-outline.svg': lockup(NAVY, 10, 7),
}
os.makedirs(OUT, exist_ok=True)
for name, svg in files.items():
    open(os.path.join(OUT, name), 'w').write(svg)
    print(name, len(svg))
