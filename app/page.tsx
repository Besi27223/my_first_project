import { redirect } from "next/navigation";

export default function RootPage() {
  if (process.env.NEXT_PUBLIC_UPLOAD_ONLY === "true") {
    redirect("/invoice/new");
  }
  redirect("/list");
}
