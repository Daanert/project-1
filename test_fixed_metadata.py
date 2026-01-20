#!/usr/bin/env python3
"""
Test the fixed metadata extraction on a real ComfyUI image
"""

import sys
import os
sys.path.insert(0, '/workspace/project-1/backend')

from comfyui_metadata import ComfyUIMetadataExtractor

# Get the first PNG file from ComfyUI output
def find_first_png(folder='/workspace/ComfyUI/output'):
    for root, dirs, files in os.walk(folder):
        for filename in files:
            if filename.lower().endswith('.png'):
                return os.path.join(root, filename)
    return None

image_path = find_first_png()
if not image_path:
    print("No PNG files found")
    sys.exit(1)

print(f"Testing with: {image_path}\n")

# Extract metadata using the fixed extractor
extractor = ComfyUIMetadataExtractor()
raw_metadata = extractor.extract_metadata(image_path)
formatted = extractor.format_metadata_for_display(raw_metadata)

print("="*70)
print("FORMATTED METADATA FOR DISPLAY")
print("="*70)

print("\n🎨 POSITIVE PROMPT:")
print("-" * 70)
prompt = formatted['positive_prompt']
if len(prompt) > 500:
    print(prompt[:500] + "...")
    print(f"(Total length: {len(prompt)} characters)")
else:
    print(prompt)

print("\n🚫 NEGATIVE PROMPT:")
print("-" * 70)
print(formatted['negative_prompt'])

print("\n⚙️  SAMPLER PARAMETERS:")
print("-" * 70)
sampler = formatted['sampler']
for key, value in sampler.items():
    print(f"  {key}: {value}")

print("\n🤖 MODELS:")
print("-" * 70)
for model in formatted['models']:
    print(f"  - {model}")

print("\n✨ LORAS:")
print("-" * 70)
if formatted['loras']:
    for lora in formatted['loras']:
        print(f"  - {lora['name']}")
        print(f"    Model Strength: {lora['strength_model']}")
        print(f"    CLIP Strength: {lora['strength_clip']}")
else:
    print("  No LoRAs found")

print("\n" + "="*70)
print(f"✅ Extraction complete!")
print(f"   Has workflow: {formatted['has_workflow']}")
print(f"   Has prompt: {formatted['has_prompt']}")
print("="*70)
