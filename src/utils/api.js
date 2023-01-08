import iplookup from "./iplookup.js";

async function API(method, params) {
    return await fetch("http://localhost:5279/", {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            method,
            params
        })
    })
}

async function pagination(method, params) {
    let list = [];
    let cont = true;
    let page = 0;
    let total_pages = 0;

    while (cont) {
        try {
            params.page = page + 1;
            const resp = await (await API(method, params)).json();
            list = list.concat(resp.result.items);
            total_pages = resp.result.total_pages;
        } catch (err) {
            console.log(err);
        }

        page++;
        if (total_pages <= page) cont = false;
    }

    return list;
}

export default {
    "blob-peers": blob_peers,
    "peer-ping": peer_ping
}

async function blob_peers(query) {
    if (!query.query) return {"message": "expected query"};

    const resolve = await (await API('get', {uri: query.query})).json();
    let peer_list = await pagination('peer_list', {
        "blob_hash": resolve.result.sd_hash,
        "page_size": 50
    });

    peer_list = await iplookup(peer_list);

    return {
        title: resolve.result.metadata.source.name,
        channel: resolve.result.channel_name + ':' + resolve.result.channel_claim_id,
        claim_id: resolve.result.claim_id,
        claim_name: resolve.result.claim_name,
        thumbnail: resolve.result.metadata.thumbnail ? resolve.result.metadata.thumbnail.url : '#',
        peers: peer_list
    };
}

async function peer_ping(query) {
    if (!query.address) return {"message": "expected address"};
    if (!query.port) return {"message": "expected port"};
    if (!query.node_id) return {"message": "expected node_id"};

    let ping;

    try {
        ping = await (await API('peer_ping', {address:query.address, port:query.port, node_id:query.node_id})).json();
    } catch {
        ping = {message: "error trying to ping"}
    }

    const resp = (await iplookup([query]))[0];

    if (ping.error) ping = {message: "error trying to ping"};

    resp.response = ping;

    return resp;
}

