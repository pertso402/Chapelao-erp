import { redirect } from "next/navigation";

// A raiz sempre encaminha para o dashboard; o middleware decide login vs. app.
export default function Home() {
  redirect("/dashboard");
}
