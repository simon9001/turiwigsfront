import { HeroWall } from '@/components/home/HeroWall';
import { TwoDoors } from '@/components/home/TwoDoors';
import { ServicesBoard } from '@/components/home/ServicesBoard';
import { PhotoRibbon } from '@/components/home/PhotoRibbon';
import { WigsShelf } from '@/components/home/WigsShelf';
import { GalleryWall } from '@/components/home/GalleryWall';
import { VisitStrip } from '@/components/home/VisitStrip';

/* The page has one job: show the work, then make booking or buying the
   easiest thing to do next. Every section ends in one of those two actions. */

export default function HomePage() {
  return (
    <>
      <HeroWall />
      <TwoDoors />
      <ServicesBoard />
      <PhotoRibbon />
      <WigsShelf />
      <GalleryWall />
      <VisitStrip />
    </>
  );
}
