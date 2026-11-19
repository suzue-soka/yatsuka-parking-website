// 提携店舗ご利用ガイド (partner portal). The guide explains procedures only; rights and duties are in the
// 約款, which wins if the two differ (約款 第3条). Do not put a fee or a duty here that the 約款 lacks.
const ja = {
  nav: 'ご利用ガイド',
  title: 'ご利用ガイド',
  intro:
    '提携店舗制度の手続をご案内します。本ガイドは手続の説明であり、権利及び義務は「提携店舗利用契約約款」に定めます。内容が異なる場合は約款が優先します。',
  sections: [
    {
      h: '1. お申込みから利用開始まで',
      ordered: true,
      items: [
        '申請中：お申込みを受け付け、当社が審査しています。',
        '承認済み：提携店舗IDを発行し、ポータルのアカウントを有効にしました。',
        '認証機代金支払待ち：認証機の請求書をポータルに掲載しました。',
        '認証機準備中：ご入金を確認し、製造元が認証機に駐車割引を設定しています。',
        '発送済み：認証機を発送しました。発送の詳細は電子メールでお知らせします。',
        '利用中：割引認証を開始できます。認証料金はこの日から発生します。',
      ],
    },
    {
      h: '2. 認証機',
      items: [
        '受け取り：届いたら7日以内に外観と動作をご確認ください。異常があれば当社にご連絡ください。配送業者への請求は当社が行います。',
        '消耗品：ロール紙などは、製造元（アマノ株式会社）のオンラインショップ等で直接ご購入ください。',
        '故障・修理：製造元に直接ご依頼ください。修理費用と保証は製造元の規定によります。製造元の連絡先は、確定次第こちらに掲載します。',
        '修理・交換の後：修理又は交換を受けたら、このページの「修理・交換の報告」からお知らせください。当社が製造元に認証設定の確認を依頼します。',
        '設置場所を移すとき：移設後、「店舗情報」から新しい所在地の変更をお申し込みください。移設先で製造元の修理を受けられるかは、製造元にご確認ください。',
        '紛失・盗難：すぐに当社にお電話ください。不正使用を防ぐため、当該認証機の認証設定を無効化します。',
      ],
    },
    {
      h: '3. 駐車割引の変更',
      ordered: true,
      items: [
        '適用を始めたい日の1か月前までに、「お問い合わせ」からお申し込みください（認証機1台につき2種類まで）。',
        '当社が変更手数料33,000円（税込）の請求書をポータルに掲載します。',
        'ご入金を確認した後、当社が製造元に設定変更を依頼します。',
        '変更が完了したら、完了日をお知らせします。完了までは変更前の駐車割引が適用されます。',
      ],
    },
    {
      h: '4. 請求とお支払い',
      items: [
        '毎月の流れ：月末で締め、前月分の請求書を毎月第5営業日までにポータルに公開し、電子メールでお知らせします。',
        '支払期限：請求書に記載した日です。',
        '銀行振込：振込名義の先頭に提携店舗IDをご記入ください（例：P001 ヤツカショウテン）。振込手数料はご負担ください。',
        '書類：過去の請求書と領収書は、ダッシュボードからPDFで取得できます。',
        '期限を過ぎた場合：期限の翌日と7日後に電子メールでお知らせします。',
      ],
    },
    {
      h: '5. 店舗情報の掲載',
      items: [
        '掲載への同意（ホームページ・掲示物）は「店舗情報」でいつでも変更できます。',
        '掲示する前に、デザイン案を電子メールでお送りし、ご意見を伺います。',
      ],
    },
  ],
  contact: 'お問い合わせ：株式会社鈴江　TEL 048-924-2401',
  report: {
    title: '修理・交換の報告',
    text: '製造元による修理又は交換を受けたら、こちらからお知らせください。',
    machine: '認証機',
    kind: '内容',
    kinds: { repair: '修理', replacement: '交換' },
    date: '修理・交換を受けた日',
    newSerial: '新しい製造番号（交換の場合・任意）',
    note: '備考（任意）',
    send: '報告する',
    sent: '報告を受け付けました。当社が製造元に認証設定の確認を依頼します。',
    list: '報告の履歴',
    none: '報告はまだありません。',
    st: { open: '設定確認中', confirmed: '設定確認済み' },
    reply: '当社からのお知らせ：',
    noMachines: '発送済みの認証機がある場合に報告できます。',
    serial: '新しい製造番号',
  },
  admin: {
    title: '修理・交換の報告',
    count: '修理・交換の報告',
    hint: '製造元（アマノ）に認証設定を確認してから、確認済みにしてください。',
    amsLine: 'AMSさぽーとセンター（業務連絡専用・オーナー用）：0120-935-624　／　駐車場利用者用：0120-951-365（事業地番号 04672）　／　障がい者スペース・予約受付：0120-956-824',
    note: '提携店舗へのお知らせ（任意）',
    confirm: '設定確認済みにする',
    confirmMsg: '製造元に認証設定を確認しましたか？',
  },
};

const en = {
  nav: 'Guide',
  title: 'User guide',
  intro:
    'How the partner program works day to day. This guide explains procedures only; rights and duties are set out in the Partner terms and conditions, which take priority if the two differ.',
  sections: [
    {
      h: '1. From application to start',
      ordered: true,
      items: [
        'Applied: we have received your application and are reviewing it.',
        'Approved: we issued your partner ID and activated your portal account.',
        'Awaiting machine payment: the invoice for the machine is in the portal.',
        'Preparing machine: payment confirmed; the maker is setting your discounts on the machine.',
        'Shipped: the machine is on its way. Shipping details are sent by email.',
        'In use: you can start validating. Validation fees are charged from this day.',
      ],
    },
    {
      h: '2. Validation machine',
      items: [
        'On delivery: check the look and operation within 7 days. If anything is wrong, contact us. We handle the claim with the carrier.',
        'Supplies: buy paper rolls and other supplies directly from the maker (Amano Corporation), for example in its online shop.',
        'Faults and repairs: ask the maker directly. Repair costs and the warranty follow the maker’s terms. The maker’s contact details will be shown here once confirmed.',
        'After a repair or replacement: tell us with the “Report a repair or replacement” form on this page. We then ask the maker to confirm the validation settings.',
        'Moving the machine: after the move, request the address change under “Store information”. Please check with the maker whether repairs are available at the new location.',
        'Loss or theft: phone us at once. We cancel that machine’s validation settings to prevent misuse.',
      ],
    },
    {
      h: '3. Changing your discounts',
      ordered: true,
      items: [
        'Apply through “Inquiries” at least one month before the date you want the change (up to two values per machine).',
        'We post an invoice for the change fee of ¥33,000 (incl. tax) in the portal.',
        'After payment is confirmed, we ask the maker to change the settings.',
        'We tell you the completion date. Until then your previous discounts apply.',
      ],
    },
    {
      h: '4. Invoices and payment',
      items: [
        'Each month: usage is closed at month end, and the invoice for the previous month is published in the portal by the 5th working day. We notify you by email.',
        'Due date: the date printed on the invoice.',
        'Bank transfer: put your partner ID at the start of the payer name (e.g. P001 YATSUKA SHOTEN). You pay the transfer fee.',
        'Documents: past invoices and receipts can be downloaded as PDFs from the dashboard.',
        'If payment is late: we email a reminder the day after the due date and again 7 days after.',
      ],
    },
    {
      h: '5. Listing your store',
      items: [
        'You can change your listing consents (website, notice board) at any time under “Store information”.',
        'Before a poster goes up, we email you the design and ask for your comments.',
      ],
    },
  ],
  contact: 'Contact: Suzue Co., Ltd. +81-48-924-2401',
  report: {
    title: 'Report a repair or replacement',
    text: 'After the maker repairs or replaces a machine, tell us here.',
    machine: 'Machine',
    kind: 'Type',
    kinds: { repair: 'Repair', replacement: 'Replacement' },
    date: 'Date of the repair or replacement',
    newSerial: 'New serial number (replacement, optional)',
    note: 'Note (optional)',
    send: 'Send report',
    sent: 'Report received. We will ask the maker to confirm the validation settings.',
    list: 'Your reports',
    none: 'No reports yet.',
    st: { open: 'Checking settings', confirmed: 'Settings confirmed' },
    reply: 'Message from us: ',
    noMachines: 'You can send a report once a machine has been shipped to you.',
    serial: 'New serial number',
  },
  admin: {
    title: 'Repair and replacement reports',
    count: 'Repair / replacement reports',
    hint: 'Confirm the validation settings with the maker (Amano) first, then mark the report as confirmed.',
    amsLine: 'AMS Support Center (business line, for the owner): 0120-935-624 / For parking customers: 0120-951-365 (site number 04672) / Accessible space and reservations: 0120-956-824',
    note: 'Message to the partner (optional)',
    confirm: 'Mark settings confirmed',
    confirmMsg: 'Have you confirmed the validation settings with the maker?',
  },
};

const zh = {
  nav: '使用指南',
  title: '使用指南',
  intro: '介绍合作店铺制度的各项手续。本指南仅为手续说明，权利与义务以《合作店铺使用合同条款》为准；内容不一致时以条款为准。',
  sections: [
    {
      h: '1. 从申请到开始使用',
      ordered: true,
      items: [
        '申请中：已受理申请，本公司正在审核。',
        '已批准：已发放合作店铺ID，并启用门户账户。',
        '待支付验证机费用：验证机的账单已发布在门户中。',
        '验证机准备中：已确认付款，制造商正在为验证机设置停车优惠。',
        '已发货：验证机已发出，发货详情将通过电子邮件通知。',
        '使用中：可以开始优惠验证，验证费用自当日起计算。',
      ],
    },
    {
      h: '2. 验证机',
      items: [
        '收货：请在收到后7日内确认外观和运行情况。如有异常请联系本公司，向承运商的索赔由本公司办理。',
        '耗材：纸卷等请直接在制造商（天野株式会社）的网上商店等处购买。',
        '故障・维修：请直接联系制造商。维修费用和保修按制造商的规定。制造商的联系方式确定后将在此公布。',
        '维修・更换之后：请通过本页的“维修・更换报告”告知本公司，本公司将请制造商确认验证设置。',
        '迁移设置地点时：迁移后请在“店铺信息”中申请变更地址。新地点能否获得制造商维修，请向制造商确认。',
        '遗失・被盗：请立即致电本公司。为防止被盗用，将停用该验证机的验证设置。',
      ],
    },
    {
      h: '3. 变更停车优惠',
      ordered: true,
      items: [
        '请在希望开始适用之日的1个月前，通过“咨询”提出申请（每台验证机最多2种）。',
        '本公司将在门户中发布变更手续费33,000日元（含税）的账单。',
        '确认付款后，本公司请制造商变更设置。',
        '变更完成后通知完成日期。完成之前适用变更前的停车优惠。',
      ],
    },
    {
      h: '4. 账单与付款',
      items: [
        '每月流程：月底结算，上月的账单最迟于每月第5个工作日在门户中发布，并通过电子邮件通知。',
        '付款期限：账单上记载的日期。',
        '银行转账：请在汇款人名称开头填写合作店铺ID（例：P001 ヤツカショウテン）。转账手续费由贵店承担。',
        '文件：以往的账单和收据可在概览页面下载PDF。',
        '逾期时：将在期限次日和7日后通过电子邮件提醒。',
      ],
    },
    {
      h: '5. 店铺信息的刊登',
      items: [
        '刊登同意（网站・告示牌）可随时在“店铺信息”中变更。',
        '张贴之前，将通过电子邮件发送设计稿并征求意见。',
      ],
    },
  ],
  contact: '咨询：株式会社铃江　TEL 048-924-2401',
  report: {
    title: '维修・更换报告',
    text: '验证机经制造商维修或更换后，请在此告知。',
    machine: '验证机',
    kind: '内容',
    kinds: { repair: '维修', replacement: '更换' },
    date: '维修・更换日期',
    newSerial: '新的制造编号（更换时・选填）',
    note: '备注（选填）',
    send: '提交报告',
    sent: '已受理报告。本公司将请制造商确认验证设置。',
    list: '报告记录',
    none: '尚无报告。',
    st: { open: '设置确认中', confirmed: '设置已确认' },
    reply: '本公司通知：',
    noMachines: '有已发货的验证机时方可报告。',
    serial: '新的制造编号',
  },
  admin: {
    title: '维修・更换报告',
    count: '维修・更换报告',
    hint: '请先向制造商（天野）确认验证设置，再标记为已确认。',
    amsLine: 'AMS支持中心（业务联络专用・业主用）：0120-935-624　／　停车场用户用：0120-951-365（场地编号 04672）　／　无障碍车位・预约受理：0120-956-824',
    note: '给合作店铺的通知（选填）',
    confirm: '标记为设置已确认',
    confirmMsg: '已向制造商确认验证设置了吗？',
  },
};

const ALL = { ja, en, zh };
export const guideText = (lang) => ALL[lang] || ja;
