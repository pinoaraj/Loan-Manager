from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "build" / "icons"
PNG_PATH = ICON_DIR / "app-icon.png"
ICO_PATH = ICON_DIR / "app-icon.ico"
PREVIEW_PATH = ICON_DIR / "app-icon-preview.png"
SVG_PATH = ICON_DIR / "app-icon.svg"

SIZE = 1024
GOLD_STOPS = [
    (0.00, (248, 231, 162, 255)),
    (0.34, (229, 197, 101, 255)),
    (0.68, (201, 151, 46, 255)),
    (1.00, (138, 97, 18, 255)),
]
BRONZE = (82, 51, 10, 255)
PREVIEW_BG = (18, 27, 50, 255)


def make_gradient(width: int, height: int) -> Image.Image:
    gradient = Image.new("RGBA", (width, height))
    px = gradient.load()

    for y in range(height):
        for x in range(width):
            t = ((x / max(width - 1, 1)) * 0.58) + ((y / max(height - 1, 1)) * 0.42)
            t = max(0.0, min(1.0, t))
            for index in range(len(GOLD_STOPS) - 1):
                start, start_color = GOLD_STOPS[index]
                end, end_color = GOLD_STOPS[index + 1]
                if t <= end:
                    local_t = 0 if end == start else (t - start) / (end - start)
                    px[x, y] = tuple(
                        round(start_color[channel] + (end_color[channel] - start_color[channel]) * local_t)
                        for channel in range(4)
                    )
                    break
            else:
                px[x, y] = GOLD_STOPS[-1][1]

    return gradient


def build_symbol_mask() -> Image.Image:
    mask = Image.new("L", (SIZE, SIZE), 0)
    draw = ImageDraw.Draw(mask)

    tablet_left, tablet_top, tablet_right, tablet_bottom = 276, 186, 646, 760
    tablet_radius = 76

    draw.rounded_rectangle(
        (tablet_left, tablet_top + 60, tablet_right, tablet_bottom),
        radius=tablet_radius,
        fill=255,
    )
    draw.polygon(
        [(tablet_left + 44, tablet_top + 118), (tablet_right - 44, tablet_top + 118), (512, tablet_top)],
        fill=255,
    )
    draw.rounded_rectangle((tablet_left + 96, tablet_bottom - 38, tablet_right - 96, tablet_bottom + 42), radius=24, fill=255)

    coin_center = (692, 622)
    coin_radius = 170
    draw.ellipse(
        (
            coin_center[0] - coin_radius,
            coin_center[1] - coin_radius,
            coin_center[0] + coin_radius,
            coin_center[1] + coin_radius,
        ),
        fill=255,
    )

    return mask


def build_cutout_mask() -> Image.Image:
    cutout = Image.new("L", (SIZE, SIZE), 0)
    draw = ImageDraw.Draw(cutout)

    line_x0, line_x1 = 350, 566
    for y in (340, 430, 520):
        draw.rounded_rectangle((line_x0, y, line_x1, y + 22), radius=11, fill=255)

    for x in (384, 462, 540):
        draw.rounded_rectangle((x, 268, x + 24, 618), radius=12, fill=255)

    draw.rounded_rectangle((356, 654, 566, 678), radius=12, fill=255)

    coin_center = (692, 622)
    draw.ellipse((coin_center[0] - 120, coin_center[1] - 120, coin_center[0] + 120, coin_center[1] + 120), fill=255)
    draw.ellipse((coin_center[0] - 92, coin_center[1] - 92, coin_center[0] + 92, coin_center[1] + 92), fill=0)

    draw.polygon(
        [
            (coin_center[0], coin_center[1] - 56),
            (coin_center[0] + 32, coin_center[1] - 4),
            (coin_center[0] + 88, coin_center[1] + 10),
            (coin_center[0] + 40, coin_center[1] + 44),
            (coin_center[0] + 52, coin_center[1] + 102),
            (coin_center[0], coin_center[1] + 72),
            (coin_center[0] - 52, coin_center[1] + 102),
            (coin_center[0] - 40, coin_center[1] + 44),
            (coin_center[0] - 88, coin_center[1] + 10),
            (coin_center[0] - 32, coin_center[1] - 4),
        ],
        fill=255,
    )

    return cutout


def build_shadow(mask: Image.Image) -> Image.Image:
    shadow = mask.filter(ImageFilter.GaussianBlur(28))
    rgba = Image.new("RGBA", (SIZE, SIZE), (214, 173, 73, 0))
    rgba.putalpha(shadow.point(lambda value: min(255, int(value * 0.34))))
    return rgba


def build_icon() -> Image.Image:
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    base_mask = build_symbol_mask()
    cutout_mask = build_cutout_mask()
    solid_mask = ImageChops.subtract(base_mask, cutout_mask)

    canvas.alpha_composite(build_shadow(base_mask))

    gradient = make_gradient(SIZE, SIZE)
    symbol = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    symbol.paste(gradient, (0, 0), solid_mask)
    canvas.alpha_composite(symbol)

    accent = Image.new("RGBA", (SIZE, SIZE), BRONZE)
    accent.putalpha(base_mask.filter(ImageFilter.GaussianBlur(1)).point(lambda value: min(255, int(value * 0.18))))
    canvas.alpha_composite(accent)

    outline = Image.new("RGBA", (SIZE, SIZE), (255, 255, 255, 0))
    outline.putalpha(base_mask.filter(ImageFilter.GaussianBlur(2)).point(lambda value: min(255, int(value * 0.08))))
    canvas.alpha_composite(outline)

    return canvas


def build_preview(icon: Image.Image) -> Image.Image:
    preview = Image.new("RGBA", (SIZE, SIZE), PREVIEW_BG)
    preview.alpha_composite(icon)
    return preview


def build_svg() -> str:
    return """<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" fill="none">
  <defs>
    <linearGradient id="gold" x1="260" y1="150" x2="790" y2="830" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#F8E7A2"/>
      <stop offset="0.34" stop-color="#E5C565"/>
      <stop offset="0.68" stop-color="#C9972E"/>
      <stop offset="1" stop-color="#8A6112"/>
    </linearGradient>
    <filter id="softGlow" x="120" y="120" width="784" height="784" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="16" result="blur"/>
      <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.84 0 0 0 0 0.68 0 0 0 0 0.25 0 0 0 0.30 0"/>
      <feBlend in="SourceGraphic" in2="blur" mode="screen"/>
    </filter>
  </defs>
  <g filter="url(#softGlow)">
    <path fill="url(#gold)" fill-rule="evenodd" clip-rule="evenodd" d="M320 246L512 186L602 304H646C688 304 722 338 722 380V760H636L596 804H326V760H276V380C276 338 310 304 352 304H422L512 186L320 246ZM352 340C333.222 340 318 355.222 318 374V718H604V374C604 355.222 588.778 340 570 340H352ZM636 760C636 724.654 664.654 696 700 696C735.346 696 764 724.654 764 760C764 795.346 735.346 824 700 824C664.654 824 636 795.346 636 760ZM368 408C368 398.059 376.059 390 386 390H540C549.941 390 558 398.059 558 408C558 417.941 549.941 426 540 426H386C376.059 426 368 417.941 368 408ZM368 496C368 486.059 376.059 478 386 478H540C549.941 478 558 486.059 558 496C558 505.941 549.941 514 540 514H386C376.059 514 368 505.941 368 496ZM368 584C368 574.059 376.059 566 386 566H540C549.941 566 558 574.059 558 584C558 593.941 549.941 602 540 602H386C376.059 602 368 593.941 368 584Z"/>
    <path fill="#52330A" fill-rule="evenodd" clip-rule="evenodd" d="M700 680C744.183 680 780 715.817 780 760C780 804.183 744.183 840 700 840C655.817 840 620 804.183 620 760C620 715.817 655.817 680 700 680ZM700 706C729.823 706 754 730.177 754 760C754 789.823 729.823 814 700 814C670.177 814 646 789.823 646 760C646 730.177 670.177 706 700 706Z"/>
  </g>
</svg>
"""


def save_outputs(icon: Image.Image) -> None:
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    icon.save(PNG_PATH)
    icon.save(
        ICO_PATH,
        format="ICO",
        sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)],
    )
    build_preview(icon).save(PREVIEW_PATH)
    SVG_PATH.write_text(build_svg(), encoding="utf-8")


def main() -> None:
    icon = build_icon()
    save_outputs(icon)
    print(f"Generated {PNG_PATH}")
    print(f"Generated {ICO_PATH}")
    print(f"Generated {PREVIEW_PATH}")
    print(f"Generated {SVG_PATH}")


if __name__ == "__main__":
    main()
