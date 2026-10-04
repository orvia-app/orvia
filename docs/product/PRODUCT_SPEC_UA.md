# ORVIA — СПЕЦИФІКАЦІЯ ПРОДУКТУ v1.0 (українська супровідна версія)

**Статус:** ПОТРЕБУЄ СИНХРОНІЗАЦІЇ з англійською v1.3; не є канонічною<br>
**Дата:** 30 вересня 2026<br>
**Етап:** Перед приватною бетою / Product Architecture v2<br>
**Власник продукту:** Maksym Andriienko

> Канонічним джерелом правди є [англійська Product Specification v1.3](PRODUCT_SPEC.md). Нижче внесено лише обмежені виправлення щодо Calendar/Plan, provider-free private beta та ієрархії документації. Повну мовну й змістову синхронізацію рішень v1.1–v1.3 ще не виконано. У разі розбіжності не об'єднуйте трактування: використовуйте англійський документ і зафіксуйте потребу перекладу.

---

## 1. Бачення продукту

**Orvia — персональна система керування увагою, справами та часом, яка перетворює неструктуровану інформацію на зрозумілі наступні дії.**

Користувач не повинен постійно:
- пам’ятати все сам;
- вручну сортувати інформацію;
- виставляти пріоритет кожній задачі;
- постійно перебудовувати свій день;
- перевіряти кілька місць, щоб зрозуміти, що робити;
- витрачати надмірний час на обслуговування productivity-системи.

Orvia бере значну частину цієї організаційної роботи на себе.

**Рівень автономності Orvia завжди контролює користувач.**

### Ключовий результат

**Менше часу на організацію → більше часу на важливе без втрати результату.**

Ідеальна фраза користувача:

> «Я плачу за Orvia, тому що вона дає мені більше вільного часу й дозволяє фокусуватися на важливому для мене без втрати результату».

---

## 2. Основний цикл продукту

**Capture → Understand → Prioritize → Act**

### Capture
Користувач скидає те, що знаходиться в голові: кілька слів, повну задачу, нотатку, ідею, подію, нагадування, URL, а в майбутньому — voice/Telegram/mobile input.

### Understand
Orvia визначає, що це, куди це належить, чи є deadline, коли це важливо, приблизну тривалість, зв’язки з наявними даними та чи потрібна додаткова інформація.

### Prioritize
Orvia може враховувати deadline, важливість, календар, доступний час, estimated duration, workspace/project, перенесення, поведінку користувача, вивчені вподобання, поточний контекст і повідомлений користувачем стан/енергію.

### Act
Orvia допомагає відповісти на головне питання:

**What should I do now? / Що мені робити зараз?**

---

## 3. Принципи продукту

### 3.1 AI-first ≠ AI-only
Кожна основна дія має залишатися доступною вручну. AI допомагає, але не є єдиним способом користування Orvia.

### 3.2 Зменшувати організаційне навантаження
Якщо функція змушує користувача значно більше сортувати, тегати, конфігурувати або підтримувати структуру без суттєво більшої користі, вона суперечить основній ідеї продукту.

### 3.3 Спокій замість шуму
Orvia не повинна перетворюватися на Jira або dashboard із великою кількістю однаково важливих блоків.

### 3.4 Пояснювати важливі рішення
Користувач має розуміти, чому Orvia щось рекомендує. Пояснення короткі, конкретні та корисні.

### 3.5 Користувач зберігає контроль
Важливі зміни прозорі. Destructive actions не приховуються. Де доречно — доступні Edit/Undo. Автономність налаштовується.

### 3.6 Не вигадувати продуктивність
Якщо нічого не потребує уваги:

> **You're clear. Nothing needs your attention right now.**

Orvia не створює зайву роботу лише для відчуття продуктивності.

### 3.7 Privacy і security — частина продукту
Користувач має розуміти й контролювати використання своїх даних, а не покладатися лише на юридичний Privacy Policy.

---

## 4. Інформаційна архітектура

### Основна навігація
- Home
- Plan
- Calendar
- Inbox
- Tasks & Notes
- Search
- Settings

### Другорядні можливості
- Projects
- Workspaces
- History / Timeline
- Feedback
- Help

Calendar — окрема primary destination поряд із Plan. Calendar відповідає на фактичне питання про час, а Plan допомагає вирішити, як цей час використати.

### Не є core navigation
Finance, Cars, AI Chat, Automation і Labs не стають частиною нового core лише через те, що відповідний код уже існує.

---

## 5. Home

Home відповідає на питання: **Що важливо зараз?**

Це не традиційний dashboard.

### Ранковий стан
Перший morning view — інформаційний:
- greeting/date;
- короткий summary дня;
- Top 3–5 priorities;
- найближчий schedule;
- Keep in mind;
- Quick Capture.

### Денний стан
Протягом дня Home стає decision-oriented.

Приклад:

> **What should I do now?**<br>
> Prepare presentation<br>
> ~45 min · High<br>
> Due tomorrow. You have 70 minutes before your next meeting.<br>
> **Start** · Other options

Другорядна інформація не повинна конкурувати з головним рішенням.

---

## 6. Пріоритети дня

Orvia формує приблизно **3–5 головних пріоритетів дня**.

Вони не повинні непомітно або хаотично змінюватися.

Якщо контекст суттєво змінився:

> **Your day changed. I can adjust your plan.**

Для beta користувач вирішує, чи перебудовувати план.

---

## 7. Plan

Plan відповідає: **Що я збираюся робити / як використати доступний час?**

Основний формат — timeline, який об’єднує:
- meetings;
- Orvia events;
- planned tasks;
- free time;
- priorities.

Користувач може вручну змінювати план.

### Still to place
Plan показує незаплановані справи, щоб вони не загубилися.

Orvia може запропонувати, куди їх поставити.

---

## 8. Calendar

Calendar відповідає: **Як виглядає мій час?**

Orvia має власний Calendar із режимами:
- Day
- Week
- Month

Він показує:
- Orvia events;
- personal events;
- події підключених зовнішніх календарів.

### Зовнішні календарі — v1
Private beta працює без зовнішнього календаря. Google Calendar read-only context — окремий gated етап після beta; Outlook — пізніше. Якщо зовнішній provider буде схвалено, Orvia використовує дозволені події як контекст і не змінює source calendar. Точна provider/permission/refresh/integration architecture залишається **OPEN**.

### Власні події Orvia
Користувач може створювати в Orvia власні події: Gym, Dentist, Dinner тощо.

### Конфлікти
Orvia завчасно визначає конфлікти й дає достатньо часу, щоб перенести, скасувати або іншим способом вирішити ситуацію.

---

## 9. Universal Capture

Capture доступний практично звідусіль.

Основний input:

> **What's on your mind?**

Default mode: **Auto**

За бажанням користувач може явно вибрати:
- Task
- Note
- Event

Orvia може розбити один capture на кілька об’єктів.

**Поточний зріз для приватної бети (локальна реалізація, 4 жовтня 2026):** Чотири видимі варіанти зберігають запис для перегляду у Вхідних; режим «Авто» не визначає тип і не заявляє про впевненість ШІ. Перетворення на завдання й нотатку зберігає наявні контракти записів; для записів акаунта створення об’єкта й завершення обробки відбуваються атомарно. Для перетворення на подію потрібні дані розкладу та запис, збережений в акаунті. Розділення одного запису на кілька об’єктів, автоматичне виконання за високої впевненості й зовнішні канали запису залишаються цільовою поведінкою. Локальний код і тести не підтверджують розгортання чи готовність до бети.

**Рішення щодо записів на пристрої:** Вони залишаються локальними. Для створення завдання, нотатки чи події в акаунті потрібен запис, збережений в акаунті. Вхід не завантажує наявні локальні записи: користувач зберігає текст і може створити новий запис в акаунті за наявності з’єднання. Автоматична синхронізація з пристрою до хмари не входить у цей пакет.

---

## 10. Confidence для Capture

### High confidence
**Understand → execute → show result → Edit/Undo**

Очевидні інтерпретації не потребують зайвого confirmation.

### Low confidence
Orvia не вгадує. Item потрапляє в Inbox для уточнення.

---

## 11. Результат Capture

Для multi-item capture показується компактний результат.

Залежно від autonomy/confidence:
- Approve all / Review; або
- high-confidence результат одразу застосовується з Undo/Edit.

---

## 12. Voice та зовнішній Capture

Voice Capture є частиною цільової архітектури.

Orvia може перетворювати один voice input на кілька об’єктів.

Архітектура не повинна блокувати майбутні Telegram/mobile capture.

До beta бажано мати хоча б **один зручний external/mobile-oriented capture channel**. Конкретний канал — відкрите implementation-рішення.

---

## 13. Inbox

Inbox = **attention queue**, а не історія всіх captures.

Причини потрапляння:
- Needs clarification
- Needs approval
- Missing information
- Possible duplicate
- Needs decision
- Conflict

Після вирішення item залишає активний Inbox.

---

## 14. Tasks

Task v1 підтримує:
- title;
- description;
- deadline;
- planned time;
- estimated duration;
- priority;
- workspace;
- project;
- status;
- reminder;
- recurrence;
- checklist.

Не створюємо десятки configurable fields.

### Статуси
- To do
- In progress
- Done
- Cancelled

`Overdue` — calculated state, а не ручний status.

---

## 15. Notes

Notes залишаються навмисно простими:
- rich text;
- workspace;
- project;
- related tasks;
- links;
- attachments later.

Не будуємо Notion-style databases, складну систему nested pages або конструктор сторінок.

### Note → Task
Виділений текст Note можна перетворити на linked Task.

---

## 16. Reminders

Reminder переважно є властивістю task/event, а не окремим top-level object.

---

## 17. Recurring Tasks

Recurring tasks — **beta requirement**.

Мають підтримувати типові сценарії: щотижня, щомісяця, weekdays, custom recurrence.

Точний UX редактора recurrence визначається під час design.

---

## 18. Projects

Projects — **lightweight-групи пов’язаних справ та інформації навколо цілі**.

Не додаємо:
- sprints;
- epics;
- story points;
- complex boards;
- Jira-style workflows.

Якщо Projects роблять Orvia відчутно складнішою — спрощуємо їх.

### Intelligent project detection
Orvia може запропонувати створити Project із пов’язаних items, але не створює його приховано без confirmation.

---

## 19. Workspaces

Default top-level workspaces:
- Personal
- Work
- Business

Користувач може перейменовувати, видаляти й додавати workspace. Orvia також може запропонувати новий.

Ієрархія залишається неглибокою. Workspace → Projects достатньо.

---

## 20. Search / Ask Orvia

Search має еволюціонувати від keyword search до пошуку й відповідей по персональній інформації користувача.

Приклади:
- What did I write about the dentist?
- What have I postponed for two weeks?
- What's planned for Orvia?
- Find the note about Italy.

---

## 21. History / Timeline

History — secondary capability для:
- history;
- audit;
- recovery/context;
- розуміння попередніх дій.

Не primary navigation.

---

## 22. Orvia Intelligence

Orvia Intelligence може аналізувати:
- deadlines;
- priority;
- estimated duration;
- calendar;
- available time;
- meetings;
- postponements;
- workspace/project;
- previous behavior;
- user preferences;
- current context.

Може автоматично оцінювати або визначати:
- type;
- workspace;
- status;
- priority;
- duration.

Користувач може виправляти ці рішення.

---

## 23. Explainability

Важливі recommendations мають коротко пояснюватися.

Наприклад:

> **Prepare presentation · ~45 min**
> Recommended because it's due tomorrow and you have meetings after 14:00.

Без AI-есе.

---

## 24. Orvia Next

Orvia Next відповідає:

**What should I do next?**

Може показувати приблизно **1–5 релевантних варіантів**.

Можливі категорії:
- Recommended
- Quick win
- Alternative

Actions:
- Start
- Skip
- Reschedule

---

## 25. Start & Focus Mode

`Start` переводить Task у **In progress**.

Опційний **Focus Mode** мінімізує навколишній UI та концентрує увагу на активній задачі.

Focus Mode усе одно показує справді важливий контекст:
- upcoming meeting;
- critical deadline;
- справді більш термінову подію.

---

## 26. Behavioral Learning

Behavioral learning — core capability.

Orvia може вивчати:
- коли користувач краще виконує складну роботу;
- коли робить quick tasks;
- реальну тривалість типів задач;
- що регулярно відкладається;
- які recommendations приймаються;
- які ігноруються;
- preferred work patterns.

---

## 27. Повторно відкладені задачі

Orvia не збільшує безкінечно кількість нагадувань.

Може:
- запитати `Still relevant?`;
- запропонувати reschedule;
- запропонувати archive/cancel;
- використати поведінку як майбутній signal.

Реальний deadline, що наближається, може знову підвищити priority.

---

## 28. Стан / енергія користувача

Користувач може повідомити, наприклад:

> «Я сьогодні без сил».

Orvia може:
- запропонувати полегшити день;
- перенести необов’язкове;
- запропонувати відпочинок;
- м’яко залишити справді критичні задачі.

У відповідній ситуації Orvia може порадити звернутися по медичну допомогу, але не діагностує і не робить самостійних медичних висновків.

---

## 29. Overdue UX

Не використовуємо stress-dashboard типу `17 OVERDUE`.

Краще:

> **3 things need attention**

І дії:
- Do
- Reschedule
- Still relevant?
- Cancel/archive

---

## 30. Completion UX

Completion feedback — спокійний і дорослий.

Без confetti, streak fireworks, productivity points та дитячої gamification за замовчуванням.

Після completion Orvia може показати релевантний наступний крок.

---

## 31. Автономність

Три режими:

### Suggest
**I recommend. You organize.**

### Assist
**I prepare. You approve.**

### Auto-plan
Orvia може автоматично виконувати дозволені planning actions у встановлених користувачем межах із transparency та Edit/Undo.

### Default
**Assist**

Режим можна змінити будь-коли.

Для beta значне replanning пропонується користувачу, а не застосовується приховано.

---

## 32. Дії без confirmation

За відповідного confidence та налаштувань Orvia може:
- аналізувати;
- рекомендувати;
- визначати high-confidence type;
- визначати workspace;
- оцінювати priority;
- оцінювати duration;
- читати дозволений calendar context;
- структурувати high-confidence captures з Undo/Edit.

Confirmation або explicit permission потрібні для:
- destructive actions;
- significant beta replanning;
- important deadline modification;
- external actions;
- ambiguous/low-confidence interpretations.

---

## 33. Notifications

Три рівні важливості:

### Critical attention
Upcoming meeting, calendar conflict, important deadline.

### Useful
Planned task approaching, day changed, plan could be adjusted.

### Ambient
Keep in mind, low-urgency reminder.

Користувач контролює типи й канали.

---

## 34. Notification Channels

Цільова архітектура:
- desktop/browser;
- mobile push;
- email;
- Telegram.

Mobile push залежить від mobile-capable client. Telegram — від інтеграції.

---

## 35. Email Policy

### Service/Auth emails
Email confirmation, password reset, security/account communication.

### Productivity emails
Morning plan, reminders, daily/weekly summary.

**Productivity emails за замовчуванням OFF і потребують opt-in користувача.**

---

## 36. Quiet Hours

Configurable quiet hours обов’язкові.

Наприклад: **22:00–08:00**

Orvia мовчить, крім явно дозволених винятків.

---

## 37. Notification Learning

Якщо користувач регулярно dismiss’ить певний тип notifications, Orvia може запропонувати зменшити їх кількість.

Не відключає їх приховано сама.

---

## 38. Morning Briefing

Optional/configurable notification.

Наприклад:

> Good morning. You have 2 meetings and 4 priorities today.

Tap → Morning Home.

Час контролює користувач.

---

## 39. Evening Review

Optional і disable-able.

Наприклад:

> 4 completed · 2 still open
> Plan tomorrow?

---

## 40. Personalization — “How Orvia knows me”

Settings показує релевантний learned context, наприклад:
- Preferred focus time
- Typical workday
- Avoid work tasks after
- Typical lunch

Користувач може виправляти ці припущення.

---

## 41. Learning Controls

Обов’язково:
- **Reset learned preferences**
- **Disable behavioral learning**

Ці controls не повинні бути приховані.

---

## 42. Sensitive Workspaces

Workspace може мати:

**Use for AI recommendations: ON/OFF**

Коли OFF, protected workspace content не використовується для AI recommendations.

Це реальна processing/data boundary, а не декоративний toggle.

---

## 43. Privacy Transparency

Settings зрозуміло пояснює використання:
- tasks;
- notes;
- calendar;
- behavioral signals;
- integrations;
- AI processing.

Не ховаємо всю важливу інформацію лише в legal Privacy Policy.

---

## 44. Links / URL Safety

Зовнішні URL вважаються **untrusted input**.

Архітектура враховує:
- malicious content;
- phishing;
- unsafe redirects;
- prompt injection / malicious instructions у fetched content;
- небезпечну автоматичну взаємодію.

Orvia не виконує сліпо інструкції, знайдені у зовнішньому контенті.

---

## 45. Attachments

PDF/images/files — **later**, не initial beta requirement.

Архітектура не повинна блокувати майбутній flow:

> attach contract → “review this before Friday” → Task + linked document.

---

## 46. Data Lifecycle

Підтримуємо:
- Archive
- Delete

Archive прибирає item з активної роботи, але зберігає для Search/Ask Orvia/history.

**Рішення для приватної бети щодо подій:** Подія може бути активною, архівованою або видаленою. Видалення є м’яким: подія зникає зі звичайних екранів, але фізично не стирається. У цьому пакеті немає відновлення для користувача. Остаточне фізичне видалення й терміни зберігання потребують окремого рішення щодо життєвого циклу даних і юридичних вимог до публічного запуску. Це рішення не завершує експорт даних акаунта чи видалення акаунта — вони залишаються окремими вимогами бети.

До beta:
- **Export my data**
- **Delete account and data**

---

## 47. Authentication

Beta authentication:
- **Continue with Google**
- **Email + Password**

Також:
- email confirmation;
- forgot password;
- reset password;
- logout/session handling.

Потрібно безпечно обробити identity/account linking, коли та сама email-адреса використовується через password auth і Google OAuth. Не допускаємо випадкового створення незалежних data identities або втрати даних.

---

## 48. Onboarding

Не робимо довгий tutorial.

Цільовий flow після появи схваленого provider connection:

**Welcome → Basic preferences → Connect calendar (optional) → Notifications → Autonomy → First Capture**

Provider-free private beta пропускає крок Connect calendar.

Orvia залишається повноцінно usable без external calendar.

Подальше навчання — contextual, під час реального використання.

---

## 49. First Success / Activation

`signup_completed` ≠ activation.

Activation означає, що користувач відчув core value:

**Capture → Orvia understands → user accepts/corrects → Orvia prioritizes → user acts**

---

## 50. Product Analytics

Дозволені privacy-safe behavioral events:
- `next_shown`
- `next_started`
- `next_skipped`
- `plan_change_suggested`
- `plan_change_accepted`
- `capture_auto_classified`
- `capture_corrected`

Не передаємо в analytics:
- task titles;
- note text;
- capture content;
- personal URLs;
- tokens;
- auth/session data;
- sensitive user content.

---

## 51. Recommendation Feedback

Іноді можна запитати:

> Was this recommendation useful?
> 👍 / 👎

Не після кожної дії.

---

## 52. Beta Feedback

Feedback Center залишається частиною beta і дозволяє швидко повідомити:
- bug;
- confusing UX;
- feature request;
- recommendation problem;
- general feedback.

---

## 53. Beta Scope

Відділяємо цільову архітектуру від того, що фізично повинно існувати до першого beta user.

### Core beta
- Authentication
- Google Sign-In
- EN/UA
- Home
- Plan
- Universal Capture
- Inbox
- Tasks
- Notes
- recurring tasks
- reminders
- Search
- lightweight Projects
- Workspaces
- manual control
- privacy/security controls
- privacy-safe behavioral analytics
- feedback
- onboarding
- production-ready email/auth infrastructure
- responsive web
- light/dark
- desktop/browser notifications where technically viable
- Export/Delete account data

### Beta intelligence
Beta не потребує perfect intelligence, але повинна демонструвати:

**Capture → Understand → Prioritize → Act**

Intelligence можна поступово посилювати.

---

## 54. Calendar Beta Decision

Private-beta Calendar scope є provider-free: окрема primary Calendar, Orvia Events, Day/Week/Month, planned Task intervals, спільна Calendar/Plan schedule projection, Plan integration і базове conflict/capacity awareness з prerequisites та OPEN рішеннями з [Calendar + Plan beta specification](CALENDAR_PLAN_BETA_SPEC.md). Google read-only context — gated після beta; Outlook — пізніше. External calendar не є beta blocker. Це рішення не означає, що Calendar, Plan або release validation уже завершені.

---

## 55. External/Mobile Capture Beta Decision

До beta прагнемо мати хоча б один зручніший capture channel, крім стандартного web flow.

Кандидати:
- voice in web/PWA;
- Telegram;
- PWA/mobile shortcut;
- інший lightweight channel.

**Рішення залишається відкритим.**

Telegram не вважається beta-required, доки не зроблено effort/value assessment.

---

## 56. Explicitly Later

Не блокуємо initial beta через:
- native iOS app;
- native Android app;
- full Telegram integration, якщо обрано інший capture channel;
- attachments;
- complex file intelligence;
- bidirectional Google/Outlook sync;
- team collaboration;
- enterprise functionality;
- complex project management;
- Notion-like databases;
- Jira-like boards;
- full autonomous-agent behavior.

---

## 57. Design Direction

Orvia повинна відчуватися як:

**calm / premium / trustworthy / focused / intelligent**

Уникаємо:
- AI hype;
- cyberpunk;
- gaming aesthetics;
- neon;
- excessive violet;
- generic Tailwind SaaS;
- giant white cards everywhere;
- excessive rounded containers;
- glassmorphism заради glassmorphism;
- noisy dashboards.

Орієнтир — принципи premium software на кшталт Linear/Raycast/Arc без копіювання їхнього UI.

Ієрархія UI:

**What matters → Why → What can I do**

---

## 58. Motion

Motion — частина design system.

Вона:
- restrained;
- functional;
- приблизно 120–250 ms для звичайних transitions;
- підтримує reduced-motion preferences.

Без декоративної анімації заради ефекту.

---

## 59. Responsive Experience

Orvia повинна бути повноцінною на:
- desktop;
- mobile web;
- light theme;
- dark theme.

Mobile — не просто стиснутий desktop.

---

## 60. Languages

**English + Ukrainian**

Українська — beta requirement, а не post-beta nice-to-have.

---

## 61. Visual Release Gate

**Automated PASS ≠ Visual PASS ≠ Release PASS.**

Великий UI redesign не приймається лише тому, що build/tests пройшли або automated agent сказав, що все добре.

Перед production UI release власник продукту явно затверджує representative real rendered screens:
- desktop;
- mobile;
- light;
- dark.

Visual smoke оцінює layout, spacing, typography, surfaces, navigation proportions, responsive behavior та загальну візуальну цілісність.

---

## 62. Product Success

Головне питання не:

> Скільки features ми реалізували?

А:

> **Чи повертається користувач в Orvia, тому що вона реально полегшує йому день?**

Корисні beta signals:
- activation;
- repeat usage;
- recommendation acceptance;
- capture corrections;
- Next usage;
- plan acceptance;
- retention;
- qualitative feedback;
- чи повідомляють користувачі про зменшення organizational overhead.

Раннім сигналом може бути невелика група користувачів, які повертаються 3–5 разів на тиждень, але сама частота недостатня.

---

## 63. Non-Goals

Orvia не будується як:
- Jira replacement;
- Notion replacement;
- enterprise PM suite;
- team collaboration platform;
- AI chatbot із todo list;
- gamified productivity app;
- productivity suite з максимальною кількістю features.

Не позиціонуємо Orvia як autonomous agent, який самостійно керує життям користувача.

---

## 64. Product Test

Для кожної великої feature ставимо питання:

> **Чи допомагає це користувачу швидше перейти від того, що знаходиться в його голові, до правильного наступного кроку?**

Якщо ні — feature потрібна сильна окрема причина для існування.

---

## 65. Core UX Test

Новий користувач без допомоги повинен пройти:

**Create account → First Capture → Understand result → Inbox if necessary → Task/Note/Event → Plan/Home → Start → Complete → understand what happens next**

Якщо цей flow незрозумілий — beta UX не готовий.

---

## 66. Security Principle

Оскільки Orvia може містити особисті задачі, робочу інформацію, calendar data, behavioral data, notes та external links, security/privacy входять у Definition of Done кожної відповідної feature.

Нові intelligence capabilities не повинні послаблювати ownership, isolation, privacy або security guarantees.

---

## 67. Ієрархія Source of Truth

Якщо продуктові документи суперечать один одному:

1. **Orvia Product Specification v1.x**
2. Approved UX Architecture decisions
3. Feature and technical specifications
4. Design Foundation
5. Screen specifications
6. Implementation and implementation evidence
7. Historical/archive documentation

Старий roadmap не може скасувати цю Product Specification.

README самостійно не визначає product strategy.

Код показує, що реалізовано, але сам по собі не визначає, яким продукт повинен стати.

---

## 68. Change Control

Документ повинен залишатися актуальним, а не стати ще одним застарілим `.md`.

Коли змінюється важливе продуктове рішення:

**Decision → update Product Spec → update affected feature spec/AC → implementation**

Версії:
- `v1.0` — поточна затверджена product architecture
- `v1.1` — невеликі продуктові зміни
- `v1.2` — product/UX/design/quality foundation
- `v1.3` — source-of-truth і private-beta scope reconciliation
- `v2.0` — фундаментальна зміна product model

Ведемо короткий Decision Log.

---

## 69. Поточні відкриті рішення

Навмисно не визначені й не повинні вигадуватися implementation agents:
- який external/mobile capture channel входить у beta;
- точні правила Priority Engine scoring;
- intelligence confidence thresholds;
- точний UX recurring-task editor;
- точні notification timing/escalation rules;
- реалізація Google OAuth account linking;
- майбутня Calendar provider/permission/refresh/integration architecture;
- точна AI/model/data architecture;
- monetization/pricing;
- фінальна visual system і logo.

Це відкриті рішення, а не пропущені requirements.

---

## 70. Decision Log

**v1.3 — 2026-10-01**
- Узгоджено ієрархію Product Specification → approved UX Architecture decisions → feature/technical specifications → Design Foundation → screen specifications → implementation/evidence → historical documentation.
- Зафіксовано вже схвалений provider-free private-beta Calendar boundary: Google read-only context після beta; Outlook пізніше; ширша provider architecture залишається OPEN.

**v1.1 — 2026-09-30**
- Calendar — окрема primary destination поряд із Plan.
- Calendar відповідає «Як виглядає мій час?», а Plan — «Що я збираюся робити / як використати доступний час?».

**v1.0 — 2026-09-30**

- Core продукту: **Capture → Understand → Prioritize → Act**.
- Home вранці інформаційний, протягом дня decision-oriented.
- Daily Top 3–5 стабільний, доки користувач не схвалить replanning.
- Plan — daily timeline із `Still to place`.
- Orvia має власний Day/Week/Month Calendar.
- Google/Outlook calendars read-only для v1.
- Universal Capture: Auto + manual Task/Note/Event.
- High-confidence interpretations можуть застосовуватися з Edit/Undo; low-confidence → Inbox.
- Inbox — attention queue, не capture history.
- Voice/external capture входить у target architecture.
- Task statuses: To do / In progress / Done / Cancelled.
- Recurring tasks — beta requirement.
- Reminders — переважно властивості tasks/events.
- Notes залишаються lightweight і можуть створювати linked tasks.
- Projects lightweight; AI-proposed project creation потребує confirmation.
- Default workspaces: Personal / Work / Business.
- History/Timeline — secondary.
- Orvia навчається на поведінці користувача.
- User-provided energy/state може впливати на planning.
- Orvia Next може показувати приблизно 1–5 contextual options.
- Focus Mode входить у target UX.
- Autonomy modes: Suggest / Assist / Auto-plan.
- Default autonomy: **Assist**.
- Significant beta replanning пропонується, а не застосовується приховано.
- Notifications: Critical / Useful / Ambient.
- Quiet hours configurable.
- Morning briefing та evening review optional.
- Productivity emails **OFF by default** і потребують opt-in.
- `How Orvia knows me`, reset learning та disable behavioral learning обов’язкові.
- Sensitive workspaces можуть бути виключені з AI recommendations.
- External URL content — untrusted input.
- Attachments — later.
- Archive + Delete підтримуються.
- Export data та Delete account/data — beta requirements.
- Beta auth: email/password + **Google Sign-In**.
- Onboarding короткий; calendar connection optional.
- Activation = отримання core value, а не signup.
- Behavioral analytics дозволені без task/note/capture content.
- EN/UA — beta requirement.
- Visual owner approval — release gate.
- Ця Product Specification замінює суперечливу стару product/roadmap документацію.

---

## 71. Наступний продуктовий етап

Після затвердження цієї специфікації наступний етап — **UX Architecture**.

Потрібно спроєктувати конкретну desktop + mobile структуру для:
- Home
- Plan
- Calendar
- Capture
- Inbox
- Tasks & Notes
- Projects
- Search
- Settings

Лише після затвердження UX Architecture документація репозиторію узгоджується за моделлю:

**KEEP / UPDATE / REPLACE / ARCHIVE / DELETE**

Старі документи не повинні залишатися активними, якщо вони суперечать цьому Source of Truth.

Після reconciliation implementation agents, включно з Codex, повинні читати цю специфікацію перед product/design роботою.
