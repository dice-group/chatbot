'use client';
import Image from 'next/image';
import ChatPopup from './components/ChatPopup';

export default function Home() {
  return (
    <div>
      <ChatPopup username="John Doe" />
    </div>
  );
}
