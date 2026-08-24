# App Store 上架材料 · Store listing copy

一切都可以在 App Store Connect 里直接复制粘贴。字数已按苹果上限控制。

---

## 1. 基本信息 App Information

| 字段 | 填这个 | 上限 |
|---|---|---|
| **Name 名称** | `小华听写 Chinese Spelling` | 30 字符 |
| **Subtitle 副标题** | `Singapore P1–P6 听写练习` | 30 字符 |
| **Bundle ID** | `com.sgspellingbuddy.app` | — |
| **Primary Category** | **Education 教育** | — |
| **Secondary Category** | **Reference 参考** (可留空) | — |
| **Support URL** | `https://www.sgspellingbuddy.com` | — |
| **Marketing URL** | `https://www.sgspellingbuddy.com` | — |
| **Privacy Policy URL** | `https://www.sgspellingbuddy.com/privacy` | — |
| **Copyright** | `2026 Youyou Zhang` | — |

---

## 2. Keywords 关键词（100 字符上限，逗号分隔，不要加空格）

```
听写,华文,中文,spelling,dictation,chinese,primary,singapore,MOE,P1,P2,P3,P4,P5,P6,tuition
```

> 提示：**不要**在关键词里重复 App 名称里已有的词（苹果会自动索引名称和副标题），这样能省字符给别的词。

---

## 3. Promotional Text 推广文本（170 字符上限 · 可随时改，不用重新审核）

```
拍张照，几秒生成听写练习。孩子自己听、自己测、自己改错，家长省心。Snap a photo of the word list — your child practises, tests and reviews on their own.
```

---

## 4. Description 应用描述（4000 字符上限）

```
小华听写 · Chinese Spelling Buddy
专为新加坡小学（P1–P6）华文听写设计，由本地华文老师打造。

孩子自己练，家长不用陪读。

■ 拍照就能出词表
把学校发的听写单拍下来，或导入 PDF，AI 自动识别课次、词语和句子，几秒生成练习。也可以手动输入。

■ 学习模式
真人发音朗读每个词语，配拼音和意思，米字格显示汉字结构。四字词自动排成上下两行，字更大，低年级孩子看得清。

■ 测验模式
先听发音，孩子在纸上写，再对照答案自评。答对得钻石，答错自动进入错字本。

■ AI 批改手写
孩子把写好的答案拍照上传，AI 逐字比对批改。批改结果家长可以逐个纠正——AI 偶尔会看走眼，最终成绩由你确认。

■ 错字本
写错的词自动收集，随时重练，直到掌握。

■ 听写提醒
输入听写日期，自动在周末和前一晚提醒复习。可发到邮箱，也可导出整个学期到日历。

■ 进度与奖励
连续打卡、每周报告、钻石奖励，让孩子愿意坚持。最多支持 2 个孩子。

──────────

Built by a Singapore Chinese-language teacher for local primary students (P1–P6).

• Photo/PDF import — snap the school's spelling list, AI turns it into practice in seconds
• Learn mode — natural audio, pinyin, meanings, and 米字格 character grids
• Test mode — listen, write on paper, self-check; earn diamonds
• AI handwriting grading — photograph the answers, AI marks each character, and parents can correct any wrong judgment before it's saved
• Mistakes book — wrong words collected automatically for re-practice
• Reminders — weekend and night-before revision prompts by email or calendar
• Streaks, weekly reports and diamond rewards to keep kids going

──────────

免费使用：手动录入词表、学习与测验模式、真人发音、错字本，另有 3 次免费 AI 体验。

Pro 会员解锁：无限拍照/PDF 识别、无限 AI 批改、听写提醒、进度分析。
月付 S$2.99 / 年付 S$20。订阅可随时在系统设置中取消。

隐私：账户由家长创建和掌控，孩子不需要独立账户。无广告、不出售数据、不做行为定向广告。建议家长用昵称而非孩子真实全名。
隐私政策：https://www.sgspellingbuddy.com/privacy
```

---

## 5. 订阅内购信息（在 App Store Connect → 订阅项里填）

| 项 | 月付 | 年付 |
|---|---|---|
| Reference Name | `Pro Monthly` | `Pro Annual` |
| Product ID | `com.sgspellingbuddy.app.pro.monthly` | `com.sgspellingbuddy.app.pro.annual` |
| 时长 | 1 Month | 1 Year |
| 价格 | 最接近 **S$2.99** 的档位 | 最接近 **S$20** 的档位 |
| Display Name | `Pro 月付 Monthly` | `Pro 年付 Annual` |
| Description | `解锁无限 AI 识别与批改、听写提醒和进度分析。Unlock unlimited AI import & grading, reminders and analytics.` | 同左 |

> 订阅组名（Subscription Group）：`Chinese Spelling Buddy Pro`

---

## 6. Age Rating 年龄分级问卷 — 逐题答案

除下列外**全部选 None / No**：

| 问题 | 答 |
|---|---|
| 暴力、恐怖、성 内容、赌博、酒精毒品等 | **None（全部无）** |
| Unrestricted Web Access 不受限网页访问 | **No**（App 只加载自己的站点） |
| 是否含用户生成内容 / 社交功能 | **No** |
| 是否含广告 | **No** |
| **Made for Kids** | **No**（这点见下方说明） |

⚠️ **Made for Kids 选 No** —— 虽然孩子在用，但**账户由家长创建和掌控**。选 Yes 会进入 Apple 的 Kids Category，规则严格得多（不能有外链、第三方分析等），而且**内购和账户体系会受限**。教育类工具通常都选 No，靠年龄分级（4+）覆盖。

预期结果分级：**4+**

---

## 7. App Privacy 隐私营养标签 — 逐项答案

**收集并关联到用户身份（Linked to You）：**

| 类型 | 具体 | 用途 |
|---|---|---|
| Contact Info | Email Address | App Functionality（账户登录） |
| User Content | Photos（词表/手写照片）、Other User Content（词表、练习记录） | App Functionality |
| Identifiers | User ID | App Functionality |
| Purchases | Purchase History | App Functionality |

**全部勾选：**
- ❌ 不用于 Tracking（追踪）
- ❌ 不用于 Third-Party Advertising
- ❌ 不用于 Developer's Advertising or Marketing

> 注意：照片是**发送给 OpenAI 做识别/批改后即用即弃**，不长期保存在服务器；标签里仍需申报「收集」，因为确实上传处理过。

---

## 8. App Review Information 审核信息（很重要）

**Sign-in required：Yes** —— 必须给审核员一个能登录的测试账号：

```
Email: （请创建一个专用测试账号，例如 appreview@sgspellingbuddy.com 或用你的备用邮箱注册）
Password: （设一个简单密码）
```

⚠️ **建议给这个账号开通 Pro**（用你 /admin 里的「老师赠送 Pro」工具），否则审核员看不到 AI 功能，可能因「功能不可用」被拒。

**Notes 备注（复制给审核员）：**

```
Chinese Spelling Buddy helps Singapore primary-school students (P1–P6) practise Chinese spelling/dictation.

HOW TO TEST
1. Sign in with the demo account above (it has Pro enabled).
2. Parent tab: tap "拍照 / PDF" (Scan & import). The app opens the NATIVE CAMERA — photograph any Chinese word list (or use "Choose from album"). AI extracts the words into a practice list.
3. Tap a child avatar in the bottom bar to switch to the student view.
4. "学习 Learn" plays natural audio for each word with pinyin and meaning; haptic feedback fires on navigation.
5. "测验 Test" is the self-check quiz.
6. "AI 批改 AI grade" uses the native camera to photograph handwritten answers; AI marks each character and the parent can correct any judgment before saving.

NATIVE FEATURES
Native camera (AVFoundation via Capacitor Camera) for both import and grading, and native haptics during practice.

SUBSCRIPTION
Pro unlocks unlimited AI import/grading, reminders and analytics. Monthly S$2.99 / Annual S$20. Restore Purchases is available on the upgrade screen.

Privacy policy: https://www.sgspellingbuddy.com/privacy
Contact: zhyouyou9@gmail.com
```

---

## 9. 截图 Screenshots

需要 **6.9 吋 iPhone**(1320 × 2868)一组,建议 4–6 张,顺序:

1. 家长主页 —— 下一次听写 + 添加入口
2. 拍照导入 —— 「拍照识别听写单」
3. 学习模式 —— 米字格 + 拼音（四字词 2×2 效果最好）
4. 测验模式
5. AI 批改结果 —— 显示家长纠错
6. 学生主页 —— 打卡 + 钻石

---

## 10. 提交前检查清单

- [ ] Paid Apps Agreement ✅ 已完成
- [ ] 银行 + 税务表 ✅ 已完成
- [ ] 隐私政策网址 ✅ 已上线
- [ ] 审核测试账号已创建，并已赠送 Pro
- [ ] 订阅商品已在 App Store Connect 创建并「准备提交」
- [ ] RevenueCat 已配 iOS SDK key + 商品映射
- [ ] `NEXT_PUBLIC_REVENUECAT_IOS_KEY` 已设到 Vercel 并重新部署
- [ ] 截图已上传
- [ ] EU trader：**不申报**（欧盟不上架，避免公开家庭住址）
