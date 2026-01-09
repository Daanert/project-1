"""
ComfyUI Metadata Extractor
Extracts workflow, prompts, and parameters from ComfyUI-generated PNG images
"""

from PIL import Image
from PIL.PngImagePlugin import PngInfo
import json
from typing import Dict, Any, Optional, List


class ComfyUIMetadataExtractor:
    """Extract and parse ComfyUI metadata from PNG images"""

    def __init__(self):
        self.metadata = {}

    def extract_metadata(self, image_path: str) -> Dict[str, Any]:
        """
        Extract all ComfyUI metadata from a PNG image

        Args:
            image_path: Path to the PNG file

        Returns:
            Dictionary containing extracted metadata
        """
        try:
            image = Image.open(image_path)

            # Extract PNG text chunks
            png_info = image.info

            # Initialize metadata structure
            metadata = {
                'workflow': None,
                'prompt': None,
                'parameters': None,
                'positive_prompt': '',
                'negative_prompt': '',
                'sampler_params': {},
                'lora_nodes': [],
                'models': [],
                'raw_metadata': {}
            }

            # Extract workflow and prompt from PNG chunks
            if 'workflow' in png_info:
                try:
                    metadata['workflow'] = json.loads(png_info['workflow'])
                except json.JSONDecodeError:
                    metadata['workflow'] = png_info['workflow']

            if 'prompt' in png_info:
                try:
                    metadata['prompt'] = json.loads(png_info['prompt'])
                except json.JSONDecodeError:
                    metadata['prompt'] = png_info['prompt']

            # Extract parameters (A1111-style)
            if 'parameters' in png_info:
                metadata['parameters'] = png_info['parameters']

            # Store all raw metadata
            metadata['raw_metadata'] = {k: v for k, v in png_info.items()}

            # Parse the prompt data to extract specific information
            if metadata['prompt']:
                self._parse_prompt_data(metadata)

            return metadata

        except Exception as e:
            return {
                'error': f'Failed to extract metadata: {str(e)}',
                'workflow': None,
                'prompt': None,
                'parameters': None,
                'positive_prompt': '',
                'negative_prompt': '',
                'sampler_params': {},
                'lora_nodes': [],
                'models': []
            }

    def _parse_prompt_data(self, metadata: Dict[str, Any]) -> None:
        """
        Parse the prompt JSON to extract KSampler parameters, prompts, and Lora nodes

        Args:
            metadata: Metadata dictionary to update with parsed data
        """
        try:
            prompt_data = metadata['prompt']

            if not isinstance(prompt_data, dict):
                return

            # The prompt data is typically a nested structure
            # Format: {node_id: {class_type: "NodeType", inputs: {...}}}
            for node_id, node_data in prompt_data.items():
                if not isinstance(node_data, dict):
                    continue

                class_type = node_data.get('class_type', '')
                inputs = node_data.get('inputs', {})

                # Extract KSampler parameters
                if 'KSampler' in class_type:
                    metadata['sampler_params'] = {
                        'seed': inputs.get('seed'),
                        'steps': inputs.get('steps'),
                        'cfg': inputs.get('cfg'),
                        'sampler_name': inputs.get('sampler_name'),
                        'scheduler': inputs.get('scheduler'),
                        'denoise': inputs.get('denoise'),
                    }

                # Extract positive prompt
                if class_type in ['CLIPTextEncode', 'CLIPTextEncodeSDXL'] and self._is_positive_prompt(node_id, prompt_data):
                    text = inputs.get('text', '')
                    if len(text) > len(metadata['positive_prompt']):
                        metadata['positive_prompt'] = text

                # Extract negative prompt
                if class_type in ['CLIPTextEncode', 'CLIPTextEncodeSDXL'] and self._is_negative_prompt(node_id, prompt_data):
                    text = inputs.get('text', '')
                    if 'negative' in str(inputs).lower() or len(text) < len(metadata.get('positive_prompt', '')):
                        metadata['negative_prompt'] = text

                # Extract Lora loader information
                if 'LoraLoader' in class_type or 'Lora' in class_type:
                    lora_info = {
                        'name': inputs.get('lora_name', inputs.get('name', 'Unknown')),
                        'strength_model': inputs.get('strength_model'),
                        'strength_clip': inputs.get('strength_clip'),
                    }
                    metadata['lora_nodes'].append(lora_info)

                # Extract checkpoint/model information
                if 'CheckpointLoader' in class_type or 'ModelLoader' in class_type:
                    model_name = inputs.get('ckpt_name', inputs.get('model_name', 'Unknown'))
                    if model_name not in metadata['models']:
                        metadata['models'].append(model_name)

            # Fallback: Try to distinguish prompts by length if not already found
            if not metadata['positive_prompt'] or not metadata['negative_prompt']:
                self._extract_prompts_by_heuristic(prompt_data, metadata)

        except Exception as e:
            print(f"Error parsing prompt data: {e}")

    def _is_positive_prompt(self, node_id: str, prompt_data: Dict) -> bool:
        """Check if a CLIP node is for positive prompt based on connections"""
        # Look for connections to KSampler's positive input
        for node in prompt_data.values():
            if isinstance(node, dict) and node.get('class_type', '').startswith('KSampler'):
                inputs = node.get('inputs', {})
                positive_input = inputs.get('positive', [])
                if isinstance(positive_input, list) and len(positive_input) > 0:
                    if str(positive_input[0]) == str(node_id):
                        return True
        return False

    def _is_negative_prompt(self, node_id: str, prompt_data: Dict) -> bool:
        """Check if a CLIP node is for negative prompt based on connections"""
        # Look for connections to KSampler's negative input
        for node in prompt_data.values():
            if isinstance(node, dict) and node.get('class_type', '').startswith('KSampler'):
                inputs = node.get('inputs', {})
                negative_input = inputs.get('negative', [])
                if isinstance(negative_input, list) and len(negative_input) > 0:
                    if str(negative_input[0]) == str(node_id):
                        return True
        return False

    def _extract_prompts_by_heuristic(self, prompt_data: Dict, metadata: Dict) -> None:
        """Extract prompts using heuristic (length-based)"""
        text_nodes = []

        for node_data in prompt_data.values():
            if isinstance(node_data, dict):
                class_type = node_data.get('class_type', '')
                if 'CLIPTextEncode' in class_type:
                    text = node_data.get('inputs', {}).get('text', '')
                    if text:
                        text_nodes.append(text)

        if len(text_nodes) >= 2:
            # Sort by length, assume longer is positive
            text_nodes.sort(key=len, reverse=True)
            if not metadata['positive_prompt']:
                metadata['positive_prompt'] = text_nodes[0]
            if not metadata['negative_prompt']:
                metadata['negative_prompt'] = text_nodes[1]
        elif len(text_nodes) == 1:
            if not metadata['positive_prompt']:
                metadata['positive_prompt'] = text_nodes[0]

    def format_metadata_for_display(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format metadata for frontend display

        Args:
            metadata: Raw extracted metadata

        Returns:
            Formatted metadata suitable for UI display
        """
        return {
            'positive_prompt': metadata.get('positive_prompt', 'N/A'),
            'negative_prompt': metadata.get('negative_prompt', 'N/A'),
            'sampler': {
                'seed': metadata.get('sampler_params', {}).get('seed', 'N/A'),
                'steps': metadata.get('sampler_params', {}).get('steps', 'N/A'),
                'cfg_scale': metadata.get('sampler_params', {}).get('cfg', 'N/A'),
                'sampler_name': metadata.get('sampler_params', {}).get('sampler_name', 'N/A'),
                'scheduler': metadata.get('sampler_params', {}).get('scheduler', 'N/A'),
                'denoise': metadata.get('sampler_params', {}).get('denoise', 'N/A'),
            },
            'loras': metadata.get('lora_nodes', []),
            'models': metadata.get('models', []),
            'has_workflow': metadata.get('workflow') is not None,
            'has_prompt': metadata.get('prompt') is not None,
        }
