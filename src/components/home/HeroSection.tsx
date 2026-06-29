"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { HeroIllustration } from "./UndrawIllustrations";
import Link from "next/link";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const illustrationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // 背景淡入
      tl.fromTo(
        ".hero-bg",
        { opacity: 0 },
        { opacity: 1, duration: 0.6 }
      );

      // 标题升起
      tl.fromTo(
        ".hero-title",
        { opacity: 0, y: 32 },
        { opacity: 1, y: 0, duration: 0.6 },
        "-=0.2"
      );

      // 副标题升起
      tl.fromTo(
        ".hero-subtitle",
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.5 },
        "-=0.3"
      );

      // CTA 按钮
      tl.fromTo(
        ".hero-cta",
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.45 },
        "-=0.2"
      );

      // 插画滑入
      tl.fromTo(
        ".hero-illustration",
        { opacity: 0, x: 80 },
        { opacity: 1, x: 0, duration: 0.9, ease: "power2.out" },
        "-=0.5"
      );

      // 插画持续浮动
      gsap.to(".hero-illustration", {
        y: -10,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1.2,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="hero-bg relative min-h-[85vh] flex items-center bg-hero-bg overflow-hidden"
    >
      {/* 装饰元素 */}
      <div className="absolute top-20 right-0 w-96 h-96 rounded-full bg-green-dark/10 blur-3xl" />
      <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-green/5 blur-3xl" />

      <div className="relative w-full max-w-[1500px] mx-auto px-10 lg:px-4xl py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* 左侧文字 */}
          <div className="text-white space-y-8">
            <div className="space-y-3">
              <p
                className="hero-title text-sm tracking-[0.2em] uppercase text-green-dark-mode/60 font-mono"
                style={{ fontFamily: "SFMono-Regular, Consolas, monospace" }}
              >
                BIJI NOTE STUDIO
              </p>
              <h1
                ref={titleRef}
                className="hero-title text-4xl sm:text-5xl lg:text-[56px] font-bold leading-[1.15] text-white"
                style={{ fontFamily: '"Songti SC", "STSong", "SimSun", serif' }}
              >
                沉浸式笔记工作台
              </h1>
            </div>

            <p
              ref={subtitleRef}
              className="hero-subtitle text-lg lg:text-xl text-white/70 leading-relaxed max-w-lg"
              style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif' }}
            >
              边写边画，流程图、思维导图、手绘批注无缝嵌入笔记正文。
              彻底告别图形工具和笔记应用之间的来回切换。
            </p>

            <div ref={ctaRef} className="hero-cta flex flex-wrap gap-4">
              <Link
                href="/notes"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-green-dark hover:bg-[#205541] text-white text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 shadow-m hover:shadow-l"
                style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif' }}
              >
                开始使用
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/30 hover:border-white/60 text-white text-sm font-semibold transition-all duration-200 hover:bg-white/10"
                style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif' }}
              >
                了解更多
              </a>
            </div>

            {/* 统计数据 */}
            <div className="hero-cta flex gap-8 pt-4 text-white/50 text-sm">
              <div>
                <span className="block text-2xl font-bold text-white/80 font-mono">Canvas</span>
                <span>原生绘图引擎</span>
              </div>
              <div>
                <span className="block text-2xl font-bold text-white/80 font-mono">悬浮</span>
                <span>不遮挡正文</span>
              </div>
              <div>
                <span className="block text-2xl font-bold text-white/80 font-mono">2秒</span>
                <span>自动保存</span>
              </div>
            </div>
          </div>

          {/* 右侧插画 */}
          <div
            ref={illustrationRef}
            className="hero-illustration flex justify-center lg:justify-end"
          >
            <HeroIllustration className="w-full max-w-[500px] h-auto" />
          </div>
        </div>
      </div>

      {/* 向下滚动提示 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
        <span className="text-xs tracking-widest uppercase font-mono">Scroll</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="animate-bounce"
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </section>
  );
}
