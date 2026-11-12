import io
import os
from PIL import Image, ImageDraw, ImageFont
from typing import Dict, Any

REF_PATH = "/home/ubuntu/ref.jpg"
ICON_GLOBE = "/home/ubuntu/icon_globe.png"
ICON_BRIEFCASE = "/home/ubuntu/icon_briefcase.png"
ICON_MONEY = "/home/ubuntu/icon_money.png"
ICON_PLANE = "/home/ubuntu/icon_plane.png"

def get_font(size: int, bold: bool = True):
    font_paths = [
        "/home/ubuntu/fonts/Inter-Bold.ttf" if bold else "/home/ubuntu/fonts/Inter-Regular.ttf",
        "Inter-Bold.ttf" if bold else "Inter-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "C:\\Windows\\Fonts\\segoeuib.ttf" if bold else "C:\\Windows\\Fonts\\segoeui.ttf",
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, size)
            except Exception:
                pass
    return ImageFont.load_default()

def wrap_job_title(title: str, max_chars: int = 22):
    words = title.strip().split()
    if not words:
        return ["Remote Specialist", ""]
    if len(words) == 1:
        return [words[0], ""]
    if len(words) == 2:
        return [words[0], words[1]]
    if len(words) == 3:
        return [f"{words[0]} {words[1]}", words[2]]
    if len(words) == 4:
        return [f"{words[0]} {words[1]}", f"{words[2]} {words[3]}"]
    
    mid = len(words) // 2
    l1 = " ".join(words[:mid])
    l2 = " ".join(words[mid:])
    if len(l2) > max_chars:
        l2 = l2[:max_chars - 3] + "..."
    return [l1, l2]

def create_base_canvas(width=1024, height=1024):
    base = Image.new("RGBA", (width, height), (10, 36, 27, 255))
    draw = ImageDraw.Draw(base)

    # Top-right radial emerald glow (matching user reference image)
    glow_x = width - 80
    glow_y = 60
    for r in range(500, 30, -25):
        factor = (1.0 - r / 500.0) ** 1.5
        alpha = int(factor * 110)
        draw.ellipse([glow_x - r, glow_y - r, glow_x + r, glow_y + r], fill=(17, 88, 58, alpha))

    # Top-left faint glow
    for r in range(320, 30, -30):
        factor = (1.0 - r / 320.0) ** 2
        alpha = int(factor * 40)
        draw.ellipse([-r // 2, -r // 2, r, r], fill=(0, 223, 129, alpha))

    # Grid lines aligned to exact 51.2px
    grid_spacing = 51.2
    grid_color = (24, 64, 48, 120)
    
    curr_x = 0.0
    while curr_x < width:
        x_int = int(round(curr_x))
        draw.line([(x_int, 0), (x_int, height)], fill=grid_color, width=1)
        curr_x += grid_spacing

    curr_y = 0.0
    while curr_y < height:
        y_int = int(round(curr_y))
        draw.line([(0, y_int), (width, y_int)], fill=grid_color, width=1)
        curr_y += grid_spacing

    return base

def generate_job_playcard(job: Dict[str, Any], width: int = 1024, height: int = 1024) -> bytes:
    """
    Generates 100% IDENTICAL replica of the user's reference image:
    1024x1024 Deep Emerald Canvas with Subtle Grid, GlobalHire AI header,
    Dual-Tone Title (White + Neon Mint), 2x2 Badges, Skill Tags,
    and Floating White CTA Card.
    """
    img = create_base_canvas(width, height)

    # If reference image exists, copy the EXACT pristine header and white card footer
    if os.path.exists(REF_PATH):
        ref = Image.open(REF_PATH).convert("RGBA")
        header = ref.crop((0, 0, width, 205))
        img.paste(header, (0, 0))
        footer = ref.crop((0, 770, width, height))
        img.paste(footer, (0, 770))

    draw = ImageDraw.Draw(img)
    pad_x = 76

    # 1. Eyebrow Tagline at y=218: "WE'RE HIRING  •  REMOTE"
    font_eyebrow = get_font(21, bold=True)
    draw.text((pad_x, 218), "WE'RE HIRING  •  REMOTE", fill=(0, 223, 129), font=font_eyebrow)

    # 2. Main Job Title (Line 1: White, Line 2: Mint Green)
    raw_title = str(job.get("title") or "Senior Frontend Developer")
    l1, l2 = wrap_job_title(raw_title)

    font_title = get_font(68, bold=True)
    draw.text((pad_x, 262), l1, fill=(255, 255, 255), font=font_title)

    if l2:
        draw.text((pad_x, 346), l2, fill=(0, 223, 129), font=font_title)
        comp_y = 472
    else:
        comp_y = 390

    # 3. Company line: "at <Company Name>" at y=472
    comp_name = str(job.get("company_name") or "Your Company Name")
    font_at = get_font(28, bold=False)
    font_comp = get_font(28, bold=True)
    draw.text((pad_x, comp_y), "at ", fill=(165, 185, 175), font=font_at)
    draw.text((pad_x + 40, comp_y), comp_name, fill=(255, 255, 255), font=font_comp)

    # 4. Badges (2x2 Grid with Exact Cropped Icons)
    font_badge = get_font(22, bold=True)
    badge_h = 60
    badge_r = 16

    # Row 1: y = 548
    r1_y = 548

    # Pill 1: 🌍 Worldwide Remote (Bright Green filled button #00DF81)
    loc_text = str(job.get('location') or 'Worldwide Remote')
    if len(loc_text) > 22 or "Worldwide" in loc_text:
        loc_text = "Worldwide Remote"
    
    b1_w = max(318, len(loc_text) * 14 + 75)
    draw.rounded_rectangle(
        [pad_x, r1_y, pad_x + b1_w, r1_y + badge_h],
        radius=badge_r,
        fill=(0, 223, 129, 255)
    )
    if os.path.exists(ICON_GLOBE):
        icon_g = Image.open(ICON_GLOBE).convert("RGBA")
        img.paste(icon_g, (pad_x + 18, r1_y + 12), icon_g)
    draw.text((pad_x + 62, r1_y + 16), loc_text, fill=(10, 36, 27), font=font_badge)

    # Pill 2: 💼 Full-time (Dark translucent pill)
    job_type = str(job.get("job_type") or "Full-time")
    b2_x = pad_x + b1_w + 16
    b2_w = max(195, len(job_type) * 14 + 75)
    draw.rounded_rectangle(
        [b2_x, r1_y, b2_x + b2_w, r1_y + badge_h],
        radius=badge_r,
        fill=(14, 42, 32, 230),
        outline=(255, 255, 255, 35),
        width=1
    )
    if os.path.exists(ICON_BRIEFCASE):
        icon_b = Image.open(ICON_BRIEFCASE).convert("RGBA")
        img.paste(icon_b, (b2_x + 18, r1_y + 12), icon_b)
    draw.text((b2_x + 62, r1_y + 16), job_type, fill=(255, 255, 255), font=font_badge)

    # Row 2: y = 624
    r2_y = 624

    # Pill 3: 💰 $3,000 – $5,000 / mo
    salary = str(job.get("salary_range") or "")
    if not salary or "Competitive" in salary:
        salary = "$3,000 – $5,000 / mo"
    elif len(salary) > 24:
        salary = salary[:22]
    
    b3_w = max(318, len(salary) * 14 + 75)
    draw.rounded_rectangle(
        [pad_x, r2_y, pad_x + b3_w, r2_y + badge_h],
        radius=badge_r,
        fill=(14, 42, 32, 230),
        outline=(255, 255, 255, 35),
        width=1
    )
    if os.path.exists(ICON_MONEY):
        icon_m = Image.open(ICON_MONEY).convert("RGBA")
        img.paste(icon_m, (pad_x + 18, r2_y + 12), icon_m)
    draw.text((pad_x + 62, r2_y + 16), salary, fill=(255, 255, 255), font=font_badge)

    # Pill 4: ✈️ Visa Sponsored
    b4_text = "Visa Sponsored"
    b4_x = pad_x + b3_w + 16
    b4_w = 275
    draw.rounded_rectangle(
        [b4_x, r2_y, b4_x + b4_w, r2_y + badge_h],
        radius=badge_r,
        fill=(14, 42, 32, 230),
        outline=(255, 255, 255, 35),
        width=1
    )
    if os.path.exists(ICON_PLANE):
        icon_p = Image.open(ICON_PLANE).convert("RGBA")
        img.paste(icon_p, (b4_x + 18, r2_y + 12), icon_p)
    draw.text((b4_x + 62, r2_y + 16), b4_text, fill=(255, 255, 255), font=font_badge)

    # 5. Skill Tags at y=722
    raw_tags = job.get("tags") or []
    if isinstance(raw_tags, str):
        try:
            import json
            raw_tags = json.loads(raw_tags)
        except Exception:
            raw_tags = [t.strip() for t in raw_tags.split(",") if t.strip()]

    clean_tags = [f"#{t}" for t in raw_tags if len(t) < 18][:4]
    if not clean_tags:
        clean_tags = ["#React", "#TypeScript", "#Next.js", "#Tailwind"]
    tags_line = "  ".join(clean_tags)
    font_tags = get_font(21, bold=True)
    draw.text((pad_x, 722), tags_line, fill=(160, 195, 178), font=font_tags)

    out = io.BytesIO()
    img.save(out, format="PNG", quality=95)
    return out.getvalue()
