"""
LLM Loader for ConceptCatch

This module loads and manages all generative models used across the platform.
It includes:
- Question generation model
- Answer/explanation generation model
- Summarization model
"""

from transformers import pipeline
import torch

# Automatically choose device (GPU if available)
device = 0 if torch.cuda.is_available() else -1


class LLMModel:
    """
    Central class that manages and provides unified access to all language models.
    """

    def __init__(self, model_name: str = None):
        """
        Initialize with an optional model name.
        If not specified, it defaults based on task type.
        """
        self.model_name = model_name
        self.model_pipeline = None

    def load_question_generation_model(self):
        """
        Loads a model specialized for question generation.
        """
        print("[INFO] Loading Question Generation model (valhalla/t5-small-qg-hl)...")
        model_name = "valhalla/t5-small-qg-hl"
        try:
            self.model_pipeline = pipeline(
                "text2text-generation", model=model_name, tokenizer=model_name, device=device
            )
            self.model_name = model_name
        except Exception as e:
            print("[ERROR] Failed to load question generation model:", e)
            raise e

    def load_answer_generation_model(self):
        """
        Loads a text generation model for answers or explanations.
        Uses Mistral-7B-Instruct if GPU available, otherwise GPT-2 fallback.
        """
        print("[INFO] Loading Answer Generation model...")
        try:
            if torch.cuda.is_available():
                model_name = "mistralai/Mistral-7B-Instruct-v0.1"
            else:
                model_name = "gpt2"

            self.model_pipeline = pipeline(
                "text-generation", model=model_name, tokenizer=model_name, device=device
            )
            self.model_name = model_name
        except Exception as e:
            print("[ERROR] Failed to load answer generation model:", e)
            raise e

    def load_summarizer(self):
        """
        Loads a summarization model for document processing.
        """
        print("[INFO] Loading Summarization model (facebook/bart-large-cnn)...")
        model_name = "facebook/bart-large-cnn"
        try:
            self.model_pipeline = pipeline(
                "summarization", model=model_name, tokenizer=model_name, device=device
            )
            self.model_name = model_name
        except Exception as e:
            print("[ERROR] Failed to load summarization model:", e)
            raise e

    def generate_response(self, prompt: str, max_length: int = 512) -> str:
        """
        Unified response generation for any loaded pipeline.
        """
        if not self.model_pipeline:
            raise ValueError("No model pipeline loaded. Load a model before calling generate_response().")

        print(f"[INFO] Generating response using {self.model_name}...")
        result = self.model_pipeline(prompt, max_length=max_length, truncation=True)
        # Handle both text-generation and summarization pipeline outputs
        if isinstance(result, list) and "generated_text" in result[0]:
            return result[0]["generated_text"]
        elif isinstance(result, list) and "summary_text" in result[0]:
            return result[0]["summary_text"]
        else:
            return str(result)


# 🔧 Factory functions for easier use in other modules
def load_question_generation_model():
    model = LLMModel()
    model.load_question_generation_model()
    return model


def load_answer_generation_model():
    model = LLMModel()
    model.load_answer_generation_model()
    return model


def load_summarizer():
    model = LLMModel()
    model.load_summarizer()
    return model
