import { TelemetryResponse, type TelemetryEvent } from '@wfynbzlx666/sdk-http'
import { http } from '../http'

export const ingest = async (events: TelemetryEvent[]): Promise<TelemetryResponse> => {
  return await http.post('/v1/telemetry/ingest', events)
}