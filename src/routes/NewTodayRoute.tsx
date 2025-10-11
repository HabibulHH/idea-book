import { NewTodayView } from '@/components/NewTodayView'
import type { AppData } from '@/types'

interface NewTodayRouteProps {
  data: AppData
  setData: (data: AppData) => void
}

export function NewTodayRoute({ data, setData }: NewTodayRouteProps) {
  return <NewTodayView data={data} setData={setData} />
}
