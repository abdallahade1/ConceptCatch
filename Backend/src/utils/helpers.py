def chunk_text(text: str, max_length: int = 2000, overlap: int = 200) -> list:
    """
    Split text into overlapping chunks for large document processing.
    """
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + max_length
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += max_length - overlap
    return chunks
