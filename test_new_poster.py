import io
import os
from PIL import Image, ImageDraw, ImageFont

def get_font(size: int, bold: bool = False):
    font_names = [
        "C:\\Windows\\Fonts\\arialbd.ttf" if bold else "C:\\Windows\\Fonts\\arial.ttf",
        "C:\\Windows\\Fonts\\segoeuib.ttf" if bold else "C:\\Windows\\Fonts\\segoeui.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
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

def draw_poster(job, width=1080, height=1350):
    # Standard Instagram/Facebook 4:5 Portrait format (1080 x 1350) - maximum feed engagement!
    img = Image.new("RGBA", (width, height), (248, 250, 252, 255))
    draw = ImageDraw.Draw(img)

    # 1. Subtle Background Elements
    # Top subtle sky gradient / soft warm lighting
    for y in range(0, 400):
        alpha = int(255 - (y / 400.0) * 40)
        draw.line([(0, y), (width, y)], fill=(238, 246, 255, 255))

    # 2. Top "We Are Hiring!" 3D Badge (Like the Allied School poster!)
    # Blue top capsule badge: "We Are"
    top_badge_w = 420
    top_badge_h = 75
    top_badge_x = (width - top_badge_w) // 2
    top_badge_y = 50

    # Blue badge shadow
    draw.rounded_rectangle(
        [top_badge_x + 5, top_badge_y + 8, top_badge_x + top_badge_w + 5, top_badge_y + top_badge_h + 8],
        radius=25, fill=(10, 45, 110, 100)
    )
    # Blue badge
    draw.rounded_rectangle(
        [top_badge_x, top_badge_y, top_badge_x + top_badge_w, top_badge_y + top_badge_h],
        radius=25, fill=(13, 82, 196, 255), outline=(255, 255, 255, 255), width=3
    )
    draw.text((top_badge_x + 65, top_badge_y + 12), "WE ARE HIRING!", fill=(255, 255, 255, 255), font=get_font(38, bold=True))

    # Red energetic burst rays on sides of badge
    draw.polygon([(top_badge_x + top_badge_w + 15, top_badge_y + 10), (top_badge_x + top_badge_w + 50, top_badge_y - 15), (top_badge_x + top_badge_w + 40, top_badge_y + 25)], fill=(225, 29, 72, 255))
    draw.polygon([(top_badge_x + top_badge_w + 25, top_badge_y + 35), (top_badge_x + top_badge_w + 65, top_badge_y + 30), (top_badge_x + top_badge_w + 45, top_badge_y + 55)], fill=(225, 29, 72, 255))

    # Giant Yellow Banner: "GLOBAL REMOTE OPPORTUNITY"
    hero_w = 880
    hero_h = 130
    hero_x = (width - hero_w) // 2
    hero_y = 150

    # 3D shadow for yellow banner
    draw.rounded_rectangle(
        [hero_x + 8, hero_y + 12, hero_x + hero_w + 8, hero_y + hero_h + 12],
        radius=30, fill=(180, 120, 0, 160)
    )
    # Bright Yellow Banner
    draw.rounded_rectangle(
        [hero_x, hero_y, hero_x + hero_w, hero_y + hero_h],
        radius=30, fill=(255, 195, 0, 255), outline=(255, 255, 255, 255), width=4
    )
    draw.text((hero_x + 45, hero_y + 28), "100% REMOTE WORK", fill=(10, 30, 80, 255), font=get_font(68, bold=True))

    # 3. Company & Role Section
    comp_name = str(job.get("company_name", "Global Enterprise")).upper()
    role_title = str(job.get("title", "Senior Software & AI Engineer"))

    intro_y = 310
    draw.text((hero_x + 30, intro_y), f"{comp_name} is actively looking for passionate & dedicated", fill=(45, 60, 75, 255), font=get_font(26, bold=False))

    # Highlighted Role Box (Navy with white text)
    role_box_y = intro_y + 45
    draw.rounded_rectangle(
        [hero_x, role_box_y, hero_x + hero_w, role_box_y + 110],
        radius=25, fill=(10, 36, 85, 255), outline=(255, 195, 0, 255), width=3
    )
    # Title (wrap if long)
    title_short = role_title[:32]
    draw.text((hero_x + 35, role_box_y + 22), title_short, fill=(255, 255, 255, 255), font=get_font(42, bold=True))
    draw.text((hero_x + 35, role_box_y + 68), "Full International Benefits • Work From Home Worldwide", fill=(0, 223, 129, 255), font=get_font(22, bold=True))

    # 4. Red Ribbon: "REQUIRED & OFFERED:"
    ribbon_w = 480
    ribbon_h = 60
    ribbon_x = (width - ribbon_w) // 2
    ribbon_y = 490

    draw.rounded_rectangle(
        [ribbon_x, ribbon_y, ribbon_x + ribbon_w, ribbon_y + ribbon_h],
        radius=18, fill=(225, 29, 72, 255), outline=(255, 255, 255, 255), width=2
    )
    draw.text((ribbon_x + 65, ribbon_y + 12), "★ JOB DETAILS & PERKS ★", fill=(255, 255, 255, 255), font=get_font(26, bold=True))

    # 5. Colorful 6-Capsule Grid (2 Columns x 3 Rows) like the Allied School poster!
    grid_y = 575
    col_w = 425
    row_h = 85
    col1_x = hero_x
    col2_x = hero_x + col_w + 30

    capsules = [
        # (title, icon_label, bg_color, border_color)
        ("Location: Worldwide Remote", "🌍 GLOBAL", (14, 116, 244, 255), (10, 80, 180, 255)),
        ("Salary: " + (job.get("salary_range") or "$80k - $140k / yr"), "💰 HIGH PAY", (16, 185, 129, 255), (10, 130, 90, 255)),
        ("Category: " + str(job.get("category", "Tech & AI")), "💻 TECH ROLE", (147, 51, 234, 255), (110, 30, 180, 255)),
        ("Visa: Sponsorship Radar", "✈️ VISA OK", (245, 158, 11, 255), (190, 110, 0, 255)),
        ("Type: " + str(job.get("job_type", "Full-Time")), "⚡ URGENT", (236, 72, 153, 255), (180, 40, 110, 255)),
        ("Experience: Freshers & Exp", "🎓 ZERO FEE", (13, 148, 136, 255), (10, 100, 90, 255)),
    ]

    for idx, (text, badge, bg_col, bdr_col) in enumerate(capsules):
        r = idx // 2
        c = idx % 2
        cx = col1_x if c == 0 else col2_x
        cy = grid_y + (r * (row_h + 18))

        # Pill container
        draw.rounded_rectangle([cx, cy, cx + col_w, cy + row_h], radius=22, fill=bg_col, outline=bdr_col, width=2)
        # Inner white pill badge
        draw.rounded_rectangle([cx + 12, cy + 14, cx + 130, cy + row_h - 14], radius=14, fill=(255, 255, 255, 240))
        draw.text((cx + 20, cy + 22), badge, fill=bg_col, font=get_font(18, bold=True))
        # Main text
        draw.text((cx + 140, cy + 24), text[:24], fill=(255, 255, 255, 255), font=get_font(21, bold=True))

    # 6. "Interested Candidates" Callout Box (Like Allied School poster)
    box_y = 905
    box_h = 115
    draw.rounded_rectangle(
        [hero_x, box_y, hero_x + hero_w, box_y + box_h],
        radius=25, fill=(255, 251, 235, 255), outline=(245, 158, 11, 255), width=3
    )
    # Blue CV Icon Box
    draw.rounded_rectangle([hero_x + 20, box_y + 18, hero_x + 105, box_y + box_h - 18], radius=18, fill=(10, 36, 85, 255))
    draw.text((hero_x + 36, box_y + 35), "CV", fill=(255, 195, 0, 255), font=get_font(30, bold=True))

    # Callout text
    draw.text((hero_x + 125, box_y + 22), "Direct Online Application • Zero Registration Fee", fill=(10, 36, 85, 255), font=get_font(25, bold=True))
    draw.text((hero_x + 125, box_y + 60), "Click 'Apply Now' below to submit your profile directly!", fill=(180, 83, 9, 255), font=get_font(21, bold=False))

    # 7. Giant 3D "APPLY NOW" Button
    btn_w = 780
    btn_h = 95
    btn_x = (width - btn_w) // 2
    btn_y = 1045

    # Button 3D shadow
    draw.rounded_rectangle([btn_x + 6, btn_y + 10, btn_x + btn_w + 6, btn_y + btn_h + 10], radius=30, fill=(0, 100, 50, 120))
    # Glowing Green Button
    draw.rounded_rectangle([btn_x, btn_y, btn_x + btn_w, btn_y + btn_h], radius=30, fill=(0, 200, 100, 255), outline=(255, 255, 255, 255), width=3)
    draw.text((btn_x + 95, btn_y + 20), "👉 APPLY NOW  —  GLOBALHIRE AI ↗", fill=(10, 36, 27, 255), font=get_font(36, bold=True))

    # 8. Bottom Royal Navy Wave Footer
    foot_y = 1170
    draw.rectangle([0, foot_y, width, height], fill=(10, 36, 85, 255))
    # Golden top border line
    draw.line([(0, foot_y), (width, foot_y)], fill=(255, 195, 0, 255), width=6)

    draw.text((hero_x, foot_y + 35), "📍 OFFICIAL WORLDWIDE RADAR:", fill=(255, 195, 0, 255), font=get_font(24, bold=True))
    draw.text((hero_x, foot_y + 80), "GLOBALHIRE AI — https://globalhireai.vercel.app", fill=(255, 255, 255, 255), font=get_font(34, bold=True))

    output = io.BytesIO()
    img.save("test_flyer.png", format="PNG", quality=95)
    print("Saved test_flyer.png successfully!")

draw_poster({
    "company_name": "Tech Corp Worldwide",
    "title": "Senior Python & AI Engineer",
    "location": "Worldwide Remote",
    "salary_range": "$90,000 - $160,000 / yr",
    "category": "Software Dev",
    "job_type": "Remote"
})

