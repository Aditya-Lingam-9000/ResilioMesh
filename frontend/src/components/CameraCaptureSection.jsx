import Webcam from 'react-webcam'

export default function CameraCaptureSection({
  webcamRef,
  fileInputRef,
  isCameraActive,
  isDragging,
  isRecording,
  capturedFrames,
  recordingStatus,
  captureError,
  lowPowerMode,
  MAX_FRAMES,
  RECORD_SECONDS,
  MAX_IMAGE_SIDE,
  useDeviceGps,
  gpsStatus,
  handleDrop,
  handleDragOver,
  handleDragLeave,
  handleRecord,
  setIsCameraActive,
  handleFileUpload,
  setLowPowerMode,
  setUseDeviceGps,
  requestHighAccuracyFix,
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="border-b border-slate-100 px-5 py-4 bg-slate-50/50">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">Camera Capture</h2>
        <p className="mt-1 text-xs text-slate-500">Record a short sample and extract frames.</p>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <div
            className={`overflow-hidden rounded-xl transition-all duration-300 relative h-[280px] sm:h-[360px] w-full flex flex-col justify-center items-center shadow-sm ${
              isCameraActive
                ? 'bg-slate-900 border border-slate-800'
                : isDragging
                  ? 'border-2 border-indigo-400 bg-indigo-50 border-dashed scale-[1.02]'
                  : 'border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 border-dashed'
            }`}
            onDrop={!isCameraActive ? handleDrop : undefined}
            onDragOver={!isCameraActive ? handleDragOver : undefined}
            onDragLeave={!isCameraActive ? handleDragLeave : undefined}
          >
            {isCameraActive ? (
              <Webcam
                ref={webcamRef}
                audio={false}
                mirrored={false}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: 'environment' }}
                className="h-full w-full object-cover rounded-xl"
              />
            ) : (
              <div className="text-center p-6 space-y-4 pointer-events-none transition-all">
                <div
                  className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
                    isDragging
                      ? 'bg-indigo-100 text-indigo-600 shadow-sm'
                      : 'bg-white text-slate-400 shadow-sm border border-slate-100'
                  }`}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <p className={`text-sm font-semibold tracking-wide transition-colors ${isDragging ? 'text-indigo-600' : 'text-slate-500'}`}>
                  {isDragging ? 'Drop image here!' : 'Camera inactive. Drop image here.'}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {isCameraActive ? (
              <button
                type="button"
                onClick={handleRecord}
                disabled={isRecording}
                className="col-span-2 rounded-xl bg-red-600 px-5 py-3.5 text-sm font-bold tracking-wide text-white shadow-sm transition hover:bg-red-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                {isRecording ? 'Recording Stream...' : 'Record Damage Clip'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsCameraActive(true)}
                  className="col-span-1 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold tracking-wide text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Turn On Camera
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="col-span-1 border border-slate-200 rounded-xl bg-white px-5 py-3.5 text-sm font-bold tracking-wide text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                >
                  Upload Image
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </>
            )}
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600 shadow-sm transition-colors hover:bg-white hover:border-slate-200">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="font-semibold text-slate-800 text-xs uppercase tracking-wide">Low-power mode</span>
              <input
                type="checkbox"
                checked={lowPowerMode}
                onChange={(event) => setLowPowerMode(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-colors"
              />
            </label>
            <p className="mt-1 text-[11px] font-medium text-slate-500">
              Profile: {lowPowerMode ? 1 : MAX_FRAMES} frame(s), {lowPowerMode ? 1 : RECORD_SECONDS}s, {lowPowerMode ? 512 : MAX_IMAGE_SIDE}px max.
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600 shadow-sm transition-colors hover:bg-white hover:border-slate-200">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="font-semibold text-slate-800 text-xs uppercase tracking-wide">Attach device GPS</span>
              <input
                type="checkbox"
                checked={useDeviceGps}
                onChange={(event) => setUseDeviceGps(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-colors"
              />
            </label>
            <p className="mt-1.5 text-xs font-medium text-slate-500">{gpsStatus}</p>
            {useDeviceGps ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                <button
                  type="button"
                  onClick={requestHighAccuracyFix}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
                >
                  Retry GPS fix
                </button>
                <span>Ensure device location services are enabled.</span>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm transition-colors hover:bg-white hover:border-slate-200">
            <p className="font-semibold text-slate-800 text-xs uppercase tracking-wide">Status</p>
            <p className="mt-1 font-medium">{recordingStatus}</p>
            {captureError ? (
              <p className="mt-2 text-xs font-semibold text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                {captureError}
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm transition-all hover:bg-slate-50">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Captured Base64 Frames</h3>
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
              {capturedFrames.length}
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {capturedFrames.length > 0 ? (
              capturedFrames.map((frame, index) => (
                <article
                  key={`${index}-${frame.slice(0, 24)}`}
                  className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="overflow-hidden rounded-md border border-slate-100 bg-slate-50">
                    <img src={frame} alt={`Captured frame ${index + 1}`} className="h-36 w-full object-cover" />
                  </div>
                  <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Base64 string preview
                  </p>
                  <p className="break-all text-[11px] font-medium text-slate-500 mt-1">{frame.slice(0, 80)}...</p>
                </article>
              ))
            ) : (
              <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white shadow-sm">
                <p className="text-xs font-medium text-slate-400">Captured frames will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
