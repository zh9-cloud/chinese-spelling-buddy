// Curated selection of short Tang/Song dynasty poems
// suitable for Singapore Primary 3–6 students.
// Rotates weekly by ISO week number so it feels "live" without a backend.

export interface Poem {
  title: string;
  author: string;
  dynasty: string;
  lines: string[];
  pinyin: string[];   // one string per line
  translation: string;
}

export const POEMS: Poem[] = [
  {
    title: "静夜思",
    author: "李白",
    dynasty: "唐",
    lines: ["床前明月光，", "疑是地上霜。", "举头望明月，", "低头思故乡。"],
    pinyin: [
      "Chuáng qián míng yuè guāng，",
      "yí shì dì shàng shuāng。",
      "Jǔ tóu wàng míng yuè，",
      "dī tóu sī gù xiāng。",
    ],
    translation: "Moonlight shines before my bed, like frost upon the ground. I raise my head to gaze at the bright moon, then bow my head and think of home.",
  },
  {
    title: "春晓",
    author: "孟浩然",
    dynasty: "唐",
    lines: ["春眠不觉晓，", "处处闻啼鸟。", "夜来风雨声，", "花落知多少。"],
    pinyin: [
      "Chūn mián bù jué xiǎo，",
      "chù chù wén tí niǎo。",
      "Yè lái fēng yǔ shēng，",
      "huā luò zhī duō shǎo。",
    ],
    translation: "In spring I sleep without noticing dawn, birds sing everywhere. Last night came wind and rain — I wonder how many flowers have fallen.",
  },
  {
    title: "咏鹅",
    author: "骆宾王",
    dynasty: "唐",
    lines: ["鹅，鹅，鹅，", "曲项向天歌。", "白毛浮绿水，", "红掌拨清波。"],
    pinyin: [
      "É, é, é,",
      "qū xiàng xiàng tiān gē。",
      "Bái máo fú lǜ shuǐ，",
      "hóng zhǎng bō qīng bō。",
    ],
    translation: "Goose, goose, goose! You bend your neck and sing to the sky. White feathers float on green water, red feet paddle through the clear ripples.",
  },
  {
    title: "登鹳雀楼",
    author: "王之涣",
    dynasty: "唐",
    lines: ["白日依山尽，", "黄河入海流。", "欲穷千里目，", "更上一层楼。"],
    pinyin: [
      "Bái rì yī shān jìn，",
      "Huáng Hé rù hǎi liú。",
      "Yù qióng qiān lǐ mù，",
      "gèng shàng yī céng lóu。",
    ],
    translation: "The sun sets behind the mountains, the Yellow River flows into the sea. To see a thousand miles further, climb up one more floor.",
  },
  {
    title: "悯农",
    author: "李绅",
    dynasty: "唐",
    lines: ["锄禾日当午，", "汗滴禾下土。", "谁知盘中餐，", "粒粒皆辛苦。"],
    pinyin: [
      "Chú hé rì dāng wǔ，",
      "hàn dī hé xià tǔ。",
      "Shuí zhī pán zhōng cān，",
      "lì lì jiē xīn kǔ。",
    ],
    translation: "Farmers hoe at noon under the blazing sun, sweat dripping onto the soil. Who knows that every grain of rice in our bowl is the fruit of bitter toil?",
  },
  {
    title: "游子吟",
    author: "孟郊",
    dynasty: "唐",
    lines: ["慈母手中线，", "游子身上衣。", "临行密密缝，", "意恐迟迟归。"],
    pinyin: [
      "Cí mǔ shǒu zhōng xiàn，",
      "yóu zǐ shēn shàng yī。",
      "Lín xíng mì mì féng，",
      "yì kǒng chí chí guī。",
    ],
    translation: "The thread in a loving mother's hand becomes the coat on her wandering son's back. She stitches closely before he leaves, fearing he will be slow to return.",
  },
  {
    title: "相思",
    author: "王维",
    dynasty: "唐",
    lines: ["红豆生南国，", "春来发几枝。", "愿君多采撷，", "此物最相思。"],
    pinyin: [
      "Hóng dòu shēng nán guó，",
      "chūn lái fā jǐ zhī。",
      "Yuàn jūn duō cǎi xié，",
      "cǐ wù zuì xiāng sī。",
    ],
    translation: "Red beans grow in the south; how many branches bloom each spring? I hope you gather plenty — nothing stirs longing more than these.",
  },
  {
    title: "绝句",
    author: "杜甫",
    dynasty: "唐",
    lines: ["两个黄鹂鸣翠柳，", "一行白鹭上青天。", "窗含西岭千秋雪，", "门泊东吴万里船。"],
    pinyin: [
      "Liǎng gè huánglí míng cuì liǔ，",
      "yī xíng báilù shàng qīng tiān。",
      "Chuāng hán xī lǐng qiān qiū xuě，",
      "mén bó Dōng Wú wàn lǐ chuán。",
    ],
    translation: "Two golden orioles sing in the green willows; a line of white egrets ascends the blue sky. The window frames the snow of a thousand autumns on western peaks; the gate anchors ships sailing ten thousand miles to eastern shores.",
  },
  {
    title: "江雪",
    author: "柳宗元",
    dynasty: "唐",
    lines: ["千山鸟飞绝，", "万径人踪灭。", "孤舟蓑笠翁，", "独钓寒江雪。"],
    pinyin: [
      "Qiān shān niǎo fēi jué，",
      "wàn jìng rén zōng miè。",
      "Gū zhōu suō lì wēng，",
      "dú diào hán jiāng xuě。",
    ],
    translation: "A thousand mountains — no bird flies. Ten thousand paths — no human trace. A lone boat, an old man in rain cape and hat, fishing alone in the cold river snow.",
  },
  {
    title: "望庐山瀑布",
    author: "李白",
    dynasty: "唐",
    lines: ["日照香炉生紫烟，", "遥看瀑布挂前川。", "飞流直下三千尺，", "疑是银河落九天。"],
    pinyin: [
      "Rì zhào xiānglú shēng zǐ yān，",
      "yáo kàn pùbù guà qián chuān。",
      "Fēi liú zhí xià sān qiān chǐ，",
      "yí shì yínhé luò jiǔ tiān。",
    ],
    translation: "Sunlight on the Incense Burner Peak births purple mist; from afar the waterfall hangs like a river before the mountain. The rushing torrent falls three thousand feet — it looks as if the Milky Way has tumbled down from the ninth heaven.",
  },
  {
    title: "清明",
    author: "杜牧",
    dynasty: "唐",
    lines: ["清明时节雨纷纷，", "路上行人欲断魂。", "借问酒家何处有，", "牧童遥指杏花村。"],
    pinyin: [
      "Qīngmíng shí jié yǔ fēn fēn，",
      "lù shàng xíngrén yù duàn hún。",
      "Jiè wèn jiǔ jiā hé chù yǒu，",
      "mùtóng yáo zhǐ xìnghuā cūn。",
    ],
    translation: "During the Qingming Festival, rain falls without end; travellers on the road are overcome with sorrow. I ask where I can find a tavern — a shepherd boy points far away to Apricot Blossom Village.",
  },
  {
    title: "早发白帝城",
    author: "李白",
    dynasty: "唐",
    lines: ["朝辞白帝彩云间，", "千里江陵一日还。", "两岸猿声啼不住，", "轻舟已过万重山。"],
    pinyin: [
      "Zhāo cí Báidì cǎiyún jiān，",
      "qiān lǐ Jiānglíng yī rì huán。",
      "Liǎng àn yuán shēng tí bú zhù，",
      "qīng zhōu yǐ guò wàn chóng shān。",
    ],
    translation: "At dawn I left White Emperor City among the colourful clouds; a thousand miles to Jiangling, I return in a single day. The monkeys on both banks cry without ceasing, yet my light boat has already passed ten thousand mountains.",
  },
];

// Returns the poem for the current week (rotates every 7 days)
export function getPoemOfWeek(): Poem {
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return POEMS[weekNumber % POEMS.length];
}
