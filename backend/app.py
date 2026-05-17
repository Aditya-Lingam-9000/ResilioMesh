import base64
import io
import json
import os
from typing import Any

import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from PIL import Image
from transformers import AutoModelForCausalLM, AutoModelForImageTextToText, AutoModelForVision2Seq, AutoProcessor

MODEL_ID = os.getenv('MODEL_ID', 'google/gemma-4-e2b-it')
MAX_NEW_TOKENS = int(os.getenv('MAX_NEW_TOKENS', '256'))
TEMPERATURE = float(os.getenv('TEMPERATURE', '0.9'))
TOP_P = float(os.getenv('TOP_P', '0.95'))
TOP_K = int(os.getenv('TOP_K', '64'))
DEVICE_MAP = os.getenv('DEVICE_MAP', 'auto')
HF_TOKEN = os.getenv('HF_TOKEN')

app = FastAPI(title='ResilioMesh Gemma Gateway')


class InferRequest(BaseModel):
    request_id: str | None = None
    prompt: str = ''
    frames: list[str] = Field(default_factory=list)


def decode_frame(frame: str) -> Image.Image:
    data = frame.strip()
    if data.startswith('data:'):
        data = data.split(',', 1)[-1]
    try:
        image_bytes = base64.b64decode(data)
    except Exception as exc:
        raise ValueError('Invalid base64 frame data') from exc
    return Image.open(io.BytesIO(image_bytes)).convert('RGB')


def extract_json(text: str) -> dict[str, Any] | None:
    if not text:
        return None
    cleaned = text.strip()
    if cleaned.startswith('```'):
        cleaned = cleaned.replace('```json', '').replace('```', '').strip()
    candidates = []
    if '{' in cleaned and '}' in cleaned:
        candidates = cleaned[cleaned.find('{'): cleaned.rfind('}') + 1].split('\n')
        candidates = ['\n'.join(candidates)]
    for candidate in candidates:
        try:
            return json.loads(candidate)
        except Exception:
            continue
    return None


def normalize_response(data: dict[str, Any] | None, request_id: str | None, raw: str) -> dict[str, Any]:
    payload = data or {}
    return {
        'request_id': payload.get('request_id') or request_id,
        'location': payload.get('location') or '16.5062, 80.6480',
        'risk_level': payload.get('risk_level') or 'High',
        'help_needed': payload.get('help_needed') or 'Analysis Error',
        'description': payload.get('description') or 'No description provided.',
        'confidence': payload.get('confidence') if isinstance(payload.get('confidence'), (int, float)) else 0.5,
        'recommended_actions': payload.get('recommended_actions')
        if isinstance(payload.get('recommended_actions'), list) else ['Manual review recommended'],
        'raw': payload.get('raw') or raw,
    }


processor = AutoProcessor.from_pretrained(MODEL_ID, token=HF_TOKEN, trust_remote_code=True)
model = None
model_class = None

if AutoModelForImageTextToText is not None:
    try:
        model = AutoModelForImageTextToText.from_pretrained(
            MODEL_ID,
            device_map=DEVICE_MAP,
            torch_dtype=torch.float16,
            token=HF_TOKEN,
            trust_remote_code=True,
        )
        model_class = 'AutoModelForImageTextToText'
    except Exception:
        model = None

if model is None and AutoModelForVision2Seq is not None:
    try:
        model = AutoModelForVision2Seq.from_pretrained(
            MODEL_ID,
            device_map=DEVICE_MAP,
            torch_dtype=torch.float16,
            token=HF_TOKEN,
            trust_remote_code=True,
        )
        model_class = 'AutoModelForVision2Seq'
    except Exception:
        model = None

if model is None:
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        device_map=DEVICE_MAP,
        torch_dtype=torch.float16,
        token=HF_TOKEN,
        trust_remote_code=True,
    )
    model_class = 'AutoModelForCausalLM'

model.eval()


def get_vision_dtype(model_instance: torch.nn.Module) -> torch.dtype:
    candidate_attrs = [
        'vision_tower',
        'vision_model',
        'vision_encoder',
        'vision_backbone',
        'vision',
    ]
    for attr in candidate_attrs:
        if hasattr(model_instance, attr):
            module = getattr(model_instance, attr)
            if isinstance(module, (list, tuple)) and module:
                module = module[0]
            try:
                return next(module.parameters()).dtype
            except StopIteration:
                continue
            except Exception:
                continue
    return model_instance.dtype


def run_inference(image: Image.Image, prompt_text: str) -> str:
    messages = [
        {
            'role': 'user',
            'content': [
                {'type': 'image'},
                {'type': 'text', 'text': prompt_text or 'Analyze the image.'},
            ],
        }
    ]
    prompt = processor.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True, enable_thinking=False
    )

    inputs = processor(text=prompt, images=image, return_tensors='pt', padding=True)
    pixel_values = inputs.pop('pixel_values', None)
    inputs = {k: v.to(model.device) for k, v in inputs.items()}

    if pixel_values is not None:
        inputs['pixel_values'] = pixel_values.to(model.device, dtype=get_vision_dtype(model))

    input_len = inputs['input_ids'].shape[-1]
    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=MAX_NEW_TOKENS,
            do_sample=True,
            temperature=TEMPERATURE,
            top_p=TOP_P,
            top_k=TOP_K,
        )

    response = processor.decode(output_ids[0][input_len:], skip_special_tokens=False)
    if hasattr(processor, 'parse_response'):
        parsed = processor.parse_response(response)
        if isinstance(parsed, dict):
            return json.dumps(parsed)
    return response


@app.get('/health')
def health() -> dict[str, Any]:
    return {
        'status': 'ok',
        'model_id': MODEL_ID,
        'model_class': model_class,
    }


@app.post('/infer')
def infer(payload: InferRequest) -> dict[str, Any]:
    if not payload.frames:
        raise HTTPException(status_code=400, detail='No frames provided')

    try:
        image = decode_frame(payload.frames[0])
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    raw = run_inference(image, payload.prompt)
    parsed = extract_json(raw)
    return normalize_response(parsed, payload.request_id, raw)
