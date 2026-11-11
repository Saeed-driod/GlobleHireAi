from PIL import Image, ImageDraw, ImageFont
import os

width, height = 1200, 630
img = Image.new('RGB', (width, height), color='#0A241B')
draw = ImageDraw.Draw(img)

# Background subtle decorative gradient / glow
for i in range(120):
    alpha_color = (10 + int(i * 0.15), 36 + int(i * 0.35), 27 + int(i * 0.2))
    draw.rectangle([0, i * 5, width, (i + 1) * 5], fill=alpha_color)

# Top corner subtle glow
draw.ellipse([850, -150, 1350, 350], fill=(0, 223, 129, 30))

# Try default or truetype font
font_large = ImageFont.load_default()
font_medium = ImageFont.load_default()
font_small = ImageFont.load_default()

for font_path in [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "arial.ttf"
]:
    if os.path.exists(font_path):
        font_large = ImageFont.truetype(font_path, 64)
        font_medium = ImageFont.truetype(font_path, 32)
        font_small = ImageFont.truetype(font_path, 22)
        break

# Logo Icon Box
logo_x, logo_y = 100, 90
draw.rounded_rectangle([logo_x, logo_y, logo_x + 90, logo_y + 90], radius=24, fill='#00DF81')
# Draw G in logo
draw.text((logo_x + 28, logo_y + 12), "G", fill='#0A241B', font=font_large)

# Brand Name
draw.text((logo_x + 115, logo_y + 16), "GlobalHire", fill='#FFFFFF', font=font_large)
# AI Badge
badge_x = logo_x + 480
draw.rounded_rectangle([badge_x, logo_y + 24, badge_x + 65, logo_y + 70], radius=12, fill='#E3F9ED')
draw.text((badge_x + 14, logo_y + 28), "AI", fill='#0A5734', font=font_medium)

# Main Title Headline
draw.text((100, 230), "Worldwide Remote Tech Jobs", fill='#00DF81', font=font_large)

# Subtitle
draw.text((100, 320), "24/7 Verified Software, AI & Design Opportunities with Direct Apply", fill='#E5E8E2', font=font_medium)

# 3 Feature Pills
pills = ["100% Verified Remote", "Transparent Salaries", "Visa Radar & Direct Apply"]
start_x = 100
for pill in pills:
    pill_w = len(pill) * 14 + 40
    draw.rounded_rectangle([start_x, 420, start_x + pill_w, 475], radius=20, fill='#13382C', outline='#00DF81', width=2)
    draw.text((start_x + 20, 436), pill, fill='#00DF81', font=font_small)
    start_x += pill_w + 20

# Bottom URL bar
draw.rectangle([0, 570, width, 630], fill='#061711')
draw.text((100, 588), "globalhireai.vercel.app  •  Verified Global Careers Radar", fill='#8C9B92', font=font_small)

output_path = "/home/ubuntu/global-job-portal/og-image.png"
img.save(output_path, "PNG")
print("Saved to", output_path)
