// Bengali calendar utility function
const getBengaliDate = (date: Date) => {
  // Bengali month names
  const bengaliMonths = [
    'বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন',
    'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র'
  ]
  
  // Bengali day names
  const bengaliDays = [
    'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
  ]
  
  // Season names
  const seasons = {
    'বৈশাখ': 'গ্রীষ্মকাল',
    'জ্যৈষ্ঠ': 'গ্রীষ্মকাল',
    'আষাঢ়': 'বর্ষাকাল',
    'শ্রাবণ': 'বর্ষাকাল',
    'ভাদ্র': 'বর্ষাকাল',
    'আশ্বিন': 'শরৎকাল',
    'কার্তিক': 'শরৎকাল',
    'অগ্রহায়ণ': 'হেমন্তকাল',
    'পৌষ': 'হেমন্তকাল',
    'মাঘ': 'শীতকাল',
    'ফাল্গুন': 'শীতকাল',
    'চৈত্র': 'বসন্তকাল'
  }
  
  // Approximate conversion to Bengali calendar
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  const dayOfWeek = date.getDay()
  
  // Rough conversion to Bengali year (Bengali year starts around April 14-15)
  let bengaliYear = year - 593
  if (month >= 3) { // April onwards
    bengaliYear = year - 592
  }
  
  // Rough month conversion
  let bengaliMonthIndex = month
  if (month >= 3) {
    bengaliMonthIndex = month - 3
  } else {
    bengaliMonthIndex = month + 9
  }
  
  const bengaliMonth = bengaliMonths[bengaliMonthIndex]
  const bengaliDay = bengaliDays[dayOfWeek]
  const season = seasons[bengaliMonth as keyof typeof seasons]
  
  return {
    bengaliDay,
    bengaliMonth,
    bengaliYear,
    day,
    season
  }
}

export function DateTime() {
  const currentDate = new Date()
  const bengaliDate = getBengaliDate(currentDate)

  return (
    <div className="text-center space-y-2 py-4">
      <div className="text-2xl font-bold text-gray-900">
        {currentDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </div>
      <div className="text-lg text-gray-700">
        {bengaliDate.bengaliDay}, {bengaliDate.day}ই {bengaliDate.bengaliMonth} {bengaliDate.bengaliYear} বঙ্গাব্দ
      </div>
      <div className="text-sm text-gray-500 italic">
        {bengaliDate.season}
      </div>
    </div>
  )
}
