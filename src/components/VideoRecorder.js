import React, { useRef, useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import Webcam from 'react-webcam';

const RecorderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
`;

const VideoPreview = styled.div`
  width: 100%;
  max-width: 350px;
  height: 500px;
  border: 2px solid var(--accent-green);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const RecordButton = styled.button`
  background-color: ${props => props.isRecording ? '#ff0000' : 'var(--accent-green)'};
  color: var(--text-dark);
  padding: 10px 20px;
  border-radius: 5px;
  font-weight: bold;
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  margin: 10px 0;
  text-align: center;
`;

const InfoMessage = styled.div`
  color: var(--accent-yellow);
  margin: 10px 0;
  text-align: center;
`;

const TroubleshootingTips = styled.div`
  margin-top: 10px;
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  font-size: 0.9rem;
`;

const VideoRecorder = ({ onVideoRecorded }) => {
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState('');
  const [hasUserMedia, setHasUserMedia] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(true);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Check if webcam is ready and has user media
  useEffect(() => {
    let checkUserMedia;
    
    const initCamera = () => {
      setIsCameraLoading(true);
      setError('');
      
      checkUserMedia = setInterval(() => {
        if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
          setHasUserMedia(true);
          setIsCameraLoading(false);
          clearInterval(checkUserMedia);
        } else if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 0) {
          // Still loading or no access
          setIsCameraLoading(true);
        }
      }, 100);
    };
    
    initCamera();
    
    return () => {
      clearInterval(checkUserMedia);
    };
  }, [retryCount]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        clearInterval(mediaRecorderRef.current.durationInterval);
      } catch (err) {
        console.error('Error stopping recording:', err);
      }
    }
    setIsRecording(false);
    setRecordingDuration(0);
  }, [mediaRecorderRef]);

  const handleStartRecording = useCallback(() => {
    setError('');
    
    // Check if webcam is ready
    if (!webcamRef.current || !webcamRef.current.video || !webcamRef.current.video.srcObject) {
      setError('Camera not ready. Please ensure camera permissions are granted and try again.');
      return;
    }
    
    // Start a 3-second countdown
    let count = 3;
    setCountdown(count);
    
    const countdownInterval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      
      if (count === 0) {
        clearInterval(countdownInterval);
        startRecording();
      }
    }, 1000);
  }, [webcamRef]);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    setRecordedVideo(null);
    setCountdown(null);
    setError('');
    
    try {
      // Make sure webcam is ready and has a stream
      if (!webcamRef.current || !webcamRef.current.video || !webcamRef.current.video.srcObject) {
        throw new Error('Camera stream not available');
      }
      
      const stream = webcamRef.current.video.srcObject;
      
      // Verify that we have a valid MediaStream
      if (!(stream instanceof MediaStream)) {
        throw new Error('Invalid media stream');
      }
      
      // Check if stream has video tracks
      if (stream.getVideoTracks().length === 0) {
        throw new Error('No video tracks available in the stream');
      }
      
      // Check if video tracks are active
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack.enabled || videoTrack.readyState !== 'live') {
        throw new Error(`Video track is not active: ${videoTrack.readyState}`);
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'video/webm'
      });
      
      const chunks = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        
        // Add validation and logging for the blob
        if (!blob || blob.size === 0) {
          console.error('Error: Created blob is empty or invalid');
          setError('Recording failed to produce valid video data. Please try again.');
          return;
        }
        
        console.log('Video recorded successfully. Blob size:', blob.size, 'bytes');
        
        const url = URL.createObjectURL(blob);
        setRecordedVideo({ url, blob });
        if (onVideoRecorded) {
          onVideoRecorded(blob);
        }
      };
      
      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError(`Recording error: ${event.error.name}`);
        setIsRecording(false);
      };
      
      mediaRecorderRef.current.start();
      
      // Start recording duration timer
      let duration = 0;
      const durationInterval = setInterval(() => {
        duration += 1;
        setRecordingDuration(duration);
        
        // Auto-stop after 3 seconds
        if (duration >= 3) {
          clearInterval(durationInterval);
          handleStopRecording();
        }
      }, 1000);
      
      // Store the interval ID to clear it if user stops manually
      mediaRecorderRef.current.durationInterval = durationInterval;
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(`Failed to start recording: ${err.message}`);
      setIsRecording(false);
      setShowTroubleshooting(true);
    }
  }, [webcamRef, onVideoRecorded, handleStopRecording]);


  const handleReset = useCallback(() => {
    setRecordedVideo(null);
    setError('');
    setShowTroubleshooting(false);
  }, []);
  
  const handleRetryCamera = useCallback(() => {
    // Increment retry count to trigger useEffect
    setRetryCount(prev => prev + 1);
    setShowTroubleshooting(false);
    setError('');
  }, []);
  
  // Generate troubleshooting tips based on error
  const getTroubleshootingTips = () => {
    return (
      <TroubleshootingTips>
        <h4>Troubleshooting Tips:</h4>
        <ul>
          <li>Close other applications that might be using your camera (Zoom, Teams, etc.)</li>
          <li>Try refreshing the page</li>
          <li>Check if your camera is working in other applications</li>
          <li>If using an external camera, try disconnecting and reconnecting it</li>
          <li>Try a different browser (Chrome or Firefox recommended)</li>
          <li>Restart your computer</li>
        </ul>
        <p><strong>NotReadableError</strong> typically means another application is using your camera or there's a hardware/driver issue.</p>
      </TroubleshootingTips>
    );
  };

  return (
    <RecorderContainer>
      <VideoPreview>
        {recordedVideo ? (
          <video 
            src={recordedVideo.url} 
            controls 
            autoPlay 
            loop 
            style={{ width: 'auto', height: '100%', maxHeight: '500px' }} 
          />
        ) : (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width="auto"
            height="100%"
            videoConstraints={{
              facingMode: "user",
              width: 720,
              height: 1280,
              aspectRatio: 9/16
            }}
            onUserMedia={() => {
              setHasUserMedia(true);
              setIsCameraLoading(false);
              setError('');
            }}
            onUserMediaError={(err) => {
              console.error('Webcam error:', err);
              let errorMessage = `Camera error: ${err.name}.`;
              
              if (err.name === 'NotReadableError') {
                errorMessage += " This usually means another application is using your camera or there's a hardware issue.";
              } else if (err.name === 'NotAllowedError') {
                errorMessage += " Please check camera permissions in your browser settings.";
              } else if (err.name === 'NotFoundError') {
                errorMessage += " No camera was found on your device.";
              } else if (err.name === 'OverconstrainedError') {
                errorMessage += " Your camera doesn't support the requested resolution.";
              }
              
              setError(errorMessage);
              setHasUserMedia(false);
              setIsCameraLoading(false);
              setShowTroubleshooting(true);
            }}
          />
        )}
      </VideoPreview>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {showTroubleshooting && getTroubleshootingTips()}
      {isCameraLoading && !error && <InfoMessage>Initializing camera...</InfoMessage>}
      {countdown && <InfoMessage>Starting in {countdown}...</InfoMessage>}
      {isRecording && <InfoMessage>Recording: {recordingDuration}s / 3s</InfoMessage>}
      
      <ButtonContainer>
        {recordedVideo ? (
          <>
            <button className="btn-primary" onClick={handleReset}>Record Again</button>
          </>
        ) : (
          <>
            {isRecording ? (
              <RecordButton isRecording={isRecording} onClick={handleStopRecording}>
                Stop Recording
              </RecordButton>
            ) : (
              <>
                <RecordButton 
                  isRecording={isRecording} 
                  onClick={handleStartRecording}
                  disabled={!hasUserMedia || isCameraLoading}
                >
                  {isCameraLoading ? 'Initializing camera...' : hasUserMedia ? 'Start Recording' : 'Camera not available'}
                </RecordButton>
                
                {error && (
                  <button onClick={handleRetryCamera}>
                    Retry Camera
                  </button>
                )}
              </>
            )}
          </>
        )}
      </ButtonContainer>
    </RecorderContainer>
  );
};

export default VideoRecorder;