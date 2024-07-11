"use client";

import { Plus } from "lucide-react";
import { UploadButton } from "../uploadthing";
import { uploadPdf } from "@/app/_hooks/uploadDocs";
import { getLatestDocId } from "@/app/_hooks/getLatest";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function UploadButtonComp() {
  const user = useUser();
  const router = useRouter();

  const Uploadbutton = () => (
    <UploadButton
      className="ut-allowed-content:hidden"
      endpoint="pdfUploader"
      content={{
        button({ ready }) {
          if (ready) return <Plus className="h-5 w-5" />;
          else return <Plus className="h-5 w-5" />;
        },
      }}
      appearance={{ button: "bg-transparent w-6 h-6" }}
      config={{ mode: "auto" }}
      onClientUploadComplete={async (res) => {
        await uploadPdf(res[0].url, res[0].name);
        const userId = user.user?.id;
        const docId = await getLatestDocId(userId);
        router.push(`/chat/summary/${docId}`);
        console.log("Files: ", res[0].url);
      }}
      onUploadError={(error: Error) => {
        alert(`ERROR! ${error.message}`);
      }}
    />
  );

  return (
    <>
      <Uploadbutton />
    </>
  );
}