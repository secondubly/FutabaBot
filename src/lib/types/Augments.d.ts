import type { ArrayString } from '@skyra/env-utilities'

declare module '@skyra/env-utilities' {
	export interface Env {
		CLIENT_OWNERS: ArrayString
	}
}
