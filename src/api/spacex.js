import * as Bundled from '../launchpads.json'

const PROXY = 'http://127.0.0.1:3001/proxy';

async function getJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

const asArray = data =>
    Array.isArray(data?.results) ? data.results :
        Array.isArray(data) ? data :
            [];

class SpaceX {
    constructor(baseUrl = PROXY) {
        this.baseUrl = baseUrl;
    }

    async launches() {
        try {
            return asArray(await getJson(`${this.baseUrl}/launches`));
        } catch {
            return [];
        }
    }

    async launchpads() {
        try {
            const [padsData, launchesData] = await Promise.all([
                getJson(`${this.baseUrl}/pads`),
                getJson(`${this.baseUrl}/launches`)
            ]);

            // Временный объект для группировки в рамках ЭТОГО вызова.
            // Не сохраняется между вызовами, не является кешем.
            const byPad = {};

            for (const l of asArray(launchesData)) {
                const id = l.pad?.id;
                if (id == null) continue;
                (byPad[id] ??= []).push(l.name);
            }

            return asArray(padsData).map(p => ({
                id: String(p.id),
                name: p.name,
                latitude: p.latitude,
                longitude: p.longitude,
                launches: (byPad[p.id] ?? []).slice(0, 5)
            }));
        } catch {
            console.log('[spacex] API недоступен, использую bundled:');
            return Bundled.launchpads;
        }
    }

    async launchpad(id) {
        const pads = await this.launchpads();
        return pads.find(p => String(p.id) === String(id)) ?? null;
    }
}

export { SpaceX };