const undici = require("undici");
const versions = ["v3", "v4"];

class Rest {
    constructor(pappumusic, options) {
        this.pappumusic = pappumusic;
        this.url = `http${options.secure ? "s" : ""}://${options.host}:${options.port}`;
        this.sessionId = options.sessionId;
        this.password = options.password;
        this.version = options.restVersion
        if (this.version && !versions.includes(this.version)) throw new RangeError(`${this.version} is not a valid version`);
    }

    setSessionId(sessionId) {
        this.sessionId = sessionId;
    }

    async makeRequest(method, endpoint, body = null) {
        const headers = {
            "Content-Type": "application/json",
            Authorization: this.password,
        };

        const requestOptions = {
            method,
            headers,
            body: body ? JSON.stringify(body) : null,
        };

        const response = await undici.fetch(this.url + endpoint, requestOptions);

        if (response.statusCode === 204) {
            return null;
        }

        try {
            const data = await response.json();
            return data;
        } catch (e) {
            return null;
        }
    }

    async getPlayers() {
        return this.makeRequest("GET", `/${this.version}/sessions/${this.sessionId}/players`);
    }

    async updatePlayer(options) {
        return this.makeRequest("PATCH", `/${this.version}/sessions/${this.sessionId}/players/${options.guildId}?noReplace=false`, options.data).then((res) => {
            this.pappumusic.emit("res", options.guildId, res);
        })
    }

    async destroyPlayer(guildId) {
        return this.makeRequest("DELETE", `/${this.version}/sessions/${this.sessionId}/players/${guildId}`);
    }

    async getTracks(identifier) {
        return this.makeRequest("GET", `/${this.version}/loadtracks?identifier=${encodeURIComponent(identifier)}`).then((res) => {
            this.pappumusic.emit("res", identifier, res);
        })
    }

    async decodeTrack(track, node) {
        if (!node) node = this.leastUsedNodes[0];
        return this.makeRequest(`GET`, `/${this.version}/decodetrack?encodedTrack=${encodeURIComponent(track)}`);
    }

    async decodeTracks(tracks) {
        return await this.makeRequest(`POST`, `/${this.version}/decodetracks`, tracks);
    }

    async getStats() {
        return this.makeRequest("GET", `/${this.version}/stats`);
    }

    async getInfo() {
        return this.makeRequest("GET", `/${this.version}/info`);
    }

    async getRoutePlannerStatus() {
        return await this.makeRequest(`GET`, `/${this.version}/routeplanner/status`);
    }
    async getRoutePlannerAddress(address) {
        return this.makeRequest(`POST`, `/${this.version}/routeplanner/free/address`, { address });
    }

    async parseResponse(req) {
        try {
            this.pappumusic.emit("pappumusicRaw", "Rest", await req.json());
            return await req.json();
        }
        catch (e) {
            return null;
        }
    }
}

module.exports = { Rest };