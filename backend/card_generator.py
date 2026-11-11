import io
import os
import math
from typing import Dict, Any, Optional
from PIL import Image, ImageDraw, ImageFont

def get_font(size: int, bold: bool = False):
    """Try to load system fonts or fallback to default."""
    font_names = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
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

def wrap_text(text: str, max_chars: int = 28) -> list:
    words = text.split()
    lines = []
    curr = []
    curr_len = 0
    for w in words:
        if curr_len + len(w) + 1 <= max_chars:
            curr.append(w)
            curr_len += len(w) + 1
        else:
            if curr:
                lines.append(" ".join(curr))
            curr = [w]
            curr_len = len(w)
    if curr:
        lines.append(" ".join(curr))
    return lines[:3] # max 3 lines

def generate_job_playcard(job: Dict[str, Any], width: int = 1080, height: int = 1080) -> bytes:
    """Generates an ultra-crisp 1080x1080 Facebook social playcard for a job."""
    img = Image.new("RGBA", (width, height), (10, 36, 27, 255)) # Forest obsidian #0A241B
    draw = ImageDraw.Draw(img)

    # 1. Background radial gradient / glow circles
    for r in range(400, 100, -20):
        alpha = int(35 * (1 - r / 400))
        draw.ellipse([width - r, -r // 2, width + r, r // 2 + 200], fill=(0, 223, 129, alpha))
        draw.ellipse([-r // 2, height - r, r, height + r // 2], fill=(16, 185, 129, alpha))

    # 2. Central White Glass Container
    pad_x = 60
    pad_y = 60
    card_w = width - (pad_x * 2)
    card_h = height - (pad_y * 2)
    
    # Outer Card
    draw.rounded_rectangle(
        [pad_x, pad_y, pad_x + card_w, pad_y + card_h],
        radius=40,
        fill=(245, 247, 243, 255), # Cream white #F5F7F3
        outline=(255, 255, 255, 80),
        width=2
    )

    # 3. Top Header inside card
    font_brand = get_font(36, bold=True)
    font_sub = get_font(20, bold=False)
    
    # Brand Pill
    pill_x = pad_x + 50
    pill_y = pad_y + 45
    draw.rounded_rectangle([pill_x, pill_y, pill_x + 280, pill_y + 55], radius=28, fill=(10, 36, 27, 255))
    draw.text((pill_x + 24, pill_y + 12), "GLOBALHIRE AI", fill=(0, 223, 129, 255), font=get_font(22, bold=True))

    # Verified Hot Opening Pill
    draw.rounded_rectangle([pad_x + card_w - 240, pill_y, pad_x + card_w - 50, pill_y + 55], radius=28, fill=(227, 249, 237, 255), outline=(188, 232, 211, 255))
    draw.text((pad_x + card_w - 220, pill_y + 14), "VERIFIED ROLE", fill=(10, 87, 52, 255), font=get_font(18, bold=True))

    # 4. Company Name & Category
    company = str(job.get("company_name", "Leading Tech Enterprise")).upper()
    category = str(job.get("category", "Software Dev")).upper()
    
    text_y = pad_y + 150
    draw.text((pad_x + 50, text_y), f"{company}  •  {category}", fill=(108, 122, 114, 255), font=get_font(24, bold=True))

    # 5. Job Title (Big, bold, wrapped)
    title = str(job.get("title", "Senior Software Engineer"))
    title_lines = wrap_text(title, max_chars=22)
    font_title = get_font(56, bold=True)
    
    title_y = text_y + 55
    for line in title_lines:
        draw.text((pad_x + 50, title_y), line, fill=(23, 38, 31, 255), font=font_title)
        title_y += 75

    # 6. Badges Grid: Location, Job Type, Salary
    badge_y = max(title_y + 40, pad_y + 460)
    
    # Location Badge
    loc = str(job.get("location", "Worldwide Remote"))[:28]
    draw.rounded_rectangle([pad_x + 50, badge_y, pad_x + 400, badge_y + 65], radius=20, fill=(244, 246, 242, 255), outline=(0, 0, 0, 15))
    draw.text((pad_x + 75, badge_y + 18), f"Location: {loc}", fill=(40, 55, 45, 255), font=get_font(22, bold=True))

    # Job Type Badge
    jtype = str(job.get("job_type", "Remote"))
    draw.rounded_rectangle([pad_x + 420, badge_y, pad_x + 680, badge_y + 65], radius=20, fill=(244, 246, 242, 255), outline=(0, 0, 0, 15))
    draw.text((pad_x + 445, badge_y + 18), f"Type: {jtype}", fill=(40, 55, 45, 255), font=get_font(22, bold=True))

    # Salary Badge (Green highlight card)
    sal = job.get("salary_range") or "$100,000 - $150,000 / yr"
    sal_y = badge_y + 90
    draw.rounded_rectangle([pad_x + 50, sal_y, pad_x + card_w - 50, sal_y + 80], radius=24, fill=(215, 245, 229, 255), outline=(188, 232, 211, 255), width=2)
    draw.text((pad_x + 80, sal_y + 22), f"Compensation:  {sal}", fill=(8, 77, 46, 255), font=get_font(28, bold=True))

    # 7. Skills / Tags Row
    tags = job.get("tags") or ["Python", "React", "AI/ML", "Worldwide"]
    if isinstance(tags, str):
        import json
        try:
            tags = json.loads(tags)
        except Exception:
            tags = tags.split(",")
    
    tag_y = sal_y + 115
    tag_x = pad_x + 50
    for t in tags[:4]:
        tag_str = f"#{str(t).strip()}"
        t_w = len(tag_str) * 14 + 30
        if tag_x + t_w > pad_x + card_w - 50:
            break
        draw.rounded_rectangle([tag_x, tag_y, tag_x + t_w, tag_y + 50], radius=16, fill=(244, 246, 242, 255))
        draw.text((tag_x + 16, tag_y + 12), tag_str, fill=(87, 104, 94, 255), font=get_font(20, bold=True))
        tag_x += t_w + 15

    # 8. Bottom CTA Banner inside card
    bot_y = pad_y + card_h - 130
    draw.rounded_rectangle([pad_x + 50, bot_y, pad_x + card_w - 50, bot_y + 85], radius=26, fill=(10, 36, 27, 255))
    draw.text((pad_x + 85, bot_y + 26), "APPLY ONLINE NOW  —  GLOBALHIREAI.VERCEL.APP", fill=(255, 255, 255, 255), font=get_font(23, bold=True))
    draw.text((pad_x + card_w - 180, bot_y + 24), "APPLY ↗", fill=(0, 223, 129, 255), font=get_font(26, bold=True))

    output = io.BytesIO()
    img.save(output, format="PNG", quality=95)
    return output.getvalue()

