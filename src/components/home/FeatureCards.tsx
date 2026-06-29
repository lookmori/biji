"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  DrawingIllustration,
  MultimediaIllustration,
  OrganizationIllustration,
} from "./UndrawIllustrations";

const features = [
  {
    icon: DrawingIllustration,
    title: "Canvas 原生绘图",
    description:
      "内置思维导图、流程图、手绘批注。悬浮面板不占编辑空间，画完一键嵌入正文，写作绘图两不误。",
    points: ["自由手绘", "思维导图", "流程图", "一键嵌入"],
  },
  {
    icon: MultimediaIllustration,
    title: "富媒体笔记",
    description:
      "支持图片、视频、音频、代码块、表格、公式。一篇文章搞定所有内容形式，不受格式限制。",
    points: ["视频嵌入", "音频播放", "代码高亮", "文件附件"],
  },
  {
    icon: OrganizationIllustration,
    title: "智能管理",
    description:
      "无限级文件夹、标签分类、全文搜索、回收站恢复。笔记再多也不乱，秒速找到所需内容。",
    points: ["无限文件夹", "拖拽排序", "全文搜索", "回收站"],
  },
];

export function FeatureCards() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray(".feature-card");
      cards.forEach((card, i) => {
        gsap.fromTo(
          card as Element,
          { opacity: 0, y: 48 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card as Element,
              start: "top bottom-=100px",
              toggleActions: "play none none none",
            },
            delay: i * 0.12,
          }
        );
      });

      // 标题区
      gsap.fromTo(
        ".features-header",
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          scrollTrigger: {
            trigger: ".features-header",
            start: "top bottom-=60px",
            toggleActions: "play none none none",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="bg-feature-bg py-20 lg:py-28"
    >
      <div className="max-w-[1500px] mx-auto px-6 sm:px-10 lg:px-4xl">
        {/* 标题区 */}
        <div className="features-header text-center mb-16 lg:mb-20">
          <p
            className="text-xs tracking-[0.16em] uppercase text-muted font-mono mb-4"
            style={{ fontFamily: "SFMono-Regular, Consolas, monospace" }}
          >
            Why BIJI
          </p>
          <h2
            className="text-3xl lg:text-4xl font-bold text-ink mb-4"
            style={{ fontFamily: '"Songti SC", "STSong", "SimSun", serif' }}
          >
            为深度写作而生
          </h2>
          <p
            className="text-muted max-w-lg mx-auto leading-relaxed"
            style={{ fontFamily: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif' }}
          >
            不是又一款笔记工具，而是将绘图、多媒体和文字融为一体的沉浸式写作空间
          </p>
        </div>

        {/* 功能卡片 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="feature-card group bg-white rounded-2xl border border-line p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-l hover:border-[#9FB5A7]"
              >
                {/* 插画 */}
                <div className="mb-6">
                  <Icon className="w-full h-auto max-h-[160px]" />
                </div>
                {/* 标题 */}
                <h3
                  className="text-xl font-bold text-ink mb-3"
                  style={{ fontFamily: '"Songti SC", "STSong", "SimSun", serif' }}
                >
                  {feature.title}
                </h3>
                {/* 描述 */}
                <p className="text-muted text-sm leading-relaxed mb-5">
                  {feature.description}
                </p>
                {/* 标签 */}
                <div className="flex flex-wrap gap-2">
                  {feature.points.map((pt, j) => (
                    <span
                      key={j}
                      className="px-3 py-1 text-xs font-semibold text-green bg-green-soft rounded-full"
                    >
                      {pt}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
