import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "隐私政策 Privacy Policy · 小华听写",
  description: "Privacy policy for Chinese Spelling Buddy (小华听写) — what we collect, how it is used, and how to delete it.",
};

const UPDATED = "2026-08-02";
const CONTACT = "zhyouyou9@gmail.com";

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-black text-gray-800 mt-8 mb-2">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-600 leading-relaxed mb-2">{children}</p>;
}
function EN({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-400 leading-relaxed mb-3">{children}</p>;
}
function LI({ children }: { children: React.ReactNode }) {
  return <li className="text-sm text-gray-600 leading-relaxed">{children}</li>;
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-5 py-10">
        <Link href="/" className="text-sm font-semibold text-brand-500">← 返回首页 Back to Home</Link>

        <h1 className="text-2xl font-black text-gray-900 mt-6">隐私政策 · Privacy Policy</h1>
        <p className="text-xs text-gray-400 mt-1">
          小华听写 / Chinese Spelling Buddy · 最后更新 Last updated: {UPDATED}
        </p>

        <P>
          小华听写（Chinese Spelling Buddy）是一款帮助新加坡小学生（小一至小六）练习华文听写的学习工具，由
          「板栗老师」开发与运营。我们非常重视家长与孩子的隐私，本政策说明我们收集哪些信息、如何使用，以及你如何删除它们。
        </P>
        <EN>
          Chinese Spelling Buddy is a study tool that helps Singapore primary students (P1–P6) practise Chinese
          spelling/dictation. This policy explains what we collect, how we use it, and how you can delete it.
        </EN>

        <H>1. 我们收集哪些信息 · What we collect</H>
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <LI><b>家长账户信息</b>：注册邮箱与加密后的密码（或你选择的 Google 登录标识）。Parent account: email and encrypted password, or your Google sign-in identifier.</LI>
          <LI><b>孩子资料</b>：由家长填写的孩子称呼（可用昵称）与年级。Child profile: a name/nickname and grade level, entered by the parent.</LI>
          <LI><b>学习内容与记录</b>：词表、练习与测验结果、错题、连续打卡、获得的钻石。Word lists, practice and test results, mistakes, streaks and reward diamonds.</LI>
          <LI><b>你上传的图片</b>：为识别词表或批改手写而拍摄的照片/PDF。Photos or PDFs you upload for word-list import or handwriting grading.</LI>
          <LI><b>付款信息</b>：订阅状态。<b>我们不接触也不存储你的银行卡号</b>，付款由 Stripe 或应用商店处理。Subscription status only — card details are handled by Stripe or the app stores, never by us.</LI>
        </ul>
        <P>我们<b>不</b>收集精确位置、通讯录、通话记录或短信。</P>
        <EN>We do not collect precise location, contacts, call logs or SMS.</EN>

        <H>2. 我们如何使用这些信息 · How we use it</H>
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <LI>提供服务本身：保存词表、生成发音、显示练习与进度。To provide the service: store lists, generate audio, show practice and progress.</LI>
          <LI>AI 功能：把你上传的图片发送给 OpenAI 用于文字识别与手写批改。AI features: uploaded images are sent to OpenAI for text recognition and handwriting grading.</LI>
          <LI>提醒邮件：在听写前发送复习提醒（可不使用）。Reminder emails before a dictation (optional).</LI>
          <LI>账户与订阅管理、以及服务的安全与故障排查。Account/subscription management, security and troubleshooting.</LI>
        </ul>
        <P>
          我们<b>不出售</b>你的任何数据，<b>不做广告投放</b>，也<b>不</b>用孩子的数据做行为定向广告。
        </P>
        <EN>We never sell your data, show no ads, and never use children&apos;s data for behavioural advertising.</EN>

        <H>3. 儿童隐私 · Children&apos;s privacy</H>
        <P>
          本应用面向小学生使用，但<b>账户由家长创建并掌控</b>。孩子不需要自己的账户，所有数据都保存在家长账户之下，家长可随时查看、修改或删除。
          我们建议家长<b>不要填写孩子的真实全名</b>，用昵称即可。应用内没有广告、没有社交聊天、也没有指向外部的推广内容。
        </P>
        <EN>
          The app is used by children but accounts are created and controlled by a parent. Children do not have their own
          accounts; all data sits under the parent&apos;s account and can be viewed, edited or deleted by them at any time. We
          recommend parents use a nickname rather than a child&apos;s full name. There are no ads, no chat and no external
          promotional content in the app.
        </EN>

        <H>4. 我们使用的第三方服务 · Third-party services</H>
        <ul className="list-disc pl-5 space-y-1 mb-3">
          <LI><b>Supabase</b> — 账户与数据存储（服务器位于新加坡）。Account and data storage (Singapore region).</LI>
          <LI><b>Vercel</b> — 网站与接口托管。Website and API hosting.</LI>
          <LI><b>OpenAI</b> — 图片文字识别与手写批改。Image text recognition and handwriting grading.</LI>
          <LI><b>Google Cloud Text-to-Speech</b> — 生成词语发音。Word pronunciation audio.</LI>
          <LI><b>Resend</b> — 发送提醒与账户邮件。Reminder and account emails.</LI>
          <LI><b>Stripe</b>（网页付款）、<b>Google Play / Apple App Store</b> 与 <b>RevenueCat</b>（应用内订阅）。Payments and subscriptions.</LI>
        </ul>
        <P>这些服务各自的隐私政策适用于它们处理的数据。</P>
        <EN>Each provider&apos;s own privacy policy applies to the data it processes.</EN>

        <H>5. 数据保存与删除 · Retention and deletion</H>
        <P>
          我们在你使用服务期间保存这些数据。你可以在应用内删除孩子、词表与练习记录；
          如需<b>删除整个账户及其全部数据</b>，请发邮件到 <b>{CONTACT}</b>，我们会在 30 天内处理完成。
          用于 AI 识别的图片仅在处理时使用，不会长期保存在我们的服务器上。
        </P>
        <EN>
          We keep data while you use the service. You can delete children, lists and records in the app; to delete your
          entire account and all its data, email <b>{CONTACT}</b> and we will complete it within 30 days. Images sent for AI
          processing are used only for that request and are not retained on our servers.
        </EN>

        <H>6. 安全 · Security</H>
        <P>
          数据通过 HTTPS 加密传输，存储在启用了访问控制（行级安全策略）的数据库中，只有你的账户能读取自己的数据。
          没有任何系统能保证 100% 安全，但我们会尽力保护。
        </P>
        <EN>
          Data is transmitted over HTTPS and stored in a database with row-level access control so only your account can read
          your data. No system is 100% secure, but we take reasonable measures to protect it.
        </EN>

        <H>7. 政策变更 · Changes</H>
        <P>如本政策有重要变更，我们会更新本页顶部的日期，必要时在应用内或通过邮件通知你。</P>
        <EN>If this policy changes materially we will update the date above and, where appropriate, notify you.</EN>

        <H>8. 联系我们 · Contact</H>
        <P>
          任何关于隐私的问题、查询或删除请求，请联系：<b>{CONTACT}</b>
        </P>
        <EN>For any privacy question, access or deletion request, contact <b>{CONTACT}</b>.</EN>

        <p className="text-center text-[11px] text-gray-300 mt-10">
          板栗老师 · 用心教，智能学 · Taught with care, learn with AI
        </p>
      </div>
    </div>
  );
}
