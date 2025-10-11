import IdeaParkingLot from '@/components/IdeaParkingLot'
import type { AppData } from '@/types'

interface IdeasRouteProps {
  data: AppData
  setData: (data: AppData) => void
}

export function IdeasRoute({ data, setData }: IdeasRouteProps) {
  return <IdeaParkingLot data={data} setData={setData} />
}
