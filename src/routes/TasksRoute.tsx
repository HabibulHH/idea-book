import { Tasks } from '@/components/Tasks'
import type { AppData } from '@/types'

interface TasksRouteProps {
  data: AppData
  setData: (data: AppData) => void
}

export function TasksRoute({ data, setData }: TasksRouteProps) {
  return <Tasks data={data} setData={setData} />
}
