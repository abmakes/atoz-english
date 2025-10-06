"use client"

import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen">

      <section
        className="relative min-h-[50vh] py-20"
        style={{
          backgroundImage: "url('/images/learning_animals.png')",
          backgroundSize: "auto 80%",
          backgroundPosition: "right center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="    mx-auto px-6 h-full">
          <div className="grid md:grid-cols-2 -mt-24 md:-mt-0 gap-12 items-center min-h-[70vh]">
            <div className="relative order-1">
              <div className="neo-card p-8 md:p-12 rotate-2 hover:rotate-0 transition-transform duration-300 bg-white min-h-[250px] md:min-h-[400px] flex flex-col justify-center">
                <h2 className="text-4xl font-black grandstander text-balance leading-tight mb-4 text-[--text-color]">AtoZ English</h2>
                <p className="text-lg text-[--text-light] leading-relaxed mb-6">
                  Learn English through fun games and interactive adventures with our adorable animal friends!
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/games">
                    <button className="neo-button w-40 bg-[--primary-accent] text-white hover:bg-[--primary-accent-hover]">Play Now</button>
                  </Link>
                  <button className="neo-button w-40 bg-white text-[--text-color] hover:bg-gray-50">Learn More</button>
                </div>
              </div>
            </div>
            <div className="order-2"></div>
          </div>
        </div>
      </section>

      <section className="bg-[--secondary-bg] py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="neo-card p-6 bg-[--primary-accent] hover:-rotate-1 transition-transform duration-300" style={{ backgroundColor: 'rgba(73, 200, 255, 0.2)' }}>
              <div className="w-12 h-12 bg-[--primary-accent] rounded-full mb-4 flex items-center justify-center text-white font-bold text-xl">
                🎮
              </div>
              <h3 className="text-xl font-bold grandstander mb-2 text-[--text-color]">Fun Games</h3>
              <p className="text-[--text-light]">Interactive games that make learning English exciting and engaging.</p>
            </div>

            <div className="neo-card p-6 hover:rotate-1 transition-transform duration-300" style={{ backgroundColor: 'rgba(66, 192, 169, 0.2)' }}>
              <div className="w-12 h-12 bg-[--secondary-accent] rounded-full mb-4 flex items-center justify-center text-white font-bold text-xl">
                🐾
              </div>
              <h3 className="text-xl font-bold grandstander mb-2 text-[--text-color]">Animal Friends</h3>
              <p className="text-[--text-light]">Learn with cute animal characters that guide you through your journey.</p>
            </div>

            <div className="neo-card p-6 hover:-rotate-1 transition-transform duration-300" style={{ backgroundColor: 'rgba(255, 193, 7, 0.2)' }}>
              <div className="w-12 h-12 rounded-full mb-4 flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: '#FFC107' }}>
                📚
              </div>
              <h3 className="text-xl font-bold grandstander mb-2 text-[--text-color]">Learn & Grow</h3>
              <p className="text-[--text-light]">Build vocabulary and language skills step by step at your own pace.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-2xl mx-auto space-y-8">
            <Image
              src="/images/learning_animals.png"
              alt="Learning animals with books and educational elements"
              width={400}
              height={300}
              className="w-full max-w-md mx-auto"
              priority
            />
            <h3 className="text-4xl font-black grandstander text-[--text-color]">Ready to Start Learning?</h3>
            <p className="text-xl text-[--text-light]">Join thousands of kids already having fun while learning English!</p>
            <Link href="/games">
              <button className="neo-button text-xl px-8 py-4" style={{ backgroundColor: 'var(--secondary-accent)', color: 'white' }}>
                Start Your Adventure
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
