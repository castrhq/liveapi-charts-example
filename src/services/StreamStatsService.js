import axios from "axios";

export default {
    getSessionsList,
    getSessionData,
    getStreamMediaPulse,
}

/**
 * @param {string} streamKey
 */
 async function getSessionsList(streamKey, daysOffset, metrics) {
	let pulseUri = import.meta.env.VITE_APP_ANALYTICS_API + `/api/session/${streamKey}/?metrics=1`;
	pulseUri += `&day_offset=${daysOffset || 360}`;
	let mediaPulse = await makeRequest(pulseUri);
	return mediaPulse;
}

/**
 * @param {string} sessionId
 */
 async function getSessionData(sessionId, points = null) {
	let pulseUri = import.meta.env.VITE_APP_ANALYTICS_API + `/api/metrics/session/${sessionId}`;
	if(points) pulseUri += `?last_points=${points}`
	let mediaPulse = await makeRequest(pulseUri);
	return mediaPulse;
}


/**
 * @param {string} streamId
 */
 async function getStreamMediaPulse(streamKey, returnRawData = false) {
	let isBackupKey = false;
	if (streamKey.includes('_backup')) {
		isBackupKey = true;
		streamKey = streamKey.replace('_backup', '');
	}

	let pulseUri = import.meta.env.VITE_APP_API_STATS + streamKey;

	if (isBackupKey) {
		pulseUri = `${pulseUri}_backup`
	}
	// pulseUri = 'https://stats.castr.io/pulse/schb9161a307c9b11eaae925dc2950a0e41'
	let mediaPulse = await makeRequest(pulseUri);
	// let proxyUri = `${process.env.VUE_APP_APP_API_BASE}/pulse/proxy?uri=${pulseUri}`
	// let mediaPulse = await makeRequest(proxyUri)
	if(returnRawData && mediaPulse && mediaPulse[0]) return mediaPulse[0];
	if (pulseUri.indexOf('stats.castr.io') && mediaPulse && mediaPulse[0]) {
		const originPulse = mediaPulse;
		mediaPulse = buildPulseObject(originPulse[0].value);
		mediaPulse.name = originPulse[0].value.name;
		mediaPulse.hostId = originPulse[0].stream_id;
		mediaPulse.isWowza = _.get(originPulse, ['0', 'wowza'], false);
		mediaPulse.staticPrefix = originPulse[0].static_prefix || false;
	}

	return mediaPulse;
}


const api = axios.create({
	timeout: 30 * 1000,
	config: {
		headers: {
			'content-type': 'application/json'
		}
	}
});
/**
 * @param {RequestConfig|string} reqConfig
 */
 async function makeRequest(reqConfig) {
	if (typeof reqConfig === 'string') {
		reqConfig = {
			path: reqConfig
		};
	}

	reqConfig.url = reqConfig.path;

	let res;
	try {
		res = await api.request(reqConfig);
	} catch (err) {
		const edata = _.get(err, 'response.data');
		throw new RequestError(edata);
	}

	return res && res.data;
}
