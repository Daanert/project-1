#!/usr/bin/env python3
"""
Test script to examine ComfyUI metadata from a real image
Run this on Vast.ai to see the actual metadata structure
"""

from PIL import Image
import json
import sys
import os

# Get the first PNG file from ComfyUI output
comfyui_folder = '/workspace/ComfyUI/output'

def find_first_png(folder):
    for root, dirs, files in os.walk(folder):
        for filename in files:
            if filename.lower().endswith('.png'):
                return os.path.join(root, filename)
    return None

image_path = find_first_png(comfyui_folder)

if not image_path:
    print("No PNG files found in ComfyUI output folder")
    sys.exit(1)

print(f"Examining: {image_path}\n")

try:
    img = Image.open(image_path)
    info = img.info

    print("="*60)
    print("PNG TEXT CHUNKS FOUND:")
    print("="*60)
    for key in info.keys():
        print(f"  - {key}")
    print()

    if 'workflow' in info:
        print("="*60)
        print("WORKFLOW DATA (first 1000 chars):")
        print("="*60)
        workflow = json.loads(info['workflow'])
        print(json.dumps(workflow, indent=2)[:1000])
        print("...")
        print()

    if 'prompt' in info:
        print("="*60)
        print("PROMPT DATA (complete):")
        print("="*60)
        prompt = json.loads(info['prompt'])
        print(json.dumps(prompt, indent=2))
        print()

        print("="*60)
        print("ANALYZING PROMPT STRUCTURE:")
        print("="*60)
        for node_id, node_data in prompt.items():
            if isinstance(node_data, dict):
                class_type = node_data.get('class_type', 'Unknown')
                inputs = node_data.get('inputs', {})
                print(f"\nNode {node_id}: {class_type}")
                if inputs:
                    print(f"  Inputs: {list(inputs.keys())}")
                    if class_type == 'KSampler':
                        print(f"    KSampler params:")
                        for k, v in inputs.items():
                            print(f"      {k}: {v}")
                    elif 'CLIPTextEncode' in class_type:
                        text = inputs.get('text', '')
                        print(f"    Text: {text[:100]}...")
                    elif 'Lora' in class_type or 'LoraLoader' in class_type:
                        print(f"    LoRA info:")
                        for k, v in inputs.items():
                            print(f"      {k}: {v}")
                    elif 'CheckpointLoader' in class_type or 'ModelLoader' in class_type:
                        print(f"    Model: {inputs.get('ckpt_name', inputs.get('model_name', 'Unknown'))}")

    print("\n" + "="*60)
    print("METADATA EXTRACTION COMPLETE")
    print("="*60)

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
