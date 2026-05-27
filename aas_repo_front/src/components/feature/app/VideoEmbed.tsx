"use client";

export default function VideoEmbed({ src }: { src: string }) {
  // autoplay=1, mute=1, loop=1, controls=1, rel=0 파라미터 추가
  const url = new URL(src);
  url.searchParams.set("autoplay", "1");
  url.searchParams.set("mute", "1");
  url.searchParams.set("loop", "1");
  url.searchParams.set("rel", "0");
  // loop을 위해 playlist에 video id 필요
  const videoId = url.pathname.split("/").pop() ?? "";
  if (videoId) url.searchParams.set("playlist", videoId);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-900 shadow-lg aspect-video">
      <iframe
        src={url.toString()}
        title="소개 영상"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
