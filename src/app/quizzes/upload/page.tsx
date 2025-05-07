import UploadForm from "@/components/management_ui/forms/UploadForm"
import DownloadButton from "@/components/management_ui/DownloadButton"
import Image from "next/image"
import { Card } from "@/components/ui/card"

export default function UploadQuizPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <h1 className="relative text-2xl w-80 bg-pink-500 shadow-solid rounded-lg font-bold sm:text-3xl sm:w-96 p-4 m-6 mt-0 text-center">Upload a quiz from a file</h1>
      </div>
      <Card className="text-2xl h-72 rounded-lg font-bold mb-6 p-8">
        <UploadForm />
      </Card>
      <Card className="flex flex-col xl:flex-row-reverse text-2xl h-full rounded-lg font-bold mb-6 p-6">
        <Image
          src={ "/images/template.png"}
          alt="excel-quiz-editing"
          height={265}
          width={903}
          className="h-full md:h-64"
        >
        </Image>
        <div className="text-base font-semibold space-y-2 p-4">
          <h1 className="text-2xl">Even faster quiz creation</h1>
          <p>Use our quiz template to make a quiz in Excel then simply upload the quiz.</p>
          <p>You can add images by going to the quiz list and editing the quiz.</p>
          <DownloadButton />
        </div>

      </Card>
    </div>
  )
}