import { useCallback, useEffect, useRef, useState } from 'react'

const SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb'
const CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb'

const isBluetoothSupported = () => typeof navigator !== 'undefined' && Boolean(navigator.bluetooth)

export function useBluetoothMesh(onReportReceived, onMeshMessage) {
  const [connections, setConnections] = useState([])
  const [meshStatus, setMeshStatus] = useState('Bluetooth idle')
  const deviceRef = useRef(null)
  const characteristicRef = useRef(null)

  useEffect(() => {
    if (!isBluetoothSupported()) {
      setMeshStatus('Bluetooth unavailable in this browser')
    }
  }, [])

  const connectToPeer = useCallback(async () => {
    if (!isBluetoothSupported()) {
      setMeshStatus('Bluetooth unavailable in this browser')
      return
    }

    try {
      setMeshStatus('Scanning for Bluetooth devices...')
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [SERVICE_UUID],
      })
      deviceRef.current = device

      setMeshStatus(`Connecting to ${device.name || 'device'}...`)
      const server = await device.gatt.connect()
      const service = await server.getPrimaryService(SERVICE_UUID)
      const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID)
      characteristicRef.current = characteristic

      await characteristic.startNotifications()
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        try {
          const value = event.target.value
          const decoded = new TextDecoder().decode(value)
          const parsed = JSON.parse(decoded)
          if (!parsed || typeof parsed !== 'object') return
          if (parsed.type === 'REPORT' && parsed.payload) {
            onReportReceived(parsed.payload)
            return
          }
          if (onMeshMessage) {
            onMeshMessage(parsed)
          }
        } catch (err) {
          console.warn('Bluetooth payload parse failed', err)
        }
      })

      setConnections((prev) => {
        const name = device.name || device.id || 'Bluetooth peer'
        if (prev.includes(name)) return prev
        return [...prev, name]
      })
      setMeshStatus(`Bluetooth connected: ${device.name || device.id || 'device'}`)
    } catch (err) {
      setMeshStatus(`Bluetooth error: ${err.message}`)
    }
  }, [onReportReceived])

  const broadcastReport = useCallback(async (report) => {
    const characteristic = characteristicRef.current
    if (!characteristic) {
      setMeshStatus('Bluetooth not connected')
      return
    }

    try {
      const payload = JSON.stringify({ type: 'REPORT', payload: report })
      const data = new TextEncoder().encode(payload)
      await characteristic.writeValue(data)
      setMeshStatus('Bluetooth report sent')
    } catch (err) {
      setMeshStatus(`Bluetooth send failed: ${err.message}`)
    }
  }, [])

  const broadcastMessage = useCallback(async (type, payload = {}) => {
    const characteristic = characteristicRef.current
    if (!characteristic) {
      setMeshStatus('Bluetooth not connected')
      return
    }

    try {
      const message = JSON.stringify({ type, payload })
      const data = new TextEncoder().encode(message)
      await characteristic.writeValue(data)
      setMeshStatus('Bluetooth message sent')
    } catch (err) {
      setMeshStatus(`Bluetooth send failed: ${err.message}`)
    }
  }, [])

  return {
    peerId: 'bluetooth',
    connections,
    meshStatus,
    connectToPeer,
    broadcastReport,
    broadcastMessage,
  }
}
