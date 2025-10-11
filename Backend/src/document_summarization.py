from typing import List
from .models.llm_loader import LLMModel

class DocumentSummarizer:
    """
    Handles summarization of documents using the LLM defined in llm_loader.py
    """

    def __init__(self, model_name: str = "gpt-5-mini"):
        self.llm = LLMModel(model_name=model_name)

    def summarize_text(self, text: str, max_chunk_size: int = 2000, max_tokens: int = 512) -> str:
        """
        Summarize text content, handling large documents by chunking.
        
        Args:
            text: Text content to summarize
            max_chunk_size: Maximum size of each chunk in characters
            max_tokens: Maximum tokens for LLM response
            
        Returns:
            Summarized text
        """
        if not text or not text.strip():
            return "No text content found to summarize."

        # If text is short enough, summarize directly
        if len(text) <= max_chunk_size:
            return self._summarize_chunk(text, max_tokens)

        # For longer texts, chunk and summarize
        chunks = self._chunk_text(text, max_chunk_size)
        summaries: List[str] = []

        for chunk in chunks:
            summary = self._summarize_chunk(chunk, max_tokens // 2)  # Smaller tokens per chunk
            summaries.append(summary.strip())

        # Combine and create final summary
        combined_text = "\n".join(summaries)
        
        if len(combined_text) <= max_chunk_size:
            return self._create_final_summary(combined_text, max_tokens)
        else:
            # If combined summaries are still too long, summarize them again
            return self._create_final_summary(combined_text[:max_chunk_size], max_tokens)

    def _summarize_chunk(self, chunk: str, max_tokens: int) -> str:
        """Summarize a single chunk of text."""
        prompt = (
            f"Summarize the following text clearly and concisely, focusing on the main ideas, "
            f"key concepts, and important information:\n\n{chunk}\n\n"
            "Provide a comprehensive summary that captures the essential points."
        )
        response = self.llm.generate_response(prompt, max_tokens=max_tokens)
        return response.strip()

    def _create_final_summary(self, combined_text: str, max_tokens: int) -> str:
        """Create the final summary from combined chunk summaries."""
        final_prompt = (
            f"Create a comprehensive and coherent summary from these partial summaries. "
            f"Organize the information logically and ensure all important concepts are included:\n\n"
            f"{combined_text}\n\n"
            "Provide a well-structured final summary."
        )
        final_summary = self.llm.generate_response(final_prompt, max_tokens=max_tokens)
        return final_summary.strip()

    def _chunk_text(self, text: str, max_chunk_size: int, overlap: int = 200) -> List[str]:
        """
        Split text into overlapping chunks for processing.
        
        Args:
            text: Text to chunk
            max_chunk_size: Maximum size of each chunk
            overlap: Number of characters to overlap between chunks
            
        Returns:
            List of text chunks
        """
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + max_chunk_size
            
            # Try to break at a sentence or paragraph boundary
            if end < len(text):
                # Look for sentence endings near the chunk boundary
                for i in range(min(100, len(text) - end)):
                    if text[end + i] in '.!?\n':
                        end = end + i + 1
                        break
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            start = end - overlap
            if start >= len(text):
                break
        
        return chunks

    def extract_key_concepts(self, text: str, max_concepts: int = 10) -> List[str]:
        """
        Extract key concepts from text for quiz generation.
        
        Args:
            text: Text to analyze
            max_concepts: Maximum number of concepts to extract
            
        Returns:
            List of key concepts
        """
        prompt = (
            f"Analyze the following text and extract the {max_concepts} most important concepts, "
            f"topics, or themes that would be suitable for creating quiz questions:\n\n{text}\n\n"
            "List each concept on a separate line, focusing on:\n"
            "- Key definitions and terminology\n"
            "- Important facts and figures\n"
            "- Main processes or procedures\n"
            "- Critical relationships between ideas\n"
            "- Fundamental principles or theories"
        )
        
        response = self.llm.generate_response(prompt, max_tokens=300)
        
        # Parse the response into a list of concepts
        concepts = []
        for line in response.split('\n'):
            line = line.strip()
            if line and not line.startswith('-'):
                # Remove numbering or bullet points
                line = line.lstrip('0123456789.- ')
                if line:
                    concepts.append(line)
        
        return concepts[:max_concepts]

    def generate_learning_objectives(self, text: str, max_objectives: int = 5) -> List[str]:
        """
        Generate learning objectives from text content.
        
        Args:
            text: Text to analyze
            max_objectives: Maximum number of objectives to generate
            
        Returns:
            List of learning objectives
        """
        prompt = (
            f"Based on the following text, create {max_objectives} clear learning objectives "
            f"that students should achieve after studying this content:\n\n{text}\n\n"
            "Format each objective as: 'Students will be able to...'\n"
            "Focus on measurable outcomes using action verbs like:\n"
            "- Define, Explain, Describe, Identify\n"
            "- Calculate, Solve, Apply, Analyze\n"
            "- Compare, Evaluate, Synthesize, Create"
        )
        
        response = self.llm.generate_response(prompt, max_tokens=400)
        
        # Parse the response into a list of objectives
        objectives = []
        for line in response.split('\n'):
            line = line.strip()
            if line and ('will be able to' in line.lower() or line.startswith('Students')):
                objectives.append(line)
        
        return objectives[:max_objectives]


# Helper function for API compatibility
def summarize_document(text: str, max_chunk_size: int = 2000, max_tokens: int = 512) -> str:
    """
    Helper function for backward compatibility with existing API.
    
    Args:
        text: Text to summarize
        max_chunk_size: Maximum chunk size
        max_tokens: Maximum tokens for response
        
    Returns:
        Summarized text
    """
    summarizer = DocumentSummarizer()
    return summarizer.summarize_text(text, max_chunk_size=max_chunk_size, max_tokens=max_tokens)