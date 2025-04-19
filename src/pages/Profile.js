import React, { useState, useEffect } from "react";
import styled from "styled-components";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage, auth } from "../services/firebase";
import ContributionTracker from "../components/contributiontracker";

const ProfileContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
`;

const Title = styled.h2`
  color: var(--accent-green);
  margin-bottom: 20px;
`;

const StatsContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background-color: var(--background-light);
  padding: 20px;
  border-radius: 8px;
  flex: 1;
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: var(--accent-yellow);
  margin-bottom: 5px;
`;

const StatLabel = styled.div`
  color: var(--text-light);
  font-size: 0.9rem;
`;

const VideosGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const VideoCard = styled.div`
  background-color: var(--background-light);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
`;

const VideoInfo = styled.div`
  padding: 15px;
`;

const VideoTitle = styled.h3`
  color: var(--accent-yellow);
  margin-bottom: 5px;
  text-transform: capitalize;
`;

const VideoMeta = styled.div`
  font-size: 0.9rem;
  color: #aaa;
  margin-bottom: 10px;
`;

const VideoStatus = styled.div`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  display: inline-block;
  background-color: ${(props) =>
    props.approved ? "rgba(0, 255, 0, 0.2)" : "rgba(255, 204, 0, 0.2)"};
  color: ${(props) =>
    props.approved ? "var(--accent-green)" : "var(--accent-yellow)"};
`;

const DeleteButton = styled.button`
  background-color: #ff4d4d;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;

  &:hover {
    background-color: #ff3333;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  background-color: var(--background-light);
  border-radius: 8px;
`;

const Profile = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVideos: 0,
    approvedVideos: 0,
    languages: 0,
  });

  useEffect(() => {
    const fetchUserVideos = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          setLoading(false);
          return;
        }

        const q = query(
          collection(db, "signs"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);

        const videosData = [];
        querySnapshot.forEach((doc) => {
          videosData.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setVideos(videosData);

        // Calculate stats
        const approvedCount = videosData.filter(
          (video) => video.approved
        ).length;
        const uniqueLanguages = new Set(
          videosData.map((video) => video.signLanguage)
        ).size;

        setStats({
          totalVideos: videosData.length,
          approvedVideos: approvedCount,
          languages: uniqueLanguages,
        });
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserVideos();
  }, []);

  const handleDeleteVideo = async (videoId, videoUrl) => {
    if (
      window.confirm(
        "Are you sure you want to delete this video? This action cannot be undone."
      )
    ) {
      try {
        // Delete from Firestore
        await deleteDoc(doc(db, "signs", videoId));

        // Delete from Storage
        // Extract the path from the URL
        const storageRef = ref(storage, videoUrl);
        await deleteObject(storageRef);

        // Update state
        setVideos(videos.filter((video) => video.id !== videoId));

        // Update stats
        const deletedVideo = videos.find((video) => video.id === videoId);
        const wasApproved = deletedVideo?.approved || false;

        setStats((prevStats) => ({
          totalVideos: prevStats.totalVideos - 1,
          approvedVideos: wasApproved
            ? prevStats.approvedVideos - 1
            : prevStats.approvedVideos,
          // We don't update languages count as it would require recalculating
          languages: prevStats.languages,
        }));
      } catch (error) {
        console.error("Error deleting video:", error);
        alert("Failed to delete video. Please try again.");
      }
    }
  };

  if (loading) {
    return <ProfileContainer>Loading...</ProfileContainer>;
  }

  return (
    <ProfileContainer>
      <Title>My Profile</Title>

      <StatsContainer>
        <StatCard>
          <StatNumber>{stats.totalVideos}</StatNumber>
          <StatLabel>Total Videos</StatLabel>
        </StatCard>

        <StatCard>
          <StatNumber>{stats.approvedVideos}</StatNumber>
          <StatLabel>Approved Videos</StatLabel>
        </StatCard>

        <StatCard>
          <StatNumber>{stats.languages}</StatNumber>
          <StatLabel>Sign Languages</StatLabel>
        </StatCard>
      </StatsContainer>

      {/* Contribution Tracker */}
      {videos.length > 0 && <ContributionTracker videos={videos} />}

      <h3>My Videos</h3>

      {videos.length === 0 ? (
        <EmptyState>
          <p>You haven't uploaded any videos yet.</p>
        </EmptyState>
      ) : (
        <VideosGrid>
          {videos.map((video) => (
            <VideoCard key={video.id}>
              <video
                src={video.videoUrl}
                controls
                style={{ width: "100%", height: "auto" }}
              />
              <VideoInfo>
                <VideoTitle>{video.word}</VideoTitle>
                <VideoMeta>
                  {video.signLanguage.toUpperCase()} •{" "}
                  {new Date(video.createdAt?.toDate()).toLocaleDateString()}
                </VideoMeta>
                <VideoStatus approved={video.approved}>
                  {video.approved ? "Approved" : "Pending Review"}
                </VideoStatus>
                <div>
                  <DeleteButton
                    onClick={() => handleDeleteVideo(video.id, video.videoUrl)}
                  >
                    Delete
                  </DeleteButton>
                </div>
              </VideoInfo>
            </VideoCard>
          ))}
        </VideosGrid>
      )}
    </ProfileContainer>
  );
};

export default Profile;
