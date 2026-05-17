import { useMemo } from 'react'
import { usePeerMesh } from './usePeerMesh'
import { useBluetoothMesh } from './useBluetoothMesh'

export function useMeshTransport(transport, onReportReceived, onMeshMessage) {
  const webrtc = usePeerMesh(onReportReceived, onMeshMessage)
  const bluetooth = useBluetoothMesh(onReportReceived, onMeshMessage)

  return useMemo(() => {
    if (transport === 'bluetooth') return bluetooth
    return webrtc
  }, [transport, webrtc, bluetooth])
}
