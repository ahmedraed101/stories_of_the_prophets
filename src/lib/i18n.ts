export type Language = 'ar' | 'en'

export const translations = {
  ar: {
    brandName: 'قصص الأنبياء',
    brandHonorific: 'عليهم السلام',
    switchLanguage: 'التبديل إلى الإنجليزية',
    switchToLight: 'التبديل إلى الوضع الفاتح',
    switchToDark: 'التبديل إلى الوضع الداكن',
    home: 'الرئيسية',
    back: 'رجوع',
    menu: 'القائمة',
    shareApp: 'شارك التطبيق',
    shareTooltip: 'شارك التطبيق مع أصدقائك',
    share: 'مشاركة',
    shareCopied: 'تم نسخ نص المشاركة',
    shareFailed: 'تعذرت المشاركة',
    shareSheetTitle: 'مشاركة التطبيق',
    shareSheetHint: 'انسخ النص أدناه وأرسله عبر واتساب أو أي تطبيق آخر',
    shareSheetCopy: 'نسخ النص',
    shareAppTitle: 'قصص الأنبياء — بلا تشتيت',
    shareAppMessage:
      'أتابع قصص الأنبياء والسيرة النبوية عبر تطبيق مركّز بلا تشتيت — ممتاز للتعلّم بهدوء وتتبّع التقدّم. جرّبه:',
    videos: (n: number) => `${n} حلقة`,
    openSeries: 'فتح السلسلة',
    continueWatching: 'متابعة المشاهدة',
    startWatching: 'ابدأ المشاهدة',
    completed: 'مكتمل',
    notCompleted: 'غير مكتمل',
    started: 'قيد المشاهدة',
    progress: (completed: number, total: number) =>
      `${completed} من ${total} مكتمل`,
    progressLabel: 'التقدم',
    markComplete: 'تحديد كمكتمل',
    previous: 'السابق',
    next: 'التالي',
    embedError: 'تعذر عرض هذا المحتوى.',
    openOriginal: 'فتح على يوتيوب',
    watchOnSource: 'فتح على يوتيوب',
    installApp: 'تثبيت التطبيق',
    installTooltip: 'تثبيت التطبيق على جهازك',
    installHintIos:
      'على آيفون: شارك ← إضافة إلى الشاشة الرئيسية',
    installHintAndroid:
      'من قائمة المتصفح اختر تثبيت التطبيق أو إضافة إلى الشاشة الرئيسية',
    installHintGeneric:
      'استخدم قائمة المتصفح لإضافة التطبيق إلى الشاشة الرئيسية',
    language: 'اللغة',
    managePlaylists: 'إدارة القوائم',
    addPlaylist: 'إضافة قائمة',
    playlistUrl: 'رابط قائمة يوتيوب',
    optionalTitle: 'عنوان مخصص (اختياري)',
    adding: 'جاري الإضافة…',
    remove: 'حذف',
    removePlaylistTitle: 'حذف القائمة؟',
    removePlaylistConfirm: (title: string) =>
      `هل تريد حذف «${title}» من التطبيق؟ لا يمكن التراجع عن هذا الإجراء.`,
    cancel: 'إلغاء',
    confirmRemove: 'نعم، احذف',
    builtIn: 'مضمّنة',
    addError: 'تعذر جلب القائمة. تحقق من الرابط وحاول مرة أخرى.',
    alreadyAdded: 'هذه القائمة مضافة مسبقاً.',
    rssLimitNote:
      'ملاحظة: القوائم المضافة تجلب أحدث الفيديوهات من يوتيوب (حتى حوالي 15).',
    brandTagline: 'تعلّم قصص الأنبياء والسيرة النبوية بلا تشتيت.',
    seriesCollection: 'المجموعات',
    overallProgress: 'التقدم الكلي',
    upNext: 'التالي',
    certificateTitle: 'شهادة إتمام',
    certificateCongrats: 'بارك الله فيك!',
    certificateBody: (series: string) =>
      `أتممتَ مشاهدة «${series}» كاملة عبر التطبيق.`,
    certificateShareMessage: (series: string) =>
      `أتممتُ مشاهدة «${series}» عبر تطبيق قصص الأنبياء — تعلّم بلا تشتيت وتتبّع تقدّمك بهدوء. 🌙`,
    certificateShare: 'مشاركة',
    certificateDownload: 'تحميل الشهادة',
    certificateShareHint:
      'يفتح قائمة المشاركة — اختر واتساب أو أي تطبيق لإرسال الصورة مع النص.',
    certificateShareInsecure:
      'الاتصال غير آمن — لن تُفتح قائمة المشاركة. اضغط «مشاركة» لحفظ الصورة ونسخ النص، أو شغّل التطبيق عبر HTTPS.',
    certificateShareFailedUseDownload:
      'تعذر المشاركة. استخدم «تحميل الشهادة» ثم أرفق الصورة في واتساب.',
    certificateShareSavedAndCopied:
      'تم حفظ الصورة ونسخ النص — أرفق الصورة في واتساب والصق النص.',
    certificateShareOpenedAndCopied:
      'افتح تبويب الصورة، احفظها بالضغط المطوّل، ثم الصق النص في واتساب.',
    certificateShareImageOpened:
      'افتح تبويب الصورة واحفظها بالضغط المطوّل، ثم شاركها في واتساب.',
    certificateClose: 'إغلاق',
    certificateView: 'عرض الشهادة',
    certificateNextSeries: 'تابع السيرة النبوية',
    certificateAllDone: 'أكملتَ جميع المجموعات الأساسية — جزاك الله خيراً!',
    achievementsTab: 'الإنجازات',
    achievementsTitle: 'إنجازاتك',
    achievementsSubtitle: 'شهادات الإتمام التي يمكنك مشاركتها مع الآخرين.',
    achievementsEmpty:
      'أكمل مجموعة كاملة من الحلقات لتحصل على شهادة إنجاز يمكنك مشاركتها هنا.',
    certificateGrandTitle: 'إنجاز كامل',
    certificateGrandHeading: 'أتممتَ الرحلة كاملة',
    certificateGrandBody:
      'أكملتَ مشاهدة قصص الأنبياء والسيرة النبوية — بارك الله فيك على هذا الإنجاز.',
    certificateGrandShareMessage:
      'أتممتُ مشاهدة قصص الأنبياء والسيرة النبوية كاملة عبر التطبيق — رحلة تعلّم بلا تشتيت. 🏆🌙',
    achievementEarned: 'مكتمل',
    achievementShare: 'مشاركة',
    achievementView: 'عرض',
    shareImageDownloaded: 'تم حفظ صورة الشهادة',
    certificateSharing: 'جاري تجهيز الصورة…',
    certificateDownloading: 'جاري التحميل…',
  },
  en: {
    brandName: 'Stories of the Prophets',
    brandHonorific: 'peace be upon them',
    switchLanguage: 'Switch to Arabic',
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',
    home: 'Home',
    back: 'Back',
    menu: 'Menu',
    shareApp: 'Share app',
    shareTooltip: 'Share the app with friends',
    share: 'Share',
    shareCopied: 'Share text copied',
    shareFailed: 'Could not share',
    shareSheetTitle: 'Share the app',
    shareSheetHint: 'Copy the text below and send it via WhatsApp or any app',
    shareSheetCopy: 'Copy text',
    shareAppTitle: 'Stories of the Prophets — no distractions',
    shareAppMessage:
      "I'm learning the stories of the prophets through a focused, distraction-free app — perfect for calm learning and tracking progress. Try it:",
    videos: (n: number) => `${n} episodes`,
    openSeries: 'Open series',
    continueWatching: 'Continue watching',
    startWatching: 'Start watching',
    completed: 'Completed',
    notCompleted: 'Not completed',
    started: 'In progress',
    progress: (completed: number, total: number) =>
      `${completed} of ${total} complete`,
    progressLabel: 'Progress',
    markComplete: 'Mark complete',
    previous: 'Previous',
    next: 'Next',
    embedError: 'Could not display this content.',
    openOriginal: 'Open on YouTube',
    watchOnSource: 'Open on YouTube',
    installApp: 'Install app',
    installTooltip: 'Install the app on your device',
    installHintIos: 'On iPhone: Share → Add to Home Screen',
    installHintAndroid:
      'From the browser menu choose Install app or Add to Home screen',
    installHintGeneric:
      'Use your browser menu to add this app to your home screen',
    language: 'Language',
    managePlaylists: 'Manage playlists',
    addPlaylist: 'Add playlist',
    playlistUrl: 'YouTube playlist link',
    optionalTitle: 'Custom title (optional)',
    adding: 'Adding…',
    remove: 'Remove',
    removePlaylistTitle: 'Remove playlist?',
    removePlaylistConfirm: (title: string) =>
      `Remove “${title}” from the app? This cannot be undone.`,
    cancel: 'Cancel',
    confirmRemove: 'Yes, remove',
    builtIn: 'Built-in',
    addError: 'Could not import that playlist. Check the link and try again.',
    alreadyAdded: 'This playlist is already in your library.',
    rssLimitNote:
      'Note: imported playlists load the latest videos from YouTube (about 15).',
    brandTagline:
      'Learn the stories of the prophets and the prophetic biography — without distraction.',
    seriesCollection: 'Collections',
    overallProgress: 'Overall progress',
    upNext: 'Up next',
    certificateTitle: 'Certificate of completion',
    certificateCongrats: 'Well done!',
    certificateBody: (series: string) =>
      `You completed all episodes of “${series}”.`,
    certificateShareMessage: (series: string) =>
      `I completed “${series}” in the Stories of the Prophets app — focused learning without distractions. 🌙`,
    certificateShare: 'Share',
    certificateDownload: 'Download certificate',
    certificateShareHint:
      'Opens the share sheet — pick WhatsApp or any app to send the image with text.',
    certificateShareInsecure:
      'Connection is not secure — the share sheet will not open. Tap Share to save the image and copy text, or run the app over HTTPS.',
    certificateShareFailedUseDownload:
      'Could not share. Use Download, then attach the image in WhatsApp.',
    certificateShareSavedAndCopied:
      'Image saved and text copied — attach the image in WhatsApp and paste the text.',
    certificateShareOpenedAndCopied:
      'Open the image tab, long-press to save, then paste the text in WhatsApp.',
    certificateShareImageOpened:
      'Open the image tab, long-press to save, then share it in WhatsApp.',
    certificateClose: 'Close',
    certificateView: 'View certificate',
    certificateNextSeries: 'Continue with the Prophetic Biography',
    certificateAllDone:
      'You completed all core collections — may Allah reward you!',
    achievementsTab: 'Achievements',
    achievementsTitle: 'Your achievements',
    achievementsSubtitle: 'Completion certificates you can share with others.',
    achievementsEmpty:
      'Finish a full collection to earn a shareable certificate here.',
    certificateGrandTitle: 'Full journey',
    certificateGrandHeading: 'You completed the full journey',
    certificateGrandBody:
      'You finished Stories of the Prophets and the Prophetic Biography — well done.',
    certificateGrandShareMessage:
      'I completed the full Stories of the Prophets journey in the app — focused learning without distractions. 🏆🌙',
    achievementEarned: 'Complete',
    achievementShare: 'Share',
    achievementView: 'View',
    shareImageDownloaded: 'Certificate image saved',
    certificateSharing: 'Preparing image…',
    certificateDownloading: 'Downloading…',
  },
} as const

export type Text = (typeof translations)[Language]
