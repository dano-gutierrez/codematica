import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

const execFileAsync = promisify(execFile);
const vocabUrl = "https://raw.githubusercontent.com/jamsinclair/open-anki-jlpt-decks/9b20cfa8d59e56018702543aa9060cb72a263692/src/n5.csv";
const vocabSha256 = "f89abc86b391c4f2b551bbf8910b0de6cd600973b3a9f8d98347513921929ebe";
const jmdictUrl = "https://github.com/scriptin/jmdict-simplified/releases/download/3.6.2%2B20260803141815/jmdict-eng-common-3.6.2%2B20260803141815.json.tgz";
const jmdictSha256 = "5000cdc6a1bc1e3a9aa1cd65fc398e784d952f377aa145b2d84151c073b2653a";
const units = ["identity-and-demonstratives", "numbers-time-and-dates", "family-home-and-location", "routines-verbs-and-particles", "food-shopping-and-counters", "adjectives-weather-and-preferences", "invitations-requests-and-permission", "transport-directions-and-travel", "past-activities-and-messages", "n5-integrated-readiness"];

const grammarRows = [
  ["polite-copula", "Noun + です", "Make a polite statement identifying or describing something.", "私は学生です。", "I am a student."],
  ["topic-wa", "Noun + は", "Mark the topic that the rest of the sentence comments on.", "今日は月曜日です。", "Today is Monday."],
  ["also-mo", "Noun + も", "Add that the same statement is true of another topic.", "私も学生です。", "I am also a student."],
  ["question-ka", "Sentence + か", "Turn a polite statement into a neutral question.", "学生ですか。", "Are you a student?"],
  ["possessive-no", "Noun + の + Noun", "Connect nouns for possession, affiliation, or description.", "これは私の本です。", "This is my book."],
  ["demonstrative-pronouns", "これ・それ・あれ", "Point to a thing near the speaker, listener, or neither person.", "それは何ですか。", "What is that?"],
  ["demonstrative-determiners", "この・その・あの + Noun", "Point to a specific noun by its relative distance.", "この本は日本語です。", "This book is in Japanese."],
  ["place-demonstratives", "ここ・そこ・あそこ", "Point to locations near the speaker, listener, or farther away.", "駅はあそこです。", "The station is over there."],
  ["interrogatives", "だれ・何・どこ・いつ", "Ask for a person, thing, place, or time.", "先生はどこですか。", "Where is the teacher?"],
  ["existence-aru-iru", "あります・います", "State that an inanimate thing or animate being exists.", "教室に先生がいます。", "There is a teacher in the classroom."],
  ["subject-ga", "Noun + が", "Mark the grammatical subject, especially with existence and ability.", "机の上に本があります。", "There is a book on the desk."],
  ["location-ni", "Place + に", "Mark where something exists or the destination of movement.", "家に猫がいます。", "There is a cat at home."],
  ["time-ni", "Time + に", "Mark a specific time when an action occurs.", "七時に起きます。", "I get up at seven."],
  ["range-kara-made", "Noun + から・まで", "Mark the starting and ending point of time or place.", "九時から五時まで働きます。", "I work from nine to five."],
  ["complete-list-to", "Noun + と + Noun", "Join nouns in a complete list meaning and.", "パンと卵を買います。", "I buy bread and eggs."],
  ["partial-list-ya", "Noun + や + Noun", "Give representative examples from a larger list.", "机の上に本やペンがあります。", "There are books, pens, and such on the desk."],
  ["polite-present", "Verb stem + ます", "Express a habitual or future action politely.", "毎日日本語を勉強します。", "I study Japanese every day."],
  ["polite-negative", "Verb stem + ません", "Express that a present or future action does not happen.", "今日は働きません。", "I will not work today."],
  ["polite-past", "Verb stem + ました", "Express a completed past action politely.", "昨日映画を見ました。", "I watched a movie yesterday."],
  ["polite-past-negative", "Verb stem + ませんでした", "Express that an action did not happen in the past.", "朝ご飯を食べませんでした。", "I did not eat breakfast."],
  ["object-o", "Noun + を + Verb", "Mark the direct object affected by an action.", "水を飲みます。", "I drink water."],
  ["action-place-de", "Place + で + Verb", "Mark the place where an action happens.", "図書館で勉強します。", "I study at the library."],
  ["direction-e", "Place + へ + movement verb", "Mark the direction toward which someone moves.", "学校へ行きます。", "I go toward school."],
  ["destination-ni", "Place + に + movement verb", "Mark a concrete destination or arrival point.", "東京に来ました。", "I came to Tokyo."],
  ["companion-to", "Person + と", "Mark the person who participates in an action with someone.", "友達と話します。", "I talk with a friend."],
  ["means-de", "Tool or vehicle + で", "Mark the means, instrument, language, or transport used.", "電車で行きます。", "I go by train."],
  ["noun-kudasai", "Noun + をください", "Politely ask for an item in a shop or restaurant.", "水をください。", "Please give me water."],
  ["te-kudasai", "て-form + ください", "Politely request that another person perform an action.", "ここに名前を書いてください。", "Please write your name here."],
  ["permission-temo-ii", "て-form + もいいです", "Ask for or grant permission to do something.", "写真を撮ってもいいですか。", "May I take a photo?"],
  ["prohibition-tewa-ikenai", "て-form + はいけません", "State that an action is prohibited.", "ここで食べてはいけません。", "You must not eat here."],
  ["volitional-mashou", "Verb stem + ましょう", "Invite someone to do an action together.", "一緒に帰りましょう。", "Let us go home together."],
  ["invitation-masenka", "Verb stem + ませんか", "Invite someone politely while leaving room to decline.", "映画を見ませんか。", "Would you like to watch a movie?"],
  ["desire-tai", "Verb stem + たいです", "Express what the speaker wants to do.", "日本へ行きたいです。", "I want to go to Japan."],
  ["desired-object-hoshii", "Noun + がほしいです", "Express that the speaker wants a thing.", "新しい自転車がほしいです。", "I want a new bicycle."],
  ["i-adjective", "い-adjective + Noun/です", "Describe a noun or make a polite statement with an i-adjective.", "今日は暑いです。", "It is hot today."],
  ["na-adjective", "な-adjective + な + Noun", "Use a na-adjective before a noun or with です as a predicate.", "静かな町です。", "It is a quiet town."],
  ["adjective-negative", "くないです・ではありません", "Make i-adjectives and na-adjectives negative politely.", "この本は高くないです。", "This book is not expensive."],
  ["adjective-past", "かったです・でした", "Describe a past state with an adjective.", "昨日は寒かったです。", "It was cold yesterday."],
  ["comparison-yori", "A は B より adjective", "Compare A with B using B as the reference point.", "電車はバスより速いです。", "The train is faster than the bus."],
  ["preference-hou-ga", "A より B のほうが adjective", "Say that B has more of a quality than A.", "肉より魚のほうが好きです。", "I like fish more than meat."],
  ["superlative-ichiban", "Group + で + Noun + が一番", "Identify the item with the greatest degree in a group.", "果物でりんごが一番好きです。", "Among fruits, I like apples best."],
  ["likes-suki-kirai", "Noun + が好き・嫌いです", "Express likes and dislikes toward a noun or activity.", "音楽が好きです。", "I like music."],
  ["skill-jouzu-heta", "Noun + が上手・下手です", "Describe skill or lack of skill in an activity.", "妹は料理が上手です。", "My younger sister is good at cooking."],
  ["understand-wakaru", "Noun + が分かります", "State that someone understands a language or fact.", "少し日本語が分かります。", "I understand a little Japanese."],
  ["reason-kara", "Reason + から", "Give a simple reason for the following statement or choice.", "雨ですから、家にいます。", "Because it is raining, I will stay home."],
  ["before-mae-ni", "Noun/Verb dictionary form + 前に", "Place one action before another action or time.", "寝る前に本を読みます。", "I read a book before sleeping."],
  ["after-ato-de", "Noun/Verb past form + 後で", "Place an action after another event.", "仕事の後で買い物します。", "I shop after work."],
  ["time-toki", "Plain form + 時", "Describe what happens at a particular time or situation.", "日本へ行く時、カメラを買いました。", "When I went to Japan, I bought a camera."],
  ["already-mou", "もう + past/affirmative", "Say that an expected action has already happened.", "もう昼ご飯を食べました。", "I already ate lunch."],
  ["not-yet-mada", "まだ + negative", "Say that an expected action has not happened yet.", "宿題はまだ終わっていません。", "The homework is not finished yet."],
  ["ongoing-teiru", "て-form + います", "Describe an action in progress or a continuing state.", "今、新聞を読んでいます。", "I am reading the newspaper now."],
  ["sequence-te-kara", "て-form + から", "State that one action happens after another is completed.", "手を洗ってから食べます。", "I eat after washing my hands."],
  ["examples-tari", "past plain + り、past plain + りします", "List representative activities without claiming a complete list.", "日曜日は本を読んだり散歩したりします。", "On Sundays I read and take walks, among other things."],
  ["experience-koto-ga-aru", "past plain + ことがあります", "Say that someone has experienced an action before.", "京都へ行ったことがあります。", "I have been to Kyoto."],
  ["not-necessary-nakutemo", "negative stem + なくてもいいです", "Say that an action is not required.", "明日は来なくてもいいです。", "You do not have to come tomorrow."],
  ["advice-hou-ga-ii", "plain past/negative + ほうがいいです", "Give gentle advice about a preferable action.", "早く寝たほうがいいです。", "You should go to bed early."],
  ["only-dake", "Noun + だけ", "Limit a statement to only the marked item or amount.", "水だけ飲みます。", "I drink only water."],
  ["example-demo", "Noun + でも", "Offer one representative option in a casual suggestion.", "お茶でも飲みませんか。", "Would you like tea or something?"],
  ["agreement-ne", "Sentence + ね", "Invite agreement or acknowledge shared information.", "今日はいい天気ですね。", "The weather is nice, isn't it?"],
  ["new-information-yo", "Sentence + よ", "Present information the listener may not know.", "この電車は東京へ行きますよ。", "This train goes to Tokyo, you know."],
] as const;

function sha(value: string | Uint8Array) { return crypto.createHash("sha256").update(value).digest("hex"); }

function parseCsv(text: string) {
  const rows: string[][] = []; let row: string[] = []; let field = ""; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted && char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(field); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && text[index + 1] === "\n") index += 1; row.push(field); if (row.some(Boolean)) rows.push(row); row = []; field = ""; }
    else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const kanaPairs: Array<[string, string]> = [["きゃ","kya"],["きゅ","kyu"],["きょ","kyo"],["しゃ","sha"],["しゅ","shu"],["しょ","sho"],["ちゃ","cha"],["ちゅ","chu"],["ちょ","cho"],["にゃ","nya"],["にゅ","nyu"],["にょ","nyo"],["ひゃ","hya"],["ひゅ","hyu"],["ひょ","hyo"],["みゃ","mya"],["みゅ","myu"],["みょ","myo"],["りゃ","rya"],["りゅ","ryu"],["りょ","ryo"],["ぎゃ","gya"],["ぎゅ","gyu"],["ぎょ","gyo"],["じゃ","ja"],["じゅ","ju"],["じょ","jo"],["びゃ","bya"],["びゅ","byu"],["びょ","byo"],["ぴゃ","pya"],["ぴゅ","pyu"],["ぴょ","pyo"],["あ","a"],["い","i"],["う","u"],["え","e"],["お","o"],["か","ka"],["き","ki"],["く","ku"],["け","ke"],["こ","ko"],["さ","sa"],["し","shi"],["す","su"],["せ","se"],["そ","so"],["た","ta"],["ち","chi"],["つ","tsu"],["て","te"],["と","to"],["な","na"],["に","ni"],["ぬ","nu"],["ね","ne"],["の","no"],["は","ha"],["ひ","hi"],["ふ","fu"],["へ","he"],["ほ","ho"],["ま","ma"],["み","mi"],["む","mu"],["め","me"],["も","mo"],["や","ya"],["ゆ","yu"],["よ","yo"],["ら","ra"],["り","ri"],["る","ru"],["れ","re"],["ろ","ro"],["わ","wa"],["を","o"],["ん","n"],["が","ga"],["ぎ","gi"],["ぐ","gu"],["げ","ge"],["ご","go"],["ざ","za"],["じ","ji"],["ず","zu"],["ぜ","ze"],["ぞ","zo"],["だ","da"],["で","de"],["ど","do"],["ば","ba"],["び","bi"],["ぶ","bu"],["べ","be"],["ぼ","bo"],["ぱ","pa"],["ぴ","pi"],["ぷ","pu"],["ぺ","pe"],["ぽ","po"]];
function romanize(reading: string) { let value = reading; for (const [from,to] of kanaPairs) value = value.replaceAll(from,to); return value.replace(/っ([a-z])/g,"$1$1").replace(/ー/g,"-").replace(/[^a-z-]/g,""); }
function unitFor(index: number) { return units[Math.min(9, Math.floor(index / 65))]!; }

type JapaneseN5BuildOptions = {
  fetcher?: typeof fetch;
  vocabularySource?: { url: string; sha256: string };
  jmdictSource?: { url: string; sha256: string };
};

export async function buildJapaneseN5(rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."), options: JapaneseN5BuildOptions = {}) {
  const fetcher = options.fetcher ?? fetch;
  const vocabularySource = options.vocabularySource ?? { url: vocabUrl, sha256: vocabSha256 };
  const dictionarySource = options.jmdictSource ?? { url: jmdictUrl, sha256: jmdictSha256 };
  const response = await fetcher(vocabularySource.url); const csv = await response.text();
  if (!response.ok || sha(csv) !== vocabularySource.sha256) throw new Error("Pinned N5 vocabulary source failed its checksum.");
  const rows = parseCsv(csv).slice(1).filter((row) => row[0] && row[1] && row[2]);
  const vocabularyPath = path.join(rootDir, "content/languages/japanese/vocabulary.json");
  const original = JSON.parse(await fs.readFile(vocabularyPath, "utf8"));
  const existingExpressions = new Set<string>(original.items.map((item: { expression: string }) => item.expression));
  original.items = original.items.map((item: Record<string, unknown>, index: number) => ({ ...item, wordClass: ["expression"], studyOrder: index + 1, unitSlugs: [unitFor(index)], jlptAlignment: "n5" }));
  const additions = rows.filter((row) => !existingExpressions.has(row[0]!)).slice(0, 650 - original.items.length).map((row, offset) => {
    const studyOrder = original.items.length + offset + 1; const reading = row[1]!; const romaji = romanize(reading);
    return { slug: `japanese/vocabulary/n5-${String(studyOrder).padStart(3,"0")}`, expression: row[0], reading, romaji: romaji || `n5-${studyOrder}`, inputSequences: romaji ? [romaji] : [], ipa: romaji || reading, meanings: [row[2]], wordClass: [row[2]!.startsWith("to ") ? "verb" : "word"], studyOrder, unitSlugs: [unitFor(studyOrder - 1)], jlptAlignment: "n5", tags: ["n5", unitFor(studyOrder - 1)], status: "published", sources: [{ label: "Open Anki JLPT N5 alignment list", url: "https://github.com/jamsinclair/open-anki-jlpt-decks" }] };
  });
  if (original.items.length + additions.length !== 650) throw new Error("The pinned list did not produce exactly 650 unique entries.");
  await fs.writeFile(vocabularyPath, `${JSON.stringify({ ...original, items: [...original.items, ...additions] }, null, 2)}\n`);

  const grammar = grammarRows.map(([id, pattern, meaning, japanese, translation], index) => ({ id, title: pattern, pattern, meaning, formation: [pattern], notes: [meaning], studyOrder: index + 1, unitSlug: units[Math.min(9, Math.floor(index / 6))], proficiencyLevel: "a1", jlptAlignment: "n5", examples: [{ japanese, reading: japanese, romaji: "See the Japanese reading in the lesson.", translation }], status: "published", sourceRefs: [] }));
  await fs.writeFile(path.join(rootDir, "content/languages/japanese/grammar-n5.json"), `${JSON.stringify({ kind: "grammar", language: "ja", items: grammar }, null, 2)}\n`);

  const audioItems = [...original.items, ...additions].map((item: { slug: string; expression: string; reading: string; unitSlugs: string[] }, index: number) => ({ id: `n5-word-${String(index + 1).padStart(3,"0")}`, transcript: item.expression, reading: item.reading, speaker: "OpenAI marin", license: "OpenAI generated output", attribution: "Generated for Codematica from independently selected curriculum text", assetPath: `audio/n5-word-${String(index + 1).padStart(3,"0")}.mp3`, qaStatus: "draft", disclosure: "AI-generated voice", unitSlug: item.unitSlugs[0], generation: { provider: "openai", model: "gpt-4o-mini-tts", voice: "marin", instructions: "Speak clear, natural standard Tokyo Japanese for an N5 beginner, with careful but not exaggerated pacing." } }));

  const knowledgeDirectory = path.join(rootDir, "content/knowledge/languages");
  const exerciseDirectory = path.join(rootDir, "content/exercises/languages");
  await fs.mkdir(knowledgeDirectory, { recursive: true }); await fs.mkdir(exerciseDirectory, { recursive: true });
  const unitTitles = ["Identity And Demonstratives", "Numbers, Time, And Dates", "Family, Home, And Location", "Routines, Verbs, And Particles", "Food, Shopping, And Counters", "Adjectives, Weather, And Preferences", "Invitations, Requests, And Permission", "Transport, Directions, And Travel", "Past Activities And Messages", "Integrated N5 Readiness"];
  const allVocabulary = [...original.items, ...additions] as Array<{ expression: string; reading: string; romaji: string; meanings: string[]; unitSlugs: string[] }>;
  const listeningItems: Array<Record<string, unknown>> = [];
  for (let unitIndex = 0; unitIndex < units.length; unitIndex += 1) {
    const unitSlug = units[unitIndex]!; const title = unitTitles[unitIndex]!;
    const words = allVocabulary.filter((item) => item.unitSlugs.includes(unitSlug)).slice(0, 65);
    const patterns = grammar.slice(unitIndex * 6, unitIndex * 6 + 6);
    const lessonSlug = `languages/japanese-n5-${unitSlug}`;
    const lesson = `---\ntitle: "Japanese N5: ${title}"\nslug: ${lessonSlug}\nsummary: "Build N5-aligned vocabulary, grammar, reading, and practical sentence skills for ${title.toLowerCase()}."\ntrack: Languages\ntopic: Japanese\ndifficulty: foundation\ntags: [japanese, n5, a1]\nprerequisites: []\ndiagramRefs: []\nstatus: published\n---\n\n## What You Will Do\n\nRead, recognize, type, and use beginner Japanese for **${title}**. This is original N5-aligned preparation, not an official JLPT word list or score guarantee. Writing tasks support learning; the official JLPT N5 exam itself measures language knowledge, reading, and listening.\n\n## Core Grammar\n\n${patterns.map((item) => `### ${item.title}\n\n**Pattern:** \`${item.pattern}\`  \n${item.meaning}\n\n- ${item.examples[0]!.japanese}\n- ${item.examples[0]!.translation}`).join("\n\n")}\n\n## Vocabulary Set\n\n| Japanese | Reading | Meaning |\n| --- | --- | --- |\n${words.map((item) => `| ${item.expression} | ${item.reading} | ${item.meanings[0]} |`).join("\n")}\n\n## Practice Loop\n\n1. Read each word aloud without romaji.\n2. Complete the mixed recognition quiz.\n3. Use the open-answer activity to convert romaji or Pencil handwriting into Japanese.\n4. Return later through Japanese review for cumulative flashcards.\n\n## Trusted Follow-up\n\n- [Official JLPT N5 level summary](https://www.jlpt.jp/e/about/levelsummary.html)\n- [Official JLPT sample questions](https://www.jlpt.jp/e/samples/sampleindex.html)\n- [Irodori Starter](https://www.irodori.jpf.go.jp/en/starter/pdf.html)\n- [Marugoto Starter A1](https://marugoto.jpf.go.jp/en/teacher/resource/starter_c/)\n`;
    await fs.writeFile(path.join(knowledgeDirectory, `japanese-n5-${unitSlug}.md`), lesson);

    const choices = words.slice(0, 12).map((word, index) => {
      const distractors = [words[(index + 7) % words.length]!, words[(index + 13) % words.length]!];
      return { id: `word-${index + 1}`, kind: "choice", prompt: `Choose the best English meaning for ${word.expression} (${word.reading}).`, options: [{ id: "correct", label: word.meanings[0], isCorrect: true }, ...distractors.map((item, distractorIndex) => ({ id: `distractor-${distractorIndex + 1}`, label: item.meanings[0], isCorrect: false }))], explanation: `${word.expression} is read ${word.reading} and means ${word.meanings[0]}.`, skillIds: ["a1-reading"] };
    });
    await fs.writeFile(path.join(exerciseDirectory, `japanese-n5-${unitSlug}-mixed.json`), `${JSON.stringify({ slug: `languages/japanese-n5-${unitSlug}-mixed`, title: `${title} Mixed Practice`, documentSlug: lessonSlug, concept: `${title} N5 recognition`, difficulty: "foundation", tags: ["japanese", "n5", "vocabulary"], status: "published", proficiencyLevel: "a1", skillIds: ["a1-reading"], required: true, type: "questionnaire", questions: choices }, null, 2)}\n`);

    const openQuestions = [...patterns, ...patterns.slice(0, 2)].map((pattern, index) => ({ id: `write-${index + 1}`, kind: "open-answer", prompt: `Write the Japanese sentence: ${pattern.examples[0]!.translation}`, template: "{{blank}}", acceptedAnswers: [pattern.examples[0]!.japanese], inputMode: "japanese-ime", explanation: `${pattern.pattern}: ${pattern.meaning}`, skillIds: ["a1-writing", "kana-ime"] }));
    await fs.writeFile(path.join(exerciseDirectory, `japanese-n5-${unitSlug}-open-answer.json`), `${JSON.stringify({ slug: `languages/japanese-n5-${unitSlug}-open-answer`, title: `${title} Open Answer`, documentSlug: lessonSlug, concept: `${title} Japanese composition`, difficulty: "foundation", tags: ["japanese", "n5", "writing", "ime"], status: "published", proficiencyLevel: "a1", skillIds: ["a1-writing", "kana-ime"], required: true, type: "questionnaire", questions: openQuestions }, null, 2)}\n`);

    const listeningQuestions = patterns.map((pattern, index) => {
      const audioId = `n5-listen-${unitIndex + 1}-${index + 1}`;
      listeningItems.push({ id: audioId, transcript: pattern.examples[0]!.japanese, reading: pattern.examples[0]!.japanese, speaker: index % 2 ? "OpenAI cedar" : "OpenAI marin", license: "OpenAI generated output", attribution: "Generated for Codematica from original curriculum text", assetPath: `audio/${audioId}.mp3`, qaStatus: "draft", disclosure: "AI-generated voice", unitSlug, generation: { provider: "openai", model: "gpt-4o-mini-tts", voice: index % 2 ? "cedar" : "marin", instructions: "Speak clear, natural standard Tokyo Japanese for an N5 beginner, with careful but not exaggerated pacing." } });
      const wrong = patterns[(index + 1) % patterns.length]!.examples[0]!;
      return { id: `listen-${index + 1}`, kind: "listening-choice", prompt: "Choose the English meaning of the sentence you hear.", audioId, options: [{ id: "correct", label: pattern.examples[0]!.translation, isCorrect: true }, { id: "distractor", label: wrong.translation, isCorrect: false }], explanation: `${pattern.examples[0]!.japanese} means ${pattern.examples[0]!.translation}`, skillIds: ["a1-listening"] };
    });
    await fs.writeFile(path.join(exerciseDirectory, `japanese-n5-${unitSlug}-listening.json`), `${JSON.stringify({ slug: `languages/japanese-n5-${unitSlug}-listening`, title: `${title} Listening`, documentSlug: lessonSlug, concept: `${title} listening comprehension`, difficulty: "foundation", tags: ["japanese", "n5", "listening"], status: "draft", proficiencyLevel: "a1", skillIds: ["a1-listening"], required: false, type: "questionnaire", questions: listeningQuestions }, null, 2)}\n`);
  }
  audioItems.push(...listeningItems as never[]);
  await fs.writeFile(path.join(rootDir, "content/languages/japanese/audio-manifest.json"), `${JSON.stringify({ kind: "audio", language: "ja", items: audioItems }, null, 2)}\n`);

  const pathFile = JSON.parse(await fs.readFile(path.join(rootDir, "content/learning-paths/japanese-foundations.json"), "utf8"));
  const kanaUnits = pathFile.units.slice(0, 5);
  const n5Units = units.map((unitSlug, index) => ({ slug: unitSlug, title: unitTitles[index], summary: `Progressive N5-aligned lesson and practice for ${unitTitles[index]!.toLowerCase()}.`, nodes: [{ kind: "document", slug: `languages/japanese-n5-${unitSlug}`, proficiencyLevel: "a1", skillIds: ["a1-reading", "a1-listening", "a1-interaction", "a1-writing"], required: true }, { kind: "exercise", slug: `languages/japanese-n5-${unitSlug}-mixed`, proficiencyLevel: "a1", skillIds: ["a1-reading"], required: true }, { kind: "exercise", slug: `languages/japanese-n5-${unitSlug}-open-answer`, proficiencyLevel: "a1", skillIds: ["a1-writing", "kana-ime"], required: true }] }));
  pathFile.title = "Japanese Foundations: Kana to JLPT N5";
  pathFile.summary = "An open, milestone-based beginner course progressing from kana through a complete N5-aligned vocabulary, grammar, reading, listening, typing, and writing foundation.";
  pathFile.units = [...kanaUnits, ...n5Units];
  const kanaStage = pathFile.progression.stages[0];
  const stage = (id: string, label: string, stageUnits: string[], checkpointUnit: string, minutes: number) => ({ id, label, level: "A1", status: "published", summary: `Build measurable N5 readiness across ${label.toLowerCase()} through original lessons and active practice.`, unitSlugs: stageUnits, outcomes: [{ id: `${id}-read`, statement: `I can read and understand short N5-aligned material for ${label.toLowerCase()}.`, skillId: "a1-reading" }, { id: `${id}-write`, statement: `I can compose short beginner Japanese answers for ${label.toLowerCase()}.`, skillId: "a1-writing" }, { id: `${id}-interact`, statement: `I can use familiar expressions for ${label.toLowerCase()}.`, skillId: "a1-interaction" }], requiredNodeSlugs: stageUnits.flatMap((unit) => [`languages/japanese-n5-${unit}`, `languages/japanese-n5-${unit}-mixed`, `languages/japanese-n5-${unit}-open-answer`]), checkpointExerciseSlug: `languages/japanese-n5-${checkpointUnit}-mixed`, passThreshold: 0.8, minimumSkillScore: 0.6, estimatedMinutes: minutes });
  pathFile.progression.roadmapLabel = "Kana to JLPT N5 roadmap";
  pathFile.progression.stages = [kanaStage, stage("n5-core-connections", "Core Connections", units.slice(0,3), units[2], 360), stage("n5-everyday-japanese", "Everyday Japanese", units.slice(3,7), units[6], 480), stage("n5-reading-listening", "Reading And Listening", units.slice(7,9), units[8], 300), stage("n5-readiness", "N5 Readiness", units.slice(9), units[9], 180)];
  await fs.writeFile(path.join(rootDir, "content/learning-paths/japanese-foundations.json"), `${JSON.stringify(pathFile, null, 2)}\n`);

  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "codematica-jmdict-"));
  try {
    const archive = path.join(temp, "jmdict.tgz"); const dictionaryResponse = await fetcher(dictionarySource.url); const bytes = new Uint8Array(await dictionaryResponse.arrayBuffer());
    if (!dictionaryResponse.ok || sha(bytes) !== dictionarySource.sha256) throw new Error("Pinned JMdict source failed its checksum.");
    await fs.writeFile(archive, bytes); await execFileAsync("tar", ["-xzf", archive, "-C", temp]);
    const jsonPath = (await fs.readdir(temp)).find((name) => name.endsWith(".json"))!; const dictionary = JSON.parse(await fs.readFile(path.join(temp, jsonPath), "utf8")); const words = dictionary.words ?? dictionary;
    const compact: Record<string, string[]> = {};
    for (const word of words) {
      const reading = word.kana?.find((entry: { common: boolean }) => entry.common)?.text ?? word.kana?.[0]?.text;
      const spellings = word.kanji?.filter((entry: { common: boolean }) => entry.common).map((entry: { text: string }) => entry.text) ?? [];
      if (reading && spellings.length && !compact[reading]) compact[reading] = spellings.slice(0, 7);
      if (Object.keys(compact).length >= 12000) break;
    }
    await fs.writeFile(path.join(rootDir, "packages/core/src/generated/japanese-ime-dictionary.json"), `${JSON.stringify(compact)}\n`);
  } finally { await fs.rm(temp, { recursive: true, force: true }); }
  return { vocabulary: 650, grammar: grammar.length, queuedAudio: audioItems.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) console.log(await buildJapaneseN5());
