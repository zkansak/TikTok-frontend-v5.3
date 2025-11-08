import { useEffect, useState } from 'react';

function useVideoPlayer(videoElement) {
  const [playerState, setPlayerState] = useState({
    isPlaying: false,
    isMuted: false, // 默认不静音
    progress: 0,
  });

  // Handle Playing
  const togglePlay = () => {
    setPlayerState((prevState) => ({
      ...prevState,
      isPlaying: !prevState.isPlaying,
    }));
  };
  const play = () => {
    setPlayerState((s) => ({ ...s, isPlaying: true }));
  };
  const pause = () => {
    setPlayerState((s) => ({ ...s, isPlaying: false }));
  };
  useEffect(() => {
    const el = videoElement.current;
    if (!el) return;
    if (playerState.isPlaying) {
      const maybePromise = el.play();
      if (maybePromise && typeof maybePromise.then === 'function') {
        maybePromise.catch(() => {
          // 忽略由快速切换播放/暂停引起的中断错误
        });
      }
    } else {
      el.pause();
    }
  }, [playerState.isPlaying, videoElement]);

  // Handle Muted
  const toggleMuted = () => {
    setPlayerState((prevState) => ({
      ...prevState,
      isMuted: !prevState.isMuted,
    }));
  };
  useEffect(() => {
    videoElement.current.muted = playerState.isMuted;
  }, [playerState.isMuted, videoElement]);

  // Handle Progress
  const handleOnTimeUpdate = () => {
    const el = videoElement.current;
    if (!el || !el.duration) return;
    const progress = (el.currentTime / el.duration) * 100;
    setPlayerState((prevState) => {
      if (progress >= 100) {
        return {
          ...prevState,
          progress: 100,
          isPlaying: false,
        };
      }
      return {
        ...prevState,
        progress,
      };
    });
  };
  const handleVideoProgress = (event) => {
    const el = videoElement.current;
    if (!el || !el.duration) return;
    const manualChange = Number(event.target.value);
    const newTime = (el.duration / 100) * manualChange;
    
    // 直接设置视频时间，实现拖拽跳转
    el.currentTime = newTime;
    
    setPlayerState((prevState) => ({
      ...prevState,
      progress: manualChange,
    }));
  };
  return {
    playerState,
    togglePlay,
    play,
    pause,
    toggleMuted,
    handleOnTimeUpdate,
    handleVideoProgress,
  };
}

export default useVideoPlayer;
