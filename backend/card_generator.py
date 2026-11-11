import io
import os
import math
from typing import Dict, Any, Optional
from PIL import Image, ImageDraw, ImageFont

def get_font(size: int, bold: bool = False):
    """Load high-quality bold system fonts on Linux & Windows."""
    font_names = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "C:\\Windows\\Fonts\\arialbd.ttf" if bold else "C:\\Windows\\Fonts\\arial.ttf",
        "C:\\Windows\\Fonts\\segoeuib.ttf" if bold else "C:\\Windows\\Fonts\\segoeui.ttf",
        "arial.ttf"
    ]
    for fn in font_names:
        if os.path.exists(fn):
            try:
                return ImageFont.truetype(fn, size)
            except Exception:
                pass
    try:
        return ImageFont.load_default()
    except Exception:
        return None

def generate_job_playcard(job: Dict[str, Any], width: int = 1080, height: int = 1350) -> bytes:
    """
    Generates a high-converting, vibrant hiring flyer (4:5 Portrait 1080x1350)
    modeled after professional high-CTR recruitment posters.
    """
    img = Image.new("RGBA", (width, height), (248, 250, 252, 255))
    draw = ImageDraw.Draw(img)

    # 1. Top subtle sky gradient
    for y in range(0, 380):
        draw.line([(0, y), (width, y)], fill=(236, 246, 255, 255))

    # 2. Top "WE ARE HIRING!" 3D Pill Badge
    badge_w = 460
    badge_h = 75
    badge_x = (width - badge_w) // 2
    badge_y = 45

    # 3D shadow
    draw.rounded_rectangle(
        [badge_x + 5, badge_y + 8, badge_x + badge_w + 5, badge_y + badge_h + 8],
        radius=25, fill=(10, 45, 110, 100)
    )
    # Royal Blue Badge
    draw.rounded_rectangle(
        [badge_x, badge_y, badge_x + badge_w, badge_y + badge_h],
        radius=25, fill=(13, 82, 196, 255), outline=(255, 255, 255, 255), width=3
    )
    draw.text((badge_x + 70, badge_y + 12), "WE ARE HIRING!", fill=(255, 255, 255, 255), font=get_font(40, bold=True))

    # Red energetic burst rays
    draw.polygon([(badge_x + badge_w + 12, badge_y + 10), (badge_x + badge_w + 50, badge_y - 15), (badge_x + badge_w + 38, badge_y + 25)], fill=(225, 29, 72, 255))
    draw.polygon([(badge_x + badge_w + 22, badge_y + 35), (badge_x + badge_w + 65, badge_y + 30), (badge_x + badge_w + 42, badge_y + 55)], fill=(225, 29, 72, 255))

    # 3. Giant Sunny Yellow Hero Banner: "100% REMOTE WORK"
    hero_w = 900
    hero_h = 135
    hero_x = (width - hero_w) // 2
    hero_y = 145

    # 3D Shadow
    draw.rounded_rectangle(
        [hero_x + 8, hero_y + 12, hero_x + hero_w + 8, hero_y + hero_h + 12],
        radius=32, fill=(180, 120, 0, 160)
    )
    # Bright Yellow Banner
    draw.rounded_rectangle(
        [hero_x, hero_y, hero_x + hero_w, hero_y + hero_h],
        radius=32, fill=(255, 195, 0, 255), outline=(255, 255, 255, 255), width=4
    )
    draw.text((hero_x + 40, hero_y + 28), "100% REMOTE WORK", fill=(10, 30, 80, 255), font=get_font(70, bold=True))

    # 4. Company & Role Intro
    comp_name = str(job.get("company_name", "Global Enterprise")).upper()
    role_title = str(job.get("title", "Senior Software & AI Engineer"))

    intro_y = 310
    draw.text((hero_x + 20, intro_y), f"{comp_name} is actively looking for passionate & dedicated:", fill=(55, 65, 81, 255), font=get_font(26, bold=False))

    # Navy Role Card
    role_box_y = intro_y + 45
    draw.rounded_rectangle(
        [hero_x, role_box_y, hero_x + hero_w, role_box_y + 115],
        radius=26, fill=(10, 36, 85, 255), outline=(255, 195, 0, 255), width=3
    )
    title_short = role_title[:32]
    draw.text((hero_x + 35, role_box_y + 22), title_short, fill=(255, 255, 255, 255), font=get_font(42, bold=True))
    draw.text((hero_x + 35, role_box_y + 72), "Full International Benefits • Work From Home Worldwide", fill=(0, 223, 129, 255), font=get_font(22, bold=True))

    # 5. Red Ribbon: "★ JOB DETAILS & PERKS ★"
    ribbon_w = 520
    ribbon_h = 60
    ribbon_x = (width - ribbon_w) // 2
    ribbon_y = 495

    draw.rounded_rectangle(
        [ribbon_x, ribbon_y, ribbon_x + ribbon_w, ribbon_y + ribbon_h],
        radius=18, fill=(225, 29, 72, 255), outline=(255, 255, 255, 255), width=2
    )
    draw.text((ribbon_x + 65, ribbon_y + 14), "★ JOB DETAILS & PERKS ★", fill=(255, 255, 255, 255), font=get_font(26, bold=True))

    # 6. Vibrant 6-Capsule Grid (2 Columns x 3 Rows)
    grid_y = 580
    col_w = 435
    row_h = 85
    col1_x = hero_x
    col2_x = hero_x + col_w + 30

    salary_display = job.get("salary_range") or "$80k - $150k / yr"
    loc_display = str(job.get("location", "Worldwide Remote"))[:24]

    capsules = [
        ("Location: " + loc_display, "🌍 GLOBAL", (14, 116, 244, 255), (10, 80, 180, 255)),
        ("Salary: " + salary_display, "💰 HIGH PAY", (16, 185, 129, 255), (10, 130, 90, 255)),
        ("Role: " + str(job.get("category", "Software Dev"))[:20], "💻 TECH ROLE", (147, 51, 234, 255), (110, 30, 180, 255)),
        ("Visa: Sponsorship Radar", "✈️ VISA OK", (245, 158, 11, 255), (190, 110, 0, 255)),
        ("Type: " + str(job.get("job_type", "Full-Time")), "⚡ URGENT", (236, 72, 153, 255), (180, 40, 110, 255)),
        ("Eligibility: Open to All", "🎓 ZERO FEE", (13, 148, 136, 255), (10, 100, 90, 255)),
    ]

    for idx, (text, badge, bg_col, bdr_col) in enumerate(capsules):
        r = idx // 2
        c = idx % 2
        cx = col1_x if c == 0 else col2_x
        cy = grid_y + (r * (row_h + 18))

        draw.rounded_rectangle([cx, cy, cx + col_w, cy + row_h], radius=22, fill=bg_col, outline=bdr_col, width=2)
        # Inner white pill badge
        draw.rounded_rectangle([cx + 12, cy + 14, cx + 130, cy + row_h - 14], radius=14, fill=(255, 255, 255, 245))
        draw.text((cx + 18, cy + 22), badge, fill=bg_col, font=get_font(18, bold=True))
        # Main text
        draw.text((cx + 140, cy + 24), text[:23], fill=(255, 255, 255, 255), font=get_font(21, bold=True))

    # 7. "Interested Candidates" Callout Box
    box_y = 905
    box_h = 115
    draw.rounded_rectangle(
        [hero_x, box_y, hero_x + hero_w, box_y + box_h],
        radius=25, fill=(255, 251, 235, 255), outline=(245, 158, 11, 255), width=3
    )
    # Blue CV Icon Box
    draw.rounded_rectangle([hero_x + 20, box_y + 18, hero_x + 105, box_y + box_h - 18], radius=18, fill=(10, 36, 85, 255))
    draw.text((hero_x + 36, box_y + 35), "CV", fill=(255, 195, 0, 255), font=get_font(30, bold=True))

    draw.text((hero_x + 125, box_y + 22), "Direct Online Application • Zero Registration Fee", fill=(10, 36, 85, 255), font=get_font(25, bold=True))
    draw.text((hero_x + 125, box_y + 60), "Click 'Apply Now' below to submit your application directly!", fill=(180, 83, 9, 255), font=get_font(21, bold=False))

    # 8. Giant 3D Glowing "APPLY NOW" Button
    btn_w = 820
    btn_h = 95
    btn_x = (width - btn_w) // 2
    btn_y = 1045

    # 3D shadow
    draw.rounded_rectangle([btn_x + 6, btn_y + 10, btn_x + btn_w + 6, btn_y + btn_h + 10], radius=30, fill=(0, 100, 50, 120))
    # Glowing Green Button
    draw.rounded_rectangle([btn_x, btn_y, btn_x + btn_w, btn_y + btn_h], radius=30, fill=(0, 200, 100, 255), outline=(255, 255, 255, 255), width=3)
    draw.text((btn_x + 85, btn_y + 20), "👉 APPLY NOW  —  GLOBALHIRE AI ↗", fill=(10, 36, 27, 255), font=get_font(38, bold=True))

    # 9. Bottom Royal Navy Wave Footer
    foot_y = 1170
    draw.rectangle([0, foot_y, width, height], fill=(10, 36, 85, 255))
    draw.line([(0, foot_y), (width, foot_y)], fill=(255, 195, 0, 255), width=6)

    draw.text((hero_x, foot_y + 35), "📍 OFFICIAL WORLDWIDE RADAR:", fill=(255, 195, 0, 255), font=get_font(24, bold=True))
    draw.text((hero_x, foot_y + 80), "GLOBALHIRE AI — https://globalhireai.vercel.app", fill=(255, 255, 255, 255), font=get_font(34, bold=True))

    output = io.BytesIO()
    img.save(output, format="PNG", quality=95)
    return output.getvalue()
