from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "build" / "icons"
PNG_PATH = ICON_DIR / "app-icon.png"
ICO_PATH = ICON_DIR / "app-icon.ico"

SIZE = 1024
FONT_PATHS = [
    Path("C:/Windows/Fonts/georgiab.ttf"),
    Path("C:/Windows/Fonts/timesbd.ttf"),
    Path("C:/Windows/Fonts/segoeuib.ttf"),
]


def load_font(size: int) -> ImageFont.FreeTypeFont:
    for font_path in FONT_PATHS:
        if font_path.exists():
            return ImageFont.truetype(str(font_path), size=size)
    raise FileNotFoundError("No compatible font found for icon generation.")


def make_gradient(width: int, height: int) -> Image.Image:
    stops = [
        (0.00, (248, 231, 162, 255)),
        (0.34, (229, 197, 101, 255)),
        (0.68, (201, 151, 46, 255)),
        (1.00, (138, 97, 18, 255)),
    ]
    gradient = Image.new("RGBA", (width, height))
    px = gradient.load()

    for y in range(height):
        for x in range(width):
            t = ((x / max(width - 1, 1)) + (y / max(height - 1, 1))) / 2
            for index in range(len(stops) - 1):
                start, start_color = stops[index]
                end, end_color = stops[index + 1]
                if t <= end:
                    local_t = 0 if end == start else (t - start) / (end - start)
                    color = tuple(
                        round(start_color[channel] + (end_color[channel] - start_color[channel]) * local_t)
                        for channel in range(4)
                    )
                    px[x, y] = color
                    break
            else:
                px[x, y] = stops[-1][1]

    return gradient


def build_icon() -> Image.Image:
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    font = load_font(470)

    text = "LM"
    measure = ImageDraw.Draw(canvas)
    bbox = measure.textbbox((0, 0), text, font=font, spacing=-34)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_x = (SIZE - text_width) / 2 - bbox[0]
    text_y = (SIZE - text_height) / 2 - bbox[1] - 12

    mask = Image.new("L", (SIZE, SIZE), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.text((text_x, text_y), text, font=font, fill=255, spacing=-34)

    glow = mask.filter(ImageFilter.GaussianBlur(18))
    glow_rgba = Image.new("RGBA", (SIZE, SIZE), (214, 173, 73, 0))
    glow_rgba.putalpha(glow.point(lambda value: min(255, int(value * 0.36))))
    canvas.alpha_composite(glow_rgba)

    gradient = make_gradient(SIZE, SIZE)
    letters = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    letters.paste(gradient, (0, 0), mask)
    canvas.alpha_composite(letters)

    return canvas


def save_outputs(image: Image.Image) -> None:
    ICON_DIR.mkdir(parents=True, exist_ok=True)
    image.save(PNG_PATH)
    image.save(
        ICO_PATH,
        format="ICO",
        sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)],
    )


def main() -> None:
    icon = build_icon()
    save_outputs(icon)
    print(f"Generated {PNG_PATH}")
    print(f"Generated {ICO_PATH}")


if __name__ == "__main__":
    main()
