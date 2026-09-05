'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface StorySlide {
  image: string;
  caption: string;
}

interface Story {
  id: string;
  label: string;
  avatar: string;
  color: string;
  slides: StorySlide[];
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

const SLIDE_DURATION = 4000;

export function StoryViewer({ stories, initialIndex, onClose }: StoryViewerProps) {
  const [storyIndex, setStoryIndex] = useState(initialIndex);
  const [slideIndex, setSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const touchStartX = useRef<number | null>(null);

  const currentStory = stories[storyIndex];
  const totalSlides = currentStory?.slides.length ?? 1;

  const goNextSlide = useCallback(() => {
    if (slideIndex < totalSlides - 1) {
      setSlideIndex((s) => s + 1);
      setProgress(0);
      startTimeRef.current = Date.now();
    } else if (storyIndex < stories.length - 1) {
      setStoryIndex((i) => i + 1);
      setSlideIndex(0);
      setProgress(0);
      startTimeRef.current = Date.now();
    } else {
      onClose();
    }
  }, [slideIndex, totalSlides, storyIndex, stories.length, onClose]);

  const goPrevSlide = useCallback(() => {
    if (slideIndex > 0) {
      setSlideIndex((s) => s - 1);
    } else if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
      setSlideIndex(0);
    }
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [slideIndex, storyIndex]);

  // Progress animation
  useEffect(() => {
    startTimeRef.current = Date.now();

    function tick() {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        goNextSlide();
      }
    }

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, [storyIndex, slideIndex, goNextSlide]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNextSlide();
      if (e.key === 'ArrowLeft') goPrevSlide();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goNextSlide, goPrevSlide]);

  // Swipe handlers
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) goNextSlide();
      else goPrevSlide();
    }
    touchStartX.current = null;
  }

  if (!currentStory) return null;
  const currentSlide = currentStory.slides[slideIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.95)' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Story container */}
      <div className="relative w-full max-w-sm h-full sm:h-[85vh] sm:rounded-2xl overflow-hidden">
        {/* Story image */}
        {currentSlide && (
          <Image
            src={currentSlide.image}
            alt={currentStory.label}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        )}

        {/* Dark gradient overlay top */}
        <div
          className="absolute inset-x-0 top-0 h-32 z-10"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
          }}
        />

        {/* Dark gradient overlay bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-40 z-10"
          style={{
            background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
          }}
        />

        {/* Progress bars */}
        <div className="absolute top-3 inset-x-3 z-20 flex gap-1">
          {currentStory.slides.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-0.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.3)' }}
            >
              <div
                className="h-full rounded-full transition-none"
                style={{
                  background: '#fff',
                  width:
                    i < slideIndex
                      ? '100%'
                      : i === slideIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Story header: avatar + label */}
        <div className="absolute top-8 left-4 z-20 flex items-center gap-2">
          <div
            className="rounded-full p-[1.5px]"
            style={{
              background: `#171614`,
            }}
          >
            <div className="rounded-full" style={{ background: '#000', padding: '1.5px' }}>
              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                <Image
                  src={currentStory.avatar}
                  alt={currentStory.label}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
            </div>
          </div>
          <span className="text-white text-sm font-semibold">{currentStory.label}</span>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          aria-label="Close story"
        >
          <X className="h-4 w-4 text-white" />
        </button>

        {/* Caption */}
        {currentSlide?.caption && (
          <div className="absolute bottom-6 inset-x-4 z-20">
            <p className="text-white text-sm leading-relaxed text-center">
              {currentSlide.caption}
            </p>
          </div>
        )}

        {/* Desktop arrow navigation */}
        <button
          onClick={goPrevSlide}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full hidden sm:flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          aria-label="Previous"
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </button>
        <button
          onClick={goNextSlide}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full hidden sm:flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          aria-label="Next"
        >
          <ChevronRight className="h-5 w-5 text-white" />
        </button>

        {/* Tap zones (mobile) */}
        <button
          className="absolute left-0 top-0 w-1/3 h-full z-15 sm:hidden"
          onClick={goPrevSlide}
          aria-label="Previous story"
        />
        <button
          className="absolute right-0 top-0 w-1/3 h-full z-15 sm:hidden"
          onClick={goNextSlide}
          aria-label="Next story"
        />
      </div>

      {/* Story navigation dots (outside on desktop) */}
      {stories.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 sm:hidden">
          {stories.map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: i === storyIndex ? '#fff' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
