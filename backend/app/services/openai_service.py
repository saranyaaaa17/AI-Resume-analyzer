import os

# Lightweight OpenAI integration starter. If OPENAI_API_KEY is set in env,
# this will attempt to use the OpenAI SDK; otherwise it returns a mocked reply.

OPENAI_KEY = os.environ.get("OPENAI_API_KEY")


def request_feedback_from_openai(resume_text: str) -> str:
    """Send a simple prompt and return text feedback. If API key not present,
    return a mocked response so the backend is still usable for dev/testing.
    """
    if not OPENAI_KEY:
        return "Mock feedback: resume parsed, consider adding metrics and clarifying role impact."

    try:
        import openai
        openai.api_key = OPENAI_KEY
        resp = openai.Completion.create(
            model="text-davinci-003",
            prompt=f"Provide brief feedback to improve this resume:\n\n{resume_text[:2000]}",
            max_tokens=150,
            temperature=0.3,
        )
        return resp.choices[0].text.strip()
    except Exception as ex:
        return f"OpenAI error: {ex}"
