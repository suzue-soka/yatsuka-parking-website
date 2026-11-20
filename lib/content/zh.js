// 简体中文。以日文版为准。
const zh = {
  name: '谷塚站东口共同停车场',
  description:
    '距谷塚站东口步行约3分钟，24小时营业、共300个车位的自走式立体停车场（埼玉县草加市）。提供计时停车、月租停车、电动车充电和Times共享汽车。限高2.10m，大型车和SUV也可停放。',
  meta: {
    title: '谷塚站停车场・月租停车｜谷塚站东口共同停车场',
    template: '%s｜谷塚站东口共同停车场',
    skip: '跳到正文',
    ogAlt: '谷塚站东口共同停车场外观',
  },
  walk: '谷塚站东口步行约3分钟',
  addressFull: '埼玉县草加市濑崎1丁目7-20',
  owner: { name: '株式会社鈴江', address: '埼玉县草加市濑崎1-7-20' },
  support: { name: 'AMS客户支持中心', operator: 'Amano Management Service株式会社', hours: '24小时・全年无休', tel: '0120-951-365', telHref: 'tel:0120951365', telLabel: '免费电话（日本国内）', codeNote: '拨打电话时，请按语音提示输入场地编号“04672”。（使用缴费机对讲机时无需输入）' },
  yen: (n) => `${n}日元`,

  nav: {
    rates: '收费标准',
    calc: '费用计算',
    access: '交通指南',
    monthly: '月租停车',
    support: '遇到问题时',
    partners: '合作店铺',
    login: '合作店铺登录',
    myPage: '合作店铺页面',
    adminPage: '管理页面',
    logout: '退出登录',
    menu: '菜单',
    menuOpen: '打开菜单',
    mainMenu: '主菜单',
    mainMenuMobile: '主菜单（手机）',
    quick: '常用菜单',
    call: '拨打电话',
    toTop: '首页',
    language: '语言',
  },

  hero: {
    eyebrow: '埼玉县草加市・东武晴空塔线 谷塚站',
    h1: ['谷塚站旁的', '立体停车场', '月租', '计时'],
    lead: '两种方式均可使用。',
    cta: { rates: '查看收费', calc: '计算停车费', access: '交通指南', monthly: '月租停车' },
    facts: [
      ['24小时营业', '300个车位', '电动车充电', '共享汽车'],
      ['距车站步行约3分钟', '室内停车', '电梯', '洗手间'],
      ['监控摄像系统', 'ALSOK安保'],
    ],
    imgAlt: '谷塚站东口共同停车场外观，自走式立体停车场',
  },

  news: {
    title: '通知',
    all: '查看全部通知',
    back: '← 通知列表',
    metaDesc: '谷塚站东口共同停车场的施工、维护、收费调整等通知。',
    categories: { お知らせ: '通知', 工事: '施工', メンテナンス: '维护', 料金改定: '收费调整' },
    translationNote: '本文为译文，如与日文通知有出入，以日文版为准。',
  },

  rates: {
    title: '收费标准',
    subtitle: '计时停车',
    taxPc: '含税',
    max: '最高收费',
    cards: [
      { key: 'day', band: '白天', hours: '8:00〜22:00', price: '100', per: '20分钟', cap: '1,200', accent: true },
      { key: 'night', band: '夜间', hours: '22:00〜次日8:00', price: '100', per: '60分钟', cap: '600', accent: false },
    ],
    notes: [
      '以上价格均含税。',
      '支付方式：现金。2027年2月2日起也可使用信用卡・交通IC卡（PASMO、Suica等）',
      '在合作店铺消费可享停车优惠（请在店内告知）',
    ],
  },

  calc: {
    title: '停车费计算器',
    pcNote: '不含合作店铺优惠',
    intro: '输入预计入场和出场的日期时间，即可估算停车费。时间为24小时制（日本时间）。',
    arrive: '预计入场',
    leave: '预计出场',
    date: (l) => `${l}日期`,
    hour: (l) => `${l}时（24小时制）`,
    minute: (l) => `${l}分`,
    from: '自入场起',
    preset: (h) => `${h}小时`,
    estimate: '估算费用（含税）',
    free: (n) => `入场后${n}分钟以内，免费`,
    duration: '停车时长',
    day: '白天费用',
    night: '夜间费用',
    kinds: { day: '白天', night: '夜间' },
    breakdown: (n) => `各时段明细（${n}项）`,
    th: ['时段', '日期时间', '时长', '费用'],
    capped: '已按最高收费',
    units: (n) => `${n}个单位`,
    nextDay: (s) => `次日${s}`,
    errors: {
      invalid: '请输入入场和出场日期。',
      order: '出场时间必须晚于入场时间。',
      too_long: (d) => `最多可计算${d}天。长期停车请考虑月租停车。`,
    },
    notes: [
      '结果仅供参考，实际费用以缴费机显示为准。',
      '各时段内不足一个计费单位（白天20分钟、夜间60分钟）的部分按一个单位计算。',
      '最高收费按时段分别计算（白天8:00〜22:00为1,200日元，夜间22:00〜次日8:00为600日元）。',
    ],
    monthlyNote: ['不含合作店铺优惠及其他折扣。长期停车请考虑', '月租停车', '。'],
  },

  access: {
    title: '交通指南',
    items: ['东武晴空塔线 谷塚站东口步行约3分钟', '正面：2个入口・2个出口', '背面：1个入口（可从日光街道直接驶入）', '限高 2.10m'],
    directions: '在Google地图中查看路线',
    mapTitle: '谷塚站东口共同停车场地图',
    navNote: '使用车载导航时，请输入日文地址或电话号码：',
  },

  facility: {
    title: '设施介绍',
    items: [
      { icon: 'h24', t: '24小时营业', d: '全年无休' },
      { icon: 'station', t: '距车站步行约3分钟', d: '东武伊势崎线 方便停车换乘' },
      { icon: 'capacity', t: '可停300辆', d: '自走式・4层＋屋顶层' },
      { icon: 'max', t: '设有最高收费', d: '白天1,200日元・夜间600日元' },
      { icon: 'size', t: '车辆尺寸', d: '高2.10m・长5.0m・宽1.9m', href: '#vehicles' },
      { icon: 'ticketless', t: '车牌识别系统', d: '无需取票入场', note: '2027年2月2日起' },
      { icon: 'monthly', t: '可月租', d: '按月签约', href: '#monthly' },
      { icon: 'partner', t: '合作店铺优惠', d: '光顾店铺可享优惠' },
      { icon: 'support', t: '24小时支持', d: '对讲机・免费电话', href: '#support' },
      { icon: 'wheelchair', t: '轮椅使用者专用车位', d: '1个（1A地面层）' },
      { icon: 'toiletAccessible', t: '设有洗手间', d: '男・女・无障碍' },
      { icon: 'elevator', t: '电梯', d: '1A〜4A・RA' },
      { icon: 'card', t: '信用卡', d: '可在出口缴费机使用', note: '2027年2月2日起' },
      { icon: 'emoney', t: '电子货币', d: '交通IC卡（PASMO・Suica等）', note: '2027年2月2日起' },
      { icon: 'cash', t: '现金', d: '硬币・纸币', note: '' },
      { icon: 'receipt', t: '收据', d: '缴费时开具' },
      { icon: 'ev', t: 'EV・PHV充电', d: '4个车位 6kW普通充电' },
      { icon: 'carshare', t: 'Times共享汽车', d: '2A设专用车位 2辆' },
      { icon: 'camera', t: '监控摄像系统', d: '场内设置' },
      { icon: 'security', t: 'ALSOK安保', d: '24小时监控' },
    ],
    sideAlt: '停车场侧面，各楼层均有停车位',
    cornerAlt: '从转角看到的停车场外观',
  },

  vehicles: {
    title: '可停放车辆',
    example: '例：',
    ngLabel: '不可停放：',
    ok: [
      { name: '轻型车', size: '车长不足3.4m・车宽不足1.48m', ex: 'Alto、N-BOX、Tanto、Wagon R、Move、Hustler、Dayz 等' },
      { name: '小型车', size: '车长不足4.3m・车宽不足1.7m', ex: 'Aqua、Fit、Note、Freed、Swift、Solio、Passo 等' },
      { name: '中型车', size: '车长不足4.8m・车宽不足1.8m', ex: 'Prius、Corolla、Impreza、Axela 等' },
      { name: '厢式车', size: '车长不足4.8m・车宽不足1.8m', ex: 'Voxy、Serena、Noah、Step WGN、Esquire 等' },
      { name: '大型车・SUV', size: '车长不足5.0m・车宽不足1.9m', ex: 'Crown、Alphard、Vellfire、Harrier、X-Trail、CX-5、Forester 等' },
    ],
    ng: ['卡车及所有大型重型车辆', '摩托车（所有两轮车）'],
    sep: '、',
  },

  monthly: {
    title: '月租停车',
    fee: '月租费',
    feeNote: '（含税・含管理费等）',
    initial: '初始费用',
    initialNote: '（含税・仅申请时支付）',
    tags: ['24小时', '室内', '立体', '铺装路面', '可停大型车・SUV', '闸门式', '不固定车位'],
    stepsTitle: '申请流程',
    steps: ['在Park Direct确认空位', '在线申请・审核', '电子签约・开始使用'],
    cta: '在Park Direct确认空位・申请',
    note: '月租停车的签约和付款由Park Direct（株式会社Nealle）负责。该网站为日文。',
  },

  help: {
    title: '遇到问题时',
    intro: '通过缴费机上的对讲机（带摄像头的远程通话装置）可直接联系接线员。缴费、停车券丢失、事故或设备故障等场内问题，请当场咨询。',
    operatorBy: '运营：',
    langNote: '接线员可能只能使用日语沟通。',
    cards: [
      { label: '计时停车（费用・缴费・事故・故障）', value: '缴费机对讲机', extra: '（24小时）' },
      { label: '月租停车', value: 'Park Direct' },
      { label: '合作店铺制度・其他', value: 'owner' },
    ],
  },

  partnerBand: {
    title: '招募合作店铺',
    text: '"合作店铺制度"由店铺为顾客承担停车费，方便顾客开车前来，有助于吸引客流。从申请到查看使用情况和账单，均可在线完成。',
    contact: '咨询：',
    features: [
      { t: '吸引顾客到店', d: '顾客无需担心停车费，可开车前来。' },
      { t: '随时查看使用情况', d: '可按日查看停车优惠的使用次数。' },
      { t: '在线获取账单', d: '每月账单（合格发票）可下载PDF，通过银行转账付款。' },
      { t: '轻松导入验证机', d: '我们将设置好的省空间型二维码优惠券发行机送到店铺（免运费）。' },
    ],
  },

  validator: {
    kicker: '设置在合作店铺的验证机',
    name: '省空间型二维码优惠券发行机',
    alt: '省空间型二维码优惠券发行机：白色机身顶部有"1""2"两个蓝色按钮',
    priceNote: '（含税・免运费）',
    points: [
      '通过按钮1・2，最多可发行2种停车优惠',
      '由我司设置好优惠后送达（免运费）',
      '体积小巧，可放在收银台旁',
      '纸张等耗材可在Amano官方商店购买',
    ],
  },

  security: {
    title: '安全措施',
    items: [
      { t: '监控摄像系统', d: '停车场内设有监控摄像头。录像仅用于防范犯罪，并妥善管理。' },
      { t: '通信加密', d: '全站采用TLS加密，保护您发送的信息。' },
      { t: '两步验证', d: '登录合作店铺门户时通过验证码确认身份。' },
      { t: '不保存银行卡信息', d: '付款由支付服务商处理，卡号不会保存在我司服务器上。' },
      { t: '各店铺数据隔离', d: '每家合作店铺只能查看自己的信息。' },
    ],
  },

  faq: {
    title: '常见问题',
    items: [
      { q: '可以提前确认停车费吗？', a: '在"费用计算"中输入预计入场和出场时间，即可查看估算费用。实际费用以缴费机显示为准。' },
      { q: '计时停车如何付款？', a: '可使用现金支付。2027年2月2日起也可使用信用卡或交通IC卡（PASMO、Suica等）。' },
      { q: '车牌识别系统（2027年2月2日起）未能识别车牌时怎么办？', a: '请通过出口缴费机的对讲机或免费电话 0120-951-365（场地编号 04672）告知。我们将确认入场记录后告知费用。' },
      { q: '缴费机出现问题或发生事故时怎么办？', a: '通过缴费机对讲机或免费电话 0120-951-365（场地编号 04672），可24小时联系"AMS客户支持中心"，接线员会当场处理。接线员可能只能使用日语沟通。' },
      { q: '合作店铺有停车优惠吗？', a: '有。在合作店铺消费时，店铺可为您承担停车费。请在店内告知。' },
      { q: '可以为电动车充电吗？', a: '设有4台6kW普通充电桩，请使用Terra Charge应用。' },
      { q: '大型车可以停吗？', a: '高度不足2.10m、车长不足5.0m、车宽不足1.9m的车辆可以停放。卡车、大型重型车辆和摩托车不可停放。' },
      { q: '如何申请月租停车？', a: '可在Park Direct网站（日文）在线确认空位并申请。' },
    ],
  },

  partnersPage: {
    title: '合作店铺',
    metaDesc: '谷塚站东口共同停车场合作店铺制度介绍。',
    intro: '在合作店铺消费时，店铺可为您承担停车费。请在店内告知。',
    pending: '合作店铺列表正在准备中。店铺同意后将陆续在此刊登。',
    loginTitle: '致合作店铺',
    loginDesc: '查看使用明细和账单（仅日文）',
    bizTitle: '致各店铺・企业',
    bizText: '加入合作店铺制度后，可由店铺为顾客承担停车费，方便顾客开车到店。',
  },

  privacy: {
    title: '隐私政策',
    body: '隐私政策正在准备中，以日文版为准。',
    contact: (owner, tel) => [`有关个人信息的咨询，请联系${owner}（电话 `, tel, '）。'],
  },

  footer: {
    line: '谷塚站东口步行约3分钟・24小时营业・300个车位',
    operator: '运营',
    telHours: '（工作日 10:00〜17:00・人工接听）',
    telHoursInline: '，工作日 10:00〜17:00・人工接听',
    links: { rates: '收费标准', access: '交通指南', monthly: '月租停车', news: '通知', partners: '合作店铺', login: '合作店铺登录', privacy: '隐私政策' },
    official: '本网站中文版为译文，如有出入，以日文版为准。',
  },
};

export default zh;
