import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  Gauge,
  Gamepad2,
  Sparkles,
  Users,
} from 'lucide-react'

const classroomBenefits = [
  {
    icon: Sparkles,
    title: 'Less prep',
    body: 'Create with AI, paste your own material, upload a template, or start from a ready-made quiz.',
  },
  {
    icon: Users,
    title: 'Whole-class energy',
    body: 'Run the action from one shared classroom screen while teams answer, race, and cheer.',
  },
  {
    icon: Gauge,
    title: 'Close to the finish',
    body: 'Balanced scoring and comeback mechanics help more students stay invested until the last question.',
  },
] as const

const steps = [
  {
    number: '01',
    title: 'Create or choose',
    body: 'Build an English quiz or browse by level, topic, and grammar focus.',
  },
  {
    number: '02',
    title: 'Set up the class',
    body: 'Choose a game, add teams, and tune timers, themes, and power-ups.',
  },
  {
    number: '03',
    title: 'Play together',
    body: 'Launch on the classroom screen and keep everyone following the same match.',
  },
] as const

const engagementPrinciples = [
  'Correct answers and quick thinking create the advantage.',
  'Comeback tools reduce runaway leads without wiping out strong play.',
  'A closer score gives every team a reason to care about the next question.',
] as const

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden text-[--text-color]">
      <section className="relative bg-[--primary-bg]">
        <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-white/50 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[--primary-accent]/25 blur-3xl" />

        <div className="container relative mx-auto px-6 pb-16 pt-14 md:pb-24 md:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-[#1E5167] bg-white px-4 py-2 text-sm font-bold shadow-[3px_3px_0px_0px_#1E5167] grandstander">
                <Gamepad2 className="h-4 w-4" aria-hidden="true" />
                English games for Pre-A1–B1
              </div>
              <h1 className="max-w-2xl text-balance text-5xl font-black leading-[1.05] grandstander sm:text-6xl lg:text-7xl">
                Designed for{' '}
                <span className="text-[#168CB9]">classroom fun.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[--text-light] inclusive-sans md:text-xl">
                Turn grammar and vocabulary practice into a whole-class game.
                Matches stay competitive to the end, while strong answers and
                quick thinking still give teams the edge.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/create"
                  className="neo-button inline-flex items-center justify-center gap-2 bg-[--primary-accent] px-8 text-white hover:bg-[--primary-accent-hover]"
                >
                  Create a quiz
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
                <Link
                  href="/games"
                  className="neo-button inline-flex items-center justify-center bg-white px-8 text-[--text-color] hover:bg-sky-50"
                >
                  Browse games
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[--text-light] inclusive-sans">
                {['Shared-screen play', 'Teacher-controlled', 'AI-assisted creation'].map(
                  (item) => (
                    <span key={item} className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-[#168CB9]" aria-hidden="true" />
                      {item}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-3xl lg:mx-0">
              <div className="absolute -inset-3 rotate-2 rounded-[30px] bg-[--secondary-accent]" />
              <div className="neo-card relative -rotate-1 overflow-hidden bg-white p-2">
                <Image
                  src="/images/marketing/score-attack-play.png"
                  alt="Score Attack classroom game with two teams, a timer, and answer choices"
                  width={1024}
                  height={683}
                  className="h-auto w-full rounded-[18px]"
                  priority
                />
              </div>
              <div className="absolute -bottom-5 right-4 rotate-2 rounded-2xl border-2 border-[#1E5167] bg-white px-4 py-3 text-sm font-black shadow-[4px_4px_0px_0px_#1E5167] grandstander md:right-8 md:text-base">
                Everyone has a reason to keep playing.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y-2 border-[#1E5167] bg-white py-12 md:py-14">
        <div className="container mx-auto grid gap-5 px-6 md:grid-cols-3">
          {classroomBenefits.map(({ icon: Icon, title, body }) => (
            <article key={title} className="flex gap-4 rounded-2xl bg-[--surface-cloud] p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#1E5167] bg-white shadow-[2px_2px_0px_0px_#1E5167]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-black grandstander">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-[--text-light] inclusive-sans">
                  {body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="neo-card overflow-hidden bg-[--surface-cloud] p-2">
              <Image
                src="/images/marketing/create-quiz.png"
                alt="Quiz creation workspace with AI-assisted questions and images"
                width={1024}
                height={683}
                className="h-auto w-full rounded-[18px]"
              />
            </div>
            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-[#168CB9] grandstander">
                From lesson to game
              </p>
              <h2 className="text-balance text-4xl font-black leading-tight grandstander md:text-5xl">
                One lesson. Three quick steps.
              </h2>
              <ol className="mt-8 space-y-6">
                {steps.map((step) => (
                  <li key={step.number} className="flex gap-4">
                    <span className="text-2xl font-black text-[#168CB9] grandstander">
                      {step.number}
                    </span>
                    <div>
                      <h3 className="text-xl font-black grandstander">{step.title}</h3>
                      <p className="mt-1 text-[--text-light] inclusive-sans">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link
                href="/create"
                className="mt-9 inline-flex items-center gap-2 font-black text-[#114257] underline decoration-2 underline-offset-4 grandstander hover:text-[#168CB9]"
              >
                Start creating
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#114257] py-16 text-white md:py-24">
        <div className="container mx-auto px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-sky-300 grandstander">
                Competitive to the last question
              </p>
              <h2 className="text-balance text-4xl font-black leading-tight grandstander md:text-5xl">
                A strong team can lead without the rest of the class checking out.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-sky-100 inclusive-sans">
                PlaytoZ balances speed, accuracy, power-ups, and comeback mechanics
                to limit landslide scores. Skill should still shape the result—the
                match just stays close enough to keep every team involved.
              </p>
              <ul className="mt-8 space-y-4">
                {engagementPrinciples.map((principle) => (
                  <li key={principle} className="flex gap-3 text-sky-50 inclusive-sans">
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-[#49C8FF]"
                      aria-hidden="true"
                    />
                    {principle}
                  </li>
                ))}
              </ul>
            </div>
            <div className="neo-card overflow-hidden bg-white p-2 shadow-[7px_7px_0px_0px_#49C8FF]">
              <Image
                src="/images/marketing/score-attack-setup.png"
                alt="Game setup controls for teams, timers, boosted scoring, and power-ups"
                width={1024}
                height={683}
                className="h-auto w-full rounded-[18px]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[--secondary-bg] py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-[#0D729B] grandstander">
              Choose the classroom energy
            </p>
            <h2 className="text-4xl font-black grandstander md:text-5xl">
              Two ways to play
            </h2>
            <p className="mt-4 text-lg text-[--text-light] inclusive-sans">
              Use the same quiz in a teacher-led team game or a simultaneous race.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <article className="neo-card flex flex-col overflow-hidden bg-white">
              <Image
                src="/images/marketing/score-attack-play.png"
                alt="Score Attack team quiz game"
                width={1024}
                height={683}
                className="h-64 w-full border-b-2 border-[#1E5167] object-cover"
              />
              <div className="flex flex-1 flex-col p-7">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#168CB9] grandstander">
                  Turn-based
                </p>
                <h3 className="mt-2 text-3xl font-black grandstander">Score Attack</h3>
                <p className="mt-3 text-[--text-light] inclusive-sans">
                  Teams take turns against the clock. Correct answers, remaining
                  time, and optional power-ups keep the score moving.
                </p>
                <Link
                  href="/games"
                  className="mt-6 inline-flex items-center gap-2 font-black grandstander hover:text-[#168CB9]"
                >
                  Choose a quiz
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </article>

            <article className="neo-card flex flex-col overflow-hidden bg-white">
              <Image
                src="/images/marketing/splash-dash-race.png"
                alt="Splash Dash capybara answer race"
                width={819}
                height={546}
                className="h-64 w-full border-b-2 border-[#1E5167] object-cover"
              />
              <div className="flex flex-1 flex-col p-7">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#168CB9] grandstander">
                  Simultaneous
                </p>
                <h3 className="mt-2 text-3xl font-black grandstander">Splash Dash</h3>
                <p className="mt-3 text-[--text-light] inclusive-sans">
                  Capybaras race toward answer crates at the same time. Speed helps,
                  but a rushed wrong answer creates an opening for the other team.
                </p>
                <Link
                  href="/games"
                  className="mt-6 inline-flex items-center gap-2 font-black grandstander hover:text-[#168CB9]"
                >
                  Start a race
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="neo-card mx-auto grid max-w-6xl items-center gap-10 overflow-hidden bg-[--surface-stone] p-8 md:p-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[--accent-premium-muted] px-4 py-2 text-sm font-black text-[--accent-premium] grandstander">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                AI-assisted, teacher-approved
              </div>
              <h2 className="text-balance text-4xl font-black leading-tight grandstander md:text-5xl">
                Turn a lesson page into a playable quiz.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[--text-light] inclusive-sans">
                Upload a lesson screenshot, review the suggested level, grammar,
                vocabulary, and questions, then edit anything before it reaches
                your class.
              </p>
              <p className="mt-4 font-semibold text-[--text-light] inclusive-sans">
                The AI drafts. You make the teaching decisions.
              </p>
              <Link
                href="/create"
                className="neo-button mt-8 inline-flex items-center gap-2 bg-[--accent-premium] px-8 text-white hover:bg-[--accent-premium-hover]"
              >
                Create with AI
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
            <div className="rounded-[24px] border-2 border-[#1E5167] bg-white p-6 shadow-[5px_5px_0px_0px_#1E5167]">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[--accent-premium] grandstander">
                Teacher review stays in the loop
              </p>
              <ul className="mt-5 space-y-4 text-[--text-light] inclusive-sans">
                {[
                  'Confirm the CEFR level and grammar focus.',
                  'Edit, approve, reject, or simplify each question.',
                  'Choose the image that best supports the language.',
                  'Publish only when the quiz is ready.',
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-[--accent-premium]"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[--primary-bg] py-16 md:py-24">
        <div className="container mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-balance text-4xl font-black leading-tight grandstander md:text-5xl">
            Bring more energy to your next English lesson.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-[--text-light] inclusive-sans">
            Create your own quiz or choose one from the catalog, then turn it into
            a match the whole class wants to finish.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/create"
              className="neo-button inline-flex items-center justify-center gap-2 bg-[--primary-accent] px-8 text-white hover:bg-[--primary-accent-hover]"
            >
              Create a quiz
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href="/games"
              className="neo-button inline-flex items-center justify-center bg-white px-8 text-[--text-color] hover:bg-sky-50"
            >
              Browse games
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
