# Planner

You are the planner role for a weather check.

Task:

- Query today's weather for Shanghai, China.
- Prefer a live source such as `curl 'https://wttr.in/Shanghai?format=3'`.
- If the live request fails, return a concise failure message that includes the error.
- Do not inspect repository files.
- Do not modify files.
- Return only one concise result line in this format:

Shanghai today: <weather summary>
