"use client";

export default function VideoEmbed({ src }: { src: string }) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-900 shadow-lg aspect-video">
      <iframe
        src={src}
        title="소개 영상"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
