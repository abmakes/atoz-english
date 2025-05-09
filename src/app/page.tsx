import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
      {/* Navigation - REMOVED FROM HERE */}
      {/* Cloud layers */}
      <div className="cloud-layer-1 absolute top-[5%] w-full h-20">
        {[...Array(8)].map((_, i) => (
          <div
            key={`cloud1-${i}`}
            className="cloud absolute h-16 rounded-full bg-white opacity-80"
            style={{
              left: `${i * 25}%`,
              width: "120px",
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>
      <div className="cloud-layer-2 absolute top-[20%] w-full h-24">
        {[...Array(6)].map((_, i) => (
          <div
            key={`cloud2-${i}`}
            className="cloud absolute h-20 rounded-full bg-white opacity-90"
            style={{
              left: `${i * 30}%`,
              width: "160px",
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}
      </div>
      <div className="cloud-layer-3 absolute top-[40%] w-full h-32">
        {[...Array(5)].map((_, i) => (
          <div
            key={`cloud3-${i}`}
            className="cloud absolute h-24 rounded-full bg-white opacity-70"
            style={{
              left: `${i * 35}%`,
              width: "200px",
              animationDelay: `${i * 1.2}s`,
            }}
          />
        ))}
      </div>
      <div className="cloud-layer-4 absolute top-[60%] w-full h-40">
        {[...Array(4)].map((_, i) => (
          <div
            key={`cloud4-${i}`}
            className="cloud absolute h-28 rounded-full bg-white opacity-60"
            style={{
              left: `${i * 40}%`,
              width: "240px",
              animationDelay: `${i * 1.5}s`,
            }}
          />
        ))}
      </div>
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4">
        <h1 className="text-6xl font-bold mb-6 text-blue-900 font-[family-name:var(--font-grandstander)]">
          AtoZ English
        </h1>
        <div className="mb-10">
           <Image 
              src="/placeholder.webp" 
              alt="AtoZ English Logo" 
              width={150} 
              height={50} 
              priority 
            />
        </div>
         <Link href="/games" legacyBehavior>
           <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white text-xl px-8 py-6 rounded-full">
             Play Now
           </Button>
         </Link>
      </div>
    </div>
  );
}
