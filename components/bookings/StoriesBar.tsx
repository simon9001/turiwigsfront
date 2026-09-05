'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import storiesData from '@/data/stories.json';
import { StoryViewer } from './StoryViewer';

interface StorySlide {
  image: string;
  caption: string;
}

interface Story {
  id: string;
  label: string;
  category: string;
  avatar: string;
  read: boolean;
  color: string;
  slides: StorySlide[];
}

const stories: Story[] = storiesData.stories;

export function StoriesBar() {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  function openStory(index: number) {
    setActiveIndex(index);
    setViewerOpen(true);
  }

  return (
    <>
      <div className="flex items-start gap-4 overflow-x-auto scrollbar-hide pb-1">
        {/* "New booking" shortcut */}
        <Link
          href="/bookings/services"
          className="flex flex-col items-center gap-1.5 flex-shrink-0"
        >
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center"
            style={{ background: '#171614', border: '2px solid #8b8881' }}
          >
            <Plus className="h-6 w-6" style={{ color: '#ffffff' }} />
          </div>
          <span
            className="text-center truncate max-w-[56px] sm:max-w-[64px] leading-tight"
            style={{ fontSize: '10px', color: '#55534e' }}
          >
            New
          </span>
        </Link>

        {/* Story items */}
        {stories.map((story, idx) => (
          <button
            key={story.id}
            onClick={() => openStory(idx)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 focus:outline-none"
          >
            {/* Ring + avatar */}
            <div
              className="rounded-full p-[2px]"
              style={{
                background: story.read
                  ? '#c9c6bf'
                  : `#171614`,
                padding: '2px',
              }}
            >
              {/* White gap */}
              <div
                className="rounded-full"
                style={{ background: '#ffffff', padding: '2px' }}
              >
                <div
                  className="relative rounded-full overflow-hidden w-12 h-12 sm:w-14 sm:h-14"
                  style={{ flexShrink: 0 }}
                >
                  <Image
                    src={story.avatar}
                    alt={story.label}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              </div>
            </div>

            <span
              className="text-center truncate max-w-[56px] sm:max-w-[64px] leading-tight"
              style={{ fontSize: '10px', color: '#55534e' }}
            >
              {story.label}
            </span>
          </button>
        ))}
      </div>

      {viewerOpen && (
        <StoryViewer
          stories={stories}
          initialIndex={activeIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}
