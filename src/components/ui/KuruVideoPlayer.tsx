import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCw,
  PictureInPicture2,
  Disc,
  FastForward,
  Rewind,
  AlertCircle
} from 'lucide-react';

interface KuruVideoPlayerProps {
  src: string;
  className?: string;
  maxHeight?: string;
  title?: string;
  onError?: () => void;
  autoPlay?: boolean;
  isCompact?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;

  if (hrs > 0) {
    return `${hrs}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const KuruVideoPlayer: React.FC<KuruVideoPlayerProps> = ({
  src,
  className = '',
  maxHeight = 'max-h-[500px]',
  onError,
  autoPlay = false,
  isCompact = false,
  onTimeUpdate
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [activeSrc, setActiveSrc] = useState(src);
  const [isProxied, setIsProxied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<number>(0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  useEffect(() => {
    setActiveSrc(src);
    setIsProxied(false);
    setHasError(false);
  }, [src]);

  const handleVideoError = () => {
    if (!isProxied && src && src.startsWith('http') && !src.includes('corsproxy.io') && !src.startsWith('blob:') && !src.startsWith('data:')) {
      console.warn('Direct video stream error, retrying through automatic CORS proxy...', src);
      setIsProxied(true);
      setActiveSrc(`https://corsproxy.io/?${encodeURIComponent(src)}`);
    } else {
      setHasError(true);
      if (onError) onError();
    }
  };

  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 2500);
    }
  };

  useEffect(() => {
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, []);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {
        setHasError(true);
      });
    }
  }, [isPlaying]);

  const handleVolumeChange = (newVol: number) => {
    if (!videoRef.current) return;
    const clamped = Math.max(0, Math.min(1, newVol));
    videoRef.current.volume = clamped;
    setVolume(clamped);
    setIsMuted(clamped === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
      if (volume === 0) {
        setVolume(0.8);
        videoRef.current.volume = 0.8;
      }
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const changeSpeed = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {
        setIsFullscreen(!isFullscreen);
      });
    } else {
      document.exitFullscreen().catch(() => {
        setIsFullscreen(false);
      });
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP not supported or failed', e);
    }
  };

  const seek = (seconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(duration, seconds));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    seek(pct * duration);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, hoverX / rect.width));
    setHoverTime(pct * duration);
    setHoverPos(hoverX);
  };

  const handleProgressMouseLeave = () => {
    setHoverTime(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ' || e.key === 'k') {
      e.preventDefault();
      togglePlay();
    } else if (e.key === 'f') {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.key === 'm') {
      e.preventDefault();
      toggleMute();
    } else if (e.key === 'ArrowLeft' || e.key === 'j') {
      e.preventDefault();
      seek(currentTime - 5);
    } else if (e.key === 'ArrowRight' || e.key === 'l') {
      e.preventDefault();
      seek(currentTime + 5);
    }
  };

  if (hasError) {
    return (
      <div className={`relative w-full rounded-2xl overflow-hidden border border-red-500/30 bg-black/90 p-8 text-center flex flex-col items-center justify-center gap-3 ${className}`}>
        <AlertCircle size={36} className="text-red-400 animate-pulse" />
        <p className="text-sm font-semibold text-red-200">Не удалось воспроизвести видеофайл</p>
        <p className="text-xs text-gray-400 max-w-xs break-all">{src}</p>
        <button
          onClick={() => {
            setHasError(false);
            if (onError) onError();
          }}
          className="mt-2 px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 rounded-xl text-xs font-bold transition-all"
        >
          Повторить попытку
        </button>
      </div>
    );
  }

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (bufferedEnd / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className={`relative w-full bg-black group select-none outline-none overflow-hidden ${
        isFullscreen
          ? 'fixed inset-0 w-screen h-screen z-[99999] rounded-none border-none flex items-center justify-center'
          : 'rounded-2xl border border-[#3d2b4f]/60 shadow-2xl'
      } ${className}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={activeSrc}
        playsInline
        autoPlay={autoPlay}
        preload="auto"
        crossOrigin="anonymous"
        className={`bg-black block cursor-pointer ${
          isFullscreen
            ? 'w-full h-full object-contain'
            : `w-full ${maxHeight} object-contain mx-auto`
        }`}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onPlay={() => {
          setIsPlaying(true);
          setIsBuffering(false);
        }}
        onPause={() => {
          setIsPlaying(false);
          setShowControls(true);
        }}
        onTimeUpdate={() => {
          if (videoRef.current) {
            const curr = videoRef.current.currentTime;
            const dur = videoRef.current.duration;
            setCurrentTime(curr);
            if (onTimeUpdate) {
              onTimeUpdate(curr, dur);
            }
          }
        }}
        onDurationChange={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
          }
        }}
        onProgress={() => {
          if (videoRef.current && videoRef.current.buffered.length > 0) {
            setBufferedEnd(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
          }
        }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onEnded={() => {
          setIsPlaying(false);
          setShowControls(true);
        }}
        onError={handleVideoError}
      />

      {/* Top Kuru Video Disc Badge */}
      {(!isCompact || isFullscreen) && (
        <div className={`absolute top-2 left-2 sm:top-3 sm:left-3 pointer-events-none transition-opacity duration-300 z-30 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-black/80 backdrop-blur-md px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border border-red-500/40 text-[10px] sm:text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5 sm:gap-2 shadow-lg">
            <Disc
              size={13}
              className={`text-red-400 sm:w-[15px] sm:h-[15px] ${isPlaying ? 'animate-[spin_2.5s_linear_infinite]' : ''}`}
            />
            <span className="bg-gradient-to-r from-red-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Kuru Video
            </span>
            {isPlaying && (
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 animate-ping" />
            )}
          </div>
        </div>
      )}

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 pointer-events-none z-20">
          <RotateCw size={32} className="text-red-500 animate-[spin_1s_linear_infinite] sm:w-9 sm:h-9" />
          <span className="text-[10px] sm:text-[11px] font-bold text-red-200 tracking-widest uppercase bg-black/80 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-red-500/30">
            Загрузка...
          </span>
        </div>
      )}

      {/* Center Big Play/Pause Button */}
      {!isCompact && (!isPlaying || showControls) && !isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <button
            onClick={togglePlay}
            className="pointer-events-auto p-2.5 sm:p-4 rounded-full bg-red-600/90 hover:bg-red-500 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all border border-red-400/50 backdrop-blur-md cursor-pointer"
            title={isPlaying ? 'Пауза' : 'Воспроизвести'}
          >
            {isPlaying ? <Pause size={22} className="sm:w-7 sm:h-7" /> : <Play size={22} className="ml-0.5 sm:ml-1 sm:w-7 sm:h-7" />}
          </button>
        </div>
      )}

      {/* COMPACT PREVIEW OVERLAY CONTROLS (Used when isCompact === true and not in Fullscreen) */}
      {isCompact && !isFullscreen && (
        <div
          className={`absolute bottom-2 inset-x-2 sm:bottom-3 sm:inset-x-3 flex items-center justify-between pointer-events-none transition-opacity duration-300 z-30 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Sound Mute/Unmute button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            className="pointer-events-auto p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-black/80 hover:bg-black border border-white/20 text-white shadow-lg backdrop-blur-md hover:scale-105 active:scale-95 transition-all"
            title={isMuted ? 'Включить звук' : 'Выключить звук'}
          >
            {isMuted || volume === 0 ? <VolumeX size={16} className="text-red-400 sm:w-4 sm:h-4" /> : <Volume2 size={16} className="sm:w-4 sm:h-4" />}
          </button>

          {/* Fullscreen button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFullscreen();
            }}
            className="pointer-events-auto p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-black/80 hover:bg-black border border-white/20 text-white shadow-lg backdrop-blur-md hover:scale-105 active:scale-95 transition-all"
            title="На весь экран"
          >
            <Maximize size={16} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      )}

      {/* FULL KURU VIDEO CONTROLS BAR (Shown when !isCompact or in Fullscreen Mode) */}
      {(!isCompact || isFullscreen) && (
        <div
          className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-2 sm:p-4 pt-8 sm:pt-10 transition-all duration-300 z-30 ${
            showControls || !isPlaying ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          {/* Progress Bar */}
          <div
            ref={progressBarRef}
            onClick={handleProgressClick}
            onMouseMove={handleProgressMouseMove}
            onMouseLeave={handleProgressMouseLeave}
            className="relative w-full h-2 sm:h-2.5 hover:h-3.5 bg-white/20 hover:bg-white/30 rounded-full cursor-pointer transition-all mb-2 sm:mb-3 group/progress"
          >
            {hoverTime !== null && (
              <div
                style={{ left: `${hoverPos}px` }}
                className="absolute bottom-6 -translate-x-1/2 bg-black/90 text-white text-[10px] sm:text-[11px] font-mono px-1.5 py-0.5 rounded border border-red-500/40 pointer-events-none shadow-md z-40"
              >
                {formatTime(hoverTime)}
              </div>
            )}

            <div
              style={{ width: `${bufferedPct}%` }}
              className="absolute top-0 bottom-0 left-0 bg-white/30 rounded-full transition-all"
            />

            <div
              style={{ width: `${progressPct}%` }}
              className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-red-500 via-purple-500 to-pink-500 rounded-full transition-all shadow-[0_0_12px_rgba(239,68,68,0.9)]"
            />

            <div
              style={{ left: `${progressPct}%` }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white border-2 border-red-500 rounded-full opacity-0 group-hover/progress:opacity-100 shadow-lg transition-opacity"
            />
          </div>

          {/* Full Controls Row */}
          <div className="flex items-center justify-between text-white text-xs gap-1 sm:gap-3">
            <div className="flex items-center gap-1 sm:gap-2.5 min-w-0">
              <button
                onClick={togglePlay}
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg sm:rounded-xl text-white hover:text-red-400 transition-colors shrink-0"
                title={isPlaying ? 'Пауза' : 'Воспроизвести'}
              >
                {isPlaying ? <Pause size={18} className="sm:w-5 sm:h-5" /> : <Play size={18} className="sm:w-5 sm:h-5" />}
              </button>

              <button
                onClick={() => seek(currentTime - 5)}
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg sm:rounded-xl text-gray-300 hover:text-white transition-colors shrink-0"
                title="-5 секунд"
              >
                <Rewind size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>

              <button
                onClick={() => seek(currentTime + 5)}
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg sm:rounded-xl text-gray-300 hover:text-white transition-colors shrink-0"
                title="+5 секунд"
              >
                <FastForward size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={toggleMute}
                  className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg sm:rounded-xl text-gray-300 hover:text-white transition-colors"
                  title={isMuted ? 'Включить звук' : 'Выключить звук'}
                >
                  {isMuted || volume === 0 ? <VolumeX size={18} className="text-red-400 sm:w-5 sm:h-5" /> : <Volume2 size={18} className="sm:w-5 sm:h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-12 xs:w-16 sm:w-20 md:w-24 h-1.5 accent-red-500 bg-white/20 rounded-lg cursor-pointer shrink-0"
                />
              </div>

              <span className="font-mono text-[10px] sm:text-xs text-gray-300 tracking-tight sm:tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 hover:bg-white/10 rounded-md sm:rounded-xl text-[10px] sm:text-xs font-bold text-gray-200 hover:text-white border border-white/20 transition-colors"
                  title="Скорость"
                >
                  {playbackSpeed}x
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-10 right-0 bg-black/90 backdrop-blur-md border border-[#3d2b4f] rounded-xl p-1 shadow-2xl flex flex-col gap-0.5 z-50 text-xs w-24">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => changeSpeed(spd)}
                        className={`px-2 py-1 text-left rounded-lg transition-colors ${
                          playbackSpeed === spd ? 'bg-red-500/30 text-red-400 font-bold' : 'hover:bg-white/10 text-gray-300'
                        }`}
                      >
                        {spd === 1 ? '1x Обычная' : `${spd}x`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={togglePiP}
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg sm:rounded-xl text-gray-300 hover:text-white transition-colors hidden sm:block"
                title="Картинка в картинке"
              >
                <PictureInPicture2 size={18} className="sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg sm:rounded-xl text-gray-300 hover:text-white transition-colors"
                title={isFullscreen ? 'Свернуть' : 'На весь экран'}
              >
                {isFullscreen ? <Minimize size={18} className="sm:w-5 sm:h-5" /> : <Maximize size={18} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


