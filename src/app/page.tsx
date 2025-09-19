import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import WaveBackground from '@/components/ui/WaveBackground';

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <WaveBackground />
      
      {/* Cloud layers */}
      <div className="relative z-5">
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
      </div>

      {/* Main content Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4">
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
         <Link href="/games">
           <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white text-xl px-8 py-6 rounded-full">
             Play Now
           </Button>
         </Link>
      </section>

      {/* Content Blocks Section */}
      <section className="relative z-10 py-16 md:py-20 bg-[--primary-bg]">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 md:mb-16 text-[--text-color] font-[family-name:var(--font-grandstander)]">
            Unlock Your English Potential
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[ 
              { title: "Interactive Quizzes", description: "Engage with dynamic quizzes designed to make learning fun and effective. Test your knowledge and track your progress.", icon: "🧠" },
              { title: "Gamified Learning", description: "Earn points, unlock achievements, and compete with others. Learning English has never been more exciting!", icon: "🎮" },
              { title: "Comprehensive Content", description: "Covering grammar, vocabulary, listening, and speaking, tailored for all levels from beginner to advanced.", icon: "📚" },
            ].map((item, index) => (
              <div key={index} className="bg-[--panel-bg] p-6 rounded-lg border-2 border-[--text-color] shadow-[4px_4px_0px_0px_var(--text-color)]">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-2xl font-bold mb-3 text-[--text-color] font-[family-name:var(--font-grandstander)]">{item.title}</h3>
                <p className="text-[--text-light] text-base leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 py-16 md:py-20 bg-[--secondary-bg]">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 md:mb-16 text-[--text-color] font-[family-name:var(--font-grandstander)]">
            What Our Learners Say
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[ 
              { quote: "AtoZ English has transformed my learning experience. The quizzes are so engaging!", author: "Maria S.", avatar: "/placeholder.webp" },
              { quote: "I love the gamified approach. It keeps me motivated to learn every day.", author: "John D.", avatar: "/placeholder.webp" },
              { quote: "Finally, a platform that makes complex grammar easy to understand.", author: "Ai Ling", avatar: "/placeholder.webp" },
            ].map((testimonial, index) => (
              <div key={index} className="bg-[--panel-bg] p-6 rounded-lg border-2 border-[--text-color] shadow-[4px_4px_0px_0px_var(--text-color)] flex flex-col">
                <p className="text-[--text-light] text-lg italic mb-4 flex-grow">&ldquo;{testimonial.quote}&rdquo;...</p>
                <div className="flex items-center">
                  <Image src={testimonial.avatar} alt={testimonial.author} width={40} height={40} className="rounded-full mr-3 border-2 border-[--primary-accent]" />
                  <span className="font-bold text-[--text-color]">{testimonial.author}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Content Section */}
      <section className="relative z-10 py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 md:mb-16 text-[--text-color] font-[family-name:var(--font-grandstander)]">
            Explore Our Resources
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[ 
              { title: "Master Verb Tenses", description: "An interactive guide to understanding and using English verb tenses correctly.", image: "/images/placeholder.webp", link: "/games" },
              { title: "Vocabulary Builder Challenge", description: "Expand your lexicon with our daily vocabulary challenges and games.", image: "/images/placeholder.webp", link: "/games" },
              { title: "Pronunciation Practice", description: "Improve your accent and speaking confidence with guided exercises.", image: "/images/placeholder.webp", link: "/games" },
            ].map((item, index) => (
              <div key={index} className="bg-[--panel-bg] rounded-lg border-2 border-[--text-color] shadow-[4px_4px_0px_0px_var(--text-color)] overflow-hidden flex flex-col">
                <Image src={item.image} alt={item.title} width={400} height={250} className="w-full h-48 object-cover" />
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-2xl font-bold mb-3 text-[--text-color] font-[family-name:var(--font-grandstander)]">{item.title}</h3>
                  <p className="text-[--text-light] text-base leading-relaxed mb-4 flex-grow">{item.description}</p>
                  <Link href={item.link} className="mt-auto">
                    <Button className="w-full bg-[--primary-accent] hover:bg-[--primary-accent-hover] text-white font-bold py-3 rounded-md border-2 border-[--text-color] shadow-[2px_2px_0px_0px_var(--text-color)] hover:shadow-[3px_3px_0px_0px_var(--text-color)] transition-all duration-150">
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
