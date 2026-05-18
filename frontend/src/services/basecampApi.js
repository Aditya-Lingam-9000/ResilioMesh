const repairTruncatedJson = (str) => {
  if (!str) return '{}'
  let cleaned = str.trim()
  
  // Find first opening brace
  const firstBrace = cleaned.indexOf('{')
  if (firstBrace === -1) return '{}'
  cleaned = cleaned.slice(firstBrace)
  
  let openBraces = 0
  let openBrackets = 0
  let inString = false
  let escaped = false
  let balancedIndex = -1
  
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i]
    if (escaped) {
      escaped = false
      continue
    }
    if (char === '\\') {
      escaped = true
      continue
    }
    if (char === '"') {
      inString = !inString
      continue
    }
    if (!inString) {
      if (char === '{') {
        openBraces++
      } else if (char === '}') {
        openBraces = Math.max(0, openBraces - 1)
        if (openBraces === 0) {
          balancedIndex = i
        }
      } else if (char === '[') {
        openBrackets++
      } else if (char === ']') {
        openBrackets = Math.max(0, openBrackets - 1)
      }
    }
  }

  // If the braces became fully balanced at some point, discard trailing markdown/text
  if (balancedIndex !== -1 && openBraces === 0) {
    cleaned = cleaned.slice(0, balancedIndex + 1)
  } else {
    // If not balanced (e.g. truncated), perform healing
    if (inString) {
      cleaned += '"'
    }

    let trailingText = cleaned.trim()
    while (
      trailingText.endsWith(',') || 
      trailingText.endsWith(':') || 
      trailingText.endsWith('[') ||
      trailingText.endsWith('{')
    ) {
      if (trailingText.endsWith('{')) openBraces = Math.max(0, openBraces - 1)
      if (trailingText.endsWith('[')) openBrackets = Math.max(0, openBrackets - 1)
      trailingText = trailingText.slice(0, -1).trim()
    }
    cleaned = trailingText

    while (openBrackets > 0) {
      cleaned += ']'
      openBrackets--
    }

    while (openBraces > 0) {
      cleaned += '}'
      openBraces--
    }
  }

  return cleaned
}

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

  const text = await res.text()
  let data
  try {
    const cleanedText = text.trim()
    if (cleanedText.startsWith('{') && cleanedText.endsWith('}')) {
      data = JSON.parse(cleanedText)
    } else {
      // If it contains markdown/preamble, parse with our robust healer
      const healedJson = repairTruncatedJson(cleanedText)
      data = JSON.parse(healedJson)
    }
  } catch (e) {
    console.warn('Direct parse failed, attempting general repair:', e)
    try {
      const healedJson = repairTruncatedJson(text)
      data = JSON.parse(healedJson)
    } catch (err) {
      throw new Error(`Failed to parse or repair Basecamp response: ${err.message}`)
    }
  }

  // Fallback: If the server returned a raw_response string instead of parsed JSON, try parsing/repairing it here
  if (data.raw_response && !data.summary) {
    try {
      const rawText = data.raw_response.trim()
      const healedJson = repairTruncatedJson(rawText)
      const parsed = JSON.parse(healedJson)
      return { ...data, ...parsed }
    } catch (e) {
      console.warn('Frontend fallback parsing failed:', e)
    }
  }

  return data
}
