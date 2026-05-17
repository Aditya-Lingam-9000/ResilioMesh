import { useState, useEffect, useRef, useCallback } from 'react';
import { Peer } from 'peerjs';

export function usePeerMesh(onReportReceived, onMeshMessage) {
  const [peerId, setPeerId] = useState('');
  const [connections, setConnections] = useState([]);
  const [meshStatus, setMeshStatus] = useState('Initializing PeerJS...');
  const peerRef = useRef(null);
  const connectionsRef = useRef(new Map());

  // Handle incoming connections and data
  const handleConnection = useCallback((conn) => {
    conn.on('open', () => {
      setConnections(prev => {
        if (!prev.includes(conn.peer)) return [...prev, conn.peer];
        return prev;
      });
      connectionsRef.current.set(conn.peer, conn);
    });

    conn.on('data', (data) => {
      if (!data || typeof data !== 'object') return
      if (data.type === 'REPORT' && data.payload) {
        const payload = data.payload || {}
        const source = typeof payload.source === 'string' ? payload.source : ''
        const normalizedPayload = {
          ...payload,
          source_peer: conn.peer,
          source: source && !source.startsWith('local') ? source : `peer-${conn.peer}`
        }
        onReportReceived(normalizedPayload);
        return
      }
      if (onMeshMessage) {
        onMeshMessage(data)
      }
    });

    conn.on('close', () => {
      setConnections(prev => prev.filter(p => p !== conn.peer));
      connectionsRef.current.delete(conn.peer);
    });
  }, [onReportReceived]);

  useEffect(() => {
    // Generate a random 4-digit ID for simpler manual connecting in demo
    const generatedId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const peer = new Peer(generatedId, {
      debug: 2
    });

    peer.on('open', (id) => {
      setPeerId(id);
      setMeshStatus(`Connected to P2P. My ID: ${id}`);
    });

    // When someone else connects to us
    peer.on('connection', handleConnection);

    peer.on('error', (err) => {
      console.error('PeerJS Error:', err);
      setMeshStatus(`PeerJS Error: ${err.message}`);
    });

    peerRef.current = peer;

    return () => {
      peer.destroy();
    };
  }, [handleConnection]);

  // Connect to another peer manually
  const connectToPeer = useCallback((targetPeerId) => {
    const peer = peerRef.current;
    if (!peer || !targetPeerId) return;
    
    // Prevent connecting to self or already connected peer
    if (targetPeerId === peerId || connectionsRef.current.has(targetPeerId)) return;

    setMeshStatus(`Connecting to ${targetPeerId}...`);
    const conn = peer.connect(targetPeerId);
    handleConnection(conn);
    setMeshStatus(`Connected to P2P. My ID: ${peerId}`);
  }, [peerId, handleConnection]);

  // Broadcast a report to all connected peers
  const broadcastReport = useCallback((report) => {
    connectionsRef.current.forEach((conn) => {
      if (conn.open) {
        conn.send({
          type: 'REPORT',
          payload: report
        });
      }
    });
  }, []);

  const broadcastMessage = useCallback((type, payload = {}) => {
    connectionsRef.current.forEach((conn) => {
      if (conn.open) {
        conn.send({
          type,
          payload
        });
      }
    });
  }, []);

  return {
    peerId,
    connections,
    meshStatus,
    connectToPeer,
    broadcastReport,
    broadcastMessage
  };
}
