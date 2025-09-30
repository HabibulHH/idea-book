import { useState, useEffect } from 'react'
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning } from 'lucide-react'

interface WeatherData {
  temperature: number
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy'
  humidity: number
  location: string
}

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

export function WeatherHeader() {
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 28,
    condition: 'sunny',
    humidity: 65,
    location: 'Dhaka'
  })

  const currentDate = new Date()
  const bengaliDate = getBengaliDate(currentDate)

  // Simulate weather data - in real app, fetch from weather API
  useEffect(() => {
    const getWeatherCondition = (temp: number, hour: number) => {
      if (temp > 35) return 'sunny'
      if (temp > 25 && hour > 6 && hour < 18) return 'sunny'
      if (temp < 5) return 'snowy'
      if (temp < 15) return 'cloudy'
      if (Math.random() > 0.7) return 'rainy'
      return 'cloudy'
    }

    const hour = new Date().getHours()
    const temp = 20 + Math.random() * 20
    const condition = getWeatherCondition(temp, hour)
    
    setWeather({
      temperature: Math.round(temp),
      condition,
      humidity: Math.round(40 + Math.random() * 40),
      location: 'Dhaka'
    })
  }, [])

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny':
        return <Sun className="h-6 w-6 text-yellow-500" />
      case 'cloudy':
        return <Cloud className="h-6 w-6 text-gray-500" />
      case 'rainy':
        return <CloudRain className="h-6 w-6 text-blue-500" />
      case 'snowy':
        return <CloudSnow className="h-6 w-6 text-blue-200" />
      case 'stormy':
        return <CloudLightning className="h-6 w-6 text-purple-500" />
      default:
        return <Sun className="h-6 w-6 text-yellow-500" />
    }
  }

  const getBackgroundGradient = (condition: string, temp: number) => {
    const baseGradients = {
      sunny: 'from-yellow-400 via-orange-300 to-yellow-200',
      cloudy: 'from-gray-400 via-gray-300 to-gray-200',
      rainy: 'from-blue-400 via-blue-300 to-blue-200',
      snowy: 'from-blue-200 via-blue-100 to-white',
      stormy: 'from-purple-600 via-purple-400 to-gray-300'
    }

    const gradient = baseGradients[condition as keyof typeof baseGradients] || baseGradients.sunny
    
    // Adjust based on temperature
    if (temp > 30) return `bg-gradient-to-br ${gradient}`
    if (temp < 10) return `bg-gradient-to-br from-blue-300 via-blue-200 to-blue-100`
    
    return `bg-gradient-to-br ${gradient}`
  }

  return (
    <div className={`relative overflow-hidden rounded-lg p-6 text-white ${getBackgroundGradient(weather.condition, weather.temperature)}`}>
      {/* Weather Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {weather.condition === 'sunny' && (
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-200 rounded-full opacity-30 animate-pulse" />
        )}
        {weather.condition === 'cloudy' && (
          <>
            <div className="absolute top-4 right-8 w-16 h-8 bg-white opacity-20 rounded-full" />
            <div className="absolute top-8 right-4 w-12 h-6 bg-white opacity-15 rounded-full" />
          </>
        )}
        {weather.condition === 'rainy' && (
          <div className="absolute inset-0 bg-blue-200 opacity-10 animate-pulse" />
        )}
        {weather.condition === 'snowy' && (
          <div className="absolute inset-0 bg-white opacity-20 animate-pulse" />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-between">
        {/* Left side - DateTime */}
        <div className="flex-1">
          <div className="text-2xl font-bold mb-1">
            {currentDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <div className="text-lg mb-1">
            {bengaliDate.bengaliDay}, {bengaliDate.day}ই {bengaliDate.bengaliMonth} {bengaliDate.bengaliYear} বঙ্গাব্দ
          </div>
          <div className="text-sm opacity-90 italic">
            {bengaliDate.season}
          </div>
        </div>
        
        {/* Right side - Weather */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            {getWeatherIcon(weather.condition)}
            <div>
              <div className="text-2xl font-bold">{weather.temperature}°C</div>
              <div className="text-sm opacity-90 capitalize">{weather.condition}</div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm opacity-90">{weather.location}</div>
            <div className="text-xs opacity-75">{weather.humidity}% humidity</div>
          </div>
        </div>
      </div>
    </div>
  )
}
