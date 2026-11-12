import io
import os
import math
from typing import Dict, Any, Optional
from PIL import Image, ImageDraw, ImageFont

# High-converting category luxury themes
THEMES = {
    "Software Dev": {
        "bg": (8, 18, 14),                # Deep Dark Forest
        "accent": (0, 223, 129),          # Electric Mint
        "accent_text": (6, 28, 18),
        "card_bg": (16, 30, 24),
        "card_border": (0, 223, 129, 120),
        "glow": (0, 223, 129, 35),
        "tag_bg": (22, 42, 34),
        "tag_border": (0, 223, 129, 60),
        "badge": "💻 TECH & ENGINEERING",
        "tagline": "GLOBAL REMOTE TECH ROLE"
    },
    "AI / Data": {
        "bg": (12, 10, 26),               # Deep Cyber Violet
        "accent": (168, 85, 247),         # Electric Violet
        "accent_text": (24, 8, 48),
        "card_bg": (22, 18, 42),
        "card_border": (168, 85, 247, 120),
        "glow": (147, 51, 234, 40),
        "tag_bg": (32, 26, 58),
        "tag_border": (168, 85, 247, 60),
        "badge": "🧠 AI & DATA INTELLIGENCE",
        "tagline": "WORLDWIDE AI / ML OPENING"
    },
    "Design": {
        "bg": (22, 10, 16),               # Deep Rose/Onyx
        "accent": (251, 113, 133),        # Sunset Coral Rose
        "accent_text": (48, 10, 22),
        "card_bg": (34, 18, 26),
        "card_border": (251, 113, 133, 120),
        "glow": (244, 63, 94, 40),
        "tag_bg": (48, 26, 36),
        "tag_border": (251, 113, 133, 60),
        "badge": "🎨 PRODUCT DESIGN & UX",
        "tagline": "CREATIVE REMOTE VACANCY"
    },
    "Marketing": {
        "bg": (10, 16, 26),               # Deep Executive Navy
        "accent": (245, 158, 11),         # Radiant Amber Gold
        "accent_text": (44, 24, 4),
        "card_bg": (18, 26, 42),
        "card_border": (245, 158, 11, 120),
        "glow": (217, 119, 6, 40),
        "tag_bg": (28, 38, 58),
        "tag_border": (245, 158, 11, 60),
        "badge": "📈 GROWTH & MARKETING",
        "tagline": "HIGH-IMPACT REMOTE ROLE"
    },
    "DevOps / Cloud": {
        "bg": (6, 18, 26),                # Deep Cyber Cyan
        "accent": (6, 182, 212),          # Neon Cyan
        "accent_text": (6, 32, 42),
        "card_bg": (14, 30, 42),
        "card_border": (6, 182, 212, 120),
        "glow": (14, 165, 233, 40),
        "tag_bg": (22, 42, 56),
        "tag_border": (6, 182, 212, 60),
        "badge": "☁️ CLOUD & INFRASTRUCTURE",
        "tagline": "DEVSECOPS REMOTE OPENING"
    },
    "Customer Support": {
        "bg": (10, 20, 20),               # Deep Emerald Teal
        "accent": (20, 184, 166),         # Bright Mint Teal
        "accent_text": (8, 36, 32),
        "card_bg": (18, 34, 34),
        "card_border": (20, 184, 166, 120),
        "glow": (13, 148, 136, 40),
        "tag_bg": (26, 46, 46),
        "tag_border": (20, 184, 166, 60),
        "badge": "🎧 CLIENT SUCCESS & SUPPORT",
        "tagline": "WORLDWIDE CUSTOMER EXPERIENCE"
    },
    "default": {
        "bg": (10, 16, 20),               # Sleek Dark Onyx
        "accent": (0, 223, 129),          # Electric Mint
        "accent_text": (6, 28, 18),
        "card_bg": (18, 28, 34),
        "card_border": (0, 223, 129, 120),
        "glow": (0, 223, 129, 35),
        "tag_bg": (26, 38, 46),
        "tag_border": (0, 223, 129, 60),
        "badge": "🌍 WORLDWIDE REMOTE ROLE",
        "tagline": "CURATED INTERNATIONAL OPENING"
    }
}

def get_font(size: int, bold: bool = False):
    """Load clean bold fonts across Linux & Windows environments."""
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

def wrap_text(text: str, max_chars_per_line: int = 30, max_lines: int = 2) -> list:
    """Wraps title cleanly without cutting words."""
    words = text.split()
    lines = []
    current_line = []
    
    for word in words:
        test_line = " ".join(current_line + [word])
        if len(test_line) <= max_chars_per_line:
            current_line.append(word)
        else:
            if current_line:
                lines.append(" ".join(current_line))
            current_line = [word]
            if len(lines) >= max_lines:
                break
    
    if current_line and len(lines) < max_lines:
        lines.append(" ".join(current_line))
    
    if len(lines) == max_lines and len(words) > len(" ".join(lines).split()):
        if len(lines[-1]) > max_chars_per_line - 3:
            lines[-1] = lines[-1][:max_chars_per_line - 3] + "..."
        else:
            lines[-1] = lines[-1] + "..."
            
    return lines or [text[:max_chars_per_line]]

def generate_job_playcard(job: Dict[str, Any], width: int = 1080, height: int = 1350) -> bytes:
    """
    Generates a top-tier Silicon Valley style recruitment poster (4:5 Portrait: 1080x1350)
    with dynamic category luxury color themes, glassmorphism cards, and real job tags.
    """
    category = str(job.get("category") or "default")
    theme = THEMES.get(category, THEMES["default"])

    # 1. Base Canvas
    img = Image.new("RGBA", (width, height), theme["bg"])
    draw = ImageDraw.Draw(img)

    # 2. Ambient Corner Glows (Gradient rings for subtle depth)
    glow_color = theme["glow"]
    for r in range(450, 50, -30):
        alpha = int((1 - r / 450) * glow_color[3])
        draw.ellipse(
            [width - r, -r // 2, width + r // 2, r],
            fill=(glow_color[0], glow_color[1], glow_color[2], alpha)
        )
        draw.ellipse(
            [-r // 2, height - r, r, height + r // 2],
            fill=(glow_color[0], glow_color[1], glow_color[2], int(alpha * 0.7))
        )

    pad_x = 75

    # 3. Top Header: Category Pill Badge + 100% Remote Indicator
    top_y = 65
    badge_text = theme["badge"]
    font_badge = get_font(20, bold=True)
    
    # Left Category Pill
    draw.rounded_rectangle(
        [pad_x, top_y, pad_x + 360, top_y + 48],
        radius=24,
        fill=theme["tag_bg"],
        outline=theme["tag_border"][:3],
        width=2
    )
    draw.text((pad_x + 22, top_y + 12), badge_text, fill=theme["accent"], font=font_badge)

    # Right Live Indicator Pill
    right_pill_w = 300
    right_pill_x = width - pad_x - right_pill_w
    draw.rounded_rectangle(
        [right_pill_x, top_y, right_pill_x + right_pill_w, top_y + 48],
        radius=24,
        fill=(255, 255, 255, 12),
        outline=(255, 255, 255, 30),
        width=1
    )
    # Mint green pulse dot
    draw.ellipse([right_pill_x + 18, top_y + 19, right_pill_x + 30, top_y + 31], fill=(0, 223, 129, 255))
    draw.text((right_pill_x + 40, top_y + 13), "VERIFIED REMOTE 24/7", fill=(255, 255, 255, 220), font=get_font(17, bold=True))

    # 4. Brand & Company Name
    company_name = str(job.get("company_name", "Global Enterprise")).upper()
    comp_y = 150
    draw.text((pad_x, comp_y), f"HIRING COMPANY • {company_name}", fill=(160, 175, 168), font=get_font(22, bold=True))

    # 5. Role Title (Clean large bold typography, 2 lines max)
    raw_title = str(job.get("title", "Senior Software & AI Engineer"))
    title_lines = wrap_text(raw_title, max_chars_per_line=28, max_lines=2)
    
    title_y = 195
    font_title = get_font(52, bold=True)
    for line in title_lines:
        draw.text((pad_x, title_y), line, fill=(255, 255, 255, 255), font=font_title)
        title_y += 66

    # Sub-location & source attribution line
    loc = str(job.get("location") or "Worldwide Remote")
    source = str(job.get("source_api") or "Remotive")
    draw.text(
        (pad_x, title_y + 5), 
        f"📍 {loc}   •   ⚡ 100% Work From Anywhere   •   via {source}", 
        fill=theme["accent"], 
        font=get_font(22, bold=True)
    )

    # 6. Primary Details Glassmorphic Hero Box
    box_y = title_y + 55
    box_w = width - (pad_x * 2)
    box_h = 240

    # Box Shadow & Background
    draw.rounded_rectangle(
        [pad_x, box_y, pad_x + box_w, box_y + box_h],
        radius=30,
        fill=theme["card_bg"],
        outline=theme["card_border"][:3],
        width=2
    )

    # Inside Hero Box: 3 Stats Columns
    # Column 1: Salary
    salary_str = job.get("salary_range") or "Competitive / Negotiable"
    if salary_str == "Competitive":
        salary_str = "Competitive (USD)"
        
    col_w = box_w // 3
    col1_x = pad_x + 35
    draw.text((col1_x, box_y + 35), "ANNUAL COMPENSATION", fill=(140, 155, 150), font=get_font(18, bold=True))
    draw.text((col1_x, box_y + 68), salary_str[:22], fill=theme["accent"], font=get_font(34, bold=True))
    draw.text((col1_x, box_y + 115), "Transparent International Pay", fill=(180, 195, 190), font=get_font(17, bold=False))

    # Column 2: Workplace & Job Type
    col2_x = pad_x + col_w + 35
    job_type = str(job.get("job_type") or "Remote")
    draw.text((col2_x, box_y + 35), "WORKPLACE MODE", fill=(140, 155, 150), font=get_font(18, bold=True))
    draw.text((col2_x, box_y + 68), "100% Remote", fill=(255, 255, 255), font=get_font(34, bold=True))
    draw.text((col2_x, box_y + 115), f"Flexible • {job_type}", fill=(180, 195, 190), font=get_font(17, bold=False))

    # Divider lines inside box
    draw.line([(pad_x + col_w, box_y + 30), (pad_x + col_w, box_y + box_h - 30)], fill=(255, 255, 255, 20), width=1)
    draw.line([(pad_x + col_w * 2, box_y + 30), (pad_x + col_w * 2, box_y + box_h - 30)], fill=(255, 255, 255, 20), width=1)

    # Column 3: Direct Apply Status
    col3_x = pad_x + col_w * 2 + 35
    draw.text((col3_x, box_y + 35), "APPLICATION STATUS", fill=(140, 155, 150), font=get_font(18, bold=True))
    draw.text((col3_x, box_y + 68), "Urgent Hiring", fill=(255, 255, 255), font=get_font(34, bold=True))
    draw.text((col3_x, box_y + 115), "Direct ATS Forwarding", fill=(180, 195, 190), font=get_font(17, bold=False))

    # Bottom perks strip inside hero box
    draw.line([(pad_x + 25, box_y + 165), (pad_x + box_w - 25, box_y + 165)], fill=(255, 255, 255, 25), width=1)
    perks_text = "✨ Zero Agent Fees   •   Home Office Stipend   •   Visa Sponsorship / Relocation Supported"
    draw.text((pad_x + 40, box_y + 185), perks_text, fill=(210, 225, 220), font=get_font(18, bold=True))

    # 7. Real Tech Stack / Skills Chips (Dynamic from job.tags)
    tags_y = box_y + box_h + 35
    draw.text((pad_x, tags_y), "PRIMARY REQUIRED SKILLS & DOMAIN:", fill=(160, 175, 168), font=get_font(20, bold=True))

    raw_tags = job.get("tags") or []
    if isinstance(raw_tags, str):
        try:
            import json
            raw_tags = json.loads(raw_tags)
        except Exception:
            raw_tags = [t.strip() for t in raw_tags.split(",") if t.strip()]
            
    # Default skills if empty
    display_tags = [t for t in raw_tags if len(t) < 22][:5]
    if not display_tags:
        display_tags = ["Worldwide Remote", "Tech & AI", "Flexible Hours", "English Communication"]

    chips_y = tags_y + 35
    chip_x = pad_x
    for tag in display_tags:
        clean_tag = f"#{tag}"
        tag_font = get_font(20, bold=True)
        # Approximate width calculation
        chip_w = max(110, len(clean_tag) * 14 + 36)
        if chip_x + chip_w > width - pad_x:
            break
        draw.rounded_rectangle(
            [chip_x, chips_y, chip_x + chip_w, chips_y + 52],
            radius=18,
            fill=theme["tag_bg"],
            outline=theme["tag_border"][:3],
            width=1
        )
        draw.text((chip_x + 18, chips_y + 14), clean_tag, fill=(240, 248, 245), font=tag_font)
        chip_x += chip_w + 16

    # 8. High-Converting Callout Container
    callout_y = chips_y + 85
    callout_h = 100
    draw.rounded_rectangle(
        [pad_x, callout_y, pad_x + box_w, callout_y + callout_h],
        radius=24,
        fill=(255, 255, 255, 10),
        outline=(255, 255, 255, 25),
        width=1
    )
    # Checkmark icon
    draw.text((pad_x + 28, callout_y + 24), "✓", fill=theme["accent"], font=get_font(38, bold=True))
    draw.text((pad_x + 75, callout_y + 22), "100% Free Candidate Application • Direct ATS Redirect", fill=(255, 255, 255), font=get_font(22, bold=True))
    draw.text((pad_x + 75, callout_y + 55), "No registration fees or agents. Tap the link below to apply directly.", fill=(160, 175, 170), font=get_font(18, bold=False))

    # 9. Giant Ultra-Clean High-Contrast "APPLY NOW" Button
    btn_y = callout_y + callout_h + 30
    btn_h = 96
    
    # Outer glow
    draw.rounded_rectangle(
        [pad_x - 3, btn_y - 3, pad_x + box_w + 3, btn_y + btn_h + 3],
        radius=28,
        fill=theme["accent"]
    )
    draw.rounded_rectangle(
        [pad_x, btn_y, pad_x + box_w, btn_y + btn_h],
        radius=26,
        fill=theme["accent"]
    )
    btn_text = "👉 TAP LINK IN POST TO APPLY DIRECTLY ↗"
    draw.text((pad_x + 95, btn_y + 28), btn_text, fill=theme["accent_text"], font=get_font(32, bold=True))

    # 10. Bottom Premium Footer
    foot_y = height - 120
    draw.line([(pad_x, foot_y), (width - pad_x, foot_y)], fill=(255, 255, 255, 30), width=1)

    # Logo G badge
    draw.rounded_rectangle([pad_x, foot_y + 20, pad_x + 48, foot_y + 68], radius=14, fill=theme["accent"])
    draw.text((pad_x + 13, foot_y + 25), "G", fill=theme["accent_text"], font=get_font(32, bold=True))

    draw.text((pad_x + 65, foot_y + 22), "GlobalHire AI — Worldwide Remote Tech Radar", fill=(255, 255, 255), font=get_font(22, bold=True))
    draw.text((pad_x + 65, foot_y + 52), "Explore 100+ verified work-from-anywhere jobs at https://globalhireai.vercel.app", fill=(140, 155, 150), font=get_font(16, bold=False))

    output = io.BytesIO()
    img.save(output, format="PNG", quality=95)
    return output.getvalue()
