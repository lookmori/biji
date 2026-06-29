export function Footer() {
  const linkClass =
    "text-white/55 hover:text-white/85 transition-colors text-sm leading-loose";
  const headingClass =
    "text-white/80 font-semibold text-sm mb-4 tracking-[0.04em]";

  return (
    <footer className="bg-ink pt-16 pb-10">
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10 lg:px-4xl">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
          {/* 品牌 */}
          <div>
            <h3
              className="text-white text-xl font-bold mb-3 tracking-[0.12em]"
              style={{ fontFamily: '"Songti SC", "STSong", "SimSun", serif' }}
            >
              BIJI
            </h3>
            <p className="text-white/40 text-sm leading-relaxed">
              沉浸式笔记工作台 — 边写边画，
              <br />
              流程图、思维导图、手绘批注
              <br />
              无缝嵌入笔记正文。
            </p>
          </div>

          {/* 产品 */}
          <div>
            <h4 className={headingClass}>产品</h4>
            <ul className="space-y-1">
              <li><a href="#" className={linkClass}>Canvas 绘图</a></li>
              <li><a href="#" className={linkClass}>思维导图</a></li>
              <li><a href="#" className={linkClass}>流程图</a></li>
              <li><a href="#" className={linkClass}>富媒体笔记</a></li>
            </ul>
          </div>

          {/* 资源 */}
          <div>
            <h4 className={headingClass}>资源</h4>
            <ul className="space-y-1">
              <li><a href="#" className={linkClass}>使用文档</a></li>
              <li><a href="#" className={linkClass}>快捷键</a></li>
              <li><a href="#" className={linkClass}>更新日志</a></li>
              <li><a href="#" className={linkClass}>反馈</a></li>
            </ul>
          </div>

          {/* 关于 */}
          <div>
            <h4 className={headingClass}>关于</h4>
            <ul className="space-y-1">
              <li><a href="#" className={linkClass}>关于 BIJI</a></li>
              <li><a href="#" className={linkClass}>隐私政策</a></li>
              <li><a href="#" className={linkClass}>服务条款</a></li>
            </ul>
          </div>
        </div>

        {/* 底部 */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-xs font-mono">
            &copy; {new Date().getFullYear()} BIJI Note Studio. All rights reserved.
          </p>
          <p className="text-white/20 text-xs font-mono">
            Built with Next.js &middot; GSAP &middot; undraw
          </p>
        </div>
      </div>
    </footer>
  );
}
