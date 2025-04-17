import React, { useState } from 'react';
import styled from 'styled-components';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db, auth } from '../services/firebase';
import VideoRecorder from '../components/VideoRecorder';

const UploadContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const Title = styled.h2`
  color: var(--accent-green);
  margin-bottom: 20px;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
  background-color: var(--background-light);
  padding: 30px;
  border-radius: 10px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: bold;
  color: var(--accent-yellow);
`;

const Input = styled.input`
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #333;
  background-color: var(--background-dark);
  color: var(--text-light);
`;

const Select = styled.select`
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #333;
  background-color: var(--background-dark);
  color: var(--text-light);
`;

const Button = styled.button`
  background-color: var(--accent-green);
  color: var(--text-dark);
  padding: 12px;
  border-radius: 5px;
  font-weight: bold;
  margin-top: 10px;
  cursor: pointer;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  margin-top: 10px;
  text-align: center;
`;

const SuccessMessage = styled.div`
  color: var(--accent-green);
  margin-top: 10px;
  text-align: center;
  padding: 10px;
  background-color: rgba(0, 255, 0, 0.1);
  border-radius: 5px;
`;

const Guidelines = styled.div`
  margin-top: 30px;
  background-color: var(--background-light);
  padding: 20px;
  border-radius: 10px;
  border-left: 4px solid var(--accent-yellow);
`;

const GuidelinesTitle = styled.h3`
  color: var(--accent-yellow);
  margin-bottom: 10px;
`;

const Upload = () => {
  const [signLanguage, setSignLanguage] = useState('');
  const [word, setWord] = useState('');
  const [videoBlob, setVideoBlob] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleVideoRecorded = (blob) => {
    setVideoBlob(blob);
  };

  const validateForm = () => {
    if (!signLanguage) {
      setError('Please select a sign language');
      return false;
    }
    
    if (!word) {
      setError('Please enter the word for this sign');
      return false;
    }
    
    // Check if word contains only letters
    if (!/^[a-zA-Z]+$/.test(word)) {
      setError('Word should only contain letters (no numbers or special characters)');
      return false;
    }
    
    if (!videoBlob) {
      setError('Please record a video');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsUploading(true);
    
    try {
      const user = auth.currentUser;
      
      if (!user) {
        setError('You must be logged in to upload videos');
        setIsUploading(false);
        return;
      }
      
      // Create a unique filename
      const timestamp = new Date().getTime();
      const filename = `${user.uid}_${word}_${timestamp}.webm`;
      
      // Upload video to Firebase Storage
      const storageRef = ref(storage, `signs/${signLanguage}/${filename}`);
      await uploadBytes(storageRef, videoBlob);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Save metadata to Firestore
      await addDoc(collection(db, 'signs'), {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        signLanguage,
        word: word.toLowerCase(),
        videoUrl: downloadURL,
        createdAt: serverTimestamp(),
        approved: false // Admin needs to approve before it's publicly available
      });
      
      setSuccess('Video uploaded successfully! It will be reviewed before being added to the database.');
      
      // Reset form
      setWord('');
      setVideoBlob(null);
      
    } catch (error) {
      console.error('Error uploading video:', error);
      setError('Error uploading video. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <UploadContainer>
      <Title>Upload Sign Video</Title>
      
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Sign Language</Label>
          <Select 
            value={signLanguage} 
            onChange={(e) => setSignLanguage(e.target.value)}
            required
          >
            <option value="">Select a sign language</option>
            <option value="asl">American Sign Language (ASL)</option>
            <option value="bsl">British Sign Language (BSL)</option>
            <option value="isl">Indian Sign Language (ISL)</option>
            <option value="csl">Chinese Sign Language (CSL)</option>
            <option value="auslan">Australian Sign Language (Auslan)</option>
          </Select>
        </FormGroup>
        
        <FormGroup>
          <Label>Word</Label>
          <Input 
            type="text" 
            value={word} 
            onChange={(e) => setWord(e.target.value)}
            placeholder="Enter the word for this sign"
            required
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Record Video (1-3 seconds)</Label>
          <VideoRecorder onVideoRecorded={handleVideoRecorded} />
        </FormGroup>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
        
        <Button type="submit" disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Upload Sign'}
        </Button>
      </Form>
      
      <Guidelines>
        <GuidelinesTitle>Recording Guidelines</GuidelinesTitle>
        <ul>
          <li>Record in a well-lit environment with a plain background</li>
          <li>Position yourself so your signing hand is clearly visible</li>
          <li>The video should be 1-3 seconds long</li>
          <li>Include the full sign motion with minimal empty space at the beginning and end</li>
          <li>Ensure the sign is completed within the recording</li>
          <li>Avoid wearing clothing with busy patterns or colors similar to your skin tone</li>
        </ul>
      </Guidelines>
    </UploadContainer>
  );
};

export default Upload;