import { getPublishedCount } from "@/api";
import HomeContent from "@/components/feature/app/HomeContent";

export const metadata = { title: "KETI ezAAS Model Hub" };
export const dynamic = "force-dynamic";

export default async function Home() {
  let aasCount = 0;
  let smCount = 0;

  try {
    const raw = await getPublishedCount();
    const list: Array<{ ty: string; cnt: number }> = Array.isArray(raw) ? raw : [];
    aasCount = list.find((r) => r.ty === "aasmodel")?.cnt ?? 0;
    smCount = list.find((r) => r.ty === "submodel")?.cnt ?? 0;
  } catch {
    // backend unreachable
  }

  return <HomeContent aasCount={aasCount} smCount={smCount} />;
}
