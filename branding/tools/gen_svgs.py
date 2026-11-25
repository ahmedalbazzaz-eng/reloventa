#!/usr/bin/env python3
"""Generates Reloventa's editable vector artwork (SVG, 1024x1024 macOS grid).
Body = 824px squircle-ish rounded rect at (100,100); transparent margin holds the shadow."""
import math, pathlib
OUT = pathlib.Path(__file__).resolve().parents[1]
CX = CY = 512

def pt(r, a):
    a = math.radians(a); return CX + r*math.cos(a), CY + r*math.sin(a)

def arc(r, a0, sweep):
    x0, y0 = pt(r, a0); x1, y1 = pt(r, a0+sweep)
    large = 1 if sweep > 180 else 0
    return f"M{x0:.1f} {y0:.1f} A{r} {r} 0 {large} 1 {x1:.1f} {y1:.1f}"

def body(fill, extra=""):
    return f'''  <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
    <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#000" flood-opacity=".38"/>
  </filter>
  <rect x="100" y="100" width="824" height="824" rx="188" fill="{fill}" filter="url(#shadow)"/>{extra}'''

def wrap(title, desc, defs, content):
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024" role="img">
  <title>{title}</title><desc>{desc}</desc>
  <defs>
{defs}
  </defs>
{content}
</svg>
'''

# ---------- Concept A: ORBIT -------------------------------------------------
def orbit(variant="default"):
    P = {
     "default": dict(bg0="#2B1A7A", bg1="#0B0724", glow="#FF4F9A", g=("#2EE6FF","#7B61FF","#FF5FA2"), g2=("#FFD27A","#FF7A59"), dot="#FFFFFF", gloss=.14),
     "dark":    dict(bg0="#150E33", bg1="#050310", glow="#7B61FF", g=("#2EE6FF","#7B61FF","#FF5FA2"), g2=("#FFD27A","#FF7A59"), dot="#FFFFFF", gloss=.07),
     "light":   dict(bg0="#FFFFFF", bg1="#DCD5FF", glow="#FFB3D1", g=("#00B8E6","#5B3FF0","#E5307F"), g2=("#FFB020","#F2542D"), dot="#1B1250", gloss=.5),
     "tinted":  dict(bg0="#2A2A2A", bg1="#0A0A0A", glow="#FFFFFF", g=("#FFFFFF","#EDEDED","#BFBFBF"), g2=("#FFFFFF","#CFCFCF"), dot="#FFFFFF", gloss=.06),
    }[variant]
    defs = f'''    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{P['bg0']}"/><stop offset="1" stop-color="{P['bg1']}"/></linearGradient>
    <radialGradient id="glow" cx=".18" cy=".92" r=".75"><stop offset="0" stop-color="{P['glow']}" stop-opacity=".55"/><stop offset="1" stop-color="{P['glow']}" stop-opacity="0"/></radialGradient>
    <linearGradient id="ring" x1="200" y1="830" x2="840" y2="200" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="{P['g'][0]}"/><stop offset=".55" stop-color="{P['g'][1]}"/><stop offset="1" stop-color="{P['g'][2]}"/></linearGradient>
    <linearGradient id="core" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="{P['g2'][0]}"/><stop offset="1" stop-color="{P['g2'][1]}"/></linearGradient>
    <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="{P['gloss']}"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <radialGradient id="halo"><stop offset="0" stop-color="{P['dot']}" stop-opacity=".55"/><stop offset="1" stop-color="{P['dot']}" stop-opacity="0"/></radialGradient>
    <clipPath id="clip"><rect x="100" y="100" width="824" height="824" rx="188"/></clipPath>'''
    dx, dy = pt(215, 315)
    content = body("url(#bg)") + f'''
  <g clip-path="url(#clip)">
    <rect x="100" y="100" width="824" height="824" fill="url(#glow)"/>
    <rect x="100" y="100" width="824" height="412" fill="url(#gloss)"/>
  </g>
  <path d="{arc(215,5,260)}" fill="none" stroke="url(#ring)" stroke-width="80" stroke-linecap="round"/>
  <path d="{arc(100,185,250)}" fill="none" stroke="url(#core)" stroke-width="58" stroke-linecap="round"/>
  <circle cx="{dx:.1f}" cy="{dy:.1f}" r="92" fill="url(#halo)"/>
  <circle cx="{dx:.1f}" cy="{dy:.1f}" r="44" fill="{P['dot']}"/>
  <rect x="101.5" y="101.5" width="821" height="821" rx="186.5" fill="none" stroke="#fff" stroke-opacity="{.10 if variant!='light' else .6}" stroke-width="3"/>'''
    return wrap("Reloventa icon — Orbit", "A reloading ring with an orbiting node and a warm core.", defs, content)

# ---------- Concept B: FLOW (ribbons) ----------------------------------------
def flow():
    defs = '''    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0F2A4A"/><stop offset="1" stop-color="#06101F"/></linearGradient>
    <linearGradient id="r1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2EE6FF"/><stop offset="1" stop-color="#5B8CFF"/></linearGradient>
    <linearGradient id="r2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7B61FF"/><stop offset="1" stop-color="#C45BFF"/></linearGradient>
    <linearGradient id="r3" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FF7A59"/><stop offset="1" stop-color="#FFC06B"/></linearGradient>'''
    def rib(dy, g):
        return f'<path d="M230 {430+dy} C 380 {430+dy}, 380 {330+dy}, 512 {380+dy} S 700 {470+dy}, 794 {350+dy}" fill="none" stroke="url(#{g})" stroke-width="78" stroke-linecap="round"/>'
    content = body("url(#bg)") + "\n  " + "\n  ".join([rib(40,"r1"), rib(190,"r2"), rib(340,"r3")])
    return wrap("Reloventa icon — Flow", "Three flowing ribbons suggesting movement and streams.", defs, content)

# ---------- Concept C: NODES (constellation loop) ----------------------------
def nodes():
    defs = '''    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E3DEFF"/></linearGradient>
    <linearGradient id="ln" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5B3FF0"/><stop offset="1" stop-color="#E5307F"/></linearGradient>'''
    pts = [pt(235, a) for a in (-90, 30, 150)]
    segs = "".join(f'<path d="M{pts[i][0]:.1f} {pts[i][1]:.1f} Q512 512 {pts[(i+1)%3][0]:.1f} {pts[(i+1)%3][1]:.1f}" fill="none" stroke="url(#ln)" stroke-width="46" stroke-linecap="round" opacity=".85"/>' for i in range(3))
    dots = "".join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{c}"/>' for (x,y),r,c in zip(pts,(88,72,72),("#E5307F","#5B3FF0","#00B8E6")))
    content = body("url(#bg)") + "\n  " + segs + "\n  " + dots
    return wrap("Reloventa icon — Nodes", "Three connected nodes forming a loop.", defs, content)

(OUT/"concepts").mkdir(exist_ok=True); (OUT/"final").mkdir(exist_ok=True)
(OUT/"concepts/concept-a-orbit.svg").write_text(orbit())
(OUT/"concepts/concept-b-flow.svg").write_text(flow())
(OUT/"concepts/concept-c-nodes.svg").write_text(nodes())
for v in ("default","dark","light","tinted"):
    name = "reloventa-icon.svg" if v=="default" else f"reloventa-icon-{v}.svg"
    (OUT/"final"/name).write_text(orbit(v))
print("ok")
