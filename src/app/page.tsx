"use client"

import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="min-h-screen text-[--text-color]">
      {/* 1. Hero */}
      <section className="relative overflow-hidden bg-[--primary-bg]">
        <div
          className="absolute inset-0 opacity-40 pointer-events-none hidden md:block"
          style={{
            backgroundImage: "url('/images/learning_animals.png')",
            backgroundSize: 'auto 70%',
            backgroundPosition: 'right bottom',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="relative container mx-auto px-6 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="neo-card p-8 md:p-12 bg-white rotate-1 hover:rotate-0 transition-transform duration-300">
              <p className="text-sm font-semibold tracking-wide text-[--text-light] inclusive-sans mb-3">
                PlaytoZ
              </p>
              <h1 className="text-4xl md:text-5xl font-black grandstander text-balance leading-tight mb-4">
                Turn English practice into a fair fight.
              </h1>
              <p className="text-lg text-[--text-light] inclusive-sans leading-relaxed mb-8">
                Teachers build quizzes in clicks. Students compete with skill and speed — Score
                Attack or Splash Dash — without luck replacing learning.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/games" className="neo-button bg-[--primary-accent] text-white hover:bg-[--primary-accent-hover] px-8">
                  Browse games
                </Link>
                <Link href="/create" className="neo-button bg-white text-[--text-color] hover:bg-gray-50 px-8">
                  Create a quiz
                </Link>
              </div>
              <p className="mt-6 text-sm text-[--text-light] inclusive-sans">
                Designed for English classrooms and tutors — Pre-A1 to A2 friendly topics welcome.
              </p>
            </div>

            <div className="relative">
              <div className="neo-card overflow-hidden bg-white -rotate-1 hover:rotate-0 transition-transform duration-300">
                <Image
                  src="/images/marketing/quiz2.png"
                  alt="Team Quiz gameplay with timer, question, and answer choices"
                  width={960}
                  height={540}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Fair fights strip */}
      <section className="bg-white border-y-2 border-[#1E5167]">
        <div className="container mx-auto px-6 py-14 md:py-16 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-black grandstander mb-4">
            Maximum fun. Skill still wins.
          </h2>
          <p className="text-lg text-[--text-light] inclusive-sans leading-relaxed mb-8">
            We keep every team competitive — without handing the match to chance. Power-ups and
            catch-up keep energy high; timers and accuracy still crown the winner.
          </p>
          <ul className="grid sm:grid-cols-3 gap-4 text-left">
            {[
              'Boosted scoring pays out remaining seconds — faster correct answers earn more.',
              'Power-ups change the round, not who randomly wins.',
              'Comeback tools keep trailing teams alive without erasing a strong lead.',
            ].map((item) => (
              <li
                key={item}
                className="neo-card p-4 bg-[--primary-bg] text-sm inclusive-sans text-[--text-light]"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3. Game modes */}
      <section className="bg-[--secondary-bg] py-16 md:py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black grandstander mb-3">Two ways to play</h2>
            <p className="text-[--text-light] inclusive-sans text-lg">
              Students compete. Teachers stay in control.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <article className="neo-card bg-white overflow-hidden flex flex-col">
              <Image
                src="/images/marketing/quiz1.png"
                alt="Team Quiz multiple choice classroom game"
                width={800}
                height={450}
                className="w-full h-52 object-cover border-b-2 border-[#1E5167]"
              />
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-2xl font-bold grandstander mb-2">Team Quiz</h3>
                <p className="text-[--text-light] inclusive-sans mb-4">
                  Turn-based classroom energy with clock pressure. Themes, 10–20s timers, Basic or
                  Boosted scoring, and power-ups: 50/50, Double Points, Time Extension, Comeback.
                </p>
                <Link href="/games" className="mt-auto text-[--text-color] font-semibold grandstander underline-offset-4 hover:underline">
                  Browse Team Quiz quizzes
                </Link>
              </div>
            </article>

            <article className="neo-card bg-white overflow-hidden flex flex-col">
              <div className="grid grid-cols-2 border-b-2 border-[#1E5167]">
                <Image
                  src="/images/marketing/quiz4.png"
                  alt="Splash Dash correct answer race feedback"
                  width={800}
                  height={450}
                  className="w-full h-52 object-cover"
                />
                <Image
                  src="/images/marketing/quiz3.png"
                  alt="Splash Dash incorrect answer penalty feedback"
                  width={800}
                  height={450}
                  className="w-full h-52 object-cover border-l-2 border-[#1E5167]"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-2xl font-bold grandstander">Splash Dash</h3>
                </div>
                <p className="text-[--text-light] inclusive-sans mb-4">
                  Simultaneous head-to-head race. Capybaras swim to answer crates — first and right
                  beats first and wrong. Speed plus correctness, with penalties for misses.
                </p>
                <Link href="/games" className="mt-auto text-[--text-color] font-semibold grandstander underline-offset-4 hover:underline">
                  Pick a quiz, then choose Splash Dash
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 4. How it works */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black grandstander text-center mb-12">
            How it works
          </h2>
          <ol className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                step: '1',
                title: 'Create or pick',
                body: 'Paste, generate, upload, or browse the catalog — skip the blank page.',
              },
              {
                step: '2',
                title: 'Tune the match',
                body: 'Team Quiz or Splash Dash. Set timer, teams, and power-ups.',
              },
              {
                step: '3',
                title: 'Play',
                body: 'Competitive scoring students feel. Teacher stays in control.',
              },
            ].map((item) => (
              <li key={item.step} className="neo-card p-6 bg-[--primary-bg]">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#1E5167] bg-white font-black grandstander mb-4">
                  {item.step}
                </span>
                <h3 className="text-xl font-bold grandstander mb-2">{item.title}</h3>
                <p className="text-[--text-light] inclusive-sans text-sm">{item.body}</p>
              </li>
            ))}
          </ol>
          <div className="text-center mt-10">
            <Link href="/create" className="neo-button bg-[--secondary-accent] text-white px-8">
              Start in 2 minutes
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Teachers */}
      <section className="py-16 md:py-20 bg-[--secondary-bg]">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="order-2 lg:order-1 space-y-4">
              <div className="neo-card overflow-hidden bg-white">
                <Image
                  src="/images/marketing/UI1.png"
                  alt="Teacher setup screen with teams, timers, boosted mode, and power-up controls"
                  width={800}
                  height={450}
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="neo-card overflow-hidden bg-white rotate-1">
                <Image
                  src="/images/marketing/tag%20based%20filters.png"
                  alt="Tag based quiz filters for topics, grammar, and levels"
                  width={800}
                  height={450}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl font-black grandstander mb-3">
                Built for teachers who hate busywork.
              </h2>
              <p className="text-lg text-[--text-light] inclusive-sans mb-6">
                Minimal typing. Maximum click-and-select.
              </p>
              <ul className="space-y-3 mb-8 text-[--text-light] inclusive-sans">
                <li>Paste content from ChatGPT (or anywhere you draft) and shape it into a quiz.</li>
                <li>Generate with AI or upload a template — skip the blank page.</li>
                <li>Pick images from one search (Our collection, Giphy, Pixabay).</li>
                <li>Classroom controls: teams, timers, hearts, music — mostly toggles.</li>
                <li>Drafts autosave so a failed publish does not wipe your work.</li>
              </ul>
              <Link href="/create" className="neo-button bg-[--text-color] text-white px-8">
                Create your first quiz
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Students */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-black grandstander mb-3">
                Compete hard. Stay in the fight.
              </h2>
              <ul className="space-y-3 mb-8 text-[--text-light] inclusive-sans">
                <li>Beat the clock in Boosted Team Quiz.</li>
                <li>Race head-to-head in Splash Dash.</li>
                <li>Power-ups that change the round — not a lottery.</li>
                <li>Themes and animal energy without losing the quiz.</li>
              </ul>
              <Link href="/games" className="neo-button bg-[--primary-accent] text-white px-8">
                Play a quiz
              </Link>
            </div>
            <div className="neo-card overflow-hidden bg-white">
              <Image
                src="/images/marketing/Screenshot%202026-07-13%20135624.png"
                alt="Power-up wheel showing Time Extension during a quiz"
                width={800}
                height={450}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 7. Coming soon */}
      <section className="py-16 md:py-20 bg-[--primary-bg]">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="neo-card p-8 md:p-10 bg-white text-center">
            <span className="inline-block text-xs font-bold grandstander uppercase tracking-wide px-3 py-1 rounded-full border-2 border-[#1E5167] mb-4">
              Coming soon
            </span>
            <h2 className="text-3xl md:text-4xl font-black grandstander mb-4">
              From lesson page to playable quiz.
            </h2>
            <p className="text-[--text-light] inclusive-sans text-lg leading-relaxed mb-6">
              Upload a screenshot. We draft objectives, level, grammar points, questions — and three
              image options per question. You approve, pick pictures, and commit. Almost no typing or
              image hunting.
            </p>
            <p className="text-sm text-[--text-light] inclusive-sans mb-6">
              Screenshot a lesson. Approve questions. Pick images. Play.
            </p>
            <Link href="/create" className="font-semibold grandstander underline-offset-4 hover:underline">
              Prefer creating today? Build a quiz now
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Final CTA */}
      <section className="py-16 md:py-24 bg-[--text-color] text-white">
        <div className="container mx-auto px-6 text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-black grandstander mb-4">
            Ready when your next lesson is.
          </h2>
          <p className="text-lg text-sky-100 inclusive-sans mb-8">
            Browse ready-made quizzes or build yours in clicks — then let skill and speed take over.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/games" className="neo-button bg-[--primary-accent] text-white px-8">
              Browse games
            </Link>
            <Link href="/create" className="neo-button bg-white text-[--text-color] px-8">
              Create a quiz
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
