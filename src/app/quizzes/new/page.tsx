import QuizForm from "@/components/management_ui/forms/QuizForm"

export default function NewQuizPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="relative left-24 bg-pink-500 text-3xl shadow-solid rounded-lg font-bold w-72 p-4 m-6 mt-0 text-center">Create New Quiz</h1>
      <QuizForm />
    </div>
  )
}