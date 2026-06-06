const STORAGE_KEY = "socialSurvival.alpha.v1";
const MAX_HISTORY = 40;
const MAX_PHRASES = 80;
const ANALYTICS_ID_PREFIX = "ssv";

const toneModes = [
  {
    id: "polite",
    label: "礼貌版",
    english: "Polite",
    hint: "适合第一次见面、服务场景和面试。",
  },
  {
    id: "casual",
    label: "自然版",
    english: "Casual",
    hint: "像正常生活聊天，不端着，也不过度正式。",
  },
  {
    id: "confident",
    label: "自信版",
    english: "Confident",
    hint: "表达明确，不让对方猜，但不压迫对方。",
  },
  {
    id: "impatient",
    label: "不耐烦版",
    english: "Risky",
    hint: "用于观察语气风险。现实里尤其不要拿去面试。",
  },
];

const rubricMeta = {
  goal: {
    label: "沟通目标",
    short: "目标",
    description: "有没有完成这一轮真正需要做的事",
  },
  relevance: {
    label: "回应相关",
    short: "相关",
    description: "有没有接住对方刚刚问的问题",
  },
  relationship: {
    label: "关系影响",
    short: "关系",
    description: "语气是否符合人物关系和当前压力",
  },
  naturalness: {
    label: "表达自然",
    short: "自然",
    description: "是否清楚、简洁，并接近真实口语",
  },
};

const categoryLabels = {
  daily: "日常生活",
  study: "学业沟通",
  work: "工作场景",
  home: "居住沟通",
};

const scenes = [
  {
    id: "coffee",
    index: "01",
    category: "daily",
    tag: "奥克兰咖啡店",
    title: "第一次点 Flat White",
    description: "后面有人排队。目标不是展示词汇量，而是短、清楚、礼貌地拿到咖啡。",
    difficulty: "Easy",
    survivalSkill: "点单与请求",
    mission: "说清楚饮品、尺寸、奶和是否加购，并自然结束交易。",
    risk: "回答太长会堵住队伍；命令式表达可能让语气显得硬。",
    subtext: "店员不是在考你英语，只是想快速确认选项。短、清楚、礼貌就够。",
    persona: {
      name: "Sam",
      role: "咖啡店店员 / 早高峰仍然努力友好",
      mood: "Friendly, queue growing",
    },
    betterPhrase: "Could I please get a medium flat white with oat milk? Just the coffee today, thanks.",
    nextChallenge: "店员问你要不要 loyalty card，你要自然地说没有，但想办一个。",
    finalReply: "Perfect. Just tap when you're ready. We'll call your name when it's done.",
    endings: {
      good: ["顺利拿到咖啡", "信息清楚、节奏合适，店员不需要反复确认。"],
      ok: ["咖啡能拿到", "你完成了交易，但还有一两轮可以说得更具体或更柔和。"],
      bad: ["咖啡到了，空气冷了", "交易完成了，但对方需要猜测或承受了一点语气压力。"],
    },
    turns: [
      {
        prompt: "Hey, how's it going? What can I get for you today?",
        goal: "说出你想点的饮品",
        signals: ["coffee", "flat white", "latte", "cappuccino", "long black", "mocha", "tea", "hot chocolate"],
        repair: "Sorry, what drink would you like?",
        examples: {
          polite: ["Could I please get a flat white?", "Can I please have a latte?"],
          casual: ["Can I grab a flat white?", "A latte, thanks."],
          confident: ["I'll have a flat white, please.", "A long black for me, thanks."],
          impatient: ["Give me a flat white.", "Coffee."],
        },
      },
      {
        prompt: "Sweet. What size are we doing?",
        goal: "选择一个尺寸",
        signals: ["small", "medium", "regular", "large", "size"],
        repair: "Would you like small, medium, or large?",
        examples: {
          polite: ["A medium one, please.", "Could I get a regular size, please?"],
          casual: ["Regular, thanks.", "Just a medium."],
          confident: ["Medium is perfect, thanks.", "I'll go for a large."],
          impatient: ["Medium.", "Just regular."],
        },
      },
      {
        prompt: "All good. Any milk preference, or just regular?",
        goal: "说明奶的选择",
        signals: ["milk", "oat", "regular", "soy", "almond", "coconut", "dairy", "no preference"],
        repair: "Would you like regular milk, oat, soy, or something else?",
        examples: {
          polite: ["Oat milk, please.", "Regular milk is fine, thanks."],
          casual: ["Oat, please.", "Regular is all good."],
          confident: ["Oat milk, please. No sugar.", "Regular milk works for me."],
          impatient: ["Oat.", "Regular."],
        },
      },
      {
        prompt: "Nice. Anything else today, or just the coffee?",
        goal: "确认是否还要其他东西",
        signals: ["just", "coffee", "nothing", "no thanks", "no, thanks", "muffin", "food", "that's all", "that is all", "yes"],
        repair: "Would you like anything else with that?",
        examples: {
          polite: ["Just the coffee today, thank you.", "No thanks, that's all."],
          casual: ["Just the coffee, cheers.", "Maybe a muffin as well."],
          confident: ["That's all for me, thanks.", "I'll add a blueberry muffin too."],
          impatient: ["No, just coffee.", "Just that."],
        },
      },
    ],
  },
  {
    id: "smalltalk",
    index: "02",
    category: "study",
    tag: "课堂 Small Talk",
    title: "小组作业前的破冰",
    description: "你和本地同学被分到同一组。目标不是突然变外向，而是让对话继续往前走。",
    difficulty: "Medium",
    survivalSkill: "接话与合作",
    mission: "回应同学、表达一个观点，并主动承担一个小任务。",
    risk: "只说 yes/no 会让对方不知道怎么接；太正式则像在写邮件。",
    subtext: "同学真正想知道的是：你愿不愿意参与，以及能不能一起把任务往前推。",
    persona: {
      name: "Jess",
      role: "设计课同学 / 看起来很 chill 但也没读懂 brief",
      mood: "Curious, slightly confused",
    },
    betterPhrase: "Yeah, I'm in this paper too. I'm still getting my head around the brief, but it looks interesting.",
    nextChallenge: "小组里有人一直说话，你要自然插入自己的观点。",
    finalReply: "Great, I'll add you to the group chat and we can sort the task list there.",
    endings: {
      good: ["组队气氛稳定", "你回应了对方，也让大家知道你愿意贡献什么。"],
      ok: ["破冰成功一半", "你加入了对话，但还可以多给一点观点或主动性。"],
      bad: ["你还像一个头像", "对方能听懂，但仍然不确定你是否想参与。"],
    },
    turns: [
      {
        prompt: "Hey, you're in this design paper too, right?",
        goal: "确认身份并接住寒暄",
        signals: ["yes", "yeah", "yep", "i am", "i'm", "same", "design", "paper", "class", "course"],
        repair: "Are you taking this design paper as well?",
        examples: {
          polite: ["Yes, I am. Nice to meet you.", "Yeah, I'm in this paper too."],
          casual: ["Yeah, I am. How are you finding it?", "Yep, same class."],
          confident: ["Yes, I'm in this paper. I'm doing the design master's.", "I am. I'm looking forward to the project."],
          impatient: ["Yeah.", "Obviously."],
        },
      },
      {
        prompt: "Nice. I'm still trying to figure out what the brief actually wants. What do you reckon?",
        goal: "对 brief 表达一个观点",
        signals: ["think", "brief", "open", "vague", "research", "focus", "figure", "understand", "interesting", "broad", "narrow"],
        repair: "What do you think the main focus of the brief is?",
        examples: {
          polite: ["I think it's interesting, but a bit open-ended.", "I'm still getting my head around it too."],
          casual: ["Yeah, it feels pretty broad.", "Honestly, I'm still figuring it out too."],
          confident: ["I think the main focus is the user research.", "It feels broad, but we can narrow it down."],
          impatient: ["It's vague.", "I don't know what they want."],
        },
      },
      {
        prompt: "Same. Have you done a project like this before?",
        goal: "说明相关经验或学习意愿",
        signals: ["before", "experience", "done", "project", "new", "first", "similar", "learn", "try", "research", "little", "format", "not really", "kind of", "a bit"],
        repair: "Is this kind of project new for you?",
        examples: {
          polite: ["A little, but not exactly in this format.", "Not really, but I'm keen to learn."],
          casual: ["Kind of, but not like this.", "Not really. Should be interesting though."],
          confident: ["I've done similar research before, so I can help structure it.", "It's new, but I can take the research lead."],
          impatient: ["Not really.", "A bit."],
        },
      },
      {
        prompt: "Cool. Maybe we should split the research first. What would you like to take?",
        goal: "主动承担一个具体任务",
        signals: ["i can", "i'll", "i will", "take", "interview", "research", "visual", "precedent", "survey", "task", "handle"],
        repair: "Which part of the research would you be comfortable taking?",
        examples: {
          polite: ["I can look into user interviews if that helps.", "I'd be happy to take the visual research."],
          casual: ["Yeah, I can take interviews.", "I'll do the visual research."],
          confident: ["I'll take user interviews and share the notes.", "I can handle the precedent research."],
          impatient: ["I'll do interviews.", "Just give me one part."],
        },
      },
    ],
  },
  {
    id: "interview",
    index: "03",
    category: "work",
    tag: "兼职面试",
    title: "被问 Availability",
    description: "咖啡店经理正在判断你是否可靠。目标是清楚、具体、有一点自信，而不是背长稿。",
    difficulty: "Medium",
    survivalSkill: "面试与可靠性",
    mission: "用具体信息证明你能服务顾客、应对忙碌时段并稳定上班。",
    risk: "答案空泛会显得没准备；过度随意或不耐烦会直接降低信任。",
    subtext: "经理真正关心的是可靠性：能不能准时、扛忙、和顾客正常沟通。",
    persona: {
      name: "Morgan",
      role: "咖啡店经理 / 忙但愿意给新人机会",
      mood: "Professional, watching reliability",
    },
    betterPhrase: "I'm available up to 20 hours a week, mostly evenings and weekends, and I can be flexible around university.",
    nextChallenge: "经理问 why should we hire you，你要回答得自信但不油腻。",
    finalReply: "Thanks, that gives me a good picture. We'll finish the interviews and get back to you soon.",
    endings: {
      good: ["面试信号不错", "你的回答具体，经理能想象你实际工作的样子。"],
      ok: ["有机会，但还普通", "核心问题答到了，但可以多给一个具体例子。"],
      bad: ["Offer 正在远离", "经理没有得到足够信息，或者语气让可靠性打了折扣。"],
    },
    turns: [
      {
        prompt: "Thanks for coming in. Could you tell me a little bit about yourself?",
        goal: "做一个与岗位相关的简短自我介绍",
        signals: ["student", "study", "design", "auckland", "barista", "experience", "work", "customer", "master", "service", "cafe"],
        repair: "Could you briefly introduce yourself and tell me what brings you to this role?",
        examples: {
          polite: ["I'm a design master's student, and I have previous barista experience.", "I'm studying at Auckland and enjoy customer-facing work."],
          casual: ["I'm a master's student and I've worked as a barista before.", "I study design and have some cafe experience."],
          confident: ["I'm a design master's student with barista and customer service experience.", "I have cafe experience and I'm comfortable working with customers."],
          impatient: ["I'm a student; it's on my CV.", "I'm a student."],
        },
      },
      {
        prompt: "Great. What customer service or cafe experience do you have?",
        goal: "说明一项相关经验",
        signals: ["barista", "cafe", "coffee", "customer", "service", "front", "order", "cash", "worked", "experience"],
        repair: "Can you give me one example of relevant work experience?",
        examples: {
          polite: ["I've worked as a barista and enjoyed helping customers.", "I have cafe experience and I'm happy to learn your process."],
          casual: ["I've worked as a barista before.", "A bit, yeah. I've done cafe work."],
          confident: ["I have barista experience and can handle front-of-house tasks.", "I've worked busy cafe shifts and served customers directly."],
          impatient: ["I have cafe experience; it's on my CV.", "I already said I'm a barista."],
        },
      },
      {
        prompt: "If it got really busy during a rush, how would you handle it?",
        goal: "说明应对忙碌时段的方法",
        signals: ["calm", "priority", "prioritise", "prioritize", "team", "communicate", "order", "organised", "organized", "pressure", "customer", "help", "faster", "rush"],
        repair: "What would you do first during a busy rush?",
        examples: {
          polite: ["I'd stay calm, communicate with the team, and work through orders carefully.", "I'd keep customers updated and ask for help when needed."],
          casual: ["I'd stay calm and work through the orders one by one.", "I'd communicate with the team and keep the line moving."],
          confident: ["I work well under pressure. I'd prioritise orders and communicate clearly.", "I'd stay organised and keep customers updated about waits."],
          impatient: ["Just work faster.", "I'd get the orders done."],
        },
      },
      {
        prompt: "Good. What's your availability like during the week?",
        goal: "清楚说明可工作的时间",
        signals: ["available", "availability", "hours", "week", "evening", "weekend", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "flexible", "class", "university"],
        repair: "Which days or times can you reliably work?",
        examples: {
          polite: ["I'm available up to 20 hours a week, mostly evenings and weekends.", "I can be flexible around my university timetable."],
          casual: ["I can do evenings and weekends, up to 20 hours.", "I'm flexible outside class time."],
          confident: ["I can reliably work up to 20 hours, especially evenings and weekends.", "My schedule is flexible and I can commit to regular shifts."],
          impatient: ["I can do 20 hours.", "Evenings and weekends."],
        },
      },
    ],
  },
  {
    id: "roommate",
    index: "04",
    category: "home",
    tag: "合租室友",
    title: "Can you keep it down?",
    description: "晚上你在打电话，室友敲门说有点吵。目标是解决影响，同时保留合理边界。",
    difficulty: "Spicy",
    survivalSkill: "冲突与边界",
    mission: "承认对方受到影响、提出解决方式，并避免把合租关系推向冷战。",
    risk: "马上辩解会让问题升级；只道歉不说明边界也可能让自己长期不舒服。",
    subtext: "对方想解决噪音，也还想保持和平。先承认影响，再讨论办法。",
    persona: {
      name: "Alex",
      role: "合租室友 / 明天早课，今晚忍耐值不多",
      mood: "Tired, trying to stay calm",
    },
    betterPhrase: "Sorry, I didn't realise it was carrying through the wall. I'll keep it down and use headphones.",
    nextChallenge: "室友总是不洗碗，你要提出问题但不把厨房变成战场。",
    finalReply: "Thanks, I appreciate it. Have a good night.",
    endings: {
      good: ["合租和平保住了", "你承认了影响，也给出了清楚可执行的办法。"],
      ok: ["问题解决，但有点僵", "对方知道你会调整，但关系温度还可以更稳。"],
      bad: ["冷战种子已埋下", "问题没有真正被接住，或回应让对方感觉被否定。"],
    },
    turns: [
      {
        prompt: "Hey, sorry, could you keep it down a bit? I've got an early start tomorrow.",
        goal: "回应噪音问题并提出立即调整",
        signals: ["sorry", "quiet", "quieter", "lower", "keep it down", "headphones", "finish", "few minutes", "didn't realise", "did not realise"],
        relevanceSignals: ["sorry", "quiet", "quieter", "lower", "keep it down", "headphones", "finish", "few minutes", "didn't realise", "did not realise", "not that loud", "fine", "stop"],
        goalSignals: ["sorry", "quiet", "quieter", "lower", "keep it down", "headphones", "finish", "few minutes", "didn't realise", "did not realise", "stop"],
        repair: "Can you lower the volume for tonight?",
        examples: {
          polite: ["Sorry, I didn't realise it was that loud. I'll keep it down.", "Of course. I'll lower my voice."],
          casual: ["Oh, my bad. I'll keep it down.", "Yeah, sorry. I'll be quieter."],
          confident: ["Sure, I'll lower my voice. I may finish this call in a few minutes.", "I'll keep it quieter and use headphones."],
          impatient: ["It's not that loud.", "Fine, I'll stop."],
        },
      },
      {
        prompt: "Thanks. It's just been carrying through the wall quite a bit.",
        goal: "承认影响而不是继续辩解",
        signals: ["understand", "makes sense", "fair", "sorry", "realise", "realize", "hear", "didn't know", "did not know", "thanks for telling"],
        relevanceSignals: ["understand", "makes sense", "fair", "sorry", "realise", "realize", "hear", "heard", "didn't know", "did not know", "thanks for telling", "you said that"],
        goalSignals: ["understand", "makes sense", "fair", "sorry", "realise", "realize", "didn't know", "did not know", "thanks for telling"],
        repair: "Do you understand why the noise has been difficult?",
        examples: {
          polite: ["That makes sense. Sorry, I didn't realise.", "I understand. Thanks for telling me."],
          casual: ["Yeah, fair enough. I get it.", "All good, I didn't realise."],
          confident: ["I understand. I'll keep late calls quieter.", "That's fair. I'll make sure it doesn't carry through the wall."],
          impatient: ["Okay, I heard you.", "Yeah, you said that."],
        },
      },
      {
        prompt: "I don't mind calls, just maybe not this loud late at night. Could we agree on something?",
        goal: "提出一个可执行的共同约定",
        signals: ["after", "before", "ten", "10", "eleven", "11", "headphones", "quiet", "quieter", "agree", "volume", "late", "calls", "message", "text"],
        repair: "What agreement would work for late-night calls?",
        examples: {
          polite: ["Could we agree that I'll keep calls quiet after ten?", "I'll use headphones and lower my voice after ten."],
          casual: ["Yeah, I'll keep it quiet after ten.", "I'll use headphones for late calls."],
          confident: ["I'll keep calls quiet after ten, but I may still need to take short calls.", "Let's agree on lower volume after ten."],
          impatient: ["Fine, no calls after ten.", "Whatever, I'll use headphones."],
        },
      },
      {
        prompt: "That sounds fair. Thanks for talking it through.",
        goal: "自然结束这次轻微冲突",
        signals: ["thanks", "thank you", "no worries", "all good", "good night", "night", "appreciate", "sure", "okay", "sorted", "yep"],
        repair: "Can we leave it there for tonight?",
        examples: {
          polite: ["No worries. Thanks for telling me. Good night.", "Of course. Sleep well."],
          casual: ["All good. Night.", "No worries, good night."],
          confident: ["All sorted. I'll keep it down. Good night.", "Thanks. We have a plan now."],
          impatient: ["Yep.", "Okay."],
        },
      },
    ],
  },
  {
    id: "returnitem",
    index: "05",
    category: "daily",
    tag: "商店服务台",
    title: "退掉一个坏掉的耳机",
    description: "商品出了问题，店员需要先确认情况。目标是坚定地解决问题，同时不给现场增加无谓火气。",
    difficulty: "Medium",
    survivalSkill: "说明问题与协商",
    mission: "说明故障、提供购买凭证、选择解决方式，并确认退款安排。",
    risk: "只说 it doesn't work 信息不够；一开始就指责店员会让简单流程变成冲突。",
    subtext: "店员通常需要按流程记录故障和凭证。你越具体，解决得越快。",
    persona: {
      name: "Taylor",
      role: "商店服务台员工 / 愿意帮忙但需要按退货流程操作",
      mood: "Helpful, following policy",
    },
    betterPhrase: "Hi, I'd like to return these headphones. The left side stopped working yesterday, and I have the receipt here.",
    nextChallenge: "店员只能提供 store credit，你要礼貌确认是否可以原路退款。",
    finalReply: "All sorted. The refund will go back to your card within three to five business days.",
    endings: {
      good: ["问题清楚解决", "你提供了关键信息，也确认了自己想要的解决方式。"],
      ok: ["退货办成了", "流程完成，但有一两处需要店员追问。"],
      bad: ["流程比故障更累", "信息不够具体，或语气让简单问题变得更难处理。"],
    },
    turns: [
      {
        prompt: "Hi there, what can I help you with today?",
        goal: "说明要退换的商品和故障",
        signals: ["return", "refund", "exchange", "headphones", "earphones", "faulty", "broken", "stopped", "working", "doesn't work", "does not work"],
        repair: "What item are you returning, and what's wrong with it?",
        examples: {
          polite: ["Hi, I'd like to return these headphones because the left side stopped working.", "Could I please exchange these faulty earphones?"],
          casual: ["These headphones stopped working, so I'd like to return them.", "Hey, can I exchange these? One side is broken."],
          confident: ["I'd like a refund for these headphones. The left side no longer works.", "These earphones are faulty, and I'd like to exchange them."],
          impatient: ["These are broken. Refund them.", "They don't work."],
        },
      },
      {
        prompt: "No problem. Do you have the receipt or another proof of purchase?",
        goal: "说明你能提供的购买凭证",
        signals: ["receipt", "email", "order", "card", "statement", "proof", "purchase", "bought", "have it", "here"],
        repair: "Can you show me any proof that you bought it here?",
        examples: {
          polite: ["Yes, I have the receipt here.", "I don't have the paper receipt, but I have the order email."],
          casual: ["Yep, the receipt is here.", "I paid by card, and I have the email."],
          confident: ["I have the receipt and the card I used for the purchase.", "The order email is on my phone here."],
          impatient: ["It's right here.", "I bought it here."],
        },
      },
      {
        prompt: "Thanks. Would you prefer a replacement or a refund?",
        goal: "清楚选择解决方式",
        signals: ["replacement", "replace", "exchange", "refund", "card", "prefer", "would like", "want", "same"],
        repair: "Would you like another pair, or your money back?",
        examples: {
          polite: ["A refund to my card would be great, please.", "Could I please get a replacement?"],
          casual: ["A refund would be great, thanks.", "I'll take a replacement."],
          confident: ["I'd prefer a full refund to the original card.", "A replacement of the same model works for me."],
          impatient: ["Refund.", "Just replace it."],
        },
      },
      {
        prompt: "Done. The refund should appear in three to five business days. Is that all right?",
        goal: "确认安排并自然结束",
        signals: ["fine", "great", "works", "all right", "okay", "thanks", "thank you", "appreciate", "perfect"],
        repair: "Are you happy with that refund timeframe?",
        examples: {
          polite: ["That's perfect, thank you for your help.", "That works for me. I appreciate it."],
          casual: ["Great, thanks for sorting it.", "Yep, that works. Cheers."],
          confident: ["That timeframe works for me. Thank you.", "Perfect. I'll check the card next week."],
          impatient: ["Fine.", "Okay."],
        },
      },
    ],
  },
  {
    id: "professor",
    index: "06",
    category: "study",
    tag: "Office Hours",
    title: "向导师问清作业要求",
    description: "你不是来让导师替你做作业，而是带着初步想法确认方向。目标是问得具体，也展示你已经思考过。",
    difficulty: "Medium",
    survivalSkill: "澄清与提案",
    mission: "说明来意、指出具体疑问、提出初步方案，并确认下一步。",
    risk: "只问 What should I do? 会把思考工作全部丢给导师；解释太久又会失去重点。",
    subtext: "导师想看到你主动思考，也愿意帮你避免在错误方向上花太久。",
    persona: {
      name: "Dr Lee",
      role: "课程导师 / 时间有限，但喜欢具体问题",
      mood: "Focused, ready to guide",
    },
    betterPhrase: "I've read the brief and drafted a direction, but I'd like to clarify how narrow the research question should be.",
    nextChallenge: "导师不同意你的方向，你要追问原因并提炼可执行的修改建议。",
    finalReply: "That sounds like a sensible next step. Send me the revised question before Friday if you'd like quick feedback.",
    endings: {
      good: ["方向变清楚了", "你带着思考来，也带着明确下一步离开。"],
      ok: ["拿到了一些线索", "问题得到回应，但你的方案或下一步还可以更具体。"],
      bad: ["答疑变成猜谜", "导师仍不清楚你卡在哪里，或不知道该如何有效帮助。"],
    },
    turns: [
      {
        prompt: "Hi Mylo, what would you like to discuss today?",
        goal: "简短说明来意",
        signals: ["assignment", "brief", "project", "question", "clarify", "direction", "research", "discuss", "feedback"],
        repair: "Which assignment or question do you need help clarifying?",
        examples: {
          polite: ["I'd like to clarify one part of the assignment brief, please.", "I have a question about my research direction."],
          casual: ["I wanted to check my direction for the project.", "I'm a bit unsure about one part of the brief."],
          confident: ["I've drafted a direction and want to clarify the assignment scope.", "I'd like feedback on one specific research question."],
          impatient: ["I don't understand the assignment.", "What am I meant to do?"],
        },
      },
      {
        prompt: "Of course. Which part feels unclear?",
        goal: "指出一个具体疑问",
        signals: ["scope", "narrow", "broad", "research", "question", "deliverable", "expected", "criteria", "example", "focus"],
        repair: "Can you name the exact requirement you are unsure about?",
        examples: {
          polite: ["I'm unsure how narrow the research question is expected to be.", "Could you clarify the expected scope of the final deliverable?"],
          casual: ["I'm not sure if my research question is too broad.", "The final deliverable is the part I'm unsure about."],
          confident: ["I need to confirm whether the focus should be one user group or several.", "I'd like to clarify how the research criteria will be assessed."],
          impatient: ["The scope makes no sense.", "All of it is unclear."],
        },
      },
      {
        prompt: "That makes sense. What direction are you currently considering?",
        goal: "提出你的初步方案",
        signals: ["plan", "focus", "focusing", "research", "interview", "test", "user", "group", "prototype", "explore", "considering", "idea", "decided", "student", "students"],
        repair: "What is your current idea, even if it is still rough?",
        examples: {
          polite: ["I'm considering focusing on international students and testing a small prototype.", "My current plan is to interview one user group first."],
          casual: ["I'm thinking of focusing on international students.", "My rough idea is to interview users and test a prototype."],
          confident: ["I plan to focus on one user group, run interviews, and test a prototype.", "My current direction is a small study of how students navigate the service."],
          impatient: ["I haven't decided.", "I just need an idea."],
        },
      },
      {
        prompt: "Good start. What will you do next to make that more focused?",
        goal: "确认一个明确的下一步",
        signals: ["revise", "rewrite", "fix", "narrow", "send", "email", "start", "draft", "interview", "research", "confirm", "next", "Friday"],
        repair: "What specific action will you take after this meeting?",
        examples: {
          polite: ["I'll narrow the question and email you a revised draft by Friday.", "I'll start with two interviews and then confirm the scope."],
          casual: ["I'll tighten the question and send you a draft.", "I'll start the interviews and see what comes up."],
          confident: ["I'll revise the question today and send it by Friday.", "My next step is to run two interviews and refine the focus."],
          impatient: ["I'll fix it.", "I guess I'll rewrite it."],
        },
      },
    ],
  },
  {
    id: "shiftswap",
    index: "07",
    category: "work",
    tag: "兼职排班",
    title: "临时请求换班",
    description: "你周六有学校活动，需要请同事换班。目标是提出完整方案，而不是把麻烦直接丢给别人。",
    difficulty: "Spicy",
    survivalSkill: "请求与责任",
    mission: "说明请求、提供对等交换、主动通知经理，并确认安排。",
    risk: "只问 Can you cover me? 会让对方承担全部成本；含糊确认可能造成无人上班。",
    subtext: "同事更愿意帮忙，是因为你尊重他的时间，也准备承担另一个班次。",
    persona: {
      name: "Jamie",
      role: "咖啡店同事 / 愿意互相帮忙，但不想被临时甩班",
      mood: "Busy, open to a fair swap",
    },
    betterPhrase: "Could you cover my Saturday morning shift? I can take your Monday evening shift in return, and I'll confirm it with the manager.",
    nextChallenge: "同事拒绝换班，你要接受答案并寻找第二个解决方案。",
    finalReply: "Perfect. Once the manager confirms it, we're all sorted.",
    endings: {
      good: ["换班安排可靠", "请求公平、责任清楚，也没有给团队留下排班漏洞。"],
      ok: ["大致换成了", "对方愿意帮忙，但确认流程还可以更稳。"],
      bad: ["排班风险上升", "请求像在甩责任，或关键确认没有完成。"],
    },
    turns: [
      {
        prompt: "Hey, what's up? You said you wanted to ask me something about the roster.",
        goal: "提出具体换班请求",
        signals: ["shift", "swap", "cover", "Saturday", "morning", "roster", "can you", "could you", "university", "class"],
        repair: "Which shift do you need help with?",
        examples: {
          polite: ["Could you cover my Saturday morning shift? I have a university event.", "Would you be able to swap my Saturday shift?"],
          casual: ["Any chance you can cover my Saturday morning shift?", "Could we swap shifts this weekend?"],
          confident: ["I need to swap my Saturday morning shift because of university.", "Could you cover Saturday morning if I take one of your shifts?"],
          impatient: ["You need to cover Saturday.", "I can't work my shift."],
        },
      },
      {
        prompt: "Maybe. I need Monday evening covered. Could you take that one?",
        goal: "回应对方提出的交换条件",
        signals: ["Monday", "evening", "take", "cover", "can", "available", "works", "swap", "yes", "can't", "cannot"],
        repair: "Are you available to work Monday evening in return?",
        examples: {
          polite: ["Yes, I can take your Monday evening shift.", "Monday evening works for me, thank you."],
          casual: ["Yep, I can cover Monday evening.", "Monday works. Let's swap."],
          confident: ["I can take Monday evening in return. That swap works for me.", "Yes, I'm available Monday evening."],
          impatient: ["Fine, I'll take Monday.", "I guess."],
        },
      },
      {
        prompt: "Cool. We should probably make sure Morgan updates the roster.",
        goal: "主动承担通知经理和确认排班",
        signals: ["manager", "Morgan", "message", "tell", "update", "confirm", "roster", "email", "I'll", "I will"],
        repair: "Who will confirm the swap with the manager?",
        examples: {
          polite: ["I'll message Morgan now and ask them to confirm the roster update.", "I'll let the manager know and copy you in."],
          casual: ["I'll message Morgan now.", "Yep, I'll get the roster updated."],
          confident: ["I'll confirm the swap with Morgan and send you the updated roster.", "I'll take responsibility for getting manager approval."],
          impatient: ["You tell Morgan.", "Someone can update it."],
        },
      },
      {
        prompt: "Thanks. Send me the confirmation when you get it.",
        goal: "确认后续并感谢对方",
        signals: ["thanks", "thank you", "appreciate", "send", "confirm", "confirmation", "will do", "sure", "message"],
        repair: "Will you send me the manager's confirmation?",
        examples: {
          polite: ["Absolutely. I'll send the confirmation as soon as I get it. Thank you.", "Will do, and I really appreciate your help."],
          casual: ["Will do. Thanks for helping me out.", "Yep, I'll send it through. Thanks."],
          confident: ["I'll send you the confirmation today. Thanks for the fair swap.", "Confirmed. I'll keep you updated."],
          impatient: ["Sure.", "Fine, I'll send it."],
        },
      },
    ],
  },
  {
    id: "flatviewing",
    index: "08",
    category: "home",
    tag: "奥克兰看房",
    title: "看房时问清费用",
    description: "房间看起来不错，但真正重要的是入住时间、费用和申请流程。目标是友好，也把关键问题问清。",
    difficulty: "Medium",
    survivalSkill: "询问条件与确认",
    mission: "介绍自己、说明入住计划、确认实际费用，并表达下一步意向。",
    risk: "因为怕显得麻烦而不问费用，之后会付出更大成本；连续审问式提问也会让对话变硬。",
    subtext: "房东或现有室友既在介绍房子，也在判断你是否是可靠、好沟通的住户。",
    persona: {
      name: "Casey",
      role: "现有室友 / 正在找一个可靠的新室友",
      mood: "Welcoming, checking fit",
    },
    betterPhrase: "I'm interested in the room. Could I confirm the bond, whether utilities are included, and the earliest move-in date?",
    nextChallenge: "对方问你生活习惯，你要诚实说明作息，也判断彼此是否合适。",
    finalReply: "Great. Send through the application and references tonight, and we'll get back to you tomorrow.",
    endings: {
      good: ["关键条件问清了", "双方都获得了判断是否合适所需要的信息。"],
      ok: ["房子有希望", "你表达了兴趣，但还有一个关键条件没有完全确认。"],
      bad: ["看了房，没看懂条件", "重要信息仍然模糊，或对方不确定你是否认真可靠。"],
    },
    turns: [
      {
        prompt: "Hi, nice to meet you. Tell me a little about yourself and what you're looking for.",
        goal: "简短介绍自己和找房需求",
        signals: ["student", "study", "work", "room", "flat", "looking", "Auckland", "quiet", "move", "master"],
        repair: "Could you briefly introduce yourself and say what kind of room you need?",
        examples: {
          polite: ["I'm a master's student at the University of Auckland, and I'm looking for a quiet room.", "I study design and I'm looking for a friendly shared flat."],
          casual: ["I'm a master's student looking for a quiet room near university.", "I study design and this kind of shared flat suits me."],
          confident: ["I'm a design master's student, and I'm looking for a stable, respectful flat.", "I study and work part-time, and I want a quiet room in Auckland."],
          impatient: ["I'm a student. I need a room.", "I'm just looking for a flat."],
        },
      },
      {
        prompt: "Sounds good. When would you want to move in?",
        goal: "说明预计入住时间",
        signals: ["move", "date", "week", "month", "June", "July", "August", "available", "start", "immediately", "next", "soon", "possible"],
        repair: "What date could you start the tenancy?",
        examples: {
          polite: ["I'd like to move in at the start of July, if that works.", "I'm available to move in next week."],
          casual: ["The start of July would be ideal.", "I could move in next week."],
          confident: ["I can start the tenancy on the first of July.", "I'm ready to move in next Monday."],
          impatient: ["As soon as possible.", "Next week."],
        },
      },
      {
        prompt: "Great. Do you have any questions about the room or the costs?",
        goal: "确认押金、租金或水电网等关键费用",
        signals: ["bond", "rent", "utilities", "power", "water", "internet", "included", "cost", "costs", "week", "expense"],
        repair: "Which cost would you like me to explain?",
        examples: {
          polite: ["Could I confirm the bond and whether utilities are included?", "Is internet included in the weekly rent, please?"],
          casual: ["How much is the bond, and are utilities included?", "Does the weekly rent include power and internet?"],
          confident: ["I'd like to confirm the bond, weekly rent, and all additional costs.", "Please clarify which utilities are included and which are separate."],
          impatient: ["What are all the extra costs?", "Is anything actually included?"],
        },
      },
      {
        prompt: "The bond is three weeks' rent, and internet is included. Would you like to apply?",
        goal: "表达意向并确认申请下一步",
        signals: ["apply", "application", "interested", "yes", "next", "send", "reference", "documents", "form", "would like"],
        repair: "Are you interested in applying, and do you know the next step?",
        examples: {
          polite: ["Yes, I'd like to apply. Could you send me the application form?", "I'm interested. What references or documents do you need?"],
          casual: ["Yes, I'd like to apply. Send me the form when you can.", "I'm keen. What's the next step?"],
          confident: ["I'd like to apply today. I can send my references and documents tonight.", "Yes, I'm interested. Please send me the application process."],
          impatient: ["Fine, I'll apply.", "Just send the form."],
        },
      },
    ],
  },
];

const defaultProfile = {
  version: 1,
  settings: {
    mode: "practice",
    analyticsConsent: false,
  },
  analytics: {
    visitorId: "",
    firstSeenAt: "",
    lastSource: "",
  },
  history: [],
  phrases: [],
  feedbackOutbox: [],
  streak: {
    count: 0,
    lastDate: "",
  },
};

const state = {
  currentScene: null,
  currentTone: "casual",
  mode: "practice",
  sceneFilter: "all",
  turnIndex: 0,
  socialHp: 100,
  replyOffset: 0,
  answers: [],
  retryCounts: {},
  isListening: false,
  voiceBaseText: "",
  isBusy: false,
  sessionSaved: false,
  practiceId: "",
  sessionStartedAt: 0,
  engine: "local",
  apiAvailable: false,
  appOpenTracked: false,
  lastAiResponse: "",
  lastEvaluation: null,
  activeView: "home",
};

let profile = loadProfile();
const analyticsRuntime = {
  sessionId: createAnalyticsId("session"),
  source: cleanAnalyticsSource(getQueryParam("src") || getQueryParam("utm_source") || getQueryParam("ref")),
  campaign: cleanAnalyticsSource(getQueryParam("campaign") || getQueryParam("utm_campaign")),
  landingPath: (window.location?.pathname || "/").slice(0, 120),
};
ensureAnalyticsIdentity();
state.mode = profile.settings.mode || "practice";

const views = {
  home: document.querySelector("#homeView"),
  scenes: document.querySelector("#scenesView"),
  chat: document.querySelector("#chatView"),
  result: document.querySelector("#resultView"),
  progress: document.querySelector("#progressView"),
  phrases: document.querySelector("#phrasesView"),
};

const sceneGrid = document.querySelector("#sceneGrid");
const sceneFilter = document.querySelector("#sceneFilter");
const chatLog = document.querySelector("#chatLog");
const chatForm = document.querySelector("#chatForm");
const messageInput = document.querySelector("#messageInput");
const quickReplies = document.querySelector("#quickReplies");
const toneGrid = document.querySelector("#toneGrid");
const toneLab = document.querySelector("#toneLab");
const toneHint = document.querySelector("#toneHint");
const turnCoach = document.querySelector("#turnCoach");
const voiceButton = document.querySelector("#voiceButton");
const voiceButtonText = document.querySelector("#voiceButtonText");
const voiceStatus = document.querySelector("#voiceStatus");
const voiceDiagnostics = document.querySelector("#voiceDiagnostics");
const reportResponseButton = document.querySelector("#reportResponseButton");
const feedbackDialog = document.querySelector("#feedbackDialog");
const methodDialog = document.querySelector("#methodDialog");
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

function cloneDefaultProfile() {
  return JSON.parse(JSON.stringify(defaultProfile));
}

function loadProfile() {
  try {
    const saved = window.localStorage?.getItem(STORAGE_KEY);
    if (!saved) return cloneDefaultProfile();
    const parsed = JSON.parse(saved);
    return {
      ...cloneDefaultProfile(),
      ...parsed,
      settings: { ...defaultProfile.settings, ...(parsed.settings || {}) },
      streak: { ...defaultProfile.streak, ...(parsed.streak || {}) },
      analytics: { ...defaultProfile.analytics, ...(parsed.analytics || {}) },
      history: Array.isArray(parsed.history) ? parsed.history : [],
      phrases: Array.isArray(parsed.phrases) ? parsed.phrases : [],
      feedbackOutbox: Array.isArray(parsed.feedbackOutbox) ? parsed.feedbackOutbox : [],
    };
  } catch (error) {
    return cloneDefaultProfile();
  }
}

function saveProfile() {
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    // The product remains usable when storage is unavailable.
  }
}

function ensureAnalyticsIdentity() {
  let changed = false;
  profile.analytics = { ...defaultProfile.analytics, ...(profile.analytics || {}) };
  if (!profile.analytics.visitorId) {
    profile.analytics.visitorId = createAnalyticsId("visitor");
    changed = true;
  }
  if (!profile.analytics.firstSeenAt) {
    profile.analytics.firstSeenAt = new Date().toISOString();
    changed = true;
  }
  if (analyticsRuntime.source && profile.analytics.lastSource !== analyticsRuntime.source) {
    profile.analytics.lastSource = analyticsRuntime.source;
    changed = true;
  }
  if (changed) saveProfile();
}

function createAnalyticsId(scope) {
  const random =
    typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function"
      ? Array.from(crypto.getRandomValues(new Uint8Array(8)), (value) => value.toString(16).padStart(2, "0")).join("")
      : Math.random().toString(36).slice(2, 14);
  return `${ANALYTICS_ID_PREFIX}_${scope}_${Date.now().toString(36)}_${random}`;
}

function getQueryParam(name) {
  try {
    return new URLSearchParams(window.location?.search || "").get(name) || "";
  } catch (error) {
    return "";
  }
}

function cleanAnalyticsSource(value) {
  return typeof value === "string" ? value.replace(/[^a-z0-9_\-.]/gi, "").slice(0, 80) : "";
}

function getCurrentSource() {
  return analyticsRuntime.source || profile.analytics?.lastSource || "direct";
}

function getViewportBucket() {
  const width = Number(window.innerWidth || 0);
  if (!width) return "unknown";
  if (width < 640) return "phone";
  if (width < 1024) return "tablet";
  return "desktop";
}

function getAnalyticsContext() {
  return {
    visitorId: profile.analytics?.visitorId || "",
    sessionId: analyticsRuntime.sessionId,
    source: getCurrentSource(),
    campaign: analyticsRuntime.campaign,
    landingPath: analyticsRuntime.landingPath,
    viewport: getViewportBucket(),
    speechSupported: Boolean(SpeechRecognition),
    consent: Boolean(profile.settings.analyticsConsent),
  };
}

function showView(name) {
  Object.values(views).forEach((view) => view.classList.remove("is-active"));
  views[name].classList.add("is-active");
  state.activeView = name;
  if (document.body) document.body.dataset.view = name;

  if (name === "home") renderHomeStats();
  if (name === "scenes") renderScenes();
  if (name === "progress") renderProgress();
  if (name === "phrases") renderPhrasebook();

  window.scrollTo?.({ top: 0, behavior: "smooth" });
}

function setMode(mode) {
  state.mode = mode === "challenge" ? "challenge" : "practice";
  profile.settings.mode = state.mode;
  saveProfile();
  renderModeControls();
}

function renderModeControls() {
  document.querySelectorAll?.("[data-mode]")?.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === state.mode);
  });

  document.querySelector("#modeExplainer").textContent =
    state.mode === "practice"
      ? "练习模式会显示表达方向、逐轮依据和建议，适合第一次接触场景。"
      : "挑战模式隐藏提示和逐轮评分，只在结束后复盘，更接近真实现场。";
}

function renderHomeStats() {
  const uniqueDays = new Set(profile.history.map((item) => item.dateKey)).size;
  document.querySelector("#homeStats").innerHTML = `
    <div><strong>${profile.history.length}</strong><span>完成场景</span></div>
    <div><strong>${profile.streak.count || uniqueDays}</strong><span>连续练习</span></div>
    <div><strong>${profile.phrases.length}</strong><span>收藏表达</span></div>
  `;
  document.querySelector("#analyticsConsent").checked = Boolean(profile.settings.analyticsConsent);
  const sourceNote = document.querySelector("#testerSourceNote");
  if (sourceNote) {
    const source = getCurrentSource();
    sourceNote.hidden = source === "direct";
    sourceNote.textContent = source === "direct" ? "" : `测试来源：${source}。勾选后会记录匿名使用漏斗，帮助我们判断这个版本是否真的好用。`;
  }
}

function renderScenes() {
  renderModeControls();
  sceneFilter.value = state.sceneFilter;
  const visibleScenes = state.sceneFilter === "all" ? scenes : scenes.filter((scene) => scene.category === state.sceneFilter);

  sceneGrid.innerHTML = visibleScenes
    .map(
      (scene) => {
        const completions = profile.history.filter((item) => item.sceneId === scene.id).length;
        return `
        <button class="scene-card" type="button" data-scene-id="${scene.id}" data-index="${scene.index}">
          <div class="scene-topline">
            <span>${categoryLabels[scene.category]} · ${scene.tag}</span>
            <span class="pill">${scene.difficulty}</span>
          </div>
          <h3>${scene.title}</h3>
          <p>${scene.description}</p>
          <div class="scene-meta">
            <span class="pill">${scene.survivalSkill}</span>
            <span class="pill">${scene.turns.length} 轮</span>
            ${completions ? `<span class="pill completed">${completions} 次完成</span>` : ""}
          </div>
          <span class="scene-action">开始练习 <span aria-hidden="true">→</span></span>
        </button>
      `;
      },
    )
    .join("");
}

function renderToneGrid() {
  toneLab.hidden = state.mode === "challenge";
  document.querySelector("#activeModeChip").textContent = state.mode === "challenge" ? "挑战模式" : "练习模式";

  if (state.mode === "challenge") {
    toneGrid.innerHTML = "";
    return;
  }

  toneGrid.innerHTML = toneModes
    .map((tone) => {
      const active = tone.id === state.currentTone ? " is-selected" : "";
      const risky = tone.id === "impatient" ? " is-risky" : "";
      return `
        <button class="tone-card${active}${risky}" type="button" data-tone-id="${tone.id}">
          <span class="tone-signal" aria-hidden="true"></span>
          <strong>${tone.label}</strong>
          <small>${tone.english}</small>
        </button>
      `;
    })
    .join("");

  toneHint.textContent = `${getCurrentTone().hint} 评分只看你实际输入的句子，不会因为选择了某个标签而加分。`;
}

function startScene(sceneId) {
  const scene = scenes.find((item) => item.id === sceneId);
  if (!scene) return;

  state.currentScene = scene;
  state.currentTone = "casual";
  state.turnIndex = 0;
  state.socialHp = 100;
  state.replyOffset = 0;
  state.answers = [];
  state.retryCounts = {};
  state.sessionSaved = false;
  state.practiceId = createAnalyticsId("practice");
  state.sessionStartedAt = Date.now();
  state.lastAiResponse = "";
  state.lastEvaluation = null;
  state.isBusy = false;

  stopListening();
  document.querySelector("#sceneTag").textContent = scene.tag;
  document.querySelector("#sceneTitle").textContent = scene.title;
  document.querySelector("#sceneDescription").textContent = scene.description;
  document.querySelector("#missionText").textContent = scene.mission;
  document.querySelector("#riskText").textContent = scene.risk;
  document.querySelector("#subtextText").textContent = scene.subtext;
  document.querySelector("#npcName").textContent = scene.persona.name;
  document.querySelector("#npcRole").textContent = scene.persona.role;
  document.querySelector("#npcMood").textContent = scene.persona.mood;

  chatLog.innerHTML = "";
  turnCoach.hidden = true;
  reportResponseButton.hidden = true;
  renderToneGrid();
  addMessage(scene.turns[0].prompt, "npc");
  updateProgress();
  updateSocialHp(0);
  renderQuickReplies();
  updateEngineBadges();
  showView("chat");
  setVoiceStatus("可以打字，也可以点击 Speak 说英文。语音识别后会先进入输入框。");
  trackEvent("scene_started", {
    practiceId: state.practiceId,
    scene: scene.id,
    category: scene.category,
    difficulty: scene.difficulty,
    mode: state.mode,
  });
  window.setTimeout?.(() => messageInput.focus?.(), 150);
}

function addMessage(text, type, labelOverride) {
  const message = document.createElement("div");
  message.className = `message ${type}`;
  message.dataset.sequence = String(chatLog.children.length + 1).padStart(2, "0");

  const label = document.createElement("span");
  label.className = "message-label";
  label.textContent = labelOverride || getMessageLabel(type);

  const content = document.createElement("span");
  content.className = "message-text";
  content.textContent = text;

  message.append(label, content);
  chatLog.appendChild(message);
  chatLog.scrollTop = chatLog.scrollHeight;
  return message;
}

function getMessageLabel(type) {
  if (type === "npc") return state.currentScene?.persona.name || "Role";
  if (type === "user") return "You";
  return "Coach";
}

function renderQuickReplies() {
  const turn = state.currentScene?.turns[state.turnIndex];
  if (!turn || state.mode === "challenge") {
    quickReplies.innerHTML = "";
    return;
  }

  const replies = getReplyBatch(turn, state.currentTone);
  const tone = getCurrentTone();
  quickReplies.innerHTML = `
    <div class="reply-label">
      <strong>${tone.label}表达方向</strong>
      <span>点击只会填入输入框，你仍可以自己修改。</span>
    </div>
    ${replies.map((reply) => `<button class="quick-reply" type="button">${reply}</button>`).join("")}
    <button class="shuffle-replies" type="button" data-shuffle-replies="true">换一批</button>
  `;
}

function getReplyBatch(turn, toneId) {
  const base = turn.examples[toneId] || turn.examples.casual;
  const extras = {
    polite: ["Thanks for letting me know.", "Could you clarify that, please?"],
    casual: ["Yeah, that works.", "No worries, I get it."],
    confident: ["That works for me.", "I can take care of that."],
    impatient: ["Yep, fine.", "Can we move on?"],
  };
  const expanded = [...new Set([...base, ...(extras[toneId] || [])])];
  const start = state.replyOffset % expanded.length;
  return [...expanded.slice(start), ...expanded.slice(0, start)].slice(0, 3);
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^\p{L}\p{N}'\s.,!?-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesSignal(text, signal) {
  const escaped = String(signal)
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");
  if (!escaped) return false;
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i").test(text);
}

function countWords(text) {
  return text.match(/[a-zA-Z]+(?:'[a-zA-Z]+)?/g)?.length || 0;
}

function inferTone(text) {
  const lower = normalizeText(text);
  if (/(whatever|obviously|i don't care|give me|you said that|not that loud|just work faster|it's on my cv)/.test(lower)) {
    return "impatient";
  }
  if (/(sorry|please|thank you|thanks|could i|would you|i appreciate)/.test(lower)) return "polite";
  if (/(i'll|i will|i can|let's|i work well|i can reliably|that works for me)/.test(lower)) return "confident";
  return "casual";
}

function evaluateTurn(text, turn, scene = state.currentScene) {
  const lower = normalizeText(text);
  const wordCount = countWords(lower);
  const hasEnglish = /[a-zA-Z]/.test(lower);
  const relevanceSignals = turn.relevanceSignals || turn.signals;
  const goalSignals = turn.goalSignals || turn.signals;
  const signalHits = [...new Set(relevanceSignals.filter((signal) => matchesSignal(lower, signal)))];
  const goalHits = [...new Set(goalSignals.filter((signal) => matchesSignal(lower, signal)))];
  const softenerHits = [...new Set((lower.match(/\b(please|thanks|thank you|sorry|could|would|appreciate|no worries)\b/g) || []))];
  const riskyHits = [...new Set((lower.match(/whatever|obviously|give me|i don't care|you said that|it's not that loud|not that loud|just work faster|it's on my cv/g) || []))];
  const directHits = [...new Set((lower.match(/\b(i want|no|fine|just)\b/g) || []))];
  const unnaturalHits = [
    ...new Set(
      (
        lower.match(/\bi very\b|\bi am agree\b|\bcan you give me\b|\blike like\b|\byou know you know\b|\bum um\b/g) || []
      ),
    ),
  ];

  let relevance = signalHits.length ? 78 + Math.min(signalHits.length * 6, 18) : wordCount >= 5 ? 35 : 20;
  let goal = goalHits.length ? 74 + Math.min(goalHits.length * 7, 20) : wordCount >= 6 ? 38 : 24;
  let relationship = 68;
  let naturalness = 70;

  if (!hasEnglish) {
    relevance = 8;
    goal = 8;
    naturalness = 18;
  }

  if (softenerHits.length) relationship += Math.min(softenerHits.length * 8, 18);
  if (riskyHits.length) relationship -= Math.min(riskyHits.length * 28, 50);
  if (directHits.length && !softenerHits.length) relationship -= Math.min(directHits.length * 6, 15);
  if (wordCount <= 2) {
    naturalness -= 20;
    relationship -= 8;
  } else if (wordCount <= 5) {
    naturalness -= 7;
  } else if (wordCount <= 24) {
    naturalness += 8;
  } else if (wordCount > 38) {
    naturalness -= 13;
  }
  naturalness -= unnaturalHits.length * 18;
  if (/[.!?]$/.test(lower)) naturalness += 2;
  if (goalHits.length && wordCount <= 24) goal += 4;

  relevance = clamp(Math.round(relevance), 5, 98);
  goal = clamp(Math.round(goal), 5, 98);
  relationship = clamp(Math.round(relationship), 8, 98);
  naturalness = clamp(Math.round(naturalness), 15, 96);

  const inferredTone = inferTone(text);
  const shouldRetry = relevance < 42 || goal < 38;
  const suggestion = chooseSuggestion(turn, state.currentTone, inferredTone);
  const summary = buildEvaluationSummary({ goal, relevance, relationship, naturalness, shouldRetry });
  const reason = buildEvaluationReason({ signalHits, goalHits, softenerHits, riskyHits, wordCount, relevance, goal, turn });
  const strength = buildTurnStrength({ goal, relevance, relationship, naturalness, softenerHits });
  const improvement = buildTurnImprovement({ goal, relevance, relationship, naturalness, riskyHits, wordCount, turn });
  const hpDelta = clamp(Math.round((relationship - 65) / 5 + (relevance - 55) / 12), -18, 8);

  return {
    goal,
    relevance,
    relationship,
    naturalness,
    overall: Math.round(goal * 0.34 + relevance * 0.26 + relationship * 0.24 + naturalness * 0.16),
    inferredTone,
    shouldRetry,
    signalHits,
    goalHits,
    softenerHits,
    riskyHits,
    unnaturalHits,
    wordCount,
    summary,
    reason,
    strength,
    improvement,
    suggestion,
    hpDelta,
    confidence: signalHits.length ? "中等" : "较低",
    goalText: turn.goal,
    sceneId: scene?.id || "",
  };
}

function chooseSuggestion(turn, selectedTone, inferredTone) {
  const preferred = selectedTone === "impatient" ? "casual" : selectedTone || inferredTone || "casual";
  return turn.examples[preferred]?.[0] || turn.examples.casual[0];
}

function buildEvaluationSummary(scores) {
  if (scores.shouldRetry) return "还没有接住当前问题";
  if (scores.relationship < 45) return "意思到了，但关系温度明显下降";
  if (scores.goal >= 82 && scores.relationship >= 72) return "沟通目标完成，语气也稳";
  if (scores.goal >= 70) return "目标基本完成，还可以更自然";
  return "能继续，但关键信息不够具体";
}

function buildEvaluationReason({ signalHits, goalHits, softenerHits, riskyHits, wordCount, relevance, goal, turn }) {
  const notes = [];
  if (relevance < 42) notes.push(`当前任务是“${turn.goal}”，但回答没有接住对方的问题`);
  else notes.push(`回答包含与当前问题相关的信息：${signalHits.slice(0, 3).join("、")}`);
  if (relevance >= 42 && goal < 38) notes.push(`这句话回应了问题，但还没有完成“${turn.goal}”`);
  if (goalHits.length) notes.push(`完成目标的证据：${goalHits.slice(0, 3).join("、")}`);
  if (softenerHits.length) notes.push("使用了礼貌缓冲");
  if (riskyHits.length) notes.push(`出现高风险表达：${riskyHits.slice(0, 2).join("、")}`);
  if (wordCount <= 3) notes.push("回答非常短，对方可能需要继续猜");
  if (wordCount > 38) notes.push("回答偏长，真实口语里可能难以跟上");
  return `${notes.join("；")}。本轮判断置信度会随场景信号数量变化。`;
}

function buildTurnStrength(scores) {
  const ranked = [
    ["沟通目标明确", scores.goal],
    ["接住了对方的问题", scores.relevance],
    ["语气照顾了关系", scores.relationship],
    ["表达清楚自然", scores.naturalness],
  ].sort((a, b) => b[1] - a[1]);
  return ranked[0][0];
}

function buildTurnImprovement({ relevance, relationship, naturalness, riskyHits, wordCount, turn }) {
  if (relevance < 45) return `先直接完成当前任务：“${turn.goal}”。`;
  if (relationship < 50 || riskyHits.length) return "先承认对方的处境，再表达自己的选择或边界。";
  if (wordCount <= 3) return "多补半句具体信息，让对方不用继续猜。";
  if (naturalness < 60) return "把句子缩短，并使用更常见的口语结构。";
  return "核心表达已经可用，下一步练习更稳定地保持这个水平。";
}

async function handleUserMessage(text) {
  const cleanText = text.trim();
  const scene = state.currentScene;
  const turn = scene?.turns[state.turnIndex];
  if (!cleanText || !scene || !turn || state.isBusy) return;

  state.isBusy = true;
  chatForm.classList.add("is-busy");
  chatForm.setAttribute("aria-busy", "true");
  const sendButton = document.querySelector(".send-button");
  sendButton.disabled = true;
  sendButton.textContent = state.engine === "ai" ? "角色回应中…" : "发送中…";
  stopListening();
  addMessage(cleanText, "user");
  messageInput.value = "";

  const evaluation = evaluateTurn(cleanText, turn, scene);
  state.lastEvaluation = evaluation;
  const attemptNumber = (state.retryCounts[state.turnIndex] || 0) + 1;
  const retry = evaluation.shouldRetry && attemptNumber <= 1;
  state.retryCounts[state.turnIndex] = attemptNumber;
  state.answers.push({
    text: cleanText,
    turnIndex: state.turnIndex,
    attempt: attemptNumber,
    evaluation,
  });

  updateSocialHp(evaluation.hpDelta);
  showTurnFeedback(evaluation);

  if (!retry) state.turnIndex += 1;
  updateProgress();
  quickReplies.innerHTML = "";

  const npcResponse = await getNpcResponse({ scene, turn, evaluation, retry, userText: cleanText });
  addMessage(npcResponse, "npc");

  if (state.engine === "ai") {
    state.lastAiResponse = npcResponse;
    reportResponseButton.hidden = false;
  }

  if (state.turnIndex >= scene.turns.length) {
    window.setTimeout?.(() => showResult(), 420);
  } else {
    renderQuickReplies();
  }

  state.isBusy = false;
  chatForm.classList.remove("is-busy");
  chatForm.setAttribute("aria-busy", "false");
  sendButton.disabled = false;
  sendButton.textContent = "发送";
}

async function getNpcResponse({ scene, turn, evaluation, retry, userText }) {
  if (state.engine === "ai" && state.apiAvailable) {
    try {
      const response = await fetch("/api/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scene: {
            id: scene.id,
            title: scene.title,
            mission: scene.mission,
            persona: scene.persona,
          },
          turn: {
            goal: turn.goal,
            prompt: turn.prompt,
            repair: turn.repair,
          },
          userText,
          evaluation: {
            goal: evaluation.goal,
            relevance: evaluation.relevance,
            relationship: evaluation.relationship,
            naturalness: evaluation.naturalness,
            inferredTone: evaluation.inferredTone,
          },
          retry,
          nextPrompt: retry ? turn.repair : scene.turns[state.turnIndex]?.prompt || scene.finalReply,
        }),
      });

      if (!response.ok) throw new Error("AI response unavailable");
      const payload = await response.json();
      if (typeof payload.reply === "string" && payload.reply.trim()) return payload.reply.trim();
      throw new Error("AI returned no reply");
    } catch (error) {
      state.engine = "local";
      updateEngineBadges("在线 AI 暂时不可用，已切回本地教练");
    }
  }

  return buildLocalNpcResponse(scene, turn, evaluation, retry);
}

function buildLocalNpcResponse(scene, turn, evaluation, retry) {
  if (retry) {
    if (evaluation.relationship < 45) return `Okay... ${turn.repair}`;
    return `Sorry, I didn't quite catch that. ${turn.repair}`;
  }

  const nextPrompt = scene.turns[state.turnIndex]?.prompt || scene.finalReply;
  if (evaluation.relationship < 40) return `Right... ${nextPrompt}`;
  if (evaluation.relationship >= 82) return `Thanks, that helps. ${nextPrompt}`;
  if (evaluation.goal >= 82) return `Great, that's clear. ${nextPrompt}`;
  return nextPrompt;
}

function showTurnFeedback(evaluation) {
  if (state.mode === "challenge") {
    turnCoach.hidden = true;
    return;
  }

  turnCoach.hidden = false;
  document.querySelector("#turnCoachSummary").textContent = evaluation.summary;
  document.querySelector("#turnCoachReason").textContent = evaluation.reason;
  document.querySelector("#turnSuggestion").textContent = evaluation.suggestion;
  document.querySelector("#miniRubric").innerHTML = renderRubricScores(evaluation, true);
}

function renderRubricScores(scores, compact = false) {
  return Object.entries(rubricMeta)
    .map(([key, meta]) => {
      const value = scores[key] ?? 0;
      if (compact) {
        return `<div class="mini-score"><span>${meta.short}</span><strong>${value}</strong></div>`;
      }
      return `
        <div class="rubric-score">
          <span>${meta.label}</span>
          <strong>${value}</strong>
          <small>${meta.description}</small>
        </div>
      `;
    })
    .join("");
}

function updateProgress() {
  const total = state.currentScene?.turns.length || 0;
  const completed = Math.min(state.turnIndex, total);
  const percent = total ? Math.round((completed / total) * 100) : 0;
  document.querySelector("#progressFill").style.width = `${percent}%`;
  document.querySelector("#turnCounter").textContent = `${completed}/${total}`;
}

function updateSocialHp(delta) {
  state.socialHp = clamp(state.socialHp + delta, 0, 100);
  document.querySelector("#socialHpValue").textContent = state.socialHp;
  document.querySelector("#socialHpFill").style.width = `${state.socialHp}%`;
  document.querySelector("#coldAlert").textContent = getColdAlert(state.socialHp);
  document.querySelector("#chatView").dataset.temperature =
    state.socialHp >= 72 ? "stable" : state.socialHp >= 42 ? "warning" : "critical";
}

function getColdAlert(hp) {
  if (hp >= 82) return "气氛流动顺畅，对方不用额外猜测。";
  if (hp >= 62) return "关系温度正常，但还有一两处可以更稳。";
  if (hp >= 38) return "气氛开始变紧，对方可能在重新判断你的意思。";
  if (hp >= 18) return "关系温度较低，先承认对方处境再继续。";
  return "关系温度见底。现在先修复关系，不要急着赢。";
}

function scoreSession(answers) {
  const valid = answers.map((answer) => answer.evaluation).filter(Boolean);
  const completedTurns = new Set(answers.filter((answer) => !answer.evaluation.shouldRetry || answer.attempt > 1).map((answer) => answer.turnIndex)).size;
  const averages = {};

  Object.keys(rubricMeta).forEach((key) => {
    averages[key] = valid.length
      ? Math.round(valid.reduce((sum, evaluation) => sum + evaluation[key], 0) / valid.length)
      : 0;
  });

  const overall = Math.round(
    averages.goal * 0.34 + averages.relevance * 0.26 + averages.relationship * 0.24 + averages.naturalness * 0.16,
  );

  return {
    ...averages,
    overall,
    completedTurns,
    retries: answers.filter((answer) => answer.attempt > 1 || answer.evaluation.shouldRetry).length,
  };
}

function showResult() {
  const scene = state.currentScene;
  if (!scene) return;
  const scores = scoreSession(state.answers);
  const ending = getEnding(scene, scores);
  document.querySelector("#resultView").dataset.ending = ending.key;
  const evidence = buildEvidence(state.answers);
  const strongest = getStrongestDimension(scores);
  const priority = getPriorityDimension(scores);

  document.querySelector("#resultTitle").textContent =
    ending.key === "good" ? "这次现场，你接住了。" : ending.key === "ok" ? "活下来了，还有升级空间。" : "现场有点紧，但复盘很值。";
  document.querySelector("#resultSummary").textContent =
    `你完成了「${scene.title}」。本报告根据每轮沟通目标、回应相关性、关系影响和表达自然度进行教练估算；它不是正式语言考试分数。`;
  document.querySelector("#endingTitle").textContent = ending.title;
  document.querySelector("#endingText").textContent = ending.text;
  document.querySelector("#resultRubric").innerHTML = renderRubricScores(scores);
  document.querySelector("#evidenceList").innerHTML = evidence
    .map((item) => `<div class="evidence-item"><span>第 ${item.turn} 轮</span><p>${escapeHtml(item.text)}</p></div>`)
    .join("");
  document.querySelector("#strongestPoint").textContent = strongest.title;
  document.querySelector("#strongestPointDetail").textContent = strongest.detail;
  document.querySelector("#priorityFix").textContent = priority.title;
  document.querySelector("#priorityFixDetail").textContent = priority.detail;
  document.querySelector("#betterPhrase").textContent = scene.betterPhrase;
  document.querySelector("#nextChallenge").textContent = scene.nextChallenge;
  document.querySelector("#shareLine").textContent = buildShareLine(scene, scores, ending);

  saveSession(scene, scores, ending);
  showView("result");
  trackEvent("scene_completed", {
    practiceId: state.practiceId,
    scene: scene.id,
    category: scene.category,
    difficulty: scene.difficulty,
    mode: state.mode,
    ending: ending.key,
    durationMs: state.sessionStartedAt ? Date.now() - state.sessionStartedAt : 0,
    turns: scene.turns.length,
    socialHp: state.socialHp,
    scores,
  });
}

function buildEvidence(answers) {
  const byTurn = new Map();
  answers.forEach((answer) => byTurn.set(answer.turnIndex, answer));
  return [...byTurn.values()].map((answer) => ({
    turn: answer.turnIndex + 1,
    text: `${answer.evaluation.summary}：${answer.evaluation.reason}`,
  }));
}

function getStrongestDimension(scores) {
  const entries = Object.keys(rubricMeta).sort((a, b) => scores[b] - scores[a]);
  const key = entries[0];
  const details = {
    goal: "你能抓住当前场景真正需要完成的事情，表达不会只停留在语法正确。",
    relevance: "你的回答大多接住了对方刚刚说的话，让对话能继续往前走。",
    relationship: "你会照顾人物关系和当下压力，表达不只是传递信息。",
    naturalness: "你的句子整体清楚、长度合适，真实对话里容易听懂。",
  };
  return { title: rubricMeta[key].label, detail: details[key] };
}

function getPriorityDimension(scores) {
  const entries = Object.keys(rubricMeta).sort((a, b) => scores[a] - scores[b]);
  const key = entries[0];
  const details = {
    goal: "下一次先问自己：这一轮对方到底需要我提供什么信息？先完成它，再润色。",
    relevance: "先用第一句话直接回应当前问题，再补充自己的解释或观点。",
    relationship: "表达选择或边界之前，先承认对方的处境，关系温度会稳很多。",
    naturalness: "优先使用短句和常见口语结构，不需要为了显得高级把一句话拉长。",
  };
  return { title: rubricMeta[key].label, detail: details[key] };
}

function getEnding(scene, scores) {
  const key = scores.overall >= 76 && state.socialHp >= 65 ? "good" : scores.overall < 52 || state.socialHp < 38 ? "bad" : "ok";
  const [title, text] = scene.endings[key];
  return { key, title, text };
}

function buildShareLine(scene, scores, ending) {
  return `我刚在 AI Social Survival 挑战了「${scene.title}」：${ending.title}。沟通目标 ${scores.goal}，回应相关 ${scores.relevance}，关系影响 ${scores.relationship}。这是教练估算，不是考试分数。`;
}

function saveSession(scene, scores, ending) {
  if (state.sessionSaved) return;
  state.sessionSaved = true;
  const now = new Date();
  const item = {
    id: `${now.getTime()}-${scene.id}`,
    createdAt: now.toISOString(),
    dateKey: getLocalDateKey(now),
    sceneId: scene.id,
    sceneTitle: scene.title,
    mode: state.mode,
    ending: ending.title,
    scores,
    socialHp: state.socialHp,
  };
  profile.history.unshift(item);
  profile.history = profile.history.slice(0, MAX_HISTORY);
  updateStreak(item.dateKey);
  saveProfile();
  renderHomeStats();
}

function updateStreak(today) {
  if (profile.streak.lastDate === today) return;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday);
  profile.streak.count = profile.streak.lastDate === yesterdayKey ? profile.streak.count + 1 : 1;
  profile.streak.lastDate = today;
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function savePhrase(text, scene = state.currentScene) {
  const cleanText = text?.trim();
  if (!cleanText) return;
  const exists = profile.phrases.some((item) => item.text.toLowerCase() === cleanText.toLowerCase());
  if (exists) return;
  profile.phrases.unshift({
    id: `${Date.now()}-${profile.phrases.length}`,
    text: cleanText,
    sceneId: scene?.id || "",
    sceneTitle: scene?.title || "自由收藏",
    createdAt: new Date().toISOString(),
  });
  profile.phrases = profile.phrases.slice(0, MAX_PHRASES);
  saveProfile();
  renderHomeStats();
}

function renderProgress() {
  const averages = getHistoryAverages(profile.history);
  document.querySelector("#progressOverview").innerHTML = `
    <div class="overview-stat"><strong>${profile.history.length}</strong><span>完成场景</span></div>
    <div class="overview-stat"><strong>${profile.streak.count}</strong><span>连续练习天数</span></div>
    <div class="overview-stat"><strong>${averages.goal}</strong><span>平均沟通目标</span></div>
    <div class="overview-stat"><strong>${averages.relationship}</strong><span>平均关系影响</span></div>
  `;

  document.querySelector("#historyList").innerHTML = profile.history.length
    ? profile.history
        .map(
          (item) => `
            <article class="history-item">
              <div>
                <p class="eyebrow">${item.dateKey} · ${item.mode === "challenge" ? "挑战模式" : "练习模式"}</p>
                <h3>${escapeHtml(item.sceneTitle)}</h3>
                <p>${escapeHtml(item.ending)} · 关系温度 ${item.socialHp}</p>
              </div>
              <div class="history-scores">
                <span>目标 ${item.scores.goal}</span>
                <span>相关 ${item.scores.relevance}</span>
                <span>关系 ${item.scores.relationship}</span>
                <span>自然 ${item.scores.naturalness}</span>
              </div>
            </article>
          `,
        )
        .join("")
    : `<div class="empty-state">还没有练习记录。完成一个场景后，这里会显示你的变化趋势。</div>`;
}

function getHistoryAverages(history) {
  if (!history.length) return { goal: 0, relationship: 0 };
  return {
    goal: Math.round(history.reduce((sum, item) => sum + item.scores.goal, 0) / history.length),
    relationship: Math.round(history.reduce((sum, item) => sum + item.scores.relationship, 0) / history.length),
  };
}

function renderPhrasebook() {
  const list = document.querySelector("#phrasebookList");
  list.innerHTML = profile.phrases.length
    ? profile.phrases
        .map(
          (item) => `
            <article class="phrasebook-item">
              <div>
                <p class="eyebrow">${escapeHtml(item.sceneTitle)}</p>
                <h3>${escapeHtml(item.text)}</h3>
                <p>收藏于 ${item.createdAt.slice(0, 10)}</p>
              </div>
              <button class="secondary-button" type="button" data-remove-phrase="${item.id}">删除</button>
            </article>
          `,
        )
        .join("")
    : `<div class="empty-state">收藏一句真正想在现实里使用的表达。它会留在这个设备上。</div>`;
}

function clearHistory() {
  const allowed = window.confirm?.("确定清除这个设备上的所有练习记录吗？收藏表达不会被删除。");
  if (allowed === false) return;
  profile.history = [];
  profile.streak = { count: 0, lastDate: "" };
  saveProfile();
  renderProgress();
  renderHomeStats();
}

function removePhrase(id) {
  profile.phrases = profile.phrases.filter((item) => item.id !== id);
  saveProfile();
  renderPhrasebook();
  renderHomeStats();
}

async function copyShareText() {
  const text = document.querySelector("#shareLine").textContent;
  const button = document.querySelector("#copyShareButton");
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "已复制";
  } catch (error) {
    button.textContent = "复制失败，可手动复制";
  }
  window.setTimeout?.(() => {
    button.textContent = "复制分享文案";
  }, 1200);
  trackEvent("share_copied", {
    practiceId: state.practiceId,
    scene: state.currentScene?.id || "",
    mode: state.mode,
  });
}

function setupVoiceInput() {
  updateVoiceDiagnostics();
  if (!SpeechRecognition) {
    voiceButton.disabled = true;
    voiceButtonText.textContent = "No voice";
    setVoiceStatus("当前浏览器不支持语音识别，可以继续使用打字模式。");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-NZ";
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.addEventListener("start", () => {
    state.isListening = true;
    state.voiceBaseText = messageInput.value.trim();
    voiceButton.classList.add("is-listening");
    voiceButton.setAttribute("aria-pressed", "true");
    voiceButtonText.textContent = "Listening";
    setVoiceStatus("正在听。说完后文字会先进入输入框，不会自动发送。");
    trackEvent("voice_started", {
      practiceId: state.practiceId,
      scene: state.currentScene?.id || "",
      mode: state.mode,
    });
  });

  recognition.addEventListener("result", (event) => {
    let transcript = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      transcript += event.results[index][0].transcript;
    }
    messageInput.value = [state.voiceBaseText, transcript.trim()].filter(Boolean).join(" ");
    setVoiceStatus(transcript.trim() ? `我听到：${transcript.trim()}` : "继续说，我在听。");
    if (transcript.trim()) {
      trackEvent("voice_transcribed", {
        practiceId: state.practiceId,
        scene: state.currentScene?.id || "",
        mode: state.mode,
      });
    }
  });

  recognition.addEventListener("end", () => {
    state.isListening = false;
    voiceButton.classList.remove("is-listening");
    voiceButton.setAttribute("aria-pressed", "false");
    voiceButtonText.textContent = "Speak";
    setVoiceStatus(messageInput.value.trim() ? "识别完成。可以修改后发送。" : "没有听清，可以再试一次。");
  });

  recognition.addEventListener("error", (event) => {
    state.isListening = false;
    voiceButton.classList.remove("is-listening");
    voiceButton.setAttribute("aria-pressed", "false");
    voiceButtonText.textContent = "Speak";
    setVoiceStatus(getVoiceErrorMessage(event.error));
    voiceDiagnostics.textContent = getVoiceDiagnosticMessage(event.error);
    voiceDiagnostics.hidden = false;
    trackEvent("voice_error", {
      practiceId: state.practiceId,
      scene: state.currentScene?.id || "",
      mode: state.mode,
      error: event.error || "unknown",
    });
  });
}

function toggleVoiceInput() {
  if (!recognition) return;
  if (state.isListening) {
    recognition.stop();
    return;
  }
  try {
    recognition.start();
  } catch (error) {
    setVoiceStatus("语音识别还没准备好，等一秒再试。");
  }
}

function stopListening() {
  if (recognition && state.isListening) recognition.stop();
}

function setVoiceStatus(text) {
  voiceStatus.textContent = text;
}

function updateVoiceDiagnostics() {
  const protocol = window.location?.protocol || "unknown";
  const support = SpeechRecognition ? "支持 Web Speech API" : "不支持 Web Speech API";
  if (protocol === "file:") {
    voiceDiagnostics.textContent = `${support}。当前是 file:// 页面，建议使用 Chrome/Edge 打开 http://127.0.0.1:4177。`;
  } else if (protocol === "http:" && !["localhost", "127.0.0.1"].includes(window.location?.hostname)) {
    voiceDiagnostics.textContent = `${support}。公开网站必须使用 HTTPS 才能请求麦克风权限。`;
  } else {
    voiceDiagnostics.textContent = `${support}。第一次使用时，浏览器会请求麦克风权限；应用不会保存录音。`;
  }
}

function getVoiceErrorMessage(error) {
  const messages = {
    "not-allowed": "浏览器没有麦克风权限。允许后再试，或继续打字。",
    "no-speech": "没有听到声音。可以靠近一点再试。",
    network: "语音服务连接失败。打字模式仍然可用。",
    aborted: "语音输入已取消。",
  };
  return messages[error] || "语音识别暂时不稳定，可以先用打字模式。";
}

function getVoiceDiagnosticMessage(error) {
  const messages = {
    "not-allowed": "请在浏览器地址栏的权限设置中允许麦克风。拒绝权限不会影响打字练习。",
    "service-not-allowed": "当前浏览器不允许语音服务。建议使用 Chrome 或 Edge 的 HTTPS 页面。",
    "no-speech": "浏览器没有检测到声音。检查系统麦克风和输入设备。",
    network: "浏览器语音服务无法联网。应用本身不会保存录音。",
  };
  return messages[error] || "语音识别失败。检查浏览器支持、麦克风权限和 HTTPS。";
}

async function detectApiStatus() {
  if (window.location?.protocol === "file:" || typeof fetch !== "function") {
    updateEngineBadges();
    return;
  }

  try {
    const response = await fetch("/api/status", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("No API");
    const payload = await response.json();
    state.apiAvailable = true;
    state.engine = payload.aiEnabled ? "ai" : "local";
    updateEngineBadges();
    flushFeedbackOutbox();
    trackAppOpened();
  } catch (error) {
    state.apiAvailable = false;
    state.engine = "local";
    updateEngineBadges();
  }
}

function updateEngineBadges(message = "") {
  const text = message || (state.engine === "ai" ? "在线 AI + 透明教练估算" : "本地教练估算 · 不发送对话");
  document.querySelector("#homeEngineBadge").textContent = text;
  document.querySelector("#chatEngineBadge").textContent = text;
}

function openDialog(dialog) {
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.open = true;
}

function closeDialog(dialog) {
  if (typeof dialog.close === "function") dialog.close();
  else dialog.open = false;
}

function openFeedback(category = "experience") {
  document.querySelector("#feedbackCategory").value = category;
  document.querySelector("#feedbackStatus").textContent = "";
  openDialog(feedbackDialog);
  trackEvent("feedback_opened", {
    practiceId: state.practiceId,
    scene: state.currentScene?.id || "",
    mode: state.mode,
    category,
  });
}

async function submitFeedback(event) {
  event.preventDefault();
  const category = document.querySelector("#feedbackCategory").value;
  const text = document.querySelector("#feedbackText").value.trim();
  const contact = document.querySelector("#feedbackContact").value.trim();
  if (!text) return;

  const payload = {
    category,
    text,
    contact,
    sceneId: state.currentScene?.id || "",
    mode: state.mode,
    reportedResponse: category === "ai-response" ? state.lastAiResponse : "",
    analytics: getAnalyticsContext(),
  };
  const status = document.querySelector("#feedbackStatus");
  status.textContent = "正在提交…";

  try {
    if (!state.apiAvailable) throw new Error("offline");
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("submit failed");
    status.textContent = "已收到，谢谢你帮我们把产品变准。";
    document.querySelector("#feedbackText").value = "";
    document.querySelector("#feedbackContact").value = "";
    trackEvent("feedback_submitted", {
      practiceId: state.practiceId,
      scene: state.currentScene?.id || "",
      mode: state.mode,
      category,
    });
  } catch (error) {
    profile.feedbackOutbox.push({ ...payload, createdAt: new Date().toISOString() });
    profile.feedbackOutbox = profile.feedbackOutbox.slice(-10);
    saveProfile();
    status.textContent = "当前离线，反馈已保存在本机；连接测试服务器后会自动重试。";
  }
}

async function flushFeedbackOutbox() {
  if (!state.apiAvailable || !profile.feedbackOutbox.length) return;
  const remaining = [];
  for (const item of profile.feedbackOutbox) {
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) remaining.push(item);
    } catch (error) {
      remaining.push(item);
    }
  }
  profile.feedbackOutbox = remaining;
  saveProfile();
}

async function trackEvent(name, details = {}) {
  if (!profile.settings.analyticsConsent || !state.apiAvailable || typeof fetch !== "function") return;
  const analytics = getAnalyticsContext();
  try {
    await fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        visitorId: analytics.visitorId,
        sessionId: analytics.sessionId,
        source: analytics.source,
        campaign: analytics.campaign,
        details: {
          ...analytics,
          ...details,
        },
      }),
    });
  } catch (error) {
    // Product events are best-effort and never block the experience.
  }
}

function trackAppOpened() {
  if (state.appOpenTracked) return;
  if (!profile.settings.analyticsConsent || !state.apiAvailable) return;
  state.appOpenTracked = true;
  trackEvent("app_opened", {
    mode: state.mode,
  });
}

function getDailyScene() {
  const dateKey = getLocalDateKey();
  const total = [...dateKey].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return scenes[total % scenes.length];
}

function getCurrentTone() {
  return toneModes.find((tone) => tone.id === state.currentTone) || toneModes[1];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator && window.location?.protocol !== "file:") {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

document.querySelector("#brandButton").addEventListener("click", () => showView("home"));
document.querySelector("#analyticsConsent").addEventListener("change", (event) => {
  profile.settings.analyticsConsent = Boolean(event.target.checked);
  saveProfile();
  if (profile.settings.analyticsConsent) {
    trackEvent("analytics_consent_enabled", {
      mode: state.mode,
    });
    trackAppOpened();
  }
});
document.querySelector("#practiceButton").addEventListener("click", () => {
  setMode("practice");
  trackEvent("mode_selected", { mode: "practice" });
  showView("scenes");
});
document.querySelector("#challengeButton").addEventListener("click", () => {
  setMode("challenge");
  trackEvent("mode_selected", { mode: "challenge" });
  showView("scenes");
});
document.querySelector("#dailyChallengeButton").addEventListener("click", () => startScene(getDailyScene().id));
document.querySelector("#howItWorksButton").addEventListener("click", () => openDialog(methodDialog));
document.querySelector("#methodStartButton").addEventListener("click", () => {
  closeDialog(methodDialog);
  showView("scenes");
});
document.querySelector("#closeMethodButton").addEventListener("click", () => closeDialog(methodDialog));
document.querySelector("#backToScenesButton").addEventListener("click", () => showView("scenes"));
document.querySelector("#tryAnotherButton").addEventListener("click", () => showView("scenes"));
document.querySelector("#retryButton").addEventListener("click", () => startScene(state.currentScene.id));
document.querySelector("#copyShareButton").addEventListener("click", copyShareText);
document.querySelector("#saveResultPhraseButton").addEventListener("click", () => {
  savePhrase(document.querySelector("#betterPhrase").textContent);
  document.querySelector("#saveResultPhraseButton").textContent = "已收藏";
});
document.querySelector("#saveTurnPhraseButton").addEventListener("click", () => {
  savePhrase(document.querySelector("#turnSuggestion").textContent);
  document.querySelector("#saveTurnPhraseButton").textContent = "已收藏";
});
document.querySelector("#closeTurnCoachButton").addEventListener("click", () => {
  turnCoach.hidden = true;
});
document.querySelector("#clearHistoryButton").addEventListener("click", clearHistory);
document.querySelector("#feedbackButton").addEventListener("click", () => openFeedback());
document.querySelector("#footerFeedbackButton").addEventListener("click", () => openFeedback());
document.querySelector("#closeFeedbackButton").addEventListener("click", () => closeDialog(feedbackDialog));
document.querySelector("#cancelFeedbackButton").addEventListener("click", () => closeDialog(feedbackDialog));
reportResponseButton.addEventListener("click", () => openFeedback("ai-response"));
document.querySelector("#feedbackForm").addEventListener("submit", submitFeedback);
document.querySelector("#voiceHelpButton").addEventListener("click", () => {
  voiceDiagnostics.hidden = !voiceDiagnostics.hidden;
});
voiceButton.addEventListener("click", toggleVoiceInput);

document.querySelectorAll?.("[data-nav-view]")?.forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.navView));
});

document.querySelectorAll?.("[data-mode]")?.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

sceneFilter.addEventListener("change", (event) => {
  state.sceneFilter = event.target.value in categoryLabels ? event.target.value : "all";
  renderScenes();
  trackEvent("scene_filter_changed", { filter: state.sceneFilter, mode: state.mode });
});

sceneGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-scene-id]");
  if (card) startScene(card.dataset.sceneId);
});

toneGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-tone-id]");
  if (!button) return;
  state.currentTone = button.dataset.toneId;
  state.replyOffset = 0;
  renderToneGrid();
  renderQuickReplies();
});

quickReplies.addEventListener("click", (event) => {
  const shuffle = event.target.closest("[data-shuffle-replies]");
  if (shuffle) {
    state.replyOffset += 1;
    renderQuickReplies();
    return;
  }
  const reply = event.target.closest(".quick-reply");
  if (reply) {
    messageInput.value = reply.textContent;
    messageInput.focus?.();
  }
});

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  handleUserMessage(messageInput.value);
});

document.querySelector("#phrasebookList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-phrase]");
  if (button) removePhrase(button.dataset.removePhrase);
});

renderHomeStats();
renderScenes();
setupVoiceInput();
detectApiStatus();
registerServiceWorker();
