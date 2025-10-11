import { NewsFeed } from '@/components/NewsFeed'
import type { AppData } from '@/types'

interface NewsFeedRouteProps {
  data: AppData
  setData: (data: AppData) => void
  user: any
}

export function NewsFeedRoute({ data, setData, user }: NewsFeedRouteProps) {
  return <NewsFeed data={data} setData={setData} user={user} />
}
