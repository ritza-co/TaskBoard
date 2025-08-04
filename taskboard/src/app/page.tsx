import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to register page as the default entry point
  redirect('/register');
}