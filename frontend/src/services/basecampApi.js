export const orchestrateBasecampPlan = async (apiUrl, reports = [], objective = 'Prioritize incidents and produce a response plan.') => {
  if (!apiUrl) {
    throw new Error('No Basecamp API URL configured. Set VITE_BASECAMP_API_URL in .env')
  }

  const payload = {
    request_id: `BC-${Date.now()}`,
    reports,
    objective,
  }

  const res = await fetch(`${apiUrl.replace(/\/$/, '')}/orchestrate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Basecamp API error ${res.status}: ${text}`)
  }

  const data = await res.json()

  // Fallback: If the server returned a raw_response string instead of parsed JSON, try parsing it here
  if (data.raw_response && !data.summary) {
    try {
      const text = data.raw_response.trim()
      const firstBrace = text.indexOf('{')
      const lastBrace = text.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonStr = text.slice(firstBrace, lastBrace + 1)
        const parsed = JSON.parse(jsonStr)
        return { ...data, ...parsed }
      }
    } catch (e) {
      console.warn('Frontend fallback parsing failed:', e)
    }
  }

  return data
}
