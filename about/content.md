# Praise Room About page: content

The editable source for every word on the About page, in English and 繁體中文. Each `###` heading is the string's key; the page reads them as `about.<key>` from `ui/src/i18n/locales/en.json` and `zh-Hant.json`, so a change here is copied into both locale files.

Conventions:

- `en` and `zh` lines are the copy. Keep both in step; the app's locale test fails when a key exists in only one language.
- `> Check:` marks a claim to confirm against the app before launch.
- `{{name}}` is a value the page fills in. Leave it as written.
- Demo data (hymns, setlist names, the public link) sits at the end. It is sample content for the device previews, not marketing copy.

---

## Navigation

### nav.features

- en: Features
- zh: 功能

### nav.demo

- en: Demo
- zh: 試用

### nav.guides

- en: Guides
- zh: 使用指南

### nav.feedback

- en: Feedback
- zh: 意見

### nav.give

- en: Give
- zh: 支持

### nav.faq

- en: FAQ
- zh: 常見問題

### nav.tryIt

- en: Try it
- zh: 試用

---

## Hero

### hero.eyebrow

- en: Praise Room · for worship teams
- zh: Praise Room · 為敬拜隊而設

### hero.before

Shown over the pile of scattered charts, before the scroll animation.

- en: Your songs are _everywhere._
- zh: 你的詩歌，_散落各處。_

### hero.after

Shown once the pile has folded into the devices. The `*…*` part takes the accent colour.

- en: Now they live in _one room._
- zh: 現在，都在*同一個房間。*

### hero.lede

- en: Praise Room replaces paper charts and PDFs passed around the group chat with one place where your team finds songs, plans the set, and plays it in the right key.
- zh: Praise Room 取代紙本和弦譜，和群組裡傳來傳去的 PDF。一個地方，讓團隊找歌、編排歌單，並用正確的調彈唱。

### hero.scrollHint

- en: Scroll to tidy up
- zh: 向下捲動，收拾一下

### hero.openDemo

- en: Open the demo
- zh: 打開示範

### hero.seeInside

- en: See what's inside
- zh: 看看裡面有甚麼

### hero.devicesCaption

- en: One room. Every screen, every key.
- zh: 一個房間。每個螢幕，每個調。

### hero.pile

The scraps in the opening pile. Generic labels only; no real chat names.

- chat: Worship team chat / 敬拜隊群組
- chatMessage: this sunday: … capo 2?? / 今個主日：… 要唔要 capo 2??
- chatReply: which version is the one we do / 我哋用邊個版本
- sticky: Bridge ×2 ?? ask leader / 橋段唱兩次？問隊長
- notes: Notes · my version / 備忘錄 · 我的版本
- voice: 0:42 · key for Sunday / 0:42 · 主日的調

---

## Features

### features.eyebrow

- en: Inside the room
- zh: 房間裡面

### features.title

- en: Seven doors off the same room.
- zh: 同一個房間，七道門。

### features.lede

- en: Every scrap from the pile has a home now. Scroll on and each door opens on the screen you'd use it on: a laptop to plan, a phone to share, the TV on the stage floor to play. Switch screens any time. Everything is live, so tap away.
- zh: 那堆紙碎都有了歸宿。繼續向下捲動，每道門都會在你最常用的螢幕上打開：用電腦編排、用手機分享、用台前的電視彈唱。隨時可以切換螢幕，畫面都是真的，可以直接點按。

### features.screens

The device switcher under each preview.

- phone: Phone / 手機
- tablet: Tablet / 平板
- desktop: Desktop / 電腦
- tv: TV / 電視

### 01 · Song library

#### features.library.kicker

- en: Song library
- zh: 詩歌庫

#### features.library.title

- en: One shelf for every song.
- zh: 每首歌，同一個書架。

#### features.library.lede

- en: Search the church's shared library by title, artist, or a line you remember from the chorus, in English or Chinese. Filter by tempo and theme when you're building a set.
- zh: 以歌名、作者或你記得的一句副歌，搜尋教會共用的詩歌庫，中英文皆可。編排歌單時，可按速度和主題篩選。

#### features.library.facts

- Title, artist or lyric / 歌名、作者或歌詞
- English · 中文 / English · 中文
- Tempo and theme filters / 速度及主題篩選

#### features.library.try

- en: Try searching “sweet”, “river”, or 恩典.
- zh: 試試搜尋「sweet」、「river」或「恩典」。

#### features.library.screen

- en: Planning at a desk, with the whole library in view.
- zh: 在書桌前編排，整個詩歌庫一目了然。

> Check: the app also imports songs from a chord-site link or a pasted chart (`songImport.*`). PRODUCT.md still lists adding songs as "being rebuilt". Decide whether to mention importing here.

### 02 · Chord charts

#### features.charts.kicker

- en: Chord charts
- zh: 和弦譜

#### features.charts.title

- en: Chords where they land.
- zh: 和弦就在落下的地方。

#### features.charts.lede

- en: Each chord sits right above the syllable it falls on. Read them as letters, as Nashville numbers, or as plain chords, whichever your players think in. Colour follows each chord's job, so it survives every key change.
- zh: 每個和弦都在它落下的音節上方。可用字母、Nashville 級數或簡單和弦閱讀，配合樂手的習慣。顏色跟隨和弦的功能，轉調後依然不變。

#### features.charts.facts

- Letters · Numbers · Simple / 字母 · 級數 · 簡化
- Coloured by function / 按功能上色
- Guitar shapes beside the song / 歌曲旁顯示結他指法

#### features.charts.try

- en: Flip between Letters and Numbers on the screen.
- zh: 在畫面上切換字母和級數。

#### features.charts.screen

- en: A tablet on the music stand.
- zh: 譜架上的平板。

### 03 · Transpose

#### features.transpose.kicker

- en: Transpose
- zh: 轉調

#### features.transpose.title

- en: Any key, spelled right.
- zh: 任何調，拼法正確。

#### features.transpose.lede

- en: Pick a key and every chord moves with it, spelled the way a musician reads it: B♭, not A♯. All twelve keys, major and minor, a capo when the guitarist wants one, and each song in a setlist keeps its own key.
- zh: 選一個調，所有和弦一起移動，並以樂手習慣的方式拼寫：是 B♭，不是 A♯。十二個調、大調小調都有，結他手需要時可以加 capo，歌單裡每首歌各自保留自己的調。

#### features.transpose.facts

- All 12 keys / 全部 12 個調
- Major and minor / 大調及小調
- Capo / Capo
- Key per song / 每首歌各自的調

#### features.transpose.try

- en: Tap B♭ or F♯ and watch the spelling change.
- zh: 點 B♭ 或 F♯，看看拼法如何改變。

#### features.transpose.screen

- en: Changing key on the phone in your pocket.
- zh: 用口袋裡的手機轉調。

### 04 · Setlists

#### features.setlists.kicker

- en: Setlists
- zh: 歌單

#### features.setlists.title

- en: This Sunday, always on top.
- zh: 這個主日，永遠在最上面。

#### features.setlists.lede

- en: Build the service as a dated setlist: songs in order, each in its own key. Upcoming, undated and past sets are grouped for you, and Mine or Shared shows whose they are.
- zh: 把聚會編成有日期的歌單：歌曲按次序排列，各有其調。即將舉行、未定日期與過往的歌單會自動分組，「我的」和「共享」分清是誰的歌單。

#### features.setlists.facts

- Dated and ordered / 有日期、有次序
- Upcoming · No date · Past / 即將 · 未定日期 · 過往
- Mine and Shared / 我的及共享

#### features.setlists.try

- en: Switch to Shared, then open a set.
- zh: 切換到「共享」，再打開一張歌單。

#### features.setlists.screen

- en: Building Sunday on a laptop.
- zh: 用電腦編排主日。

### 05 · Musician view

#### features.musician.kicker

- en: Musician view
- zh: 樂手模式

#### features.musician.title

- en: Made for a glance mid-song.
- zh: 為歌唱中的一瞥而設。

#### features.musician.lede

- en: One setlist on screen, from a phone on the music stand to the TV on the stage floor, with ← / → to move between songs. Hide the chords for singers, pick from five lyric sizes, let it scroll for you, and keep the screen awake. On a TV, Present shows one section at a time, full screen.
- zh: 整張歌單一個畫面，由譜架上的手機到台前地上的電視都適用，用 ← / → 切歌。歌手可以隱藏和弦，歌詞有五種大小，可以自動捲動，螢幕也會保持亮着。在電視上，「簡報」模式會全螢幕逐段顯示。

#### features.musician.facts

- ← / → between songs / ← / → 切歌
- Lyrics only / 只顯示歌詞
- Five lyric sizes / 五種歌詞大小
- Auto-scroll / 自動捲動
- Present to TV / 投放到電視

#### features.musician.try

- en: Press → to move on, then hide the chords.
- zh: 按 → 切到下一首，再隱藏和弦。

#### features.musician.screen

- en: The TV on the stage floor, read from three metres away.
- zh: 台前地上的電視，三米外也看得清。

> Check: the first draft promised a "low light / dim" mode. The app has no such mode, so it was replaced with keep-awake and Present to TV. Add it back only if the feature is built.

### 06 · Sharing

#### features.sharing.kicker

- en: Sharing
- zh: 分享

#### features.sharing.title

- en: Share the songs, not the people.
- zh: 分享詩歌，不分享人。

#### features.sharing.lede

- en: Folders share setlists with the people in them, and an invite link brings new members in. Every setlist also has a public link that anyone can open without an account. It carries the songs and keys, and never member data.
- zh: 資料夾把歌單分享給裡面的成員，邀請連結可以讓新成員加入。每張歌單也有公開連結，不用帳號就能打開。連結只帶詩歌和調，從不包括成員資料。

#### features.sharing.facts

- Folders for your team / 團隊資料夾
- Invite link / 邀請連結
- Signed-out public link / 免登入公開連結
- No member data / 不含成員資料

#### features.sharing.try

- en: Compare the team view with the public link.
- zh: 比較團隊檢視和公開連結。

#### features.sharing.screen

- en: Sending the link from a phone.
- zh: 用手機傳送連結。

### 07 · Bilingual

#### features.bilingual.kicker

- en: Bilingual by design
- zh: 雙語設計

#### features.bilingual.title

- en: Two languages, equal footing.
- zh: 兩種語言，同等地位。

#### features.bilingual.lede

- en: English and Traditional Chinese are built in rather than translated after the fact. Songs, search and every screen work in both, and Chinese text gets the space it needs.
- zh: 英文和繁體中文一開始就是設計的一部分，不是事後翻譯。詩歌、搜尋和每個畫面都支援兩種語言，中文排版也有足夠空間。

#### features.bilingual.facts

- English / English
- 繁體中文 / 繁體中文
- Search either way / 兩種語言都能搜尋

#### features.bilingual.try

- en: On a big screen, English and 中文 sit side by side.
- zh: 在大螢幕上，English 和中文並排顯示。

#### features.bilingual.screen

- en: A big screen shows both languages side by side.
- zh: 大螢幕把兩種語言並排顯示。

---

## Demo

### demo.eyebrow

- en: Full demo
- zh: 完整示範

### demo.title

- en: Play the set yourself.
- zh: 親手彈一次這張歌單。

### demo.lede

- en: This is the reader your musicians open on Sunday, running on four public-domain hymns. Try it as a laptop, a tablet on the stand, a phone, or the TV on the stage floor. Nothing to install and no account needed.
- zh: 這就是樂手在主日打開的閱讀畫面，用四首公共領域聖詩示範。可以用電腦、譜架上的平板、手機，或台前的電視來試。不用安裝，也不用帳號。

### demo.steps

1. Tap the key and move Amazing Grace to B♭. The original key stays outlined. / 點調號，把 Amazing Grace 轉到 B♭。原調會保留外框。
2. Switch to Numbers. The chords stop changing when you change key. / 切換到級數。之後再轉調，級數也不會變。
3. Use ← → to move between songs. Each one keeps its own key. / 用 ← → 切歌，每首歌各自保留自己的調。
4. Hide the chords and change the lyric size. / 隱藏和弦，調整歌詞大小。

---

## Guides

### guides.eyebrow

- en: Guides
- zh: 使用指南

### guides.title

- en: How to, step by step.
- zh: 一步一步來。

### guides.lede

- en: Short guides for each room. Open the one you need.
- zh: 每個房間都有簡短指南，打開你需要的那一個。

> Check: every step below names a button or menu. Walk through each one in the app and match the labels exactly before launch.

### guides.library.findSong

Find a song / 找一首歌

1. Open **Songs** from the sidebar, or the bottom bar on a phone. / 從側欄或手機底部列打開**詩歌**。
2. Type part of a title, an artist, or a lyric. / 輸入部分歌名、作者或歌詞。
3. Narrow the list with the **tempo** and **theme** filters. / 用**速度**和**主題**篩選縮窄結果。
4. Tap a song to open its chart. / 點一首歌打開和弦譜。

- tip: Searching lyrics finds songs when nobody remembers the title. / 沒人記得歌名時，搜尋歌詞就能找到。

### guides.library.addSong

Add a song / 新增詩歌

1. Ask an admin to make you an **editor**. / 請管理員把你設為**編輯**。
2. Choose **New song**, or paste a chart. / 選擇**新增詩歌**，或貼上和弦譜。
3. Write chords in brackets before the syllable: `[G]Amazing`. / 在音節前用方括號寫和弦：`[G]Amazing`。
4. Set the key, tempo and theme, then save. / 設定調、速度和主題，然後儲存。

### guides.charts.notation

Letters, numbers or simple / 字母、級數或簡化

1. Open any song. / 打開任何一首歌。
2. Open the reading settings. / 打開閱讀設定。
3. Pick **Letters**, **Numbers** or **Simple**. Your choice sticks for every song. / 選擇**字母**、**級數**或**簡化**，之後每首歌都會沿用。

- tip: Numbers stay the same in every key. / 級數在任何調都一樣。

### guides.charts.colours

What the colours mean / 顏色代表甚麼

1. The **1** chord, home, takes your accent colour. / 主和弦 **1** 用你的強調色。
2. The **4** and **5** each get their own colour. / **4** 和 **5** 各有自己的顏色。
3. The minor **2**, **3** and **6** share one colour. / 小和弦 **2**、**3**、**6** 共用一種顏色。

### guides.transpose.whileReading

Change key while reading / 閱讀時轉調

1. Tap the **key** beside the song title. / 點歌名旁的**調號**。
2. Pick a new key. The original stays outlined. / 選擇新的調，原調會保留外框。
3. Tap the original to go back. / 點原調即可還原。

- tip: This only changes your screen, not the setlist. / 這只會改變你的畫面，不影響歌單。

### guides.transpose.forTeam

Set a key for the team / 為團隊設定調

1. Edit the setlist. / 編輯歌單。
2. Tap the key chip on a song row. / 點歌曲旁的調號。
3. Choose the key and save. Everyone opens it in that key. / 選好調並儲存，所有人都會以這個調打開。

### guides.setlists.create

Create a setlist / 建立歌單

1. Go to **Setlists** and choose **New setlist**. / 到**歌單**，選擇**新增歌單**。
2. Give it a name and a date, or leave the date empty for ideas. / 輸入名稱和日期；構思中的可以留空日期。
3. Add songs, set each key, and drag them into order. / 加入歌曲、設定調，並拖曳排序。
4. Save. It appears under **Upcoming**. / 儲存後會出現在**即將舉行**。

### guides.musician.play

Play through a set / 順著歌單彈奏

1. Open a setlist. / 打開歌單。
2. Use ← → to move between songs. / 用 ← → 切歌。
3. Hide the chords or change the lyric size from the reading settings. / 在閱讀設定隱藏和弦或調整歌詞大小。
4. On a TV, choose **Present to TV** for one section at a time, full screen. / 在電視上選擇**投放到電視**，全螢幕逐段顯示。

- tip: On a music stand, landscape shows more of each song. / 放在譜架上時，橫放可以看到更多內容。

### guides.sharing.team

Share with your team / 與團隊分享

1. Create a **folder** and add members, or send them the invite link. / 建立**資料夾**並加入成員，或傳送邀請連結。
2. Move setlists into the folder. / 把歌單移進資料夾。
3. Members find them under **Shared**. / 成員可在**共享**找到。

### guides.sharing.public

Send a public link / 傳送公開連結

1. Open a setlist. / 打開歌單。
2. Choose **Copy public link**. / 選擇**複製公開連結**。
3. Anyone can read the songs without an account. / 任何人不用帳號都能閱讀詩歌。

- tip: Public links carry songs only, never member data. / 公開連結只包含詩歌，從不包括成員資料。

---

## Feedback

### feedback.eyebrow

- en: Feedback
- zh: 意見

### feedback.title

- en: Tell us what to fix next.
- zh: 告訴我們下一步該修甚麼。

### feedback.lede

- en: Found a wrong chord, a bug, or a missing song? Tell us here.
- zh: 發現和弦錯了、程式出錯，或缺了某首歌？在這裡告訴我們。

> Check: the first draft said the same form lives in the app under Settings → Feedback. The app has no feedback screen yet, so that line was removed. Decide where submissions go (email, GitHub issue, a form service) before launch; the form only shows a thank-you today.

### feedback.form

- kindLegend: What kind of note is this? / 這是哪類意見？
- kinds: Bug / 錯誤 · Idea / 建議 · Question / 問題
- message: Message / 內容
- messagePlaceholder: Which song, which screen, what happened? / 哪首歌、哪個畫面、發生了甚麼？
- email: Email (optional) / 電郵（選填）
- emailPlaceholder: Only if you'd like a reply / 想收到回覆才需要填
- emailHint: We only use it to reply to this note. / 只會用來回覆這則意見。
- submit: Send feedback / 送出意見
- thanksTitle: Thank you. It's in the room. / 謝謝，已經收到。

---

## Who builds it

### team.eyebrow

- en: Who builds it
- zh: 誰在建造

### team.title

- en: Built by a worship team, for worship teams.
- zh: 由敬拜隊建造，為敬拜隊而設。

### team.cardTitle

- en: A few volunteers, one church in Hong Kong.
- zh: 幾位義工，香港一間教會。

### team.body

> Check: placeholder. Replace with the team's own words.

- en: We play on Sundays and write code during the week. Praise Room is what we wanted on our own music stands: one library, the right key, and nothing to fight with mid-song.
- zh: 我們主日在台上事奉，平日寫程式。Praise Room 就是我們想放在自己譜架上的東西：一個詩歌庫、正確的調、歌唱中不用跟螢幕搏鬥。

### team.roles

- Musicians / 樂手
- Worship leaders / 敬拜帶領
- Developers / 開發者
- Song editors / 詩歌編輯

---

## Giving

### give.title

- en: Keep the room open.
- zh: 讓這個房間繼續開著。

### give.body

- en: Praise Room is free for worship teams. Gifts cover hosting and the domain, and anything beyond that goes back into the app.
- zh: Praise Room 免費供敬拜隊使用。奉獻用於伺服器和域名費用，其餘全部投放回應用程式。

### give.once

- en: Give once
- zh: 單次奉獻

### give.monthly

- en: Give monthly
- zh: 每月奉獻

> Check: giving is not set up. Both buttons are placeholders until there is a way to receive gifts.

---

## FAQ

### faq.title

- en: Questions people ask.
- zh: 常見問題。

### faq.cost

- q: Does it cost anything? / 要收費嗎？
- a: No. Praise Room is free for worship teams. Gifts help cover hosting. / 不用。Praise Room 免費供敬拜隊使用，奉獻幫助支付伺服器費用。

### faq.join

- q: Can our church join? / 我們的教會可以加入嗎？
- a: Not yet. We're still deciding how other churches join, for example whether each church gets its own library. Leave a note in the feedback form and we'll let you know. / 暫時未可以。我們仍在決定其他教會如何加入，例如每間教會是否擁有自己的詩歌庫。歡迎在意見表留言，我們會通知你。

### faq.chinese

- q: Does it work in Chinese? / 支援中文嗎？
- a: Yes. Every screen exists in English and Traditional Chinese, and you can search songs in either language. / 支援。每個畫面都有英文及繁體中文版本，詩歌也可用任一語言搜尋。

### faq.stage

- q: Can I read it on a dark stage? / 在昏暗的台上看得清楚嗎？
- a: Dark is the default. Pick from five lyric sizes, and the screen stays awake while a song is open. / 預設就是深色模式。歌詞有五種大小，打開歌曲時螢幕會保持亮着。

### faq.publicLink

- q: What does a public link show? / 公開連結會顯示甚麼？
- a: Only the songs and their keys. Public links never show member names, emails, or folders. / 只有詩歌和它們的調。公開連結從不顯示成員名稱、電郵或資料夾。

### faq.missingSong

- q: A song we need is missing. What now? / 缺了我們要用的歌，怎麼辦？
- a: Ask an editor on your team to add it, or send a request through the feedback form with the title and artist. / 請團隊裡的編輯加入，或在意見表填上歌名和作者提出要求。

---

## Footer

### footer.domain

- praiseroom.app

### footer.copyright

- © 2026 Praise Room

---

## Demo data

Sample content for the device previews. Public-domain hymns only; no real member names.

- **Setlist:** Sunday service / 主日崇拜, 2026-11-08, folder "Sunday band / 主日樂隊"
  1. Amazing Grace (奇異恩典), John Newton, G, 72 BPM, 3/4, verses 1 and 2
  2. Holy, Holy, Holy (聖哉聖哉聖哉), Reginald Heber, D, 84 BPM, 4/4
  3. It Is Well (我心靈得安寧), Horatio Spafford, C, 66 BPM, 4/4
  4. Be Thou My Vision (成為我異象), Irish traditional, E♭, 76 BPM, 3/4
- **Other setlists:** Sunday service 2026-11-15 · Christmas ideas / 聖誕構思 (no date) · Sunday service 2026-11-01 (past) · Youth night / 青年晚會 2026-11-13 (shared) · Prayer meeting / 禱告會 2026-10-30 (shared, past)
- **Library extras:** Come Thou Fount (萬福泉源) · Crown Him with Many Crowns (以諸般冠冕) · Blessed Assurance (有福的確據) · When I Survey the Wondrous Cross (當我注目看奇妙十架) · All Creatures of Our God and King (萬物頌) · The Old Rugged Cross (古舊十架)
- **Public link:** praiseroom.app/s/7kq2-sunday (made up)

> Check: the chords for Holy, Holy, Holy, It Is Well and Be Thou My Vision were written for the demo, not copied from a source, and the Chinese hymn titles are common translations nobody has confirmed. Have a musician check both.
