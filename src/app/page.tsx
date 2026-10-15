import nextDynamic from "next/dynamic";

const HomeClient = nextDynamic(() => import("@/components/home/HomeClient"), {
  ssr: false,
});

export const dynamic = "force-dynamic";

export default function Page() {
  return <HomeClient />;
}


