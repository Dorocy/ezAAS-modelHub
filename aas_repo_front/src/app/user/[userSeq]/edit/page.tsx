import { getUser } from "@/api";
import UserForm from "@/components/feature/user/UserForm";

interface Props {
  params: Promise<{ userSeq: string }>;
}

// apiRequest 는 result.data 를 이미 벗겨서 반환하므로 getUser 결과는
// 보통 사용자 객체 배열([{...}]) 이지만, 환경에 따라 { data: [...] } 로 한 번
// 더 감싸여 오기도 한다. 두 경우를 모두 안전하게 처리해 첫 사용자를 꺼낸다.
function pickUser(res: any) {
  if (!res) return undefined;
  if (Array.isArray(res)) return res[0];
  if (Array.isArray(res.data)) return res.data[0];
  if (res.data && typeof res.data === "object") return res.data;
  if (typeof res === "object" && res.user_seq != null) return res;
  return undefined;
}

export default async function Page({ params }: Props) {
  const { userSeq } = await params;
  const res = await getUser({ userSeq }).catch(() => null);
  const user = pickUser(res);

  return <UserForm mode="edit" user={user} />;
}
