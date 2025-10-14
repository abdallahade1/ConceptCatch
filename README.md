# ConceptCatch

**ConceptCatch** is an adaptive AI learning assistant that transforms mistakes into opportunities for learning. It analyzes student answers to identify why they are wrong, reteaches the concept in plain language, and tracks mistakes over time. Teachers and students can use it to create custom quizzes and problem sets on any topic and difficulty level.


## Team Name: ConceptCatch
- Abdallah Adel  
- Shahd Ammar  
- Yasmeen Saber  


## Project Features

### 1. AI-Powered Feedback for Students
**Core Capabilities:**
- Detect correctness of student responses (right, wrong, partially correct).
- Classify mistake type (conceptual, procedural, arithmetic, misread, reasoning, communication, strategic, careless, misinterpretation, or formatting).
- Explain why an answer is incorrect using clear, student-friendly language.
- Reteach the concept through step-by-step breakdowns or analogies.
- Generate similar practice problems tailored to the same concept.

### 2. Quiz and Problem Set Creation
**Core Capabilities:**
- Topic and difficulty selection.
- Multiple question types supported (MCQ, short answer, essay, and true/false).
- AI-generated quizzes and teacher-edited quiz versions.
- Automatic generation of detailed explanations.
- Adaptive quizzes based on the student’s past mistakes for targeted practice.

### 3. Mistake Analysis and Adaptive Practice
**Core Capabilities:**
- Label mistake types and aggregate them over time.
- Identify recurring weakness points or misunderstood concepts.
- Generate targeted quizzes from a student’s mistake history.
- Provide a teacher dashboard with detailed, exportable performance reports.


## Demo 
[Demo Link](https://drive.google.com/file/d/1fUZwDrOLXzDQiIDmgqYKSsLbZQ2OSp6V/view?usp=sharing)


## Demonstration Video
[Demonstration Video Link](https://drive.google.com/file/d/17HRXl-_0xe8-cT6_wVQjWxukU6SqyzOL/view?usp=sharing)


## Environment Setup
### Installations
#### React (Frontend)
```bash
cd frontend
npm install
```

#### FastAPI (Backend)
```bash
cd backend
pip install -r requirements.txt
```

#### AI and LangChain Dependencies
```bash
pip install openai langchain langchain-openai python-dotenv
```


## Running
### Frontend
```bash
cd frontend
npm run dev
```

### Backend
```bash
cd backend
uvicorn src.app:app --reload --port 8000
```


## GenAI Tools Used
- **ChatGPT**


## Generative AI Usage Examples

### Example 1: Debugging LangChain Memory Error
**Prompt Used:**
I'm using LangChain memory to remember the question, the student's previous answer, and the AI feedback when handling a follow-up question. I want the LLM to be aware of the original question to generate similar practice questions if requested. I encountered the following error: *ValueError: One input key expected, got ['followup_format_instructions', 'prev_question']*. This happens when I include prev_question in the LLM chain.

**AI Solution:**
The AI explained that `ConversationBufferMemory` expects one input key and advised using an f-string instead of placeholder variables. This resolved the multi-input key error and enabled dynamic prompt generation.

### Example 2: Debugging Asynchronous API Initialization and Environment Configuration in FastAPI
**Prompt Used:**
After modularizing our FastAPI app into multiple routers, the Azure OpenAI connection stopped working. We are using LangChain's AzureOpenAI class for model initialization.  When we start the server, we get: openai.error.AuthenticationError: No API key provided.
**AI Solution:**  
- Move `load_dotenv()` before app initialization.  
- Implement lazy initialization with `@lru_cache` to load AzureOpenAI clients only when needed.  
- Add a startup event to verify environment configuration.


## License
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)