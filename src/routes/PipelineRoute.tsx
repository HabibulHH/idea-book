import ExecutionPipeline from '@/components/ExecutionPipeline'
import type { AppData } from '@/types'

interface PipelineRouteProps {
  data: AppData
  setData: (data: AppData) => void
}

export function PipelineRoute({ data, setData }: PipelineRouteProps) {
  return <ExecutionPipeline data={data} setData={setData} />
}
