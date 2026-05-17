const sanitizeFilePart = (value) => {
  if (!value) return 'report'
  return value.toString().replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 60)
}

export const buildEvidencePack = (report) => {
  const nowIso = new Date().toISOString()

  return {
    schema_version: 'resilio.evidence-pack.v1',
    generated_at: nowIso,
    report: {
      id: report?.id || `RPT-${Date.now()}`,
      location: report?.location || '16.5062, 80.6480',
      risk_level: report?.risk_level || 'High',
      help_needed: report?.help_needed || 'Analysis Error',
      description: report?.description || 'No description provided.',
      confidence: typeof report?.confidence === 'number' ? report.confidence : 0.5,
      recommended_actions: Array.isArray(report?.recommended_actions) ? report.recommended_actions : [],
      source: report?.source || 'local-device',
      image_data_url: report?.image || null,
      captured_at: report?.captured_at || nowIso,
      location_source: report?.location_source || 'model',
      device_gps: report?.device_gps || null,
    },
    device: {
      user_agent: navigator.userAgent,
    },
    app: {
      name: 'Resilio Mesh',
    },
  }
}

export const downloadEvidencePack = (report) => {
  const pack = buildEvidencePack(report)
  const json = JSON.stringify(pack, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `resilio_evidence_${sanitizeFilePart(pack.report.id)}.json`

  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
