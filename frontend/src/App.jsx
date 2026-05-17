import { useRef, useState, useCallback, useEffect } from 'react'
import { captureFramesAtOnePerSecond } from './utils/frameCapture'
import { sendFramesToGemma } from './services/gemmaApi'
import { orchestrateBasecampPlan } from './services/basecampApi'
import { useMeshTransport } from './hooks/useMeshTransport'
import DashboardShell from './components/DashboardShell'
import MeshHealthSection from './components/MeshHealthSection'
import CameraCaptureSection from './components/CameraCaptureSection'
import IncidentTimelineSection from './components/IncidentTimelineSection'
import TriageQueueSection from './components/TriageQueueSection'
import BasecampSection from './components/BasecampSection'
import LiveMapSection from './components/LiveMapSection'
import ReportModal from './components/ReportModal'

function App() {
  const webcamRef = useRef(null)
  const [reports, setReports] = useState([])
  const hasHydratedReportsRef = useRef(false)

  // Handle reports from peers
  const onReportReceived = useCallback((newReport) => {
    setReports((prev) => {
      // Prevent duplicates by ID
      if (prev.some(r => r.id === newReport.id)) return prev

      const imageHash = newReport?.image && !newReport?.image_hash
        ? hashString(String(newReport.image).slice(0, 1200))
        : newReport?.image_hash
      const incoming = { ...newReport, image_hash: imageHash }
      const fingerprint = getReportFingerprint(incoming)
      const duplicate = findDuplicateReport({ ...incoming, fingerprint }, prev)
      const normalizedReport = {
        ...incoming,
        fingerprint,
        is_duplicate: Boolean(duplicate),
        duplicate_of: duplicate?.id || null,
      }

      return [normalizedReport, ...prev]
    })
  }, []);

  const [meshTransport, setMeshTransport] = useState('webrtc')
  const { peerId, connections, meshStatus, connectToPeer, broadcastReport, broadcastMessage } = useMeshTransport(
    meshTransport,
    onReportReceived,
    () => {}
  )

  const [apiStatus] = useState('Gemma API connection ready')
  const [connectInput, setConnectInput] = useState('')
  const [selectedReport, setSelectedReport] = useState(null)
  const [basecampPlan, setBasecampPlan] = useState(null)
  const [isOrchestrating, setIsOrchestrating] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [recordingStatus, setRecordingStatus] = useState('Ready to capture frames')
  const [capturedFrames, setCapturedFrames] = useState([])
  const [captureError, setCaptureError] = useState('')
  const [actionChecklist, setActionChecklist] = useState({})
  const [lowPowerMode, setLowPowerMode] = useState(false)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [activeSection, setActiveSection] = useState('mesh')
  const [useDeviceGps, setUseDeviceGps] = useState(false)
  const [gpsStatus, setGpsStatus] = useState('GPS idle')
  const [deviceGps, setDeviceGps] = useState(null)
  const gpsWatchIdRef = useRef(null)
  const gpsRetryTimeoutRef = useRef(null)
  const gpsRetryInFlightRef = useRef(false)
  const deviceGpsRef = useRef(null)
  const gpsPermissionStateRef = useRef('prompt')
  const fileInputRef = useRef(null)
  const gemmaApiUrl = import.meta.env.VITE_KAGGLE_API_URL || import.meta.env.VITE_GEMMA_API_URL
  const basecampApiUrl = import.meta.env.VITE_BASECAMP_API_URL || gemmaApiUrl
  const clientIdRef = useRef(typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `client-${Date.now()}-${Math.floor(Math.random() * 1000)}`)
  const localNodeId = peerId || clientIdRef.current
  const knownNodeIds = [localNodeId, ...connections].filter(Boolean)

  useEffect(() => {
    if (hasHydratedReportsRef.current) return
    hasHydratedReportsRef.current = true
    try {
      const raw = localStorage.getItem('resiliomesh.reports')
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        setReports(parsed)
      }
    } catch (err) {
      console.warn('Failed to hydrate reports from storage', err)
    }
  }, [])

  useEffect(() => {
    if (!hasHydratedReportsRef.current) return
    try {
      localStorage.setItem('resiliomesh.reports', JSON.stringify(reports))
    } catch (err) {
      console.warn('Failed to persist reports', err)
    }
  }, [reports])

  // --- Defaults & helper utilities (kept minimal to avoid render errors) ---
  const MAX_FRAMES = 3
  const RECORD_SECONDS = 3
  const MAX_IMAGE_SIDE = 1024

  const formatTimestamp = (ts) => {
    try {
      const d = ts ? new Date(ts) : new Date()
      return d.toLocaleString()
    } catch (e) {
      return String(ts)
    }
  }

  const hashString = (value) => {
    const str = String(value || '')
    let hash = 5381
    for (let i = 0; i < str.length; i += 1) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i)
    }
    return `h${Math.abs(hash)}`
  }

  const getReportFingerprint = (r) => {
    if (r?.fingerprint) return r.fingerprint
    if (r?.image_hash) return r.image_hash
    const signature = [r?.location, r?.risk_level, r?.help_needed].filter(Boolean).join('|')
    return hashString(signature)
  }

  const parseLocation = (locStr) => {
    if (!locStr) return null
    const parts = String(locStr).split(',').map(x => parseFloat(x.trim()))
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { lat: parts[0], lng: parts[1] }
    }
    return null
  }

  const findDuplicateReport = (r, list = []) => {
    return list.find((x) => {
      // Don't match against self
      if (x.id === r.id) return false

      // Check 1: Identical image hashes
      if (r.image_hash && x.image_hash && r.image_hash === x.image_hash) {
        return true
      }

      // Check 2: Same classified help needed category AND close spatial proximity (approx ~500m / 0.005 degrees)
      if (r.help_needed && x.help_needed && r.help_needed.toLowerCase().trim() === x.help_needed.toLowerCase().trim()) {
        const p1 = parseLocation(r.location)
        const p2 = parseLocation(x.location)
        if (p1 && p2) {
          const dLat = Math.abs(p1.lat - p2.lat)
          const dLng = Math.abs(p1.lng - p2.lng)
          if (dLat <= 0.005 && dLng <= 0.005) {
            return true
          }
        } else if (r.location && x.location && r.location === x.location) {
          return true
        }
      }

      // Check 3: Fingerprint direct match (legacy fallback)
      const fp1 = getReportFingerprint(r)
      const fp2 = getReportFingerprint(x)
      if (fp1 && fp2 && fp1 === fp2) {
        return true
      }

      return false
    }) || null
  }

  const makeReportId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return `RPT-${crypto.randomUUID()}`
    return `RPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  }

  const buildGemmaPrompt = (requestId) => (
    'You are an emergency response analyst. Return ONLY raw JSON. ' +
    'Keys: request_id, location, risk_level, help_needed, description, confidence, recommended_actions. ' +
    'Example: {"request_id": "' + requestId + '", "location": "16.5062, 80.6480", "risk_level": "High", "help_needed": "Medical", "description": "...", "confidence": 0.95, "recommended_actions": ["..."]}. ' +
    'Rules: risk_level must be High, Medium, or Low. confidence 0.0-1.0. ' +
    'recommended_actions must be an array. ' +
    `Echo request_id exactly as: ${requestId}. ` +
    'If location unknown, use "16.5062, 80.6480".'
  )

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) handleFileUpload({ target: { files: [file] } })
  }
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = () => setIsDragging(false)

  const buildReportFromAnalysis = (analysis, image, source = 'local-device') => {
    const timestamp = Date.now()
    const imageHash = image ? hashString(String(image).slice(0, 1200)) : null
    const fallbackSignature = [analysis.location, analysis.risk_level, analysis.help_needed, analysis.description]
      .filter(Boolean)
      .join('|')
    const fingerprint = imageHash || hashString(fallbackSignature)
    return {
      id: makeReportId(),
      captured_at: timestamp,
      request_id: analysis.request_id,
      client_id: clientIdRef.current,
      location: analysis.location || '16.5062, 80.6480',
      location_source: analysis.location_source || 'model',
      risk_level: analysis.risk_level || 'High',
      help_needed: analysis.help_needed || 'Analysis Error',
      description: analysis.description || 'No description provided.',
      confidence: typeof analysis.confidence === 'number' ? analysis.confidence : 0.5,
      recommended_actions: Array.isArray(analysis.recommended_actions) ? analysis.recommended_actions : [],
      source,
      fingerprint,
      image_hash: imageHash,
      image,
      device_gps: useDeviceGps ? deviceGpsRef.current : null,
    }
  }

  const analyzeFrames = async (frames, image) => {
    if (!frames?.length) {
      setCaptureError('No frames available to analyze.')
      return
    }

    setCaptureError('')
    setRecordingStatus('Sending frames to Gemma...')

    try {
      const requestId = `${clientIdRef.current}-${Date.now()}`
      const analysis = await sendFramesToGemma(gemmaApiUrl, frames, buildGemmaPrompt(requestId), requestId)

      // Use the analysis ID if present, otherwise fallback to the one we sent
      const finalAnalysis = {
        ...analysis,
        request_id: analysis?.request_id || requestId
      }

      const report = buildReportFromAnalysis(finalAnalysis, image)
      setReports((prev) => {
        const duplicate = findDuplicateReport(report, prev)
        const finalReport = {
          ...report,
          is_duplicate: Boolean(duplicate),
          duplicate_of: duplicate?.id || null,
        }
        broadcastReport?.(finalReport)
        return [finalReport, ...prev]
      })
      setRecordingStatus('Ready to capture frames')
    } catch (err) {
      const urlHint = gemmaApiUrl ? ` (${gemmaApiUrl})` : ''
      setCaptureError(err?.message || `Failed to send frames to Gemma${urlHint}.`)
      setRecordingStatus('Ready to capture frames')
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target?.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const data = reader.result
      setCapturedFrames((p) => [data, ...p].slice(0, MAX_FRAMES))
      analyzeFrames([data], data)
    }
    reader.readAsDataURL(file)
  }

  const handleRecord = async () => {
    setIsRecording(true)
    setRecordingStatus('Recording...')

    try {
      const duration = lowPowerMode ? 1 : RECORD_SECONDS
      const resolution = lowPowerMode ? 512 : MAX_IMAGE_SIDE

      const frames = await captureFramesAtOnePerSecond(
        webcamRef.current?.video,
        duration,
        { maxSide: resolution, quality: lowPowerMode ? 0.4 : 0.7 }
      )

      if (!frames.length) {
        setCaptureError('No frames captured. Check camera permissions.')
        setRecordingStatus('Ready to capture frames')
        return
      }

      setCapturedFrames(frames.slice(0, MAX_FRAMES))
      await analyzeFrames(frames, frames[0])
    } finally {
      setIsRecording(false)
    }
  }

  const handleRunOrchestration = async () => {
    if (!reports.length) return
    setIsOrchestrating(true)
    try {
      const plan = await orchestrateBasecampPlan(basecampApiUrl, reports)
      setBasecampPlan(plan)
    } catch (err) {
      console.error('Basecamp orchestration failed:', err)
      // Provide a fallback UI error state if needed
      setBasecampPlan({ summary: `Error generating plan: ${err.message}`, prioritized_incidents: [], deployment_recommendations: [] })
    } finally {
      setIsOrchestrating(false)
    }
  }

  useEffect(() => {
    if (!useDeviceGps) {
      if (gpsWatchIdRef.current) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current)
        gpsWatchIdRef.current = null
      }
      setGpsStatus('GPS idle')
      setDeviceGps(null)
      deviceGpsRef.current = null
      return
    }

    if (!navigator.geolocation) {
      setGpsStatus('Geolocation not supported')
      return
    }

    setGpsStatus('Searching for satellite fix...')

    const onGpsSuccess = (pos) => {
      const coords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        altitude: pos.coords.altitude,
        heading: pos.coords.heading,
        speed: pos.coords.speed,
        ts: pos.timestamp,
      }
      setDeviceGps(coords)
      deviceGpsRef.current = coords
      setGpsStatus(`GPS fix acquired (~${Math.round(pos.coords.accuracy)}m)`)
    }

    const onGpsError = (err) => {
      console.warn('GPS Error:', err)
      if (err.code === 3) { // Timeout
        setGpsStatus('High-accuracy timeout. Trying standard fix...')
        // Fallback to lower accuracy if high accuracy fails
        if (gpsWatchIdRef.current) navigator.geolocation.clearWatch(gpsWatchIdRef.current)
        gpsWatchIdRef.current = navigator.geolocation.watchPosition(onGpsSuccess, 
          (e) => setGpsStatus(`GPS Error: ${e.message}`), 
          { enableHighAccuracy: false, timeout: 15000 }
        )
      } else {
        setGpsStatus(`GPS Error: ${err.message}`)
      }
    }

    gpsWatchIdRef.current = navigator.geolocation.watchPosition(onGpsSuccess, onGpsError, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 15000,
    })

    return () => {
      if (gpsWatchIdRef.current) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current)
        gpsWatchIdRef.current = null
      }
    }
  }, [useDeviceGps])

  const requestHighAccuracyFix = () => {
    if (!navigator.geolocation) return
    setGpsStatus('Requesting high-accuracy fix...')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          ts: pos.timestamp,
        }
        setDeviceGps(coords)
        deviceGpsRef.current = coords
        setGpsStatus(`GPS fix acquired (~${Math.round(pos.coords.accuracy)}m)`)
      },
      (err) => {
        // Immediate fallback for manual retry
        navigator.geolocation.getCurrentPosition(
          (pos) => {
             const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, ts: pos.timestamp }
             setDeviceGps(coords)
             deviceGpsRef.current = coords
             setGpsStatus(`Standard fix acquired (~${Math.round(pos.coords.accuracy)}m)`)
          },
          (e) => setGpsStatus(`GPS Error: ${e.message}`),
          { enableHighAccuracy: false, timeout: 10000 }
        )
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const handleExportJson = () => {
    if (!reports.length) return
    const blob = new Blob([JSON.stringify(reports, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `resiliomesh-reports-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExportCsv = () => {
    if (!reports.length) return
    const columns = [
      'id',
      'captured_at',
      'risk_level',
      'help_needed',
      'confidence',
      'location',
      'description',
      'source',
      'request_id',
      'client_id',
    ]
    const escapeValue = (value) => {
      const str = String(value ?? '')
      return `"${str.replace(/"/g, '""')}"`
    }
    const rows = reports.map((report) => (
      columns.map((key) => escapeValue(report[key])).join(',')
    ))
    const csv = [columns.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `resiliomesh-reports-${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getChecklistState = (reportId, actions = []) => {
    if (!actionChecklist[reportId]) {
      return Object.fromEntries(actions.map((a) => [a, false]))
    }
    return actionChecklist[reportId]
  }

  const toggleChecklistItem = (reportId, action) => {
    setActionChecklist((prev) => {
      const copy = { ...prev }
      copy[reportId] = { ...(copy[reportId] || {}), [action]: !((copy[reportId] || {})[action]) }
      return copy
    })
  }

  // Derived collections used by sections
  const timelineReports = reports
  const triageReports = [...reports].sort((a, b) => {
    const riskOrder = { High: 0, Medium: 1, Low: 2 }
    return (riskOrder[a.risk_level] - riskOrder[b.risk_level]) || ((b.confidence || 0) - (a.confidence || 0))
  })
  const triageCounts = { High: 0, Medium: 0, Low: 0 }
  triageReports.forEach((r) => { triageCounts[r.risk_level] = (triageCounts[r.risk_level] || 0) + 1 })

  const recentMeshCount = reports.length
  const meshSourceCount = new Set(reports.map((r) => r.source)).size
  const meshReportCount = reports.length
  const lastMeshTimestamp = reports.length > 0 ? (reports[0].captured_at || Date.now()) : null
  const coveragePercent = Math.min(100, Math.round((meshSourceCount / Math.max(1, 5)) * 100))
  const coverageLabel = coveragePercent > 66 ? 'Good' : coveragePercent > 33 ? 'Partial' : 'Sparse'
  const meshHealthLabel = connections.length > 4 ? 'High' : connections.length > 1 ? 'Medium' : 'Low'
  const meshHealthStyle = { High: 'bg-green-50 text-green-700 border-green-200', Medium: 'bg-amber-50 text-amber-700 border-amber-200', Low: 'bg-red-50 text-red-700 border-red-200' }

  const sections = [
    { id: 'mesh', label: 'Mesh Health' },
    { id: 'capture', label: 'Capture' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'triage', label: 'Triage' },
    { id: 'basecamp', label: 'Basecamp' },
    { id: 'map', label: 'Map' },
  ]

  const riskStyle = {
    High: 'bg-red-50 text-red-700 border-red-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Low: 'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <>
      <style>{`
        @keyframes fadeInScale {
          0% { opacity: 0; transform: scale(0.98) translateY(5px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-animate {
          animation: fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .fade-in {
          animation: fadeInScale 0.3s ease-out forwards;
        }
      `}</style>

      <DashboardShell
        sections={sections}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        meshStatus={meshStatus}
        connections={connections}
        connectInput={connectInput}
        setConnectInput={setConnectInput}
        connectToPeer={connectToPeer}
        meshTransport={meshTransport}
        onTransportChange={setMeshTransport}
      >
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Operations Console</p>
              <h3 className="text-lg font-extrabold text-slate-900">Incident Intake</h3>
              <p className="text-xs text-slate-500">Capture or upload imagery to populate the mesh timeline.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSection('capture')}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-sm transition hover:bg-indigo-700"
              >
                Start Capture
              </button>
              <button
                type="button"
                onClick={handleExportJson}
                disabled={!reports.length}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Export JSON
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={!reports.length}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Export CSV
              </button>
            </div>
          </div>
          {reports.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500">
              No reports yet. Upload imagery or start a capture to seed the timeline.
            </div>
          ) : null}
        </section>
        {activeSection === 'mesh' ? (
          <MeshHealthSection
            meshHealthLabel={meshHealthLabel}
            meshHealthStyle={meshHealthStyle}
            connections={connections}
            recentMeshCount={recentMeshCount}
            meshSourceCount={meshSourceCount}
            meshReportCount={meshReportCount}
            lastMeshTimestamp={lastMeshTimestamp}
            coverageLabel={coverageLabel}
            coveragePercent={coveragePercent}
            formatTimestamp={formatTimestamp}
          />
        ) : null}

        {activeSection === 'capture' ? (
          <CameraCaptureSection
            webcamRef={webcamRef}
            fileInputRef={fileInputRef}
            isCameraActive={isCameraActive}
            isDragging={isDragging}
            isRecording={isRecording}
            capturedFrames={capturedFrames}
            recordingStatus={recordingStatus}
            captureError={captureError}
            lowPowerMode={lowPowerMode}
            MAX_FRAMES={MAX_FRAMES}
            RECORD_SECONDS={RECORD_SECONDS}
            MAX_IMAGE_SIDE={MAX_IMAGE_SIDE}
            useDeviceGps={useDeviceGps}
            gpsStatus={gpsStatus}
            handleDrop={handleDrop}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleRecord={handleRecord}
            setIsCameraActive={setIsCameraActive}
            handleFileUpload={handleFileUpload}
            setLowPowerMode={setLowPowerMode}
            setUseDeviceGps={setUseDeviceGps}
            requestHighAccuracyFix={requestHighAccuracyFix}
          />
        ) : null}

        {activeSection === 'timeline' ? (
          <IncidentTimelineSection
            timelineReports={timelineReports}
            riskStyle={riskStyle}
            formatTimestamp={formatTimestamp}
            onSelectReport={setSelectedReport}
          />
        ) : null}

        {activeSection === 'triage' ? (
          <TriageQueueSection
            triageCounts={triageCounts}
            triageReports={triageReports}
            riskStyle={riskStyle}
            onSelectReport={setSelectedReport}
            onRunOrchestration={handleRunOrchestration}
            isOrchestrating={isOrchestrating}
            basecampPlan={basecampPlan}
          />
        ) : null}

        {activeSection === 'basecamp' ? (
          <BasecampSection
            onRunOrchestration={handleRunOrchestration}
            isOrchestrating={isOrchestrating}
            basecampPlan={basecampPlan}
            reportsCount={reports.length}
          />
        ) : null}

        {activeSection === 'map' ? (
          <LiveMapSection
            reports={reports}
            riskStyle={riskStyle}
            showHeatmap={showHeatmap}
            setShowHeatmap={setShowHeatmap}
            onSelectReport={setSelectedReport}
          />
        ) : null}
      </DashboardShell>

      <ReportModal
        selectedReport={selectedReport}
        setSelectedReport={setSelectedReport}
        riskStyle={riskStyle}
        getChecklistState={getChecklistState}
        toggleChecklistItem={toggleChecklistItem}
      />
    </>
  )
}

export default App
