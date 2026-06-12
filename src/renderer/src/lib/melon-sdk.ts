import { createMelonDevMock } from '@/lib/melon-dev-mock';
import type { MelonApi } from '@shared/ipc';

let devMock: MelonApi | null = null;

function getMelonApi(): MelonApi {
	if (window.Melon) {
		return window.Melon;
	}

	if (import.meta.env.DEV) {
		devMock ??= createMelonDevMock();
		return devMock;
	}

	throw new Error('Melon API is not available');
}

export const melon = getMelonApi();
