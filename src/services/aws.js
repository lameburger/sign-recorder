// Firebase Storage implementation for long-term video storage
import { ref, uploadBytes, getDownloadURL, getMetadata, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

// Folder name for storing sign language videos (replacing AWS Glacier vault)
const STORAGE_FOLDER = "sign-language-videos";

/**
 * Upload a video to Firebase Storage (replacing AWS Glacier)
 * @param {Blob} videoBlob
 * @param {Object} metadata
 * @returns {Promise<Object>}
 */
export const uploadVideoToGlacier = async (videoBlob, metadata) => {
  try {
    // Validate inputs
    if (!videoBlob) {
      throw new Error('Video blob is missing or invalid');
    }
    
    if (!metadata || !metadata.userId || !metadata.word || !metadata.signLanguage) {
      throw new Error('Required metadata is missing');
    }
    
    // Check if blob is valid and has content
    if (videoBlob.size === 0) {
      throw new Error('Video blob is empty');
    }
    
    // Create a unique filename with metadata embedded
    const timestamp = new Date().getTime();
    const filename = `${metadata.userId}_${metadata.word}_${timestamp}.webm`;
    
    console.log('Creating storage reference for:', `${STORAGE_FOLDER}/${metadata.signLanguage}/${filename}`);
    
    // Create a reference to the storage location
    const storageRef = ref(storage, `${STORAGE_FOLDER}/${metadata.signLanguage}/${filename}`);
    
    // Log blob information for debugging
    console.log('Video blob info:', {
      type: videoBlob.type,
      size: videoBlob.size,
      lastModified: videoBlob.lastModified
    });
    
    // Upload the video with metadata
    console.log('Starting upload to Firebase Storage...');
    
    // Add timeout handling
    const uploadPromise = uploadBytes(storageRef, videoBlob, {
      customMetadata: {
        metadata: JSON.stringify(metadata)
      }
    });
    
    // Set a timeout for the upload (30 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Upload timed out after 30 seconds')), 30000);
    });
    
    // Race the upload against the timeout
    const uploadResult = await Promise.race([uploadPromise, timeoutPromise]);
    
    console.log('Upload successful, getting download URL...');
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    console.log("Video uploaded to Firebase Storage:", uploadResult);
    
    // Return information similar to what AWS Glacier would return
    return {
      archiveId: storageRef.fullPath, // Use the storage path as the archive ID
      location: downloadURL,
      checksum: uploadResult.metadata?.md5Hash || '',
      metadata,
    };
  } catch (error) {
    console.error("Error uploading to Firebase Storage:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
    
    // Provide more specific error messages based on error type
    if (error.code === 'storage/unauthorized') {
      throw new Error('Permission denied: You do not have permission to access this storage bucket');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was canceled');
    } else if (error.code === 'storage/quota-exceeded') {
      throw new Error('Storage quota exceeded. Please contact administrator');
    } else if (error.code === 'storage/invalid-url') {
      throw new Error('Invalid storage URL. Check your Firebase configuration');
    } else if (error.code === 'storage/retry-limit-exceeded') {
      throw new Error('Upload failed: Network error. Please check your internet connection and try again');
    } else if (error.message.includes('timed out')) {
      throw new Error('Upload timed out. Please check your internet connection and try again');
    } else {
      // Rethrow with more context
      throw new Error(`Upload failed: ${error.message}`);
    }
  }
};

/**
 * Retrieve a video from Firebase Storage (replacing AWS Glacier job initiation)
 * @param {string} archiveId - The storage path of the video
 * @returns {Promise<Object>}
 */
export const initiateVideoRetrieval = async (archiveId) => {
  try {
    // In Firebase Storage, we don't need to initiate a job like in Glacier
    // We can directly get the download URL
    const storageRef = ref(storage, archiveId);
    
    // Return a job-like object for compatibility
    return {
      jobId: archiveId, // Use the archive ID as the job ID
      statusCode: 'InProgress',
      jobDescription: `Retrieval for ${archiveId}`,
    };
  } catch (error) {
    console.error("Error initiating retrieval:", error);
    throw error;
  }
};

/**
 * Check the status of a retrieval (always returns completed in Firebase)
 * @param {string} jobId - The storage path of the video
 * @returns {Promise<Object>}
 */
export const checkRetrievalJobStatus = async (jobId) => {
  try {
    // In Firebase Storage, files are immediately available
    // So we always return a completed status
    return {
      Action: "ArchiveRetrieval",
      Completed: true,
      JobId: jobId,
      StatusCode: "Succeeded"
    };
  } catch (error) {
    console.error("Error checking retrieval status:", error);
    throw error;
  }
};

/**
 * Get the output of a completed retrieval
 * @param {string} jobId - The storage path of the video
 * @returns {Promise<Object>}
 */
export const getJobOutput = async (jobId) => {
  try {
    // In Firebase, we can directly get the file
    const storageRef = ref(storage, jobId);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    // Get the metadata
    const metadataResult = await getMetadata(storageRef);
    
    // Parse the custom metadata if available
    let parsedMetadata = {};
    if (metadataResult.customMetadata && metadataResult.customMetadata.metadata) {
      try {
        parsedMetadata = JSON.parse(metadataResult.customMetadata.metadata);
      } catch (e) {
        console.error("Error parsing metadata:", e);
      }
    }
    
    return {
      body: downloadURL, // Return the download URL instead of the actual body
      contentType: metadataResult.contentType,
      metadata: parsedMetadata,
    };
  } catch (error) {
    console.error("Error getting retrieval output:", error);
    throw error;
  }
};

export default {
  uploadVideoToGlacier,
  initiateVideoRetrieval,
  checkRetrievalJobStatus,
  getJobOutput,
};