import os
from dotenv import load_dotenv
from langchain_openai import AzureChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List
import document_processing as dp

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
     2. If the answer is correct:
        a. Briefly confirm and reinforce understanding.
        b. Do not include any reteaching steps.
     3. If the answer is wrong or partially correct:
        a. Identify the mistake type (conceptual, procedural, careless, or misinterpretation).
        b. Explain clearly and kindly why the answer is incorrect or incomplete.
        c. Reteach both the **concept** and the **solution process** step-by-step, so the student learns how to solve the problem correctly from start to finish.

     Guidance:
     - For conceptual mistakes: start by explaining the missing or misunderstood concept simply.
     - For procedural mistakes: reteach the correct process.
     - For careless or misinterpretation mistakes: clarify the specific misunderstanding.
     - Always teach in an encouraging, student-friendly tone.
     - Consider the subject ({subject}) when determining correctness, but do not downgrade an answer from partially correct to wrong unless it is completely incorrect.
     - If a resource is provided (not "[None]"), reference it when evaluating and explaining, while also using your own knowledge to enhance clarity. If no resource is provided, rely entirely on general knowledge.

     Return ONLY valid JSON following this structure:
    {format_instructions}"""
    ),
    ("user", 
     "Question: {question}\nStudent Answer: {student_answer}\nSubject: {subject}\nResource(optional): {resource_text}"
    )
    ], 
)

# === Feedback Generation Function ===
def give_feedback(subject, question, student_answer, resource=None):
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
    result = chain.invoke(inputs)
    return result


# === Intial Feature Running ===
q = "What are the main advantages of using the Waterfall Model in software development?"
ans = "“The Waterfall Model is easy to understand and manage because it follows a step-by-step process. It works well when project requirements are fixed and clearly defined. Each phase must be completed before moving to the next, which makes tracking progress and ensuring documentation much simpler.”"
subject = "Software Engineering"
resource_txt  = dp.extract_text("D:/College/6th Semester/Software Engineering/Lectures/Lec 2 Ch2 SW Processes Final.pdf")
response = give_feedback(subject, q, ans, resource_txt)
print(response)