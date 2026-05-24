import { useState, useRef, useCallback } from 'react';

export function useRealtimeVoice(onTriageComplete) {
  const [voiceState, setVoiceState] = useState('idle'); // idle, connecting, listening, speaking, error
  const [errorMsg, setErrorMsg] = useState('');
  
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const audioElRef = useRef(null);
  const streamRef = useRef(null);

  const startSession = useCallback(async () => {
    try {
      setVoiceState('connecting');
      setErrorMsg('');

      // 1. Get ephemeral token from backend
      const tokenResponse = await fetch('http://localhost:5000/api/realtime/token', { method: 'POST' });
      if (!tokenResponse.ok) throw new Error('Failed to fetch ephemeral token');
      const data = await tokenResponse.json();
      const EPHEMERAL_KEY = data.client_secret.value;

      // 2. Create Peer Connection
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Create an audio element to play agent's voice
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioElRef.current = audioEl;

      pc.ontrack = e => {
        audioEl.srcObject = e.streams[0];
        // Note: when remote track is playing, the agent is speaking
      };

      // 3. Add local microphone track
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = ms;
      pc.addTrack(ms.getTracks()[0]);

      // 4. Set up Data Channel for events
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.addEventListener('message', (e) => {
        try {
          const event = JSON.parse(e.data);
          // Handle specific Realtime API events
          if (event.type === 'response.audio.delta') {
            setVoiceState('speaking');
          }
          if (event.type === 'response.done') {
            setVoiceState('listening');
          }
          if (event.type === 'conversation.item.input_audio_transcription.completed') {
             // User finished speaking
             setVoiceState('processing');
          }
          // We can listen for function calls or specific phrases to trigger triage complete
          if (event.type === 'response.function_call_arguments.done') {
            // If we registered tools...
          }
        } catch (err) {
          console.error(err);
        }
      });

      // 5. Create Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 6. Send SDP to OpenAI
      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-realtime-preview-2024-12-17';
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          'Content-Type': 'application/sdp'
        },
      });

      if (!sdpResponse.ok) {
        throw new Error('Failed to connect to OpenAI WebRTC');
      }

      const answer = {
        type: 'answer',
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);
      
      setVoiceState('listening');

      // Send initial instructions if needed via data channel once open
      dc.addEventListener('open', () => {
        const initEvent = {
          type: 'session.update',
          session: {
            input_audio_transcription: { model: "whisper-1" }
          }
        };
        dc.send(JSON.stringify(initEvent));
      });

    } catch (err) {
      console.error('Realtime Voice Error:', err);
      setVoiceState('error');
      setErrorMsg(err.message);
      stopSession();
    }
  }, []);

  const stopSession = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setVoiceState('idle');
  }, []);

  return {
    voiceState,
    errorMsg,
    startSession,
    stopSession
  };
}
