from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "build" / "icons"
PNG_PATH = ICON_DIR / "app-icon.png"
ICO_PATH = ICON_DIR / "app-icon.ico"
PREVIEW_PATH = ICON_DIR / "app-icon-preview.png"
SVG_PATH = ICON_DIR / "app-icon.svg"

SIZE = 1024
PREVIEW_BG = (18, 27, 50, 255)
CHARCOAL = (34, 49, 66, 255)
CHARCOAL_DARK = (24, 36, 49, 255)
EMERALD = (20, 163, 111, 255)
EMERALD_DARK = (15, 143, 101, 255)
ACCENT = (46, 123, 255, 255)
WHITE = (247, 250, 252, 255)


def draw_lm_mark(draw: ImageDraw.ImageDraw) -> None:
    draw.polygon([(196, 178), (310, 264), (310, 670), (196, 710)], fill=CHARCOAL)
    draw.polygon([(196, 690), (554, 690), (620, 742), (620, 830), (444, 830), (444, 782), (196, 782)], fill=CHARCOAL_DARK)
    draw.polygon(
        [(360, 294), (560, 452), (824, 220), (824, 530), (706, 530), (706, 426), (554, 548), (470, 480), (470, 690), (360, 690)],
        fill=EMERALD,
    )


def draw_coin(draw: ImageDraw.ImageDraw) -> None:
    draw.ellipse((174, 696, 406, 928), fill=EMERALD)
    draw.rectangle((272, 730, 308, 892), fill=WHITE)
    draw.arc((230, 724, 350, 816), 90, 270, fill=WHITE, width=26)
    draw.arc((230, 808, 350, 890), 270, 90, fill=WHITE, width=26)
    draw.rectangle((230, 792, 320, 820), fill=EMERALD)


def draw_document(draw: ImageDraw.ImageDraw) -> None:
    draw.rounded_rectangle((670, 486, 906, 790), radius=26, outline=CHARCOAL, width=28)
    draw.polygon([(808, 486), (906, 486), (906, 586)], fill=(0, 0, 0, 0))
    draw.line((808, 486, 906, 586), fill=CHARCOAL, width=28)
    draw.line((808, 556, 906, 556), fill=CHARCOAL, width=28)
    draw.line((730, 588, 824, 588), fill=ACCENT, width=24)
    draw.ellipse((718, 626, 746, 654), fill=CHARCOAL)
    draw.ellipse((718, 674, 746, 702), fill=CHARCOAL)
    draw.line((772, 640, 894, 640), fill=CHARCOAL, width=24)
    draw.line((772, 688, 874, 688), fill=CHARCOAL, width=24)


def draw_growth(draw: ImageDraw.ImageDraw) -> None:
    draw.rectangle((760, 810, 810, 900), fill=EMERALD)
    draw.rectangle((836, 780, 892, 900), fill=EMERALD_DARK)
    draw.rectangle((918, 706, 976, 900), fill=EMERALD_DARK)
    draw.arc((560, 676, 936, 932), 24, 82, fill=ACCENT, width=28)
    draw.line((898, 730, 930, 716), fill=ACCENT, width=28)
    draw.line((930, 716, 922, 748), fill=ACCENT, width=28)


def build_icon() -> Image.Image:
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    draw_lm_mark(draw)
    draw_coin(draw)
    draw_document(draw)
    draw_growth(draw)

    return canvas


def build_preview(icon: Image.Image) -> Image.Image:
    preview = Image.new("RGBA", (SIZE, SIZE), PREVIEW_BG)
    preview.alpha_composite(icon)
    return preview


def build_svg() -> str:
    return """<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" fill="none">
  <defs>
    <linearGradient id="emerald" x1="380" y1="230" x2="858" y2="738" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#16B978"/>
      <stop offset="1" stop-color="#0F8F65"/>
    </linearGradient>
  </defs>
  <path d="M196 178L310 264V670C268 670 228 684 196 710V178Z" fill="#223142"/>
  <path d="M196 690H554L620 742V830H444V782H196V690Z" fill="#182431"/>
  <path d="M360 294L560 452L824 220V530H706V426L554 548L470 480V690H360V294Z" fill="url(#emerald)"/>
  <circle cx="290" cy="812" r="116" fill="#14A36F"/>
  <path d="M308 742V770C338 776 360 797 360 826C360 861 330 881 292 881C271 881 248 873 232 857L256 828C268 839 282 845 295 845C307 845 315 839 315 830C315 820 307 814 287 808C252 799 224 783 224 745C224 714 246 690 282 683V654H320V682C342 686 362 698 376 715L350 742C338 730 324 722 308 719C292 716 270 722 270 741C270 751 278 758 299 764C337 775 360 792 360 826" fill="#F7FAFC"/>
  <path d="M686 486H860L910 538V706" stroke="#223142" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M806 486V556H910" stroke="#223142" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M730 588H824" stroke="#2E7BFF" stroke-width="24" stroke-linecap="round"/>
  <circle cx="732" cy="640" r="14" fill="#223142"/>
  <circle cx="732" cy="688" r="14" fill="#223142"/>
  <path d="M772 640H894" stroke="#223142" stroke-width="24" stroke-linecap="round"/>
  <path d="M772 688H874" stroke="#223142" stroke-width="24" stroke-linecap="round"/>
  <path d="M584 912C716 894 818 844 916 720" stroke="#2E7BFF" stroke-width="28" stroke-linecap="round"/>
  <path d="M898 730L930 716L922 748" stroke="#2E7BFF" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M760 900H810V810H760V900Z" fill="#14A36F"/>
  <path d="M836 900H892V780H836V900Z" fill="#119665"/>
  <path d="M918 900H976V706H918V900Z" fill="#0F8F65"/>
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
