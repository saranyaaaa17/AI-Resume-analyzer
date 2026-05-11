import os
import re

# Lightweight OpenAI integration starter. If OPENAI_API_KEY is set in env,
# this will attempt to use the OpenAI SDK; otherwise it returns a heuristic reply.

OPENAI_KEY = os.environ.get("OPENAI_API_KEY")


def _generate_heuristic_feedback(resume_text: str) -> str:
    normalized_text = resume_text.lower()
    lines = [line.strip() for line in resume_text.splitlines() if line.strip()]

    suggestions = []

    if not re.search(r"\b\d+%|\b\d+\b", resume_text):
        suggestions.append("Add measurable impact such as percentages, revenue, latency, or time saved.")

    if not any(keyword in normalized_text for keyword in ("skills", "technologies", "technical skills", "tool", "stack")):
        suggestions.append("Add a clear skills section with tools, languages, and frameworks.")

    if not any(keyword in normalized_text for keyword in ("summary", "profile", "objective")):
        suggestions.append("Add a 2-3 line professional summary at the top.")

    if not any(keyword in normalized_text for keyword in ("experience", "work history", "employment")):
        suggestions.append("Make work experience easier to scan with role titles, dates, and bullet points.")

    if not any("@" in line for line in lines):
        suggestions.append("Include a visible email address and other contact details near the top.")

    if not suggestions:
        suggestions = [
            "Keep bullets action-focused and start each point with a strong verb.",
            "Tailor keywords to the job description and repeat the most relevant ones naturally.",
            "Trim weak filler and keep the strongest achievements near the top.",
        ]

    return "\n".join(f"- {suggestion}" for suggestion in suggestions[:4])


def request_feedback_from_openai(resume_text: str) -> str:
    """Send a simple prompt and return text feedback.

    If the API key is missing or the request fails, return heuristic feedback so
    the app still produces useful, content-aware suggestions during development.
    """
    if not OPENAI_KEY:
        return _generate_heuristic_feedback(resume_text)

    try:
        from openai import OpenAI

        client = OpenAI(api_key=OPENAI_KEY)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a concise resume reviewer. Return short bullet-point feedback."},
                {"role": "user", "content": f"Review this resume and give 3-4 concise improvement tips:\n\n{resume_text[:4000]}"},
            ],
            temperature=0.3,
            max_tokens=220,
        )
        content = response.choices[0].message.content
        return content.strip() if content else _generate_heuristic_feedback(resume_text)
    except Exception as ex:
        return f"OpenAI unavailable, using heuristic feedback instead.\n{_generate_heuristic_feedback(resume_text)}"
