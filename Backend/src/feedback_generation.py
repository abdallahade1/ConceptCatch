import os
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List
from src import document_processing as dp
import uuid
from typing import Dict
from langchain.memory import ConversationBufferMemory
from langchain.chains import LLMChain


# === Importing Environment Variables ===
load_dotenv()

# === GPT5-mini Model Initialization ===
llm = AzureChatOpenAI(
    api_key= os.getenv("AZURE_OPENAI_KEY"),
    azure_endpoint= os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_version= os.getenv("AZURE_OPENAI_API_VERSION"),
    deployment_name= os.getenv("AZURE_GPT5_DEPLOYMENT"),
    # temperature = 0.0   # only temperature of 1 is supported in GPT5-mini
    )

# === LangChain Memory ===
memory_store: Dict[str, ConversationBufferMemory] = {}
user_sessions: Dict[str, str] = {}  

# === Stuctured Feedback Model ===
class Feedback(BaseModel):
    correctness: str = Field(description="right, wrong, or partially correct")
    mistake_type: str = Field(description="conceptual, procedural, reasoning, communication, strategic, careless, or misinterpretation")
    explanation: str = Field(description="Why the student's answer is incorrect or incomplete, in student-friendly language.")
    reteaching_steps: List[str] = Field(description="Step-by-step reteaching guidance including concept explanation if needed.")

parser = PydanticOutputParser(pydantic_object=Feedback)
format_instructions = parser.get_format_instructions()

# === Feedback Prompt Template ===
feedback_prompt = ChatPromptTemplate.from_messages([
    ("system", 
     """You are an expert tutor giving feedback to a student.
     
     Your goals:
     1. Determine whether the student's answer is right, wrong, or partially correct.
     2. If the answer is correct:
        a. Briefly confirm and reinforce understanding.
        b. Do not include any reteaching steps.
     3. If the answer is wrong or partially correct:
        a. Identify the mistake type (conceptual, procedural, reasoning, communication, strategic, careless, or misinterpretation)"
        b. Explain clearly and kindly why the answer is incorrect or incomplete.
        c. Reteach both the **concept** and the **solution process** step-by-step, so the student learns how to solve the problem correctly from start to finish.

     Guidance:
     - For conceptual mistakes: start by explaining the missing or misunderstood concept simply.
     - For procedural mistakes: reteach the correct steps or process required to solve the problem.
     - For reasoning mistakes: guide the student through the correct logical approach and problem-solving steps.
     - For communication mistakes: help the student express their answer clearly and completely.
     - For strategic mistakes: suggest a more effective approach or method for solving the problem.
     - For careless mistakes: point out minor errors (e.g., arithmetic, typos) without discouraging the student.
     - For misinterpretation mistakes: clarify what the question is asking and correct any misunderstanding.
     - Always teach in an encouraging, student-friendly tone.
     - Consider the subject ({subject}) when determining correctness, but do not downgrade an answer from partially correct to wrong unless it is completely incorrect.
     - If a resource is provided (not "[None]"), reference it when evaluating and explaining, while also using your own knowledge to enhance clarity. If no resource is provided, rely entirely on general knowledge.
     - After giving feedback, politely prompt the student that they may:
        1. Ask a follow-up question for clarification, or
        2. Request similar practice questions for more practice.

     Return ONLY valid JSON following this structure:
    {format_instructions}"""
    ),
    ("user", 
     "Question: {question}\nStudent Answer: {student_answer}\nSubject: {subject}\nResource(optional): {resource_text}"
    )
    ], 
)

# === Functions to manage User Sessions ===
def create_new_session(user_id, question, student_answer, resource_text, feedback):
    session_id = str(uuid.uuid4())
    memory = ConversationBufferMemory(return_messages=True)
    memory.chat_memory.add_user_message(f"Question: {question}")
    memory.chat_memory.add_user_message(f"Student Answer: {student_answer}")
    memory.chat_memory.add_user_message(f"Resource: {resource_text}")
    memory.chat_memory.add_ai_message(f"Tutor Feedback: {feedback}")

    memory_store[session_id] = memory
    user_sessions[user_id] = session_id
    return session_id

def delete_previous_session(user_id):
    previous_session = user_sessions.get(user_id)
    if previous_session and previous_session in memory_store:
        del memory_store[previous_session]

# === Feedback Generation Function ===
def give_feedback(user_id, subject, question, student_answer, resource=None):
    delete_previous_session(user_id)

    if resource:
        resource_text = resource 
        if dp.count_tokens(resource_text) > 1000:
            resource_text = dp.get_relevant_resource_text(resource_text, question, student_answer)
            print("!!!!! Large Document")
    else: 
        resource_text = "[None]"
        
    inputs = {
    "question": question,
    "student_answer": student_answer,
    "subject": subject,
    "resource_text": resource_text,
    "format_instructions": format_instructions
    }
    
    chain = feedback_prompt | llm | parser
    feedback = chain.invoke(inputs)
    
    session_id = create_new_session(user_id, question, student_answer, resource_text, feedback)

    return feedback, session_id

# === Follow-up Question Function === 
def answer_followup_question(session_id, followup_question):
    memory = memory_store.get(session_id)
    if not memory:
        raise ValueError("No active session found. Please submit a new question first.")
    
    prev_question = memory.chat_memory.messages[0].content 
    followup_prompt = ChatPromptTemplate.from_messages([
    ("system",
     f"""You are a helpful tutor continuing a conversation with a student.
     Use the previous discussion (question, student answer, tutor feedback, and any provided resource) as **authoritative context**.
     When the student requests practice questions, generate 3 similar practice questions based **only on the previous question: {prev_question}** by default, unless the student specifies a different number.
     Answer the student's follow-up question clearly and kindly."""
      ),
    ("user", "Followup_Question: {followup_question}")
    ])

    chain = LLMChain(llm=llm, prompt=followup_prompt, memory=memory)
    result = chain.invoke({"followup_question": followup_question})
    
    return result['text']