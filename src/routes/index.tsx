import { Routes, Route, Navigate } from 'react-router-dom'
import { TasksRoute } from './TasksRoute'
import { NewTodayRoute } from './NewTodayRoute'
import { NewsFeedRoute } from './NewsFeedRoute'
import { BooksRoute } from './BooksRoute'
import { PeopleRoute } from './PeopleRoute'
import { IdeasRoute } from './IdeasRoute'
import { PipelineRoute } from './PipelineRoute'
import type { AppData } from '@/types'

interface AppRoutesProps {
  data: AppData
  setData: (data: AppData) => void
  user: any
}

export function AppRoutes({ data, setData, user }: AppRoutesProps) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/tasks" replace />} />
      <Route path="/tasks" element={<TasksRoute data={data} setData={setData} />} />
      <Route path="/newtoday" element={<NewTodayRoute data={data} setData={setData} />} />
      <Route path="/newsfeed" element={<NewsFeedRoute data={data} setData={setData} user={user} />} />
      <Route path="/books" element={<BooksRoute />} />
      <Route path="/people" element={<PeopleRoute />} />
      <Route path="/ideas" element={<IdeasRoute data={data} setData={setData} />} />
      <Route path="/pipeline" element={<PipelineRoute data={data} setData={setData} />} />
      <Route path="*" element={<Navigate to="/tasks" replace />} />
    </Routes>
  )
}
