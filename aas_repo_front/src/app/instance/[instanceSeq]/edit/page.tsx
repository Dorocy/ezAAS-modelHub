import InstanceFormLoader from "@/components/feature/instance/InstanceFormLoader";

interface Props {
  params: Promise<{ instanceSeq: string }>;
}

export default async function Page({ params }: Props) {
  const { instanceSeq } = await params;

  // 편집 데이터는 클라이언트에서 /instance/{instance_seq} API로 불러온다.
  // (서버사이드 fetch는 token 쿠키 만료/오염 시 401 → 로그인 → 메인으로 바운스되어
  //  "Edit를 누르면 메인페이지로 돌아간다"는 증상이 있었음)
  // 로더가 InstanceForm을 edit 모드로 렌더하므로 Create와 동일한 스텝 위저드가
  // 표시되고, 기존 작업 내용(이름/설명/메타데이터)이 그대로 입력되어 있다.
  return <InstanceFormLoader mode="edit" instanceSeq={instanceSeq} />;
}
