import { redirect } from 'next/navigation';

export default function Home() {
  // This automatically sends visitors from http://localhost:3000 to http://localhost:3000/login
  redirect('/login');
}