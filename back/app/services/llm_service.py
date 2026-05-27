import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_KEY")
)

def generate_llm_report(data):

    prompt = f"""
You are a statistical data analyst.

Interpret the following statistical analysis results.

Rules:
- Do not invent new variables
- Do not exaggerate conclusions
- Explain whether the relationship is weak or strong
- Explain practical significance
- Keep response short and professional

Data:
{json.dumps(data, indent=2)}
"""

    response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[
        {
            "role": "user",
            "content": prompt
        }
    ],
    temperature=0.2
    )

    return response.choices[0].message.content