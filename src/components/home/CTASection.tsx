import Link from "next/link";

export function CTASection() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10 lg:px-4xl text-center">
        <h2
          className="text-3xl lg:text-4xl font-bold text-ink mb-4"
          style={{ fontFamily: '"Songti SC", "STSong", "SimSun", serif' }}
        >
          准备好提升你的笔记体验了吗？
        </h2>
        <p className="text-muted text-lg mb-10 max-w-md mx-auto leading-relaxed">
          免费开始使用，无需下载。在浏览器中体验下一代笔记工作台。
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/notes"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-green-dark hover:bg-[#205541] text-white text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 shadow-m hover:shadow-l"
          >
            免费开始使用
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M6 4L10 8L6 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <a
            href="#"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white border border-[#D2DBD4] hover:bg-[#EDF3EE] text-ink text-sm font-bold transition-all duration-200"
          >
            查看文档
          </a>
        </div>
      </div>
    </section>
  );
}
