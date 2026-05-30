import { getUser } from "@/api";
import UserForm from "@/components/feature/user/UserForm";

interface Props {
  params: Promise<{ userSeq: string }>;
}

export default async function Page({ params }: Props) {
  const { userSeq } = await params;
  const user = await getUser({ userSeq }).catch(() => null);

  return (
    <>
      {Array.isArray(user?.data) && user.data.length > 0 ? (
        <UserForm mode="view" user={user.data[0]} />
      ) : (
        <UserForm mode="view" />
      )}
    </>
  );
}
