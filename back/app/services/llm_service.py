import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_KEY")
)


def generate_llm_report(data):

    if not os.getenv("GROQ_KEY"):
        return "LLM report unavailable (GROQ_KEY not configured)."

    prompt = f"""
You are a senior data analyst.

You must:
- Explain statistical results clearly
- Do NOT hallucinate
- Use only provided data
- Judge:
  * statistical significance (based on p-value)
  * effect strength (based on metric)
  * practical meaning

Return format:
- 3-6 sentences max
- No bullet points
- No markdown
- No headers

---

ANALYSIS INPUT:
{json.dumps(data, indent=2)}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a strict statistical interpretation engine. "
                    "Never invent data. Be precise and conservative."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.1
    )

    return response.choices[0].message.content