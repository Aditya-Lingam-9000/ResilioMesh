const DEFAULT_LLAMA_MODEL = 'gemma-4-e2b-it'
const DEFAULT_MAX_TOKENS = 512
const MAX_REPAIR_CHARS = 4000

const isChatCompletionsUrl = (apiUrl) => apiUrl.includes('/v1/chat/completions')

const normalizeGemmaResponse = (data) => {
  if (!data || typeof data !== 'object') return null

  const requestId = typeof data.request_id === 'string' ? data.request_id : undefined
  const location = typeof data.location === 'string' ? data.location : ''
  const locationMatch = location.match(/-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?/)

  const confidenceValue = typeof data.confidence === 'number'
    ? data.confidence
    : Number.parseFloat(data.confidence)

  const riskLevel = ['High', 'Medium', 'Low'].includes(data.risk_level)
    ? data.risk_level
    : 'High'

  const recommendedActions = Array.isArray(data.recommended_actions)
    ? data.recommended_actions
    : []

  const normalizedConfidence = Number.isFinite(confidenceValue)
    ? Math.min(1, Math.max(0, confidenceValue))
    : 0.5

  return {
    request_id: requestId,
    location: locationMatch ? locationMatch[0] : '16.5062, 80.6480',
    risk_level: riskLevel,
    help_needed: typeof data.help_needed === 'string' ? data.help_needed : 'Analysis Error',
    description: typeof data.description === 'string' ? data.description : 'No description provided.',
    confidence: normalizedConfidence,
    recommended_actions: recommendedActions,
    raw: data.raw || undefined,
  }
}

const repairTruncatedJson = (str) => {
  if (!str) return '{}'
  let cleaned = str.trim()
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

const extractJsonFromText = (text) => {
  if (!text) return null

  const trimmed = text.trim()
  const unfenced = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  // Try parsing directly first
  try {
    return JSON.parse(unfenced)
  } catch (e) {
    // If direct parse fails, find boundaries
    const firstBrace = unfenced.indexOf('{')
    const lastBrace = unfenced.lastIndexOf('}')

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = unfenced.slice(firstBrace, lastBrace + 1)
      try {
        return JSON.parse(candidate)
      } catch (err) {
        // Try healing the candidate
        try {
          const healed = repairTruncatedJson(candidate)
          return JSON.parse(healed)
        } catch {
          // ignore and fall through
        }
      }
    }

    // Try healing the entire unfenced block directly
    if (firstBrace !== -1) {
      try {
        const healed = repairTruncatedJson(unfenced)
        return JSON.parse(healed)
      } catch (err) {
        // ignore and fall through
      }
    }

    // Fallback: try the original regex-based approach for multiple small objects
    const matches = unfenced.match(/\{[\s\S]*?\}/g)
    if (matches) {
      for (const m of matches) {
        try {
          return JSON.parse(m)
        } catch {
          continue
        }
      }
    }
  }

  return null
}

const buildChatPayload = (apiUrl, messages, maxTokens = DEFAULT_MAX_TOKENS) => {
  const payload = {
    model: DEFAULT_LLAMA_MODEL,
    messages,
    temperature: 0.1,
    top_p: 1.0,
    max_tokens: maxTokens,
  }
  
  // Only use json_object if not a local loopback address (some local servers struggle with it)
  if (!apiUrl.includes('127.0.0.1') && !apiUrl.includes('localhost')) {
    payload.response_format = { type: 'json_object' }
  }
  
  return payload
}

const fetchChatCompletion = async (apiUrl, payload) => {
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gemma API error ${res.status}: ${text}`)
  }

  return res.json()
}

const parseChatContent = (content) => {
  if (!content) return null

  if (typeof content === 'object') {
    // If it's already an object, normalize it
    return normalizeGemmaResponse(content) || content
  }

  // If it's a string, try to extract JSON
  const parsed = extractJsonFromText(content)
  if (parsed) return normalizeGemmaResponse(parsed) || parsed
  
  // If no JSON found, try to extract fields using regex as a last resort
  const location = content.match(/-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?/)?.[0] || '16.5062, 80.6480'
  const risk = content.match(/High|Medium|Low/i)?.[0] || 'High'
  const risk_level = risk.charAt(0).toUpperCase() + risk.slice(1).toLowerCase()
  
  // Heuristic for help_needed (look for short sentences or specific keywords)
  const helpMatch = content.match(/Needs?:\s*([^\n.]+)/i) || content.match(/Assistance:\s*([^\n.]+)/i)
  const help_needed = helpMatch ? helpMatch[1].trim() : 'Manual Review'

  return normalizeGemmaResponse({
    location,
    risk_level,
    help_needed,
    description: content.slice(0, 500),
    confidence: 0.4,
    recommended_actions: ['Manual review recommended'],
    raw: content
  })
}

const repairJsonResponse = async (apiUrl, rawText) => {
  const trimmed = (rawText || '').slice(0, MAX_REPAIR_CHARS)
  const messages = [
    {
      role: 'system',
      content: 'Return ONLY raw JSON. No explanations, no markdown, no thinking. Start with { and end with }.',
    },
    {
      role: 'user',
      content: `Convert the following into JSON with keys: location, risk_level, help_needed, description, confidence, recommended_actions. If missing, use defaults: location "16.5062, 80.6480", risk_level "High", help_needed "Analysis Error", description "No description provided.", confidence 0.5, recommended_actions ["Manual review recommended"].\n\n${trimmed}`,
    },
  ]

  const data = await fetchChatCompletion(apiUrl, buildChatPayload(apiUrl, messages, DEFAULT_MAX_TOKENS))
  return parseChatContent(data?.choices?.[0]?.message?.content)
}

export async function sendFramesToGemma(apiUrl, frames = [], prompt = '', requestId = '') {
  if (!apiUrl) {
    throw new Error('No Gemma API URL configured. Set VITE_GEMMA_API_URL or VITE_KAGGLE_API_URL in .env')
  }

  if (isChatCompletionsUrl(apiUrl)) {
    const contentParts = frames.map((frame) => ({
      type: 'image_url',
      image_url: { url: frame },
    }))
    contentParts.push({
      type: 'text',
      text: 'Analyze the image and follow the system instructions exactly.',
    })

    const messages = prompt
      ? [
        { role: 'system', content: prompt + ' DO NOT include any thinking process, reasoning, or preamble. Start your response directly with the JSON object.' },
        { role: 'user', content: contentParts }
      ]
      : [{ role: 'user', content: contentParts }]

    const data = await fetchChatCompletion(apiUrl, buildChatPayload(apiUrl, messages, DEFAULT_MAX_TOKENS))
    const content = data?.choices?.[0]?.message?.content
    console.log('Raw model output:', content)
    const parsed = parseChatContent(content)
    if (parsed) return parsed

    const repaired = await repairJsonResponse(apiUrl, content || '')
    if (repaired) return repaired

    return normalizeGemmaResponse({
      location: '16.5062, 80.6480',
      risk_level: 'High',
      help_needed: 'Analysis Error',
      description: 'Failed to parse model output. See raw field for details.',
      confidence: 0.0,
      recommended_actions: ['Manual review recommended'],
      raw: content || '',
    })
  }

  const payload = {
    request_id: requestId || undefined,
    prompt,
    frames,
  }

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gemma API error ${res.status}: ${text}`)
  }

  const data = await res.json()
  return normalizeGemmaResponse(data) || data
}
