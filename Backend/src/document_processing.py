import os
import pdfplumber
from docx import Document
from pptx import Presentation
from langchain.text_splitter import TokenTextSplitter
import tiktoken
from langchain_openai import AzureOpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv


# === Importing Environment Variables ===
load_dotenv()


# === Functions to extract text from files with the extensions: pdf, docx, pptx, txt ===
def extract_pdf_text(file_path):
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() + "\n"
    return text


def extract_docx_text(file_path):
    doc = Document(file_path)
    text = "\n".join([para.text for para in doc.paragraphs])
    return text


def extract_pptx_text(file_path):
    prs = Presentation(file_path)
    text = ""
    for slide in prs.slides:
        for shape in slide.shapes:
            if hasattr(shape, "text"):
                text += shape.text + "\n"
    return text


def extract_txt_text(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()
        return text.strip()
    except UnicodeDecodeError:
        with open(file_path, "r", encoding="latin-1") as f:
            text = f.read()
        return text.strip()


def extract_text(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return extract_pdf_text(file_path)
    elif ext == ".docx":
        return extract_docx_text(file_path)
    elif ext == ".pptx":
        return extract_pptx_text(file_path)
    elif ext == "txt":
        return extract_txt_text(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")
    

# == Handling Large Resources == 
embeddings = AzureOpenAIEmbeddings(
    api_key= os.getenv("AZURE_OPENAI_KEY"),
    azure_endpoint= os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_version= os.getenv("AZURE_OPENAI_API_VERSION"),
    azure_deployment= os.getenv("AZURE_TEXT_EMBEDDING_DEPLOYMENT")
)


def get_relevant_resource_text(text, question, student_answer):
    splitter = TokenTextSplitter(chunk_size=400, chunk_overlap=50, encoding_name="cl100k_base")
    chunks = splitter.split_text(text)
    vectorDB= FAISS.from_texts(chunks, embedding=embeddings)

    query = f"{question}\n{student_answer}"
    retrieved_text = vectorDB.similarity_search(query, k=3)
    resource_text = " ".join([txt.page_content for txt in retrieved_text])
    return resource_text    


def count_tokens(text, model_name="gpt-5-mini"):
    enc = tiktoken.encoding_for_model(model_name)
    count = len(enc.encode(text))
    return count