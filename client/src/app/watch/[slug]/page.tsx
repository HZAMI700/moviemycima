'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ReactPlayer from 'react-player';
import { HiPlay, HiPause, HiArrowsExpand, HiX, HiDesktopComputer, HiCog, HiChevronDown } from 'react-icons/hi';
import { moviesAPI, seriesAPI, historyAPI } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function WatchPage() {
  const { slug } = useParams();
  const searchParams = useSearchParams();
  const [item, setItem] = useState<any>(null);
  const [episode, setEpisode] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [played, setPlayed] = useState(0);
  const [isPiP, setIsPiP] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);
  const controlsTimer = useRef<any>(null);
  const { user } = useAuthStore();

  const isMovie = !searchParams.get('season');
  const season = searchParams.get('season');
  const episodeNum = searchParams.get('episode');

  useEffect(() => {
    fetchContent();
  }, [slug, season, episodeNum]);

  const fetchContent = async () => {
    try {
      if (isMovie) {
        const { data } = await moviesAPI.getMovieBySlug(slug as string);
        setItem(data);
      } else {
        const { data } = await seriesAPI.getSeriesBySlug(slug as string);
        setItem(data);
        const ep = data.episodes?.find(
          (e: any) => e.season === parseInt(season || '1') && e.episode === parseInt(episodeNum || '1')
        );
        setEpisode(ep);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    const onMouseMove = () => {
      setShowControls(true);
      clearTimeout(controlsTimer.current);
      controlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  const embedUrl = episode?.embedLinks?.[0] || item?.embedLinks?.[0];
  const title = episode?.titleAr || episode?.title || item?.titleAr || item?.title;

  const togglePiP = async () => {
    try {
      const video = document.querySelector('video');
      if (video) {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          setIsPiP(false);
        } else {
          await video.requestPictureInPicture();
          setIsPiP(true);
        }
      }
    } catch {}
  };

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <p className="text-dark-400">المحتوى غير متوفر</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className={`absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <Link href={isMovie ? `/movie/${slug}` : `/serie/${slug}`} className="flex items-center gap-3">
            <HiX className="w-6 h-6 text-white/80 hover:text-white" />
            <div>
              <h1 className="text-sm font-medium">{title}</h1>
              {episode && <p className="text-xs text-dark-400">الموسم {season} - الحلقة {episodeNum}</p>}
            </div>
          </Link>
          <button onClick={() => {
            if (document.fullscreenElement) document.exitFullscreen();
            else document.documentElement.requestFullscreen();
          }} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <HiArrowsExpand className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative">
        {embedUrl ? (
          <iframe src={embedUrl} className="w-full h-full" allowFullScreen allow="autoplay; fullscreen" />
        ) : (
          <div className="w-full h-full bg-black">
            <ReactPlayer
              ref={playerRef}
              url={item.trailer || ''}
              width="100%"
              height="100%"
              playing={playing}
              volume={volume}
              onProgress={(s) => setPlayed(s.played)}
              progressInterval={5000}
              playbackRate={speed}
              config={{
                file: { attributes: { controlsList: 'nodownload' } },
              }}
            />
          </div>
        )}
      </div>

      <div className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent pt-16 pb-4 px-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-4">
          <button onClick={() => setPlaying(!playing)} className="text-white hover:text-primary-500 transition-colors">
            {playing ? <HiPause className="w-6 h-6" /> : <HiPlay className="w-6 h-6" />}
          </button>

          <div className="flex-1">
            <input type="range" min={0} max={0.999} step={0.001} value={played}
              onChange={(e) => {
                setPlayed(parseFloat(e.target.value));
                playerRef.current?.seekTo(parseFloat(e.target.value));
              }}
              className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500"
            />
          </div>

          <div className="relative">
            <button onClick={() => setShowSpeedMenu(!showSpeedMenu)} className="flex items-center gap-1 text-sm text-white/80 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors">
              <HiCog className="w-4 h-4" /> {speed}x
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-dark-800 border border-dark-600 rounded-xl p-1 shadow-2xl">
                {speeds.map(s => (
                  <button key={s} onClick={() => { setSpeed(s); setShowSpeedMenu(false); }}
                    className={`block w-full text-right px-4 py-1.5 rounded-lg text-sm transition-colors ${
                      speed === s ? 'bg-primary-600 text-white' : 'text-dark-300 hover:bg-dark-700'
                    }`}>{s}x</button>
                ))}
              </div>
            )}
          </div>

          <button onClick={togglePiP} className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <HiDesktopComputer className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
