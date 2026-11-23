import { redirect } from 'next/navigation';
import { PRODUCTS_PATH } from '@/lib/admin/paths';

/** The dashboard comes in a later stage. Until then the admin opens on the products. */
export default function AdminHome() {
  redirect(PRODUCTS_PATH);
}
