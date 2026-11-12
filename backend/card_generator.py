import io
import os
import math
from typing import Dict, Any, Optional
from PIL import Image, ImageDraw, ImageFont

def get_font(size: int, bold: bool = False):
    font_names = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "C:\\Windows\\Fonts\\segoeuib.ttf" if bold else "C:\\Windows\\Fonts\\segoeui.ttf",
        "C:\\Windows\\Fonts\\arialbd.ttf" if bold else "C:\\Windows\\Fonts\\arial.ttf",
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

def wrap_job_title(title: str, max_chars_per_line: int = 24):
    """
    Intelligently splits the job title so that:
    - Line 1 is displayed in crisp white
    - Line 2 (the key specialization/role) is displayed in bright electric mint green!
    """
    words = title.strip().split()
    if not words:
        return ["Remote Specialist", ""]
    
    if len(words) == 1:
        return [words[0], ""]

    if len(words) == 2:
        return [words[0], words[1]]

    # For 3 words, e.g. "Senior Frontend Developer" -> ["Senior Frontend", "Developer"]
    if len(words) == 3:
        return [f"{words[0]} {words[1]}", words[2]]

    # For 4 words, e.g. "Lead Cloud DevOps Engineer" -> ["Lead Cloud", "DevOps Engineer"]
    if len(words) == 4:
        return [f"{words[0]} {words[1]}", f"{words[2]} {words[3]}"]

    # For longer titles:
    mid = len(words) // 2
    l1 = " ".join(words[:mid])
    l2 = " ".join(words[mid:])
    if len(l2) > max_chars_per_line:
        l2 = l2[:max_chars_per_line - 3] + "..."
    return [l1, l2]

def generate_job_playcard(job: Dict[str, Any], width: int = 1080, height: int = 1080) -> bytes:
    """
    Generates EXACT replica of the user's reference flyer:
    1080x1080 Deep Emerald Canvas with Subtle Grid, GlobalHire AI header,
    Dual-Tone Title (White + Neon Mint), 2x2 Badges, Skill Tags,
    and Floating White CTA Card.
    """
    # 1. Base Canvas - Deep Emerald Black
    bg_color = (6, 22, 16)
    img = Image.new("RGBA", (width, height), bg_color)
    draw = ImageDraw.Draw(img)

    # 2. Ambient Glows (Top Right and Top Left)
    for r in range(480, 40, -30):
        alpha = int((1 - r / 480) * 45)
        draw.ellipse([width - r, -r // 2, width + r // 2, r], fill=(0, 223, 129, alpha))
    for r in range(350, 40, -30):
        alpha = int((1 - r / 350) * 20)
        draw.ellipse([-r // 3, -r // 3, r, r], fill=(0, 223, 129, alpha))

    # 3. Subtle Tech Grid Lines
    grid_spacing = 76
    grid_color = (0, 223, 129, 14)
    for x in range(0, width, grid_spacing):
        draw.line([(x, 0), (x, height)], fill=grid_color, width=1)
    for y in range(0, height, grid_spacing):
        draw.line([(0, y), (width, y)], fill=grid_color, width=1)

    pad_x = 76

    # 4. Header Section
    header_y = 68

    # 4a. Left: App Icon (Green squircle with black 'G')
    icon_size = 68
    icon_r = 20
    draw.rounded_rectangle(
        [pad_x - 3, header_y - 3, pad_x + icon_size + 3, header_y + icon_size + 3],
        radius=icon_r + 2,
        fill=(0, 223, 129, 60)
    )
    draw.rounded_rectangle(
        [pad_x, header_y, pad_x + icon_size, header_y + icon_size],
        radius=icon_r,
        fill=(0, 223, 129, 255)
    )
    font_g = get_font(42, bold=True)
    draw.text((pad_x + 18, header_y + 8), "G", fill=(8, 28, 18), font=font_g)

    # 4b. Brand Name: "GlobalHire"
    brand_x = pad_x + icon_size + 18
    font_brand = get_font(38, bold=True)
    draw.text((brand_x, header_y + 12), "GlobalHire", fill=(255, 255, 255), font=font_brand)

    # 4c. "AI" Badge Pill
    ai_badge_x = brand_x + 215
    ai_badge_y = header_y + 17
    draw.rounded_rectangle(
        [ai_badge_x, ai_badge_y, ai_badge_x + 44, ai_badge_y + 32],
        radius=10,
        fill=(12, 48, 32),
        outline=(0, 223, 129, 90),
        width=1
    )
    font_ai = get_font(18, bold=True)
    draw.text((ai_badge_x + 10, ai_badge_y + 5), "AI", fill=(0, 223, 129), font=font_ai)

    # 4d. Right: "• New Job Alert" Pill
    pill_w = 206
    pill_h = 48
    pill_x = width - pad_x - pill_w
    pill_y = header_y + 10
    draw.rounded_rectangle(
        [pill_x, pill_y, pill_x + pill_w, pill_y + pill_h],
        radius=24,
        fill=(16, 42, 32, 220),
        outline=(255, 255, 255, 28),
        width=1
    )
    # Bright green pulse dot
    draw.ellipse([pill_x + 18, pill_y + 19, pill_x + 30, pill_y + 31], fill=(0, 223, 129, 255))
    font_alert = get_font(18, bold=True)
    draw.text((pill_x + 38, pill_y + 12), "New Job Alert", fill=(225, 240, 232), font=font_alert)

    # 5. Eyebrow Tagline: "WE'RE HIRING  •  REMOTE"
    eyebrow_y = 225
    font_eyebrow = get_font(21, bold=True)
    draw.text((pad_x, eyebrow_y), "WE'RE HIRING  •  REMOTE", fill=(0, 223, 129), font=font_eyebrow)

    # 6. Main Job Title (Large Dual-Tone: Line 1 White, Line 2 Neon Mint)
    raw_title = str(job.get("title") or "Senior Frontend Developer")
    line1, line2 = wrap_job_title(raw_title)
    
    font_title = get_font(64, bold=True)
    title_y1 = eyebrow_y + 42
    draw.text((pad_x, title_y1), line1, fill=(255, 255, 255), font=font_title)
    
    if line2:
        title_y2 = title_y1 + 76
        draw.text((pad_x, title_y2), line2, fill=(0, 223, 129), font=font_title)
        comp_y = title_y2 + 88
    else:
        comp_y = title_y1 + 86

    # 7. Company Name: "at <Company Name>"
    company_name = str(job.get("company_name") or "Your Company Name")
    font_at = get_font(28, bold=False)
    font_company = get_font(28, bold=True)
    draw.text((pad_x, comp_y), "at ", fill=(165, 185, 175), font=font_at)
    draw.text((pad_x + 40, comp_y), company_name, fill=(255, 255, 255), font=font_company)

    # 8. Badges / Pills (2 Rows x 2 Columns)
    badge_row1_y = comp_y + 68
    badge_h = 60
    badge_radius = 18
    font_badge = get_font(21, bold=True)

    # Pill 1: Worldwide Remote (Bright Green filled button!)
    loc_text = f"🌍 {job.get('location') or 'Worldwide Remote'}"
    if len(loc_text) > 22 or "Worldwide" in loc_text:
        loc_text = "🌍 Worldwide Remote"
    
    b1_w = max(260, len(loc_text) * 13 + 40)
    draw.rounded_rectangle(
        [pad_x, badge_row1_y, pad_x + b1_w, badge_row1_y + badge_h],
        radius=badge_radius,
        fill=(0, 223, 129, 255)
    )
    draw.text((pad_x + 22, badge_row1_y + 16), loc_text, fill=(8, 28, 18), font=font_badge)

    # Pill 2: Job Type (Glassy dark)
    job_type = str(job.get("job_type") or "Full-time")
    b2_text = f"💼 {job_type}"
    b2_x = pad_x + b1_w + 16
    b2_w = 210
    draw.rounded_rectangle(
        [b2_x, badge_row1_y, b2_x + b2_w, badge_row1_y + badge_h],
        radius=badge_radius,
        fill=(18, 42, 32, 220),
        outline=(255, 255, 255, 28),
        width=1
    )
    draw.text((b2_x + 22, badge_row1_y + 16), b2_text, fill=(255, 255, 255), font=font_badge)

    # Row 2:
    badge_row2_y = badge_row1_y + badge_h + 16

    # Pill 3: Salary / Compensation
    salary_text = str(job.get("salary_range") or "")
    if not salary_text or "Competitive" in salary_text:
        salary_text = "$3,000 – $6,000 / mo"
    elif "/yr" in salary_text.lower() or "year" in salary_text.lower():
        salary_text = salary_text[:22]
    b3_text = f"💰 {salary_text}"
    b3_w = max(290, len(b3_text) * 12 + 45)
    draw.rounded_rectangle(
        [pad_x, badge_row2_y, pad_x + b3_w, badge_row2_y + badge_h],
        radius=badge_radius,
        fill=(18, 42, 32, 220),
        outline=(255, 255, 255, 28),
        width=1
    )
    draw.text((pad_x + 22, badge_row2_y + 16), b3_text, fill=(255, 255, 255), font=font_badge)

    # Pill 4: Visa Sponsored / Direct ATS
    b4_text = "✈️ Visa Sponsored"
    b4_x = pad_x + b3_w + 16
    b4_w = 250
    draw.rounded_rectangle(
        [b4_x, badge_row2_y, b4_x + b4_w, badge_row2_y + badge_h],
        radius=badge_radius,
        fill=(18, 42, 32, 220),
        outline=(255, 255, 255, 28),
        width=1
    )
    draw.text((b4_x + 22, badge_row2_y + 16), b4_text, fill=(255, 255, 255), font=font_badge)

    # 9. Real Skill Tags List (#React #TypeScript #Next.js #Tailwind)
    tags_y = badge_row2_y + badge_h + 30
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
        
    tags_str = "  ".join(clean_tags)
    font_tags = get_font(21, bold=True)
    draw.text((pad_x, tags_y), tags_str, fill=(160, 195, 178), font=font_tags)

    # 10. Bottom White Hero Card ("Apply directly, no middleman")
    card_y = height - 250
    card_w = width - (pad_x * 2)
    card_h = 135
    card_r = 34

    # Drop shadow under card
    draw.rounded_rectangle(
        [pad_x, card_y + 4, pad_x + card_w, card_y + card_h + 4],
        radius=card_r,
        fill=(0, 0, 0, 80)
    )
    # Pure White Card
    draw.rounded_rectangle(
        [pad_x, card_y, pad_x + card_w, card_y + card_h],
        radius=card_r,
        fill=(255, 255, 255, 255)
    )

    # Inside White Card - Left:
    draw.text(
        (pad_x + 38, card_y + 26), 
        "Apply directly, no middleman", 
        fill=(95, 110, 102), 
        font=get_font(18, bold=False)
    )
    draw.text(
        (pad_x + 38, card_y + 58), 
        "globalhireai.vercel.app", 
        fill=(14, 26, 20), 
        font=get_font(34, bold=True)
    )

    # Inside White Card - Right: Dark Button with Neon Green Text "Apply Now →"
    btn_w = 260
    btn_h = 74
    btn_x = pad_x + card_w - btn_w - 30
    btn_y = card_y + 30
    draw.rounded_rectangle(
        [btn_x, btn_y, btn_x + btn_w, btn_y + btn_h],
        radius=24,
        fill=(12, 28, 20)
    )
    btn_font = get_font(24, bold=True)
    draw.text((btn_x + 42, btn_y + 22), "Apply Now →", fill=(0, 223, 129), font=btn_font)

    # 11. Bottom Centered Footer Text
    footer_text = "Follow for daily remote & tech jobs from around the world"
    font_foot = get_font(17, bold=False)
    draw.text((pad_x + 120, height - 70), footer_text, fill=(100, 132, 118), font=font_foot)

    output = io.BytesIO()
    img.save(output, format="PNG", quality=95)
    return output.getvalue()
