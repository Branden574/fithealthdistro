import { notFound } from 'next/navigation';
import { MotionLab } from './MotionLab';

export const metadata = { title: 'Motion lab', robots: { index: false, follow: false } };

/** A development-only page for checking the shared motion system. It does not exist in production builds. */
export default function MotionLabPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <MotionLab />;
}
