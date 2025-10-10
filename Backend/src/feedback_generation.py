import os
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List

# === Environment Setup ===
load_dotenv()

# === GPT5-mini Model Initialization ===
llm = AzureChatOpenAI(
    api_key= os.getenv("AZURE_OPENAI_KEY"),
    azure_endpoint= os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_version= os.getenv("AZURE_OPENAI_API_VERSION"),
    deployment_name= os.getenv("AZURE_GPT5_DEPLOYMENT"),
    # temperature = 0.0   # only temperature of 1 is supported in GPT5-mini
    )

# === Stuctured Output Model ===
class Feedback(BaseModel):
    correctness: str = Field(description="right, wrong, or partially correct")
    mistake_type: str = Field(description="conceptual, procedural, careless, or misinterpretation")
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
     2. If the answer is correct, briefly confirm and reinforce understanding.
     3. If the answer is wrong or partially correct:
        a. Identify the mistake type (conceptual, procedural, careless, or misinterpretation).
        b. Explain clearly and kindly why the answer is incorrect or incomplete.
        c. Reteach both the **concept** and the **solution process** step-by-step, so the student learns how to solve the problem correctly from start to finish.

     Guidance:
     - For conceptual mistakes: start by explaining the missing or misunderstood concept simply.
     - For procedural mistakes: reteach the correct process.
     - For careless or misinterpretation mistakes: clarify the specific misunderstanding.
     - Always teach in an encouraging, student-friendly tone.
     
     Return ONLY valid JSON following this structure:
    {format_instructions}"""
    ),
    ("user", 
     "Question: {question}\n Student Answer: {student_answer}")
    ], 
)

# === Feedback Generation Function ===
def give_feedback(question, student_answer, source=None):
    chain = feedback_prompt | llm | parser
    result = chain.invoke({
        "question": question,
        "student_answer": student_answer,
        "format_instructions": format_instructions})
    return result


# === Intial Test for The Feature ===
Q = "What is the time complexity of inserting an element into a binary search tree (BST) in the average case?"
Ans = "The time complexity is O(log n) in all cases."
response = give_feedback(Q, Ans)
print(response)