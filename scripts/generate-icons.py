"""
Generate clean, professional PNG icons for AI Prompt Manager.
"""
import os
from PIL import Image, ImageDraw

def generate_icons():
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'assets', 'icons')
    os.makedirs(output_dir, exist_ok=True)
    
    sizes = [16, 32, 48, 128]
    
    for size in sizes:
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Rounded rectangle background with deep modern indigo/violet
        margin = max(1, size // 16)
        radius = max(3, size // 4)
        
        # Outer rounded box
        draw.rounded_rectangle(
            [margin, margin, size - margin, size - margin],
            radius=radius,
            fill='#4338CA',  # Indigo 700
            outline='#6366F1', # Indigo 500
            width=max(1, size // 32)
        )
        
        scale = size / 128.0
        
        if size == 16:
            # Semicolon dot & comma
            draw.ellipse([4, 3, 7, 6], fill='#FFFFFF')
            draw.ellipse([4, 8, 7, 11], fill='#FFFFFF')
            draw.line([(5, 11), (3, 13)], fill='#FFFFFF', width=1)
            # Sparkle
            draw.ellipse([9, 5, 12, 8], fill='#38BDF8')
        elif size == 32:
            # Semicolon
            draw.ellipse([8, 8, 13, 13], fill='#FFFFFF')
            draw.ellipse([8, 16, 13, 21], fill='#FFFFFF')
            draw.line([(10, 20), (7, 25)], fill='#FFFFFF', width=2)
            # AI Star
            draw.line([(21, 9), (21, 23)], fill='#38BDF8', width=2)
            draw.line([(14, 16), (28, 16)], fill='#38BDF8', width=2)
        else:
            # 48 and 128
            # Semicolon top dot
            dot_r = int(7 * scale)
            top_x = int(42 * scale)
            top_y = int(46 * scale)
            draw.ellipse([top_x - dot_r, top_y - dot_r, top_x + dot_r, top_y + dot_r], fill='#FFFFFF')
            
            # Semicolon bottom comma
            bot_y = int(74 * scale)
            draw.ellipse([top_x - dot_r, bot_y - dot_r, top_x + dot_r, bot_y + dot_r], fill='#FFFFFF')
            draw.line([(top_x + int(2 * scale), bot_y + int(3 * scale)), (top_x - int(7 * scale), bot_y + int(18 * scale))], fill='#FFFFFF', width=max(2, int(4 * scale)))
            
            # Sparkle cross
            center_x = int(84 * scale)
            center_y = int(52 * scale)
            arm = int(14 * scale)
            draw.line([(center_x, center_y - arm), (center_x, center_y + arm)], fill='#38BDF8', width=max(2, int(4 * scale)))
            draw.line([(center_x - arm, center_y), (center_x + arm, center_y)], fill='#38BDF8', width=max(2, int(4 * scale)))
            
            # Flow lines
            line_x = int(68 * scale)
            line_w = int(32 * scale)
            draw.line([(line_x, int(80 * scale)), (line_x + line_w, int(80 * scale))], fill='#E0E7FF', width=max(2, int(4 * scale)))
            draw.line([(line_x, int(94 * scale)), (line_x + int(line_w * 0.7), int(94 * scale))], fill='#94A3B8', width=max(2, int(3.5 * scale)))

        dest = os.path.join(output_dir, f'icon{size}.png')
        img.save(dest, 'PNG')
        print(f"Generated {dest} ({size}x{size})")

if __name__ == '__main__':
    generate_icons()
