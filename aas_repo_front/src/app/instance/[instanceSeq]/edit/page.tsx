import InstanceFormLoader from "@/components/feature/instance/InstanceFormLoader";

interface Props {
  params: Promise<{ instanceSeq: string }>;
}

export default async function Page({ params }: Props) {
  const { instanceSeq } = await params;
  // 인스턴스 데이터는 클라이언트에서 프록시+메모리 토큰으로 가져온다.
  // (서버 쿠키 의존 시 stale 토큰으로 401 → 홈 바운스 문제가 발생)
  return <InstanceFormLoader mode="edit" instanceSeq={instanceSeq} />;
}
