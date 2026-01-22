#!/usr/bin/env python3
"""
Analyze ComfyUI image metadata to debug prompt extraction
"""

from PIL import Image
import json
import sys

def analyze_metadata(image_path):
    """Analyze and print all metadata from a ComfyUI image"""

    print("=" * 80)
    print(f"Analyzing: {image_path}")
    print("=" * 80)

    try:
        img = Image.open(image_path)
        png_info = img.info

        print("\n📋 Available PNG Chunks:")
        print("-" * 80)
        for key in png_info.keys():
            print(f"  - {key}")

        # Analyze workflow
        if 'workflow' in png_info:
            print("\n🔄 WORKFLOW DATA:")
            print("-" * 80)
            try:
                workflow = json.loads(png_info['workflow'])
                print(json.dumps(workflow, indent=2)[:2000] + "...\n[truncated]")
            except:
                print(png_info['workflow'][:500])

        # Analyze prompt (this is the key one)
        if 'prompt' in png_info:
            print("\n💬 PROMPT DATA (API format):")
            print("-" * 80)
            try:
                prompt = json.loads(png_info['prompt'])

                # Print each node
                for node_id, node_data in prompt.items():
                    class_type = node_data.get('class_type', 'Unknown')
                    inputs = node_data.get('inputs', {})

                    print(f"\nNode {node_id}: {class_type}")
                    print(f"  Inputs: {json.dumps(inputs, indent=4)}")

                    # Highlight text-related nodes
                    if 'Text' in class_type or 'CLIP' in class_type or 'Random' in class_type:
                        print(f"  ⚠️  TEXT NODE DETECTED")

            except Exception as e:
                print(f"Error parsing prompt: {e}")
                print(png_info['prompt'][:1000])

        # Analyze parameters
        if 'parameters' in png_info:
            print("\n⚙️  PARAMETERS (A1111 style):")
            print("-" * 80)
            print(png_info['parameters'][:500])

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python analyze_image_metadata.py <image_path>")
        sys.exit(1)

    analyze_metadata(sys.argv[1])
