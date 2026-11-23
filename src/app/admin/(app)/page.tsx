import { redirect } from 'next/navigation';
import { INQUIRIES_PATH } from '@/lib/admin/paths';

/** It only ever redirects, so there is no page here to check for instant navigation. */
export const instant = false;

/** The dashboard comes in a later stage. Until then the admin opens on the inquiries, where new work arrives. */
export default function AdminHome() {
  redirect(INQUIRIES_PATH);
}
