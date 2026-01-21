#!/usr/bin/env python3
"""
Generate placeholder images with ComfyUI metadata for local testing
"""

import os
import json
import random
from PIL import Image, PngImagePlugin
from datetime import datetime

# Create output directory
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'placeholder_images')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Sample prompts
POSITIVE_PROMPTS = [
    "A serene landscape with mountains and a lake at sunset, highly detailed, 8k, photorealistic",
    "Portrait of a woman with flowing red hair, dramatic lighting, fantasy art style, intricate details",
    "Futuristic cityscape with flying cars and neon lights, cyberpunk aesthetic, night scene",
    "Cute cat sitting on a windowsill, soft natural lighting, cozy atmosphere, digital painting",
    "Epic fantasy battle scene with dragons and warriors, dynamic composition, cinematic",
    "Tranquil zen garden with cherry blossoms, peaceful mood, traditional Japanese art style",
    "Steampunk airship floating above clouds, detailed mechanical parts, Victorian era",
    "Magical forest with glowing mushrooms and fireflies, enchanted atmosphere, fantasy illustration",
    "Modern architecture building with glass facade, minimalist design, blue hour photography",
    "Underwater scene with coral reef and tropical fish, vibrant colors, marine life",
]

NEGATIVE_PROMPTS = [
    "blurry, low quality, pixelated, distorted, ugly, deformed",
    "bad anatomy, bad hands, mutated, disfigured, poorly drawn",
    "out of focus, noisy, grainy, jpeg artifacts, watermark",
    "cartoon, anime, illustration, painting, drawing, sketch",
]

LORA_OPTIONS = [
    {"name": "DetailEnhancer.safetensors", "strength": 0.7},
    {"name": "RealisticVision.safetensors", "strength": 0.5},
    {"name": "ColorPop.safetensors", "strength": 0.3},
    {"name": "StyleBoost.safetensors", "strength": 0.6},
    {"name": "QualityImprover.safetensors", "strength": 0.4},
    {"name": "LightingFix.safetensors", "strength": 0.8},
]

MODELS = [
    "realisticVision_v51.safetensors",
    "dreamshaper_8.safetensors",
    "epicRealism_v5.safetensors",
    "absoluteReality_v181.safetensors",
]

SAMPLERS = ["euler", "euler_a", "dpmpp_2m", "dpmpp_sde", "ddim"]
SCHEDULERS = ["normal", "karras", "exponential", "simple"]

def create_comfyui_metadata(image_num):
    """Create realistic ComfyUI metadata"""

    # Select random parameters
    positive_prompt = random.choice(POSITIVE_PROMPTS)
    negative_prompt = random.choice(NEGATIVE_PROMPTS)
    model = random.choice(MODELS)
    sampler_name = random.choice(SAMPLERS)
    scheduler = random.choice(SCHEDULERS)
    seed = random.randint(100000000000000, 999999999999999)
    steps = random.randint(20, 50)
    cfg = round(random.uniform(4.0, 12.0), 1)
    denoise = round(random.uniform(0.8, 1.0), 2)

    # Select 0-3 random LoRAs
    num_loras = random.randint(0, 3)
    selected_loras = random.sample(LORA_OPTIONS, num_loras)

    # Build workflow with node references (like real ComfyUI)
    workflow = {
        "1": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {
                "ckpt_name": model
            }
        },
        "2": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": ["118", 0],  # Reference to node 118
                "clip": ["1", 1]
            }
        },
        "3": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": negative_prompt,
                "clip": ["1", 1]
            }
        },
        "4": {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed,
                "steps": steps,
                "cfg": cfg,
                "sampler_name": sampler_name,
                "scheduler": scheduler,
                "denoise": denoise,
                "model": ["1", 0],
                "positive": ["2", 0],
                "negative": ["3", 0],
                "latent_image": ["5", 0]
            }
        },
        "118": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": positive_prompt,
                "clip": ["1", 1]
            }
        }
    }

    # Add Power Lora Loader if we have LoRAs
    if selected_loras:
        lora_inputs = {
            "model": ["1", 0],
            "clip": ["1", 1]
        }

        for i, lora in enumerate(selected_loras, 1):
            lora_inputs[f"lora_{i}"] = {
                "on": True,
                "lora": lora["name"],
                "strength": lora["strength"]
            }

        workflow["120"] = {
            "class_type": "Power Lora Loader (rgthree)",
            "inputs": lora_inputs
        }

    # Create prompt data (simplified version)
    prompt = workflow.copy()

    return workflow, prompt

def generate_placeholder_image(width, height, color_seed):
    """Generate a colorful placeholder image"""
    img = Image.new('RGB', (width, height))
    pixels = img.load()

    # Generate random gradient
    random.seed(color_seed)
    r1, g1, b1 = random.randint(50, 200), random.randint(50, 200), random.randint(50, 200)
    r2, g2, b2 = random.randint(50, 200), random.randint(50, 200), random.randint(50, 200)

    for y in range(height):
        for x in range(width):
            # Create gradient
            ratio = (x + y) / (width + height)
            r = int(r1 + (r2 - r1) * ratio)
            g = int(g1 + (g2 - g1) * ratio)
            b = int(b1 + (b2 - b1) * ratio)

            # Add some noise
            r = max(0, min(255, r + random.randint(-20, 20)))
            g = max(0, min(255, g + random.randint(-20, 20)))
            b = max(0, min(255, b + random.randint(-20, 20)))

            pixels[x, y] = (r, g, b)

    return img

def create_image_with_metadata(image_num):
    """Create a PNG image with embedded ComfyUI metadata"""

    # Generate image
    width = random.choice([512, 768, 1024])
    height = random.choice([512, 768, 1024])
    img = generate_placeholder_image(width, height, image_num)

    # Create metadata
    workflow, prompt = create_comfyui_metadata(image_num)

    # Create PNG info
    metadata = PngImagePlugin.PngInfo()
    metadata.add_text("workflow", json.dumps(workflow))
    metadata.add_text("prompt", json.dumps(prompt))

    # Save image
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"ComfyUI_{timestamp}_{image_num:04d}.png"
    filepath = os.path.join(OUTPUT_DIR, filename)

    img.save(filepath, "PNG", pnginfo=metadata)
    print(f"✅ Created: {filename} ({width}x{height})")

    return filepath

def main():
    """Generate multiple placeholder images"""
    print("🎨 Generating placeholder images with ComfyUI metadata...\n")

    # Generate 20 placeholder images
    num_images = 20

    for i in range(1, num_images + 1):
        create_image_with_metadata(i)

    print(f"\n✨ Successfully generated {num_images} placeholder images in: {OUTPUT_DIR}")
    print(f"📁 You can now start the gallery and it will display these images!")

if __name__ == "__main__":
    main()
